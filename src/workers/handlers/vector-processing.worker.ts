/**
 * Vector Processing Web Worker
 * Handles embedding computation and vector operations
 */

import type { 
  ComputeEmbeddingsRequest, 
  ComputeEmbeddingsSuccess, 
  ComputeEmbeddingsError, 
  ComputeEmbeddingsProgress 
} from '../types'

// Import processing utilities (will need to be worker-compatible versions)
declare const self: Worker & {
  postMessage(message: ComputeEmbeddingsSuccess | ComputeEmbeddingsError | ComputeEmbeddingsProgress): void
  onmessage: ((this: Worker, ev: MessageEvent<ComputeEmbeddingsRequest>) => void) | null
}

interface EmbeddingModel {
  name: string
  dimensions: number
  maxTokens: number
}

// Available embedding models
const EMBEDDING_MODELS: Record<string, EmbeddingModel> = {
  'text-embedding-ada-002': {
    name: 'text-embedding-ada-002',
    dimensions: 1536,
    maxTokens: 8191
  },
  'sentence-transformers': {
    name: 'all-MiniLM-L6-v2',
    dimensions: 384,
    maxTokens: 512
  }
}

// Text preprocessing for embeddings
function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Simulate embedding generation (would use actual model in production)
async function generateEmbedding(text: string, model: string): Promise<Float32Array> {
  const embeddingModel = EMBEDDING_MODELS[model]
  if (!embeddingModel) {
    throw new Error(`Unknown embedding model: ${model}`)
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

  // Generate pseudo-random but deterministic embedding based on text content
  const hash = simpleHash(text)
  const embedding: number[] = []
  
  for (let i = 0; i < embeddingModel.dimensions; i++) {
    // Use text hash and index to generate deterministic values
    const value = Math.sin(hash + i * 0.1) * Math.cos(hash * 0.7 + i)
    embedding.push(value)
  }

  // Normalize the vector
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  const normalized = embedding.map(val => val / norm)
  
  return new Float32Array(normalized)
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Main processing function
async function processEmbeddingRequest(request: ComputeEmbeddingsRequest): Promise<void> {
  const { id, payload } = request
  const { texts, model = 'text-embedding-ada-002', batchSize = 10 } = payload
  
  try {
    const embeddings: Float32Array[] = []
    const total = texts.length
    let processed = 0
    
    // Process in batches for better performance and progress reporting
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      
      // Process batch
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(preprocessText(text), model))
      )
      
      embeddings.push(...batchEmbeddings)
      processed += batch.length
      
      // Send progress update
      const progressResponse: ComputeEmbeddingsProgress = {
        id,
        type: 'COMPUTE_EMBEDDINGS_PROGRESS',
        timestamp: Date.now(),
        payload: {
          processed,
          total,
          estimatedTimeRemaining: estimateTimeRemaining(processed, total)
        }
      }
      self.postMessage(progressResponse)
    }
    
    // Send success response
    const successResponse: ComputeEmbeddingsSuccess = {
      id,
      type: 'COMPUTE_EMBEDDINGS_SUCCESS',
      timestamp: Date.now(),
      payload: {
        embeddings,
        processingTime: Date.now() - startTime
      }
    }
    
    self.postMessage(successResponse)
    
  } catch (error) {
    const errorResponse: ComputeEmbeddingsError = {
      id,
      type: 'COMPUTE_EMBEDDINGS_ERROR',
      timestamp: Date.now(),
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        total: texts.length
      }
    }
    self.postMessage(errorResponse)
  }
}

function estimateTimeRemaining(processed: number, total: number): number {
  if (processed <= 0) return 0
  const elapsed = Date.now() - startTime
  const avgTimePerItem = elapsed / processed
  const remaining = total - processed
  return Math.round(remaining * avgTimePerItem)
}

let startTime = Date.now()

// Worker message handler
self.onmessage = (event: MessageEvent<ComputeEmbeddingsRequest>) => {
  startTime = Date.now()
  processEmbeddingRequest(event.data)
}

// Handle worker errors
self.onerror = (error) => {
  console.error('Vector processing worker error:', error)
}
