import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  initDB, saveRequest, searchRequests, getRequestHistory, getRequestById,
  createCollection, getCollections, deleteCollection, renameRequest,
  moveRequestToCollection, getRequestsByCollection,
  createEnvironment, getEnvironments, updateEnvironment, deleteEnvironment,
  deleteRequest, importPostmanCollection, exportCollectionToHttp, importHttpFile
} from '../src/main/db'

let db: Database
let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'recon-test-'))
  db = initDB(join(tmpDir, 'test.db'))
})

afterEach(() => {
  db.close()
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('saveRequest + getRequestById', () => {
  it('saves and retrieves a request with all fields', async () => {
    const id = await saveRequest(db, {
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token123' },
      body: '{"name":"test"}',
      status: 201,
      statusText: 'Created',
      responseHeaders: { 'content-type': 'application/json' },
      responseBody: '{"id":1,"name":"test"}',
      responseTimeMs: 45,
      name: 'Create user',
      collection_id: null
    })

    const req = getRequestById(db, id)
    expect(req).not.toBeNull()
    expect(req.method).toBe('POST')
    expect(req.url).toBe('https://api.example.com/users')
    expect(req.name).toBe('Create user')
    expect(JSON.parse(req.headers)).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer token123' })
    expect(req.body).toBe('{"name":"test"}')
    expect(req.status).toBe(201)
    expect(req.responseTimeMs).toBe(45)
  })

  it('saves a request with null body and empty headers', async () => {
    const id = await saveRequest(db, {
      method: 'GET',
      url: 'https://api.example.com/health',
      headers: {},
      body: null,
      name: null,
      collection_id: null
    })

    const req = getRequestById(db, id)
    expect(req).not.toBeNull()
    expect(req.body).toBeNull()
    expect(JSON.parse(req.headers)).toEqual({})
  })
})

describe('searchRequests', () => {
  beforeEach(async () => {
    await saveRequest(db, {
      method: 'GET', url: 'https://api.github.com/users/octocat',
      headers: {}, body: null, name: 'Get GitHub user',
      status: 200, statusText: 'OK', responseHeaders: {},
      responseBody: '{"login":"octocat","name":"The Octocat"}',
      responseTimeMs: 100, collection_id: null
    })
    await saveRequest(db, {
      method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts',
      headers: { 'Content-Type': 'application/json' }, body: '{"title":"foo"}',
      name: 'Create post', status: 201, statusText: 'Created',
      responseHeaders: {}, responseBody: '{"id":101}', responseTimeMs: 80,
      collection_id: null
    })
  })

  it('returns results for FTS keyword search', async () => {
    const results = await searchRequests(db, 'github', 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.url.includes('github.com'))).toBe(true)
  })

  it('returns results for semantic search with natural language', async () => {
    const results = await searchRequests(db, 'user account profile', 10)
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns semantic results for conceptually related queries', async () => {
    const results = await searchRequests(db, 'create a new blog post', 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.method === 'POST')).toBe(true)
  })

  it('semantic search returns scored results with match_type', async () => {
    const results = await searchRequests(db, 'post', 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r => r.match_type !== undefined)).toBe(true)
  })

  it('handles special characters without crashing (FTS5 injection)', async () => {
    const results1 = await searchRequests(db, 'user OR', 10)
    expect(Array.isArray(results1)).toBe(true)

    const results2 = await searchRequests(db, 'user-name', 10)
    expect(Array.isArray(results2)).toBe(true)

    const results3 = await searchRequests(db, '"unclosed quote', 10)
    expect(Array.isArray(results3)).toBe(true)
  })

  it('returns empty array for no matches', async () => {
    const results = await searchRequests(db, 'zzznomatchxyz', 10)
    expect(results).toEqual([])
  })
})

describe('collections', () => {
  it('creates, lists, and deletes collections', () => {
    const id1 = createCollection(db, 'API Tests')
    const id2 = createCollection(db, 'Production')
    const cols = getCollections(db)
    expect(cols).toHaveLength(2)
    expect(cols.some(c => c.name === 'API Tests')).toBe(true)
    expect(cols.some(c => c.name === 'Production')).toBe(true)

    deleteCollection(db, id1)
    expect(getCollections(db)).toHaveLength(1)
  })

  it('moves requests between collections', async () => {
    const colId = createCollection(db, 'Test Collection')
    const reqId = await saveRequest(db, {
      method: 'GET', url: 'https://api.example.com/test',
      headers: {}, body: null, name: 'Test', collection_id: null
    })

    moveRequestToCollection(db, reqId, colId)
    const reqs = getRequestsByCollection(db, colId)
    expect(reqs).toHaveLength(1)
    expect(reqs[0].url).toBe('https://api.example.com/test')
  })

  it('renames a request', async () => {
    const id = await saveRequest(db, {
      method: 'GET', url: 'https://api.example.com/test',
      headers: {}, body: null, name: 'Original', collection_id: null
    })

    renameRequest(db, id, 'Renamed')
    const req = getRequestById(db, id)
    expect(req.name).toBe('Renamed')
  })

  it('deletes a request', async () => {
    const id = await saveRequest(db, {
      method: 'GET', url: 'https://api.example.com/test',
      headers: {}, body: null, name: 'Test', collection_id: null
    })

    deleteRequest(db, id)
    expect(getRequestById(db, id)).toBeUndefined()
  })
})

describe('environments', () => {
  it('creates, lists, updates, and deletes environments', () => {
    const id = createEnvironment(db, 'Staging', { baseUrl: 'https://staging.example.com', token: 'abc123' })
    const envs = getEnvironments(db)
    expect(envs).toHaveLength(1)
    expect(envs[0].name).toBe('Staging')

    updateEnvironment(db, id, 'Production', { baseUrl: 'https://prod.example.com', token: 'xyz789' })
    const updated = getEnvironments(db)
    expect(updated[0].name).toBe('Production')
    expect(JSON.parse(updated[0].variables)).toEqual({ baseUrl: 'https://prod.example.com', token: 'xyz789' })

    deleteEnvironment(db, id)
    expect(getEnvironments(db)).toHaveLength(0)
  })
})

describe('Postman import', () => {
  it('imports a flat Postman collection', async () => {
    const postmanJson = JSON.stringify({
      info: { name: 'My API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
      item: [
        {
          name: 'Get users',
          request: {
            method: 'GET',
            url: 'https://api.example.com/users',
            header: [{ key: 'Accept', value: 'application/json' }]
          }
        },
        {
          name: 'Create user',
          request: {
            method: 'POST',
            url: { raw: 'https://api.example.com/users' },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { raw: '{"name":"test"}' }
          }
        }
      ]
    })

    const result = await importPostmanCollection(db, postmanJson)
    expect(result.collectionName).toBe('My API')
    expect(result.imported).toBe(2)

    const cols = getCollections(db)
    expect(cols).toHaveLength(1)
    const reqs = getRequestsByCollection(db, cols[0].id)
    expect(reqs).toHaveLength(2)
    expect(reqs.some(r => r.method === 'GET')).toBe(true)
    expect(reqs.some(r => r.method === 'POST')).toBe(true)
  })

  it('imports nested Postman folders', async () => {
    const postmanJson = JSON.stringify({
      info: { name: 'Nested API' },
      item: [
        {
          name: 'Users Folder',
          item: [
            { name: 'List users', request: { method: 'GET', url: 'https://api.example.com/users' } },
            { name: 'Get user', request: { method: 'GET', url: 'https://api.example.com/users/1' } }
          ]
        },
        {
          name: 'Posts Folder',
          item: [
            { name: 'List posts', request: { method: 'GET', url: 'https://api.example.com/posts' } }
          ]
        }
      ]
    })

    const result = await importPostmanCollection(db, postmanJson)
    expect(result.imported).toBe(3)
  })

  it('handles empty Postman collection', async () => {
    const result = await importPostmanCollection(db, JSON.stringify({ info: { name: 'Empty' }, item: [] }))
    expect(result.imported).toBe(0)
  })

  it('handles malformed JSON gracefully', async () => {
    await expect(importPostmanCollection(db, '{not valid json')).rejects.toThrow()
  })
})

describe('.http export + import roundtrip', () => {
  it('exports a collection and re-imports it', async () => {
    const colId = createCollection(db, 'Roundtrip Test')
    await saveRequest(db, {
      method: 'GET', url: 'https://api.example.com/users',
      headers: { Accept: 'application/json' }, body: null,
      name: 'List users', collection_id: colId
    })
    await saveRequest(db, {
      method: 'POST', url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' }, body: '{"name":"test"}',
      name: 'Create user', collection_id: colId
    })

    const exported = exportCollectionToHttp(db, colId)
    expect(exported.filename).toBe('Roundtrip_Test.http')
    expect(exported.content).toContain('GET https://api.example.com/users')
    expect(exported.content).toContain('POST https://api.example.com/users')
    expect(exported.content).toContain('Accept: application/json')
    expect(exported.content).toContain('Content-Type: application/json')
    expect(exported.content).toContain('{"name":"test"}')

    const result = await importHttpFile(db, exported.content, 'Reimported')
    expect(result.imported).toBe(2)
    expect(result.collectionName).toBe('Reimported')
  })

  it('exports empty collection without crashing', () => {
    const colId = createCollection(db, 'Empty')
    const exported = exportCollectionToHttp(db, colId)
    expect(exported.content).toContain('Empty')
  })
})

describe('request history', () => {
  it('returns requests ordered by created_at desc', async () => {
    await saveRequest(db, { method: 'GET', url: 'https://first.com', headers: {}, body: null, name: 'First', collection_id: null })
    await saveRequest(db, { method: 'GET', url: 'https://second.com', headers: {}, body: null, name: 'Second', collection_id: null })

    const history = getRequestHistory(db, 10)
    expect(history).toHaveLength(2)
    expect(history[0].name).toBe('Second')
  })

  it('respects limit', async () => {
    for (let i = 0; i < 5; i++) {
      await saveRequest(db, { method: 'GET', url: `https://api.example.com/${i}`, headers: {}, body: null, name: `Req ${i}`, collection_id: null })
    }
    expect(getRequestHistory(db, 3)).toHaveLength(3)
  })
})

describe('environment variable substitution', () => {
  it('substitutes {{var}} patterns', () => {
    const env = { baseUrl: 'https://api.example.com', token: 'abc123' }
    expect(substituteEnvVars('{{baseUrl}}/users', env)).toBe('https://api.example.com/users')
    expect(substituteEnvVars('Bearer {{token}}', env)).toBe('Bearer abc123')
  })

  it('leaves unknown vars as-is', () => {
    const env = { baseUrl: 'https://api.example.com' }
    expect(substituteEnvVars('{{baseUrl}}/users?key={{apiKey}}', env)).toBe('https://api.example.com/users?key={{apiKey}}')
  })
})

import { substituteEnvVars } from '../src/main/http'