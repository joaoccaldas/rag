/**
 * Persistent Vector Database using IndexedDB
 * Provides fast vector similarity search with persistent storage
 */

import { Document, SearchResult } from '../types'

interface VectorEntry {
  id: string
  documentId: string
  chunkId: string
  embedding: number[]
  metadata: {
    documentName: string
    chunkIndex: number
    tokenCount: number
    content: string
  }
  timestamp: number
}

interface VectorSearchOptions {
  limit?: number
  threshold?: number
  includeMetadata?: boolean
}

class VectorDatabase {
  private db: IDBDatabase | null = null
  private dbName = 'MieleVectorDB'
  private version = 1
  private storeName = 'vectors'

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('documentId', 'documentId', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async storeVectors(documents: Document[]): Promise<void> {
    if (!this.db) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)

    const vectors: VectorEntry[] = []
    
    for (const doc of documents) {
      if (doc.chunks) {
        for (const chunk of doc.chunks) {
          if (chunk.embedding) {
            vectors.push({
              id: `${doc.id}_${chunk.id}`,
              documentId: doc.id,
              chunkId: chunk.id,
              embedding: chunk.embedding,
              metadata: {
                documentName: doc.name,
                chunkIndex: chunk.metadata.chunkIndex || 0,
                tokenCount: chunk.metadata.tokenCount || 0,
                content: chunk.content
              },
              timestamp: Date.now()
            })
          }
        }
      }
    }

    // Store all vectors
    for (const vector of vectors) {
      store.put(vector)
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error('Failed to store vectors'))
    })
  }

  async searchSimilar(
    queryEmbedding: number[], 
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.db) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const { limit = 10, threshold = 0.1 } = options
    
    // Get all vectors (in a real implementation, you'd want indexing)
    const vectors = await this.getAllVectors()
    
    // Calculate similarities
    const similarities = vectors.map(vector => ({
      vector,
      similarity: this.cosineSimilarity(queryEmbedding, vector.embedding)
    })).filter(item => item.similarity >= threshold)

    // Sort by similarity and limit results
    similarities.sort((a, b) => b.similarity - a.similarity)
    const topResults = similarities.slice(0, limit)

    // Convert to SearchResult format
    return topResults.map(({ vector, similarity }) => ({
      chunk: {
        id: vector.chunkId,
        documentId: vector.documentId,
        content: vector.metadata.content,
        startIndex: 0,
        endIndex: vector.metadata.content.length,
        metadata: {
          chunkIndex: vector.metadata.chunkIndex,
          tokenCount: vector.metadata.tokenCount
        }
      },
      document: {
        id: vector.documentId,
        name: vector.metadata.documentName,
        type: 'txt',
        content: '',
        metadata: {},
        status: 'ready',
        uploadedAt: new Date(vector.timestamp),
        lastModified: new Date(vector.timestamp),
        size: 0
      },
      similarity,
      relevantText: vector.metadata.content.substring(0, 200) + '...'
    }))
  }

  private async getAllVectors(): Promise<VectorEntry[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error('Failed to retrieve vectors'))
      }
    })
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) return 0

    return dotProduct / (magnitudeA * magnitudeB)
  }

  async deleteVectorsByDocument(documentId: string): Promise<void> {
    if (!this.db) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const index = store.index('documentId')
    
    const request = index.openCursor(IDBKeyRange.only(documentId))
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to delete vectors'))
      }
    })
  }

  async getStorageStats(): Promise<{
    totalVectors: number
    documentCount: number
    storageSize: number
  }> {
    if (!this.db) await this.initialize()
    
    try {
      const vectors = await this.getAllVectors()
      const documentIds = new Set(vectors.map(v => v.documentId))
      
      // Estimate storage size (rough calculation)
      const storageSize = vectors.reduce((total, vector) => {
        return total + JSON.stringify(vector).length
      }, 0)

      return {
        totalVectors: vectors.length,
        documentCount: documentIds.size,
        storageSize
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalVectors: 0,
        documentCount: 0,
        storageSize: 0
      }
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear database'))
    })
  }
}

// Singleton instance
export const vectorDB = new VectorDatabase()

// Enhanced Vector Storage class that uses persistent storage
export class PersistentVectorStorage {
  private cache = new Map<string, SearchResult[]>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async storeEmbeddings(documents: Document[]): Promise<void> {
    await vectorDB.storeVectors(documents)
    this.clearCache()
  }

  async searchSimilar(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(queryEmbedding, options)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Search in persistent storage
    const results = await vectorDB.searchSimilar(queryEmbedding, options)
    
    // Cache results
    this.cache.set(cacheKey, results)
    setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL)
    
    return results
  }

  async deleteDocumentVectors(documentId: string): Promise<void> {
    await vectorDB.deleteVectorsByDocument(documentId)
    this.clearCache()
  }

  async getStorageStats() {
    return vectorDB.getStorageStats()
  }

  async clearAll(): Promise<void> {
    await vectorDB.clearAll()
    this.clearCache()
  }

  private getCacheKey(embedding: number[], options: VectorSearchOptions): string {
    const embeddingHash = embedding.slice(0, 10).join(',')
    return `${embeddingHash}_${JSON.stringify(options)}`
  }

  private clearCache(): void {
    this.cache.clear()
  }
}
