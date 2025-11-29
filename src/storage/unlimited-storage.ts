/**
 * Unlimited Storage System for RAG
 * Implements multiple storage layers to overcome browser limitations
 */

// IndexedDB wrapper for large data storage
class IndexedDBStorage {
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
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' })
          docStore.createIndex('type', 'type', { unique: false })
          docStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('visualContent')) {
          const visualStore = db.createObjectStore('visualContent', { keyPath: 'id' })
          visualStore.createIndex('documentId', 'documentId', { unique: false })
          visualStore.createIndex('type', 'type', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('embeddings')) {
          const embeddingStore = db.createObjectStore('embeddings', { keyPath: 'id' })
          embeddingStore.createIndex('documentId', 'documentId', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('chatHistory')) {
          const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id' })
          chatStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('filename', 'filename', { unique: false })
        }
      }
    })
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAll(storeName: string): Promise<any[]> {
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

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getStorageUsage(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { usage: 0, quota: 0 }
  }
}

// File System Access API wrapper (for browsers that support it)
class FileSystemStorage {
  private directoryHandle: FileSystemDirectoryHandle | null = null
  
  async init(): Promise<boolean> {
    try {
      if ('showDirectoryPicker' in window) {
        // This requires user permission
        this.directoryHandle = await (window as any).showDirectoryPicker({
          id: 'miele-rag-storage',
          mode: 'readwrite'
        })
        return true
      }
    } catch (error) {
      console.warn('File System Access API not available or permission denied:', error)
    }
    return false
  }

  async isAvailable(): Promise<boolean> {
    return 'showDirectoryPicker' in window
  }

  async saveFile(filename: string, data: string | ArrayBuffer): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('File system not initialized')
    }

    const fileHandle = await this.directoryHandle.getFileHandle(filename, {
      create: true
    })
    const writable = await fileHandle.createWritable()
    await writable.write(data)
    await writable.close()
  }

  async loadFile(filename: string): Promise<string> {
    if (!this.directoryHandle) {
      throw new Error('File system not initialized')
    }

    const fileHandle = await this.directoryHandle.getFileHandle(filename)
    const file = await fileHandle.getFile()
    return await file.text()
  }

  async deleteFile(filename: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('File system not initialized')
    }

    await this.directoryHandle.removeEntry(filename)
  }

  async listFiles(): Promise<string[]> {
    if (!this.directoryHandle) {
      throw new Error('File system not initialized')
    }

    const files: string[] = []
    for await (const [name, handle] of this.directoryHandle.entries()) {
      if (handle.kind === 'file') {
        files.push(name)
      }
    }
    return files
  }
}

// Compression utilities
class CompressionUtils {
  static async compress(data: string): Promise<string> {
    try {
      // Use browser's native compression if available
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip')
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        
        const compressed = new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(data))
              controller.close()
            }
          }).pipeThrough(stream)
        )
        
        const arrayBuffer = await compressed.arrayBuffer()
        return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      } else {
        // Fallback: Simple string compression
        return this.simpleCompress(data)
      }
    } catch (error) {
      console.warn('Compression failed, using original data:', error)
      return data
    }
  }

  static async decompress(compressedData: string): Promise<string> {
    try {
      if ('DecompressionStream' in window && compressedData !== this.simpleCompress(compressedData)) {
        const stream = new DecompressionStream('gzip')
        const decoder = new TextDecoder()
        
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0))
        const decompressed = new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(compressed)
              controller.close()
            }
          }).pipeThrough(stream)
        )
        
        return await decompressed.text()
      } else {
        return this.simpleDecompress(compressedData)
      }
    } catch (error) {
      console.warn('Decompression failed, returning original data:', error)
      return compressedData
    }
  }

  private static simpleCompress(data: string): string {
    // Simple run-length encoding for repeated patterns
    return data.replace(/(.)\1{2,}/g, (match, char) => `${char}${match.length}`)
  }

  private static simpleDecompress(data: string): string {
    // Reverse simple compression
    return data.replace(/(.)\d+/g, (match, char) => {
      const count = parseInt(match.slice(1))
      return char.repeat(count)
    })
  }
}

// Main Unlimited Storage Manager
export class UnlimitedStorageManager {
  private indexedDB = new IndexedDBStorage()
  private fileSystem = new FileSystemStorage()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      await this.indexedDB.init()
      console.log('✅ IndexedDB initialized')
    } catch (error) {
      console.error('IndexedDB initialization failed:', error)
    }

    // File system is optional and requires user permission
    try {
      const fsAvailable = await this.fileSystem.isAvailable()
      if (fsAvailable) {
        console.log('📁 File System Access API available (requires user permission)')
      }
    } catch (error) {
      console.warn('File system not available:', error)
    }

    this.initialized = true
  }

  // Document storage with unlimited capacity
  async storeDocument(document: any): Promise<void> {
    await this.init()

    try {
      // Compress large content
      if (document.content && document.content.length > 10000) {
        document.content = await CompressionUtils.compress(document.content)
        document._compressed = true
      }

      // Store in IndexedDB
      await this.indexedDB.store('documents', document)
      
      // Remove from localStorage to free space
      const localDocs = localStorage.getItem('rag_documents')
      if (localDocs) {
        const parsed = JSON.parse(localDocs)
        const filtered = parsed.filter((doc: any) => doc.id !== document.id)
        localStorage.setItem('rag_documents', JSON.stringify(filtered))
      }

      console.log(`✅ Document ${document.id} stored in unlimited storage`)
    } catch (error) {
      console.error('Failed to store document:', error)
      throw error
    }
  }

  async getDocument(id: string): Promise<any> {
    await this.init()

    try {
      const document = await this.indexedDB.get('documents', id)
      
      if (document && document._compressed) {
        document.content = await CompressionUtils.decompress(document.content)
        delete document._compressed
      }

      return document
    } catch (error) {
      console.error('Failed to get document:', error)
      return null
    }
  }

  async getAllDocuments(): Promise<any[]> {
    await this.init()

    try {
      const documents = await this.indexedDB.getAll('documents')
      
      // Decompress if needed
      for (const doc of documents) {
        if (doc._compressed) {
          doc.content = await CompressionUtils.decompress(doc.content)
          delete doc._compressed
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to get all documents:', error)
      return []
    }
  }

  // Visual content storage
  async storeVisualContent(visualContent: any[]): Promise<void> {
    await this.init()

    try {
      for (const item of visualContent) {
        // Compress base64 images
        if (item.data?.base64) {
          item.data.base64 = await CompressionUtils.compress(item.data.base64)
          item._imageCompressed = true
        }

        await this.indexedDB.store('visualContent', item)
      }

      // Clear from localStorage
      localStorage.removeItem('rag_visual_content')
      
      console.log(`✅ ${visualContent.length} visual items stored in unlimited storage`)
    } catch (error) {
      console.error('Failed to store visual content:', error)
      throw error
    }
  }

  async getVisualContent(): Promise<any[]> {
    await this.init()

    try {
      const visualContent = await this.indexedDB.getAll('visualContent')
      
      // Decompress images
      for (const item of visualContent) {
        if (item._imageCompressed && item.data?.base64) {
          item.data.base64 = await CompressionUtils.decompress(item.data.base64)
          delete item._imageCompressed
        }
      }

      return visualContent
    } catch (error) {
      console.error('Failed to get visual content:', error)
      return []
    }
  }

  // Embeddings storage
  async storeEmbeddings(embeddings: any[]): Promise<void> {
    await this.init()

    try {
      for (const embedding of embeddings) {
        await this.indexedDB.store('embeddings', embedding)
      }
      console.log(`✅ ${embeddings.length} embeddings stored`)
    } catch (error) {
      console.error('Failed to store embeddings:', error)
      throw error
    }
  }

  async getEmbeddings(documentId?: string): Promise<any[]> {
    await this.init()

    try {
      const allEmbeddings = await this.indexedDB.getAll('embeddings')
      
      if (documentId) {
        return allEmbeddings.filter(emb => emb.documentId === documentId)
      }
      
      return allEmbeddings
    } catch (error) {
      console.error('Failed to get embeddings:', error)
      return []
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<{
    indexedDB: { usage: number; quota: number }
    localStorage: { usage: number; limit: number }
    totalCapacity: string
  }> {
    await this.init()

    const indexedDBStats = await this.indexedDB.getStorageUsage()
    
    let localStorageUsage = 0
    try {
      localStorageUsage = JSON.stringify(localStorage).length
    } catch (e) {
      localStorageUsage = 0
    }

    return {
      indexedDB: indexedDBStats,
      localStorage: {
        usage: localStorageUsage,
        limit: 10 * 1024 * 1024 // 10MB typical limit
      },
      totalCapacity: `${Math.round(indexedDBStats.quota / (1024 * 1024 * 1024))}GB available via IndexedDB`
    }
  }

  // Migration from localStorage to unlimited storage
  async migrateFromLocalStorage(): Promise<void> {
    console.log('🔄 Migrating data from localStorage to unlimited storage...')

    try {
      // Migrate documents
      const docs = localStorage.getItem('rag_documents')
      if (docs) {
        const documents = JSON.parse(docs)
        for (const doc of documents) {
          await this.storeDocument(doc)
        }
        console.log(`✅ Migrated ${documents.length} documents`)
      }

      // Migrate visual content
      const visual = localStorage.getItem('rag_visual_content')
      if (visual) {
        const visualContent = JSON.parse(visual)
        await this.storeVisualContent(visualContent)
        console.log(`✅ Migrated ${visualContent.length} visual items`)
      }

      // Migrate chat history
      const chat = localStorage.getItem('chat_history')
      if (chat) {
        const chatHistory = JSON.parse(chat)
        for (const message of chatHistory) {
          await this.indexedDB.store('chatHistory', {
            id: `msg_${Date.now()}_${Math.random()}`,
            ...message,
            timestamp: new Date().toISOString()
          })
        }
        console.log(`✅ Migrated ${chatHistory.length} chat messages`)
      }

      console.log('🎉 Migration completed successfully!')
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  // Enable file system storage (requires user permission)
  async enableFileSystemStorage(): Promise<boolean> {
    try {
      const enabled = await this.fileSystem.init()
      if (enabled) {
        console.log('✅ File System Access enabled - truly unlimited storage!')
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to enable file system storage:', error)
      return false
    }
  }
}

// Export singleton instance
export const unlimitedStorage = new UnlimitedStorageManager()
