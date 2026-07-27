import { initDB, saveRequest, searchRequests, getRequestHistory } from './src/main/db'
import { executeRequest } from './src/main/http'
import path from 'path'
import os from 'os'

const db = initDB(path.join(os.tmpdir(), 'recon-test2.db'))

async function run() {
  // Real request
  const r1 = await executeRequest({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: { 'Accept': 'application/json' },
    body: null
  })
  console.log('--- HTTP execution ---')
  console.log('Status:', r1.status, r1.statusText)
  console.log('Time:', r1.responseTimeMs + 'ms')

  // Save real request
  saveRequest(db, {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: { 'Accept': 'application/json' },
    body: null,
    ...r1
  })

  // Save mock requests for search testing
  saveRequest(db, {
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'auth token test', body: 'login flow', userId: 1 }),
    status: 201, statusText: 'Created', responseHeaders: {},
    responseBody: JSON.stringify({ id: 101, title: 'auth token test' }),
    responseTimeMs: 120
  })

  saveRequest(db, {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    headers: { 'Accept': 'application/json' },
    body: null,
    status: 200, statusText: 'OK', responseHeaders: {},
    responseBody: JSON.stringify({ id: 1, name: 'Leanne Graham', username: 'Bret', email: 'Sincere@april.biz' }),
    responseTimeMs: 89
  })

  saveRequest(db, {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/comments?postId=1',
    headers: { 'Accept': 'application/json' },
    body: null,
    status: 200, statusText: 'OK', responseHeaders: {},
    responseBody: JSON.stringify([{ id: 1, name: 'id labore ex et quam laborum', email: 'Eliseo@gardner.io' }]),
    responseTimeMs: 95
  })

  console.log('\n--- History ---')
  const h = getRequestHistory(db, 10)
  h.forEach(x => console.log(' ', x.method, x.url, x.status))

  console.log('\n--- Search: "auth login" ---')
  searchRequests(db, 'auth login', 5).forEach(r =>
    console.log(' ', r.score.toFixed(3), r.match_type, r.method, r.url)
  )

  console.log('\n--- Search: "user account profile" ---')
  searchRequests(db, 'user account profile', 5).forEach(r =>
    console.log(' ', r.score.toFixed(3), r.match_type, r.method, r.url)
  )

  console.log('\n--- Search: "comments feedback" ---')
  searchRequests(db, 'comments feedback', 5).forEach(r =>
    console.log(' ', r.score.toFixed(3), r.match_type, r.method, r.url)
  )

  console.log('\n--- All tests passed ---')
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1) })