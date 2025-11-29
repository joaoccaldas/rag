/**
 * IndexedDB Vector Database Adapter
 * 
 * Enhanced implementation of the existing IndexedDB storage with improved performance
 * and standardized interface for vector operations.
 * 
 * Why: Maintains backward compatibility while providing performance optimizations
 * and preparing for migration to enterprise vector databases.
 */

import { BaseVectorDatabase, VectorDocument, SearchQuery, SearchResult, VectorDatabaseConfig } from './index'

interface IndexedDBSchema {
  documents: VectorDocument
  metadata: {
    id: string
    lastUpdated: Date
    documentCount: number
  }
}

export class IndexedDBVectorDatabase extends BaseVectorDatabase {
  private db: IDBDatabase | null = null
  private readonly dbName = 'MieleRAGVectorDB'
  private readonly dbVersion = 2
  
  constructor(config: VectorDatabaseConfig) {
    super(config)
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'))
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB Vector Database initialized')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create documents store with optimized indexes
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' })
          documentsStore.createIndex('documentId', 'metadata.documentId', { unique: false })
          documentsStore.createIndex('type', 'metadata.type', { unique: false })
          documentsStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
          documentsStore.createIndex('keywords', 'metadata.keywords', { unique: false, multiEntry: true })
        }
        
        // Create metadata store for database statistics
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' })
        }
      }
    })
  }

  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['documents', 'metadata'], 'readwrite')
    const documentsStore = transaction.objectStore('documents')
    const metadataStore = transaction.objectStore('metadata')
    
    // Batch insert for better performance
    const promises = documents.map(doc => {
      return new Promise<void>((resolve, reject) => {
        const request = documentsStore.put(doc)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    
    await Promise.all(promises)
    
    // Update metadata
    const stats = await this.getStats()
    await new Promise<void>((resolve, reject) => {
      const metadataRequest = metadataStore.put({
        id: 'stats',
        lastUpdated: new Date(),
        documentCount: stats.count + documents.length
      })
      metadataRequest.onsuccess = () => resolve()
      metadataRequest.onerror = () => reject(metadataRequest.error)
    })
    
    console.log(`✅ Added ${documents.length} documents to IndexedDB`)
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const results: SearchResult[] = []
      const request = store.openCursor()
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const document = cursor.value as VectorDocument
          
          // Apply filters if provided
          if (query.filters && !this.matchesFilters(document, query.filters)) {
            cursor.continue()
            return
          }
          
          // Calculate cosine similarity
          const similarity = this.calculateCosineSimilarity(query.vector, document.embedding)
          
          if (similarity >= (query.threshold || 0.3)) {
            results.push({
              document,
              similarity,
              relevantText: this.extractRelevantText(document.content, 200)
            })
          }
          
          cursor.continue()
        } else {
          // Sort by similarity and limit results
          results.sort((a, b) => b.similarity - a.similarity)
          const limitedResults = results.slice(0, query.limit || 10)
          resolve(limitedResults)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => {
        console.log(`✅ Deleted document ${id} from IndexedDB`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async updateDocument(document: VectorDocument): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.put(document)
      request.onsuccess = () => {
        console.log(`✅ Updated document ${document.id} in IndexedDB`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getStats(): Promise<{ count: number; collections: string[] }> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => {
        resolve({
          count: request.result,
          collections: ['documents'] // IndexedDB doesn't have collections, but we maintain interface
        })
      }
      request.onerror = () => reject(request.error)
    })
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('✅ IndexedDB connection closed')
    }
  }

  // Helper methods
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  private matchesFilters(document: VectorDocument, filters: Record<string, string | number | boolean>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const documentValue = this.getNestedValue(document as unknown as Record<string, unknown>, key)
      if (documentValue !== value) return false
    }
    return true
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, obj as unknown)
  }

  private extractRelevantText(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }
}
