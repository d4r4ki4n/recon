import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('recon', {
  executeRequest: (req: any) => ipcRenderer.invoke('request:execute', req),
  search: (query: string, limit?: number) => ipcRenderer.invoke('request:search', { query, limit }),
  getHistory: (limit?: number) => ipcRenderer.invoke('request:history', { limit }),
  getRequest: (id: number) => ipcRenderer.invoke('request:get', { id }),
  renameRequest: (id: number, name: string) => ipcRenderer.invoke('request:rename', { id, name }),
  moveRequest: (requestId: number, collectionId: number | null) => ipcRenderer.invoke('request:move', { requestId, collectionId }),
  createCollection: (name: string) => ipcRenderer.invoke('collection:create', { name }),
  getCollections: () => ipcRenderer.invoke('collection:list'),
  deleteCollection: (id: number) => ipcRenderer.invoke('collection:delete', { id }),
  getCollectionRequests: (collectionId: number) => ipcRenderer.invoke('collection:requests', { collectionId }),
  createEnvironment: (name: string, variables: Record<string, string>) => ipcRenderer.invoke('environment:create', { name, variables }),
  getEnvironments: () => ipcRenderer.invoke('environment:list'),
  updateEnvironment: (id: number, name: string, variables: Record<string, string>) => ipcRenderer.invoke('environment:update', { id, name, variables }),
  deleteEnvironment: (id: number) => ipcRenderer.invoke('environment:delete', { id }),
  deleteRequest: (id: number) => ipcRenderer.invoke('request:delete', { id }),
  saveRequest: (req: any) => ipcRenderer.invoke('request:save', req),
  importPostman: (json: string) => ipcRenderer.invoke('import:postman', { json }),
  exportCollectionHttp: (collectionId: number) => ipcRenderer.invoke('collection:export-http', { collectionId }),
  importHttp: (content: string, collectionName?: string) => ipcRenderer.invoke('import:http', { content, collectionName })
})