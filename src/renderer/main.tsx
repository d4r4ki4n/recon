import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'

const { recon } = window as any

interface HistoryItem {
  id: number
  method: string
  url: string
  body: string | null
  status: number | null
  status_text: string | null
  response_body: string | null
  response_time_ms: number | null
  created_at: string
  name?: string | null
  collection_id?: number | null
  score?: number
  match_type?: string
}

interface Collection {
  id: number
  name: string
}

interface Environment {
  id: number
  name: string
  variables: Record<string, string>
}

function methodClass(m: string) { return `method-${m}` }
function statusClass(s: number | null) {
  if (!s) return ''
  if (s < 300) return 'status-2xx'
  if (s < 400) return 'status-3xx'
  if (s < 500) return 'status-4xx'
  return 'status-5xx'
}

function App() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<{key: string, value: string}[]>([{key: '', value: ''}])
  const [body, setBody] = useState('')
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearch, setIsSearch] = useState(false)

  const [collections, setCollections] = useState<Collection[]>([])
  const [activeCollection, setActiveCollection] = useState<number | null>(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const [environments, setEnvironments] = useState<Environment[]>([])
  const [activeEnv, setActiveEnv] = useState<Environment | null>(null)
  const [showEnvModal, setShowEnvModal] = useState(false)
  const [envName, setEnvName] = useState('')
  const [envVars, setEnvVars] = useState<{key: string, value: string}[]>([{key: '', value: ''}])

  const [requestName, setRequestName] = useState('')
  const [copied, setCopied] = useState(false)

  const loadHistory = useCallback(async () => {
    if (activeCollection !== null) {
      const items = await recon.getCollectionRequests(activeCollection)
      setHistory(items)
    } else {
      const items = await recon.getHistory(50)
      setHistory(items)
    }
    setIsSearch(false)
  }, [activeCollection])

  const loadCollections = useCallback(async () => {
    const cols = await recon.getCollections()
    setCollections(cols)
  }, [])

  const loadEnvironments = useCallback(async () => {
    const envs = await recon.getEnvironments()
    setEnvironments(envs)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])
  useEffect(() => { loadCollections() }, [loadCollections])
  useEffect(() => { loadEnvironments() }, [loadEnvironments])

  const handleSend = async () => {
    if (!url) return
    setLoading(true)
    setResponse(null)
    try {
      const headerObj: Record<string, string> = {}
      for (const h of headers) {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value
      }
      const result = await recon.executeRequest({
        method,
        url,
        headers: headerObj,
        body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? body : null,
        collectionId: activeCollection,
        name: requestName || undefined,
        env: activeEnv?.variables || undefined
      })
      setResponse(result)
      await loadHistory()
      setSelectedId(null)
    } catch (e: any) {
      setResponse({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!url) return
    const headerObj: Record<string, string> = {}
    for (const h of headers) {
      if (h.key.trim()) headerObj[h.key.trim()] = h.value
    }
    await recon.saveRequest({
      method,
      url,
      headers: headerObj,
      body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? body : null,
      collectionId: activeCollection,
      name: requestName || undefined
    })
    await loadHistory()
  }

  const handleCopyResponse = () => {
    if (response?.responseBody) {
      navigator.clipboard.writeText(formatJson(response.responseBody))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory()
      return
    }
    const results = await recon.search(searchQuery, 20)
    setHistory(results)
    setIsSearch(true)
  }

  const handleSelectHistory = async (id: number) => {
    const req = await recon.getRequest(id)
    if (!req) return
    setSelectedId(id)
    setMethod(req.method)
    setUrl(req.url)
    setBody(req.body || '')
    setRequestName(req.name || '')
    try {
      const h = JSON.parse(req.headers || '{}')
      const entries = Object.entries(h).map(([key, value]) => ({key, value: value as string}))
      setHeaders(entries.length > 0 ? entries : [{key: '', value: ''}])
    } catch {
      setHeaders([{key: '', value: ''}])
    }
    setResponse({
      status: req.status,
      statusText: req.status_text,
      responseHeaders: JSON.parse(req.response_headers || '{}'),
      responseBody: req.response_body,
      responseTimeMs: req.response_time_ms
    })
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    await recon.createCollection(newCollectionName.trim())
    setNewCollectionName('')
    setShowNewCollection(false)
    await loadCollections()
  }

  const handleDeleteCollection = async (id: number) => {
    await recon.deleteCollection(id)
    if (activeCollection === id) setActiveCollection(null)
    await loadCollections()
  }

  const handleSaveEnv = async () => {
    const vars: Record<string, string> = {}
    for (const v of envVars) {
      if (v.key.trim()) vars[v.key.trim()] = v.value
    }
    const existing = environments.find(e => e.name === envName.trim())
    if (existing) {
      await recon.updateEnvironment(existing.id, envName.trim(), vars)
    } else {
      await recon.createEnvironment(envName.trim(), vars)
    }
    await loadEnvironments()
    setShowEnvModal(false)
    setEnvName('')
    setEnvVars([{key: '', value: ''}])
  }

  const handleEditEnv = (env: Environment) => {
    setEnvName(env.name)
    const entries = Object.entries(env.variables).map(([key, value]) => ({key, value}))
    setEnvVars(entries.length > 0 ? entries : [{key: '', value: ''}])
    setShowEnvModal(true)
  }

  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...headers]
    next[i] = { ...next[i], [field]: val }
    setHeaders(next)
  }

  const addHeader = () => setHeaders([...headers, {key: '', value: ''}])
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i))

  const updateEnvVar = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...envVars]
    next[i] = { ...next[i], [field]: val }
    setEnvVars(next)
  }

  const handleDeleteRequest = async (id: number) => {
    await recon.deleteRequest(id)
    if (selectedId === id) {
      setSelectedId(null)
      setResponse(null)
    }
    await loadHistory()
  }

  const formatJson = (text: string | null) => {
    if (!text) return ''
    try { return JSON.stringify(JSON.parse(text), null, 2) } catch { return text }
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Recon</h1>
          <div className="sidebar-actions">
            <select
              className="env-select"
              value={activeEnv?.id || ''}
              onChange={(e) => {
                const env = environments.find(ev => ev.id === Number(e.target.value))
                setActiveEnv(env || null)
              }}
            >
              <option value="">No environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            <button className="icon-btn" title="Manage environments" onClick={() => {
              setEnvName('')
              setEnvVars([{key: '', value: ''}])
              setShowEnvModal(true)
            }}>+</button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search requests semantically..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="collection-bar">
          <button
            className={`collection-tab ${activeCollection === null ? 'active' : ''}`}
            onClick={() => setActiveCollection(null)}
          >All</button>
          {collections.map(col => (
            <div key={col.id} className="collection-tab-wrapper">
              <button
                className={`collection-tab ${activeCollection === col.id ? 'active' : ''}`}
                onClick={() => setActiveCollection(col.id)}
              >{col.name}</button>
              <span className="collection-delete" onClick={() => handleDeleteCollection(col.id)}>x</span>
            </div>
          ))}
          {showNewCollection ? (
            <div className="new-collection-row">
              <input
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                autoFocus
              />
              <button onClick={handleCreateCollection}>Add</button>
            </div>
          ) : (
            <button className="collection-tab add" onClick={() => setShowNewCollection(true)}>+ New</button>
          )}
        </div>

        <div className="history-list scrollbar">
          {history.length === 0 && (
            <div style={{padding: '16px', color: 'var(--text-dim)', fontSize: '12px'}}>
              No requests yet. Send one to get started.
            </div>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              className={`history-item ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => handleSelectHistory(item.id)}
            >
              <div className="history-item-top">
                <span className={`history-item-method ${methodClass(item.method)}`}>{item.method}</span>
                {item.status && (
                  <span className={`status-badge ${statusClass(item.status)}`}> {item.status}</span>
                )}
                {isSearch && item.match_type && (
                  <span className="match-badge"> {item.match_type}</span>
                )}
                {item.name && <span className="request-name">{item.name}</span>}
              </div>
              <div className="history-item-url">{item.url}</div>
              <div className="history-item-meta">
                <span>{new Date(item.created_at).toLocaleString()}</span>
                {item.response_time_ms && <span>{item.response_time_ms}ms</span>}
                <span className="history-item-delete" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item.id) }}>delete</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-panel">
        <div className="request-bar">
          <select className="method-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            className="url-input"
            type="text"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend() }
              else if (e.key === 'Enter') handleSend()
            }}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading || !url}>
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button className="save-btn" onClick={handleSave} disabled={!url} title="Save to collection without sending">
            Save
          </button>
        </div>

        <div className="request-name-bar">
          <input
            type="text"
            placeholder="Request name (optional)"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
          />
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
          {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
            <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
          )}
        </div>

        <div className="tab-content" style={{maxHeight: '200px'}}>
          {activeTab === 'headers' && (
            <div>
              {headers.map((h, i) => (
                <div key={i} className="key-value-row">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={h.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                  />
                  <div style={{display: 'flex', gap: '4px'}}>
                    <input
                      type="text"
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(i, 'value', e.target.value)}
                      style={{flex: 1}}
                    />
                    <button onClick={() => removeHeader(i)} style={{background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0 8px'}}>x</button>
                  </div>
                </div>
              ))}
              <button className="add-row-btn" onClick={addHeader}>+ Add header</button>
            </div>
          )}
          {activeTab === 'body' && (
            <textarea
              placeholder='{"key": "value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend() } }}
              style={{height: '150px'}}
            />
          )}
        </div>

        <div className="response-panel">
          {response ? (
            <>
              <div className="response-header">
                {response.error ? (
                  <span style={{color: 'var(--red)'}}>Error: {response.error}</span>
                ) : (
                  <>
                    <span className={`status-badge ${statusClass(response.status)}`}>{response.status} {response.statusText}</span>
                    {response.responseTimeMs && (
                      <span style={{color: 'var(--text-dim)'}}>{response.responseTimeMs}ms</span>
                    )}
                    <button className="copy-btn" onClick={handleCopyResponse} title="Copy response body">
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </>
                )}
              </div>
              {!response.error && (
                <div className="tabs">
                  <div className={`tab ${responseTab === 'body' ? 'active' : ''}`} onClick={() => setResponseTab('body')}>Body</div>
                  <div className={`tab ${responseTab === 'headers' ? 'active' : ''}`} onClick={() => setResponseTab('headers')}>Headers</div>
                </div>
              )}
              <div className="response-body scrollbar">
                {response.error ? '' : responseTab === 'body' ? formatJson(response.responseBody) : (
                  <div className="response-headers-list">
                    {Object.entries(response.responseHeaders || {}).map(([k, v]) => (
                      <div key={k} className="response-header-row">
                        <span className="response-header-key">{k}</span>
                        <span className="response-header-val">{v as string}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              {loading ? 'Sending...' : 'No response yet. Send a request to see results.'}
            </div>
          )}
        </div>
      </div>

      {showEnvModal && (
        <div className="modal-overlay" onClick={() => setShowEnvModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Environment</h2>
              <button className="icon-btn" onClick={() => setShowEnvModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Environment name (e.g. Production, Staging)"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                className="env-name-input"
              />
              <div className="env-vars-list">
                {envVars.map((v, i) => (
                  <div key={i} className="key-value-row">
                    <input
                      type="text"
                      placeholder="Variable name"
                      value={v.key}
                      onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                    />
                    <div style={{display: 'flex', gap: '4px'}}>
                      <input
                        type="text"
                        placeholder="Value"
                        value={v.value}
                        onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                        style={{flex: 1}}
                      />
                      <button onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))} style={{background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0 8px'}}>x</button>
                    </div>
                  </div>
                ))}
                <button className="add-row-btn" onClick={() => setEnvVars([...envVars, {key: '', value: ''}])}>+ Add variable</button>
              </div>
              <p className="env-hint">Use variables in URL, headers, or body with {'{{variable_name}}'}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEnvModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEnv} disabled={!envName.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)