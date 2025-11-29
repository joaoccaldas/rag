// Enhanced Storage Utilities for RAG System

import { Document } from '../types'

const DB_NAME = 'RAGDatabase'
const DB_VERSION = 1
const STORE_NAME = 'documents'

/**
 * IndexedDB wrapper for document storage
 * Falls back to localStorage if IndexedDB is unavailable
 */
class RAGStorage {
  private db: IDBDatabase | null = null
  private isInitialized = false

  /**
   * Initialize the storage system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Try to initialize IndexedDB
      await this.initIndexedDB()
      console.log('RAG Storage: IndexedDB initialized successfully')
    } catch (error) {
      console.warn('RAG Storage: IndexedDB unavailable, using localStorage fallback', error)
    }
    
    this.isInitialized = true
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create documents store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
        }
      }
    })
  }

  /**
   * Save documents to storage
   */
  async saveDocuments(documents: Document[]): Promise<void> {
    await this.initialize()

    // Try IndexedDB first
    if (this.db) {
      try {
        return await this.saveToIndexedDB(documents)
      } catch (error) {
        console.warn('IndexedDB save failed, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    this.saveToLocalStorage(documents)
  }

  /**
   * Load documents from storage
   */
  async loadDocuments(): Promise<Document[]> {
    await this.initialize()

    // Try IndexedDB first
    if (this.db) {
      try {
        return await this.loadFromIndexedDB()
      } catch (error) {
        console.warn('IndexedDB load failed, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    return this.loadFromLocalStorage()
  }

  /**
   * Delete a document from storage
   */
  async deleteDocument(id: string): Promise<void> {
    await this.initialize()

    // Try IndexedDB first
    if (this.db) {
      try {
        return await this.deleteFromIndexedDB(id)
      } catch (error) {
        console.warn('IndexedDB delete failed, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    this.deleteFromLocalStorage(id)
  }

  /**
   * Clear all documents from storage
   */
  async clearAllDocuments(): Promise<void> {
    await this.initialize()

    // Try IndexedDB first
    if (this.db) {
      try {
        return await this.clearIndexedDB()
      } catch (error) {
        console.warn('IndexedDB clear failed, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    this.clearLocalStorage()
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear localStorage
   */
  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem('rag-documents')
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  /**
   * Save to IndexedDB
   */
  private async saveToIndexedDB(documents: Document[]): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // Instead of clearing all and re-adding, let's update/add each document individually
      let pending = documents.length
      if (pending === 0) {
        resolve()
        return
      }

      documents.forEach(doc => {
        // Use put instead of add to allow updates
        const putRequest = store.put(doc)
        putRequest.onsuccess = () => {
          pending--
          if (pending === 0) resolve()
        }
        putRequest.onerror = () => reject(putRequest.error)
      })

      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Load from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<Document[]> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const documents = request.result.map(this.parseDocument)
        resolve(documents)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete from IndexedDB
   */
  private async deleteFromIndexedDB(id: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save to localStorage (fallback)
   */
  private saveToLocalStorage(documents: Document[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('rag-documents', JSON.stringify(documents))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  /**
   * Load from localStorage (fallback)
   */
  private loadFromLocalStorage(): Document[] {
    if (typeof window === 'undefined') return []
    
    try {
      const saved = localStorage.getItem('rag-documents')
      if (saved) {
        return JSON.parse(saved).map(this.parseDocument)
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    
    return []
  }

  /**
   * Delete from localStorage (fallback)
   */
  private deleteFromLocalStorage(id: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem('rag-documents')
      if (saved) {
        const documents = JSON.parse(saved)
        const filtered = documents.filter((doc: Document) => doc.id !== id)
        localStorage.setItem('rag-documents', JSON.stringify(filtered))
      }
    } catch (error) {
      console.error('Failed to delete from localStorage:', error)
    }
  }

  /**
   * Parse document and convert date strings back to Date objects
   */
  private parseDocument(doc: Document & { uploadedAt: string; lastModified: string; metadata: { createdAt?: string } }): Document {
    return {
      ...doc,
      uploadedAt: new Date(doc.uploadedAt),
      lastModified: new Date(doc.lastModified),
      metadata: {
        ...doc.metadata,
        createdAt: doc.metadata.createdAt ? new Date(doc.metadata.createdAt) : undefined
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    available: boolean
    type: 'indexeddb' | 'localstorage'
    usage?: number
    quota?: number
  }> {
    await this.initialize()

    if (this.db) {
      try {
        // Try to get storage estimate if available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          return {
            available: true,
            type: 'indexeddb',
            usage: estimate.usage,
            quota: estimate.quota
          }
        }
        
        return {
          available: true,
          type: 'indexeddb'
        }
      } catch (error) {
        console.warn('Storage stats unavailable:', error)
      }
    }

    return {
      available: typeof window !== 'undefined' && !!window.localStorage,
      type: 'localstorage'
    }
  }
}

// Create singleton instance
export const ragStorage = new RAGStorage()
