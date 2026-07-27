import https from 'https'
import http from 'http'
import { URL } from 'url'

export interface HttpRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
}

export interface HttpResponse {
  status: number
  statusText: string
  responseHeaders: Record<string, string>
  responseBody: string
  responseTimeMs: number
}

export function executeRequest(req: HttpRequest): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    let url: URL
    try {
      url = new URL(req.url)
    } catch (e) {
      reject(new Error(`Invalid URL: ${req.url}`))
      return
    }

    const isHttps = url.protocol === 'https:'
    const lib = isHttps ? https : http

    const finalHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      finalHeaders[key] = value
    }

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: req.method.toUpperCase(),
      headers: finalHeaders
    }

    const r = lib.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf-8')
        const responseHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            responseHeaders[key] = value
          } else if (Array.isArray(value)) {
            responseHeaders[key] = value.join(', ')
          }
        }
        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          responseHeaders,
          responseBody,
          responseTimeMs: Date.now() - start
        })
      })
    })

    r.on('error', (e) => reject(e))
    r.setTimeout(30000, () => {
      r.destroy(new Error('Request timeout (30s)'))
    })

    if (req.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
      r.write(req.body)
    }
    r.end()
  })
}

export function substituteEnvVars(
  text: string,
  env: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return env[key] !== undefined ? env[key] : match
  })
}