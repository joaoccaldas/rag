/**
 * Universal Storage Utility
 * Provides cross-port persistence for development by using multiple storage strategies
 */

interface StorageOptions {
  prefix?: string
  enableCrossDomainSync?: boolean
  storageKey?: string
}

type StorageValue = string | number | boolean | object | null

class UniversalStorage {
  private prefix: string
  private enableCrossDomainSync: boolean
  private storageKey: string

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'miele_rag'
    this.enableCrossDomainSync = options.enableCrossDomainSync ?? true
    this.storageKey = options.storageKey || 'universal_storage'
  }

  // Generate a storage key that works across ports
  private getUniversalKey(key: string): string {
    // Use domain without port for universal access
    const domain = window.location.hostname
    return `${this.prefix}_${domain}_${key}`
  }

  // Store data in multiple locations for redundancy
  async setItem(key: string, value: StorageValue): Promise<void> {
    const universalKey = this.getUniversalKey(key)
    const serializedValue = JSON.stringify(value)

    try {
      // 1. LocalStorage (current port)
      localStorage.setItem(key, serializedValue)
      
      // 2. Universal localStorage (cross-port)
      localStorage.setItem(universalKey, serializedValue)
      
      // 3. IndexedDB (most reliable)
      await this.setIndexedDB(universalKey, value)
      
      // 4. SessionStorage backup
      sessionStorage.setItem(universalKey, serializedValue)
      
      console.log(`Universal storage: Saved ${key} to multiple locations`)
    } catch (error) {
      console.error('Failed to save to universal storage:', error)
    }
  }

  // Retrieve data with fallback strategy
  async getItem<T = StorageValue>(key: string): Promise<T | null> {
    const universalKey = this.getUniversalKey(key)
    
    try {
      // 1. Try current localStorage first
      let value = localStorage.getItem(key)
      if (value) {
        return JSON.parse(value) as T
      }
      
      // 2. Try universal localStorage
      value = localStorage.getItem(universalKey)
      if (value) {
        // Restore to current localStorage
        localStorage.setItem(key, value)
        return JSON.parse(value) as T
      }
      
      // 3. Try IndexedDB
      const idbValue = await this.getIndexedDB<T>(universalKey)
      if (idbValue) {
        // Restore to localStorage
        const serialized = JSON.stringify(idbValue)
        localStorage.setItem(key, serialized)
        localStorage.setItem(universalKey, serialized)
        return idbValue
      }
      
      // 4. Try sessionStorage
      value = sessionStorage.getItem(universalKey)
      if (value) {
        const parsed = JSON.parse(value) as T
        // Restore to other storage locations
        await this.setItem(key, parsed as StorageValue)
        return parsed
      }
      
      return null
    } catch (error) {
      console.error('Failed to retrieve from universal storage:', error)
      return null
    }
  }

  // Remove from all storage locations
  async removeItem(key: string): Promise<void> {
    const universalKey = this.getUniversalKey(key)
    
    try {
      localStorage.removeItem(key)
      localStorage.removeItem(universalKey)
      sessionStorage.removeItem(universalKey)
      await this.deleteIndexedDB(universalKey)
    } catch (error) {
      console.error('Failed to remove from universal storage:', error)
    }
  }

  // IndexedDB operations
  private async setIndexedDB(key: string, value: StorageValue): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbName = `${this.prefix}_db`
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage')
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['storage'], 'readwrite')
        const store = transaction.objectStore('storage')
        
        const putRequest = store.put(value, key)
        putRequest.onsuccess = () => {
          db.close()
          resolve()
        }
        putRequest.onerror = () => {
          db.close()
          reject(putRequest.error)
        }
      }
    })
  }

  private async getIndexedDB<T = StorageValue>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const dbName = `${this.prefix}_db`
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage')
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['storage'], 'readonly')
        const store = transaction.objectStore('storage')
        
        const getRequest = store.get(key)
        getRequest.onsuccess = () => {
          db.close()
          resolve(getRequest.result as T || null)
        }
        getRequest.onerror = () => {
          db.close()
          reject(getRequest.error)
        }
      }
    })
  }

  private async deleteIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbName = `${this.prefix}_db`
      const request = indexedDB.open(dbName, 1)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['storage'], 'readwrite')
        const store = transaction.objectStore('storage')
        
        const deleteRequest = store.delete(key)
        deleteRequest.onsuccess = () => {
          db.close()
          resolve()
        }
        deleteRequest.onerror = () => {
          db.close()
          reject(deleteRequest.error)
        }
      }
    })
  }

  // Sync data across all known ports
  async syncAcrossPorts(): Promise<void> {
    const currentPort = window.location.port || '3000'
    
    console.log(`Syncing data across ports, current: ${currentPort}`)
    
    // This would require a more sophisticated approach in a real application
    // For now, we rely on IndexedDB which is shared across ports on the same domain
    console.log('Cross-port sync relies on IndexedDB shared storage')
  }
}

// Create singleton instance
export const universalStorage = new UniversalStorage()

// Enhanced storage wrapper for RAG system
export class RAGUniversalStorage {
  private storage = universalStorage

  async saveDocuments(documents: Record<string, unknown>[]): Promise<void> {
    await this.storage.setItem('documents', documents)
  }

  async getDocuments(): Promise<Record<string, unknown>[]> {
    return (await this.storage.getItem<Record<string, unknown>[]>('documents')) || []
  }

  async saveChunks(chunks: Record<string, unknown>[]): Promise<void> {
    await this.storage.setItem('chunks', chunks)
  }

  async getChunks(): Promise<Record<string, unknown>[]> {
    return (await this.storage.getItem<Record<string, unknown>[]>('chunks')) || []
  }

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.storage.setItem('settings', settings)
  }

  async getSettings(): Promise<Record<string, unknown>> {
    return (await this.storage.getItem<Record<string, unknown>>('settings')) || {}
  }

  async saveVisualContent(content: Record<string, unknown>[]): Promise<void> {
    await this.storage.setItem('visual_content', content)
  }

  async getVisualContent(): Promise<Record<string, unknown>[]> {
    return (await this.storage.getItem<Record<string, unknown>[]>('visual_content')) || []
  }

  async saveChatHistory(history: Record<string, unknown>[]): Promise<void> {
    await this.storage.setItem('chat_history', history)
  }

  async getChatHistory(): Promise<Record<string, unknown>[]> {
    return (await this.storage.getItem<Record<string, unknown>[]>('chat_history')) || []
  }

  async clearAll(): Promise<void> {
    const keys = ['documents', 'chunks', 'settings', 'visual_content', 'chat_history']
    for (const key of keys) {
      await this.storage.removeItem(key)
    }
  }

  // Migration utility
  async migrateFromLocalStorage(): Promise<void> {
    const keys = ['rag_documents', 'rag_chunks', 'rag_settings', 'rag_visual_content', 'chat_history']
    
    for (const key of keys) {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          const parsed = JSON.parse(value)
          const newKey = key.replace('rag_', '').replace('_', '_')
          await this.storage.setItem(newKey, parsed)
          console.log(`Migrated ${key} to universal storage`)
        } catch (error) {
          console.warn(`Failed to migrate ${key}:`, error)
        }
      }
    }
  }
}

export const ragUniversalStorage = new RAGUniversalStorage()
