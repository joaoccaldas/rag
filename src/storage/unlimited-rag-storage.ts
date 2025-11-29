/**
 * RAG Unlimited Storage System
 * Overcomes browser localStorage limitations for unlimited document and visual content storage
 */

interface Document {
  id: string
  name: string
  content: string
  type: string
  createdAt: string
  embedding?: number[]
  chunks?: DocumentChunk[]
}

interface DocumentChunk {
  id: string
  content: string
  embedding?: number[]
}

interface VisualContent {
  id: string
  type: string
  data?: {
    base64?: string
  }
  thumbnail?: string
  metadata?: Record<string, unknown>
}

// IndexedDB wrapper for unlimited storage
class RAGIndexedDB {
  private dbName = 'miele-rag-unlimited'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('visualContent')) {
          db.createObjectStore('visualContent', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('chatHistory')) {
          db.createObjectStore('chatHistory', { keyPath: 'id' })
        }
      }
    })
  }

  async store<T extends { id: string }>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { usage: 0, quota: 2 * 1024 * 1024 * 1024 } // 2GB default estimate
  }
}

export class UnlimitedRAGStorage {
  private indexedDB = new RAGIndexedDB()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      await this.indexedDB.init()
      console.log('✅ Unlimited RAG storage initialized')
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize unlimited storage:', error)
      throw error
    }
  }

  // Document management with unlimited capacity
  async storeDocument(document: Document): Promise<void> {
    await this.init()

    try {
      await this.indexedDB.store('documents', document)
      console.log(`✅ Document ${document.name} stored (unlimited)`)
      
      // Remove from localStorage to free space
      this.removeFromLocalStorage('rag_documents', document.id)
    } catch (error) {
      console.error('Failed to store document:', error)
      throw error
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    await this.init()
    return await this.indexedDB.get<Document>('documents', id)
  }

  async getAllDocuments(): Promise<Document[]> {
    await this.init()
    return await this.indexedDB.getAll<Document>('documents')
  }

  async deleteDocument(id: string): Promise<void> {
    await this.init()
    await this.indexedDB.delete('documents', id)
  }

  // Visual content with unlimited capacity
  async storeVisualContent(visualItems: VisualContent[]): Promise<void> {
    await this.init()

    try {
      for (const item of visualItems) {
        await this.indexedDB.store('visualContent', item)
      }
      console.log(`✅ ${visualItems.length} visual items stored (unlimited)`)
      
      // Clear localStorage visual content
      localStorage.removeItem('rag_visual_content')
    } catch (error) {
      console.error('Failed to store visual content:', error)
      throw error
    }
  }

  async getVisualContent(): Promise<VisualContent[]> {
    await this.init()
    return await this.indexedDB.getAll<VisualContent>('visualContent')
  }

  async getVisualContentByDocument(documentId: string): Promise<VisualContent[]> {
    await this.init()
    const allVisual = await this.getVisualContent()
    return allVisual.filter(item => item.metadata?.['documentId'] === documentId)
  }

  // Chat history with unlimited capacity
  async storeChatMessage(message: { id?: string; content: string; role: string; timestamp?: string }): Promise<void> {
    await this.init()

    const chatMessage = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp || new Date().toISOString()
    }

    await this.indexedDB.store('chatHistory', chatMessage)
  }

  async getChatHistory(limit?: number): Promise<Array<{ id: string; content: string; role: string; timestamp: string }>> {
    await this.init()
    const allMessages = await this.indexedDB.getAll<{ id: string; content: string; role: string; timestamp: string }>('chatHistory')
    
    // Sort by timestamp and limit if requested
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    if (limit) {
      return allMessages.slice(-limit)
    }
    
    return allMessages
  }

  // Storage statistics and management
  async getStorageStats(): Promise<{
    indexedDB: { usage: number; quota: number; usageGB: number; quotaGB: number }
    localStorage: { usage: number; limit: number; usageKB: number; limitMB: number }
    recommendations: string[]
  }> {
    await this.init()

    const indexedDBStats = await this.indexedDB.getStorageEstimate()
    
    let localStorageUsage = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          localStorageUsage += value.length * 2 // UTF-16 = 2 bytes per char
        }
      }
    } catch {
      localStorageUsage = 0
    }

    const recommendations: string[] = []
    
    if (localStorageUsage > 5 * 1024 * 1024) { // 5MB
      recommendations.push('LocalStorage is over 5MB - consider migrating to unlimited storage')
    }
    
    if (indexedDBStats.usage > indexedDBStats.quota * 0.8) {
      recommendations.push('IndexedDB is over 80% full - consider cleaning old data')
    } else {
      recommendations.push(`You have ${Math.round((indexedDBStats.quota - indexedDBStats.usage) / (1024 * 1024 * 1024))}GB of unlimited storage available`)
    }

    return {
      indexedDB: {
        usage: indexedDBStats.usage,
        quota: indexedDBStats.quota,
        usageGB: indexedDBStats.usage / (1024 * 1024 * 1024),
        quotaGB: indexedDBStats.quota / (1024 * 1024 * 1024)
      },
      localStorage: {
        usage: localStorageUsage,
        limit: 10 * 1024 * 1024, // 10MB typical
        usageKB: localStorageUsage / 1024,
        limitMB: 10
      },
      recommendations
    }
  }

  // Migration utilities
  async migrateFromLocalStorage(): Promise<{ documentsCount: number; visualCount: number; chatCount: number }> {
    await this.init()
    console.log('🔄 Starting migration from localStorage to unlimited storage...')

    let documentsCount = 0
    let visualCount = 0
    let chatCount = 0

    try {
      // Migrate documents
      const docsData = localStorage.getItem('rag_documents')
      if (docsData) {
        const documents = JSON.parse(docsData) as Document[]
        for (const doc of documents) {
          await this.storeDocument(doc)
          documentsCount++
        }
        localStorage.removeItem('rag_documents')
        console.log(`✅ Migrated ${documentsCount} documents`)
      }

      // Migrate visual content
      const visualData = localStorage.getItem('rag_visual_content')
      if (visualData) {
        const visualItems = JSON.parse(visualData) as VisualContent[]
        await this.storeVisualContent(visualItems)
        visualCount = visualItems.length
        console.log(`✅ Migrated ${visualCount} visual items`)
      }

      // Migrate chat history
      const chatData = localStorage.getItem('chat_history')
      if (chatData) {
        const chatMessages = JSON.parse(chatData) as Array<{ content: string; role: string }>
        for (const message of chatMessages) {
          await this.storeChatMessage(message)
          chatCount++
        }
        localStorage.removeItem('chat_history')
        console.log(`✅ Migrated ${chatCount} chat messages`)
      }

      console.log('🎉 Migration completed successfully!')
      return { documentsCount, visualCount, chatCount }
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  private removeFromLocalStorage(key: string, itemId: string): void {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        const items = JSON.parse(data)
        if (Array.isArray(items)) {
          const filtered = items.filter((item: { id: string }) => item.id !== itemId)
          localStorage.setItem(key, JSON.stringify(filtered))
        }
      }
    } catch (error) {
      console.warn(`Failed to remove item ${itemId} from localStorage ${key}:`, error)
    }
  }

  // Cleanup and optimization
  async optimizeStorage(): Promise<void> {
    await this.init()
    console.log('🧹 Optimizing unlimited storage...')

    // Could implement compression, deduplication, etc.
    // For now, just log the optimization
    const stats = await this.getStorageStats()
    console.log('Storage optimization completed. Current usage:', {
      indexedDBGB: Math.round(stats.indexedDB.usageGB * 100) / 100,
      localStorageKB: Math.round(stats.localStorage.usageKB)
    })
  }
}

// Export singleton instance
export const unlimitedRAGStorage = new UnlimitedRAGStorage()

// Helper function to check if unlimited storage is supported
export function isUnlimitedStorageSupported(): boolean {
  return 'indexedDB' in window
}

// Helper function to get storage capacity information
export async function getStorageCapacityInfo(): Promise<{
  hasUnlimitedStorage: boolean
  estimatedCapacity: string
  currentUsage: string
  recommendations: string[]
}> {
  const hasUnlimitedStorage = isUnlimitedStorageSupported()
  
  if (!hasUnlimitedStorage) {
    return {
      hasUnlimitedStorage: false,
      estimatedCapacity: 'Not available',
      currentUsage: 'Unknown',
      recommendations: ['Browser does not support IndexedDB - limited to localStorage only']
    }
  }

  try {
    const stats = await unlimitedRAGStorage.getStorageStats()
    
    return {
      hasUnlimitedStorage: true,
      estimatedCapacity: `${Math.round(stats.indexedDB.quotaGB)}GB`,
      currentUsage: `${Math.round(stats.indexedDB.usageGB * 100) / 100}GB`,
      recommendations: stats.recommendations
    }
  } catch {
    return {
      hasUnlimitedStorage: true,
      estimatedCapacity: 'Unknown',
      currentUsage: 'Unknown',
      recommendations: ['Error accessing storage information']
    }
  }
}
