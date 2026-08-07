import { app, BrowserWindow, ipcMain } from 'electron'
import { Database } from 'better-sqlite3'
import path from 'path'
import {
  initDB, saveRequest, searchRequests, getRequestHistory, getRequestById,
  createCollection, getCollections, deleteCollection, renameRequest,
  moveRequestToCollection, getRequestsByCollection,
  createEnvironment, getEnvironments, updateEnvironment, deleteEnvironment,
  deleteRequest, importPostmanCollection, exportCollectionToHttp, importHttpFile
} from './db'
import { executeRequest, substituteEnvVars } from './http'
import { seedIfEmpty } from './seed'

let mainWindow: BrowserWindow | null = null
let db: Database

app.whenReady().then(async () => {
  db = initDB(path.join(app.getPath('userData'), 'recon.db'))

  await seedIfEmpty(db)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
})

ipcMain.handle('request:execute', async (_event, { method, url, headers, body, collectionId, name, env }) => {
  let finalUrl = url
  let finalHeaders = headers
  let finalBody = body
  if (env) {
    finalUrl = substituteEnvVars(finalUrl, env)
    finalHeaders = Object.fromEntries(
      Object.entries(finalHeaders).map(([k, v]) => [k, substituteEnvVars(v as string, env)])
    )
    if (finalBody) finalBody = substituteEnvVars(finalBody, env)
  }
  const result = await executeRequest({ method, url: finalUrl, headers: finalHeaders, body: finalBody })
  const id = await saveRequest(db, { method, url, headers: finalHeaders, body: finalBody, ...result, collection_id: collectionId, name })
  return { id, ...result }
})

ipcMain.handle('request:search', async (_event, { query, limit }) => {
  return searchRequests(db, query, limit || 20)
})

ipcMain.handle('request:history', async (_event, { limit }) => {
  return getRequestHistory(db, limit || 50)
})

ipcMain.handle('request:get', async (_event, { id }) => {
  return getRequestById(db, id)
})

ipcMain.handle('collection:create', async (_event, { name }) => {
  return createCollection(db, name)
})

ipcMain.handle('collection:list', async () => {
  return getCollections(db)
})

ipcMain.handle('collection:delete', async (_event, { id }) => {
  deleteCollection(db, id)
})

ipcMain.handle('request:rename', async (_event, { id, name }) => {
  renameRequest(db, id, name)
})

ipcMain.handle('request:move', async (_event, { requestId, collectionId }) => {
  moveRequestToCollection(db, requestId, collectionId)
})

ipcMain.handle('collection:requests', async (_event, { collectionId }) => {
  return getRequestsByCollection(db, collectionId)
})

ipcMain.handle('environment:create', async (_event, { name, variables }) => {
  return createEnvironment(db, name, variables)
})

ipcMain.handle('environment:list', async () => {
  return getEnvironments(db)
})

ipcMain.handle('environment:update', async (_event, { id, name, variables }) => {
  updateEnvironment(db, id, name, variables)
})

ipcMain.handle('environment:delete', async (_event, { id }) => {
  deleteEnvironment(db, id)
})

ipcMain.handle('request:delete', async (_event, { id }) => {
  deleteRequest(db, id)
})

ipcMain.handle('request:save', async (_event, { method, url, headers, body, collectionId, name }) => {
  const id = await saveRequest(db, { method, url, headers, body, collection_id: collectionId, name })
  return { id }
})

ipcMain.handle('import:postman', async (_event, { json }) => {
  return importPostmanCollection(db, json)
})

ipcMain.handle('collection:export-http', async (_event, { collectionId }) => {
  return exportCollectionToHttp(db, collectionId)
})

ipcMain.handle('import:http', async (_event, { content, collectionName }) => {
  return importHttpFile(db, content, collectionName)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})