import { pipeline, Pipeline } from '@xenova/transformers'

let embedder: Pipeline | null = null

async function getEmbedder(): Promise<Pipeline> {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return embedder
}

export async function embed(text: string): Promise<Float32Array> {
  const extractor = await getEmbedder()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return new Float32Array(output.data)
}

export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  const extractor = await getEmbedder()
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  const dim = output.dims[output.dims.length - 1]
  const results: Float32Array[] = []
  for (let i = 0; i < texts.length; i++) {
    const start = i * dim
    results.push(new Float32Array(output.data.slice(start, start + dim)))
  }
  return results
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}