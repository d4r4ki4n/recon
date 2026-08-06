import { Database } from 'better-sqlite3'
import { saveRequest } from './db'

interface SeedRequest {
  method: string
  url: string
  name: string
  headers: Record<string, string>
  body: string | null
  status: number
  statusText: string
  responseHeaders: Record<string, string>
  responseBody: string
  responseTimeMs: number
  collection: string
}

const seedData: SeedRequest[] = [
  {
    method: 'GET',
    url: 'https://api.github.com/users/octocat',
    name: 'Get GitHub user profile',
    headers: { 'Accept': 'application/vnd.github.v3+json' },
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify({
      login: 'octocat',
      id: 583231,
      node_id: 'MDQ6VXNlcjU4MzIzMQ==',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/octocat',
      html_url: 'https://github.com/octocat',
      followers_url: 'https://api.github.com/users/octocat/followers',
      following_url: 'https://api.github.com/users/octocat/following{/other_user}',
      gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
      organizations_url: 'https://api.github.com/users/octocat/orgs',
      repos_url: 'https://api.github.com/users/octocat/repos',
      events_url: 'https://api.github.com/users/octocat/events{/privacy}',
      received_events_url: 'https://api.github.com/users/octocat/received_events',
      type: 'User',
      site_admin: false,
      name: 'The Octocat',
      company: '@github',
      blog: 'https://github.blog',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 8,
      public_gists: 8,
      followers: 9337,
      following: 9,
      created_at: '2011-01-25T18:44:36Z',
      updated_at: '2024-01-15T20:22:33Z'
    }, null, 2),
    responseTimeMs: 142,
    collection: 'GitHub API'
  },
  {
    method: 'GET',
    url: 'https://api.github.com/repos/octocat/Hello-World',
    name: 'Get repository info',
    headers: { 'Accept': 'application/vnd.github.v3+json' },
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify({
      id: 1296269,
      node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
      name: 'Hello-World',
      full_name: 'octocat/Hello-World',
      owner: {
        login: 'octocat',
        id: 583231,
        type: 'User',
        site_admin: false
      },
      private: false,
      html_url: 'https://github.com/octocat/Hello-World',
      description: 'My first repository on GitHub!',
      fork: false,
      url: 'https://api.github.com/repos/octocat/Hello-World',
      created_at: '2011-01-26T19:01:12Z',
      updated_at: '2011-01-26T19:14:43Z',
      pushed_at: '2011-01-26T19:06:43Z',
      git_url: 'git://github.com/octocat/Hello-World.git',
      ssh_url: 'git@github.com:octocat/Hello-World.git',
      clone_url: 'https://github.com/octocat/Hello-World.git',
      svn_url: 'https://github.com/octocat/Hello-World',
      homepage: null,
      size: 0,
      stargazers_count: 0,
      watchers_count: 0,
      language: null,
      has_issues: true,
      has_downloads: true,
      has_wiki: true,
      has_pages: false,
      forks_count: 0,
      open_issues_count: 0,
      default_branch: 'master'
    }, null, 2),
    responseTimeMs: 98,
    collection: 'GitHub API'
  },
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    name: 'Get user account details',
    headers: {},
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify({
      id: 1,
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'Sincere@april.biz',
      address: {
        street: 'Kulas Light',
        suite: 'Apt. 556',
        city: 'Gwenborough',
        zipcode: '92998-3874',
        geo: { lat: '-37.3159', lng: '81.1496' }
      },
      phone: '1-770-736-8031 x56442',
      website: 'hildegard.org',
      company: {
        name: 'Romaguera-Crona',
        catchPhrase: 'Multi-layered client-server neural-net',
        bs: 'harness real-time e-markets'
      }
    }, null, 2),
    responseTimeMs: 67,
    collection: 'JSONPlaceholder'
  },
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts?userId=1',
    name: 'List posts by user',
    headers: {},
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify([
      { userId: 1, id: 1, title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit', body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' },
      { userId: 1, id: 2, title: 'qui est esse', body: 'est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla' },
      { userId: 1, id: 3, title: 'ea molestias quasi exercitationem repellat qui ipsa sit aut', body: 'et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusamus quis doloremque\nsed qui voluptatem architecto ab nihil' }
    ], null, 2),
    responseTimeMs: 54,
    collection: 'JSONPlaceholder'
  },
  {
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    name: 'Create a new post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
    status: 201,
    statusText: 'Created',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify({ id: 101, title: 'foo', body: 'bar', userId: 1 }, null, 2),
    responseTimeMs: 89,
    collection: 'JSONPlaceholder'
  },
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/comments?postId=1',
    name: 'Fetch comments for a post',
    headers: {},
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify([
      { postId: 1, id: 1, name: 'id labore ex et quam laborum', email: 'Eliseo@gardner.biz', body: 'laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium' },
      { postId: 1, id: 2, name: 'quo vero reiciendis velit similique earum', email: 'Jayne_Kuhic@sydney.com', body: 'est natus enim nihil est dolore omnis voluptatem autem\nsequi quis autem\nmolestiae non' }
    ], null, 2),
    responseTimeMs: 61,
    collection: 'JSONPlaceholder'
  },
  {
    method: 'GET',
    url: 'https://api.github.com/rate_limit',
    name: 'Check API rate limit status',
    headers: { 'Accept': 'application/vnd.github.v3+json' },
    body: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
    responseBody: JSON.stringify({
      rate: { limit: 60, remaining: 58, used: 2, reset: 1786040000 },
      search: { limit: 10, remaining: 10, used: 0, reset: 1786037000 }
    }, null, 2),
    responseTimeMs: 73,
    collection: 'GitHub API'
  },
  {
    method: 'POST',
    url: 'https://httpbin.org/post',
    name: 'Test endpoint - echo request back',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'data', nested: { key: 'value' } }),
    status: 200,
    statusText: 'OK',
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: JSON.stringify({
      args: {},
      data: '{"test":"data","nested":{"key":"value"}}',
      headers: { 'Content-Type': 'application/json', 'Host': 'httpbin.org' },
      json: { test: 'data', nested: { key: 'value' } },
      origin: '192.168.1.1',
      url: 'https://httpbin.org/post'
    }, null, 2),
    responseTimeMs: 112,
    collection: 'Testing'
  }
]

export async function seedIfEmpty(db: Database): Promise<void> {
  const count = db.prepare('SELECT COUNT(*) as count FROM requests').get() as any
  if (count.count > 0) return

  const collectionMap = new Map<string, number>()

  for (const req of seedData) {
    let collectionId: number | null = null

    if (req.collection) {
      if (!collectionMap.has(req.collection)) {
        const result = db.prepare('INSERT INTO collections (name) VALUES (?)').run(req.collection)
        collectionMap.set(req.collection, Number(result.lastInsertRowid))
      }
      collectionId = collectionMap.get(req.collection)!
    }

    await saveRequest(db, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      status: req.status,
      statusText: req.statusText,
      responseHeaders: req.responseHeaders,
      responseBody: req.responseBody,
      responseTimeMs: req.responseTimeMs,
      name: req.name,
      collection_id: collectionId
    })
  }
}