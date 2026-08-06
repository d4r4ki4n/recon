import Database from 'better-sqlite3'
import crypto from 'crypto'
import { embed, cosineSimilarity } from './embeddings'

export interface SavedRequest {
  id?: number
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
  status?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
  responseTimeMs?: number
  created_at?: string
  name?: string | null
  collection_id?: number | null
}

export function initDB(dbPath: string): Database {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variables TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT NOT NULL DEFAULT '{}',
      body TEXT,
      status INTEGER,
      status_text TEXT,
      response_headers TEXT NOT NULL DEFAULT '{}',
      response_body TEXT,
      response_time_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      url_hash TEXT NOT NULL,
      name TEXT,
      collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS request_embeddings (
      request_id INTEGER PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
      embedding BLOB NOT NULL
    );
  `)

  const cols = db.prepare("PRAGMA table_info(requests)").all() as any[]
  if (!cols.find(c => c.name === 'name')) {
    db.exec('ALTER TABLE requests ADD COLUMN name TEXT')
  }
  if (!cols.find(c => c.name === 'collection_id')) {
    db.exec('ALTER TABLE requests ADD COLUMN collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL')
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_requests_url_hash ON requests(url_hash);
    CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collection_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS requests_fts USING fts5(
      method, url, body, response_body,
      content='requests',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS requests_ai AFTER INSERT ON requests BEGIN
      INSERT INTO requests_fts(rowid, method, url, body, response_body)
      VALUES (new.id, new.method, new.url, new.body, new.response_body);
    END;

    CREATE TRIGGER IF NOT EXISTS requests_ad AFTER DELETE ON requests BEGIN
      INSERT INTO requests_fts(requests_fts, rowid, method, url, body, response_body)
      VALUES('delete', old.id, old.method, old.url, old.body, old.response_body);
    END;

    CREATE TRIGGER IF NOT EXISTS requests_au AFTER UPDATE ON requests BEGIN
      INSERT INTO requests_fts(requests_fts, rowid, method, url, body, response_body)
      VALUES('delete', old.id, old.method, old.url, old.body, old.response_body);
      INSERT INTO requests_fts(rowid, method, url, body, response_body)
      VALUES (new.id, new.method, new.url, new.body, new.response_body);
    END;
  `)

  return db
}

function hashUrl(method: string, url: string): string {
  return crypto.createHash('md5').update(`${method} ${url}`).digest('hex')
}

function buildSearchText(req: SavedRequest): string {
  const parts = [
    req.method,
    req.url,
    req.body || '',
    req.responseBody || '',
    req.name || ''
  ]
  return parts.join(' ')
}

export async function saveRequest(db: Database, req: SavedRequest): Promise<number> {
  const urlHash = hashUrl(req.method, req.url)
  const headersJson = JSON.stringify(req.headers || {})
  const result = db.prepare(`
    INSERT INTO requests (method, url, headers, body, status, status_text, response_headers, response_body, response_time_ms, url_hash, name, collection_id)
    VALUES (@method, @url, @headers, @body, @status, @status_text, @response_headers, @response_body, @response_time_ms, @url_hash, @name, @collection_id)
  `).run({
    method: req.method,
    url: req.url,
    headers: headersJson,
    body: req.body || null,
    status: req.status || null,
    status_text: req.statusText || null,
    response_headers: JSON.stringify(req.responseHeaders || {}),
    response_body: req.responseBody || null,
    response_time_ms: req.responseTimeMs || null,
    url_hash: urlHash,
    name: req.name || null,
    collection_id: req.collection_id || null
  })

  const id = Number(result.lastInsertRowid)
  const searchText = buildSearchText(req)
  const embedding = await embed(searchText)
  db.prepare('INSERT OR REPLACE INTO request_embeddings (request_id, embedding) VALUES (?, ?)').run(id, Buffer.from(embedding))

  return id
}

export async function searchRequests(db: Database, query: string, limit: number = 20): Promise<any[]> {
  const escapedQuery = '"' + query.replace(/"/g, '""') + '"'
  let ftsResults: any[] = []
  try {
    ftsResults = db.prepare(`
      SELECT r.id, r.method, r.url, r.body, r.status, r.status_text, r.response_body, r.response_time_ms, r.created_at, r.name, r.collection_id,
             bm25(requests_fts) as rank
      FROM requests_fts
      JOIN requests r ON r.id = requests_fts.rowid
      WHERE requests_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(escapedQuery, limit) as any[]
  } catch {
    ftsResults = []
  }

  const queryEmbedding = await embed(query)
  const allRequests = db.prepare(`
    SELECT id, method, url, body, status, status_text, response_body, response_time_ms, created_at, name, collection_id
    FROM requests ORDER BY created_at DESC LIMIT 500
  `).all() as any[]

  const scored = allRequests.map(req => {
    const row = db.prepare('SELECT embedding FROM request_embeddings WHERE request_id = ?').get(req.id) as any
    if (!row) return { ...req, semanticScore: 0, match_type: 'fts' }
    const emb = Array.from(new Float32Array(row.embedding))
    const score = cosineSimilarity(queryEmbedding, emb)
    return { ...req, semanticScore: score, match_type: 'semantic' }
  }).sort((a, b) => b.semanticScore - a.semanticScore)

  const ftsIds = new Set(ftsResults.map(r => r.id))
  const semanticOnly = scored.filter(r => !ftsIds.has(r.id)).slice(0, limit)
  const combined = [...ftsResults, ...semanticOnly].slice(0, limit)

  return combined.map(r => {
    if (ftsIds.has(r.id) && (r as any).semanticScore !== undefined) {
      return { ...r, match_type: 'fts+semantic' }
    }
    return r
  })
}

export function getRequestHistory(db: Database, limit: number = 50): any[] {
  return db.prepare(`
    SELECT id, method, url, body, status, status_text, response_headers, response_body, response_time_ms, created_at, name, collection_id
    FROM requests ORDER BY created_at DESC LIMIT ?
  `).all(limit) as any[]
}

export function getRequestById(db: Database, id: number): any {
  return db.prepare(`
    SELECT id, method, url, headers, body, status, status_text, response_headers, response_body, response_time_ms, created_at, name, collection_id
    FROM requests WHERE id = ?
  `).get(id) as any
}

export function createCollection(db: Database, name: string): number {
  const result = db.prepare('INSERT INTO collections (name) VALUES (?)').run(name)
  return Number(result.lastInsertRowid)
}

export function getCollections(db: Database): any[] {
  return db.prepare('SELECT id, name, created_at FROM collections ORDER BY name').all() as any[]
}

export function deleteCollection(db: Database, id: number): void {
  db.prepare('DELETE FROM collections WHERE id = ?').run(id)
}

export function renameRequest(db: Database, id: number, name: string): void {
  db.prepare('UPDATE requests SET name = ? WHERE id = ?').run(name, id)
}

export function moveRequestToCollection(db: Database, requestId: number, collectionId: number | null): void {
  db.prepare('UPDATE requests SET collection_id = ? WHERE id = ?').run(collectionId, requestId)
}

export function getRequestsByCollection(db: Database, collectionId: number): any[] {
  return db.prepare(`
    SELECT id, method, url, body, status, status_text, response_headers, response_body, response_time_ms, created_at, name, collection_id
    FROM requests WHERE collection_id = ? ORDER BY created_at DESC
  `).all(collectionId) as any[]
}

export function createEnvironment(db: Database, name: string, variables: Record<string, string>): number {
  const result = db.prepare('INSERT INTO environments (name, variables) VALUES (?, ?)').run(name, JSON.stringify(variables))
  return Number(result.lastInsertRowid)
}

export function getEnvironments(db: Database): any[] {
  return db.prepare('SELECT id, name, variables FROM environments ORDER BY name').all() as any[]
}

export function updateEnvironment(db: Database, id: number, name: string, variables: Record<string, string>): void {
  db.prepare('UPDATE environments SET name = ?, variables = ? WHERE id = ?').run(name, JSON.stringify(variables), id)
}

export function deleteEnvironment(db: Database, id: number): void {
  db.prepare('DELETE FROM environments WHERE id = ?').run(id)
}

export function deleteRequest(db: Database, id: number): void {
  db.prepare('DELETE FROM requests WHERE id = ?').run(id)
}

interface PostmanItem {
  name?: string
  request?: {
    method?: string
    url?: string | { raw?: string }
    header?: Array<{ key: string, value: string }>
    body?: { raw?: string }
  }
  item?: PostmanItem[]
}

export async function importPostmanCollection(db: Database, json: string): Promise<{ collectionName: string, imported: number }> {
  const data = JSON.parse(json)
  const collectionName = data?.info?.name || 'Imported Collection'
  const collectionId = createCollection(db, collectionName)

  let count = 0

  const processItem = async (item: PostmanItem) => {
    if (item.item && Array.isArray(item.item)) {
      for (const child of item.item) await processItem(child)
      return
    }
    if (!item.request) return

    const method = (item.request.method || 'GET').toUpperCase()
    const url = typeof item.request.url === 'string' ? item.request.url : (item.request.url?.raw || '')
    if (!url) return

    const headers: Record<string, string> = {}
    if (item.request.header) {
      for (const h of item.request.header) {
        if (h.key) headers[h.key] = h.value
      }
    }

    const body = item.request.body?.raw || null

    await saveRequest(db, {
      method,
      url,
      headers,
      body,
      name: item.name || null,
      collection_id: collectionId
    })
    count++
  }

  if (data.item && Array.isArray(data.item)) {
    for (const item of data.item) await processItem(item)
  }

  return { collectionName, imported: count }
}