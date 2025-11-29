/**
 * UNIFIED STORAGE MANAGER - SINGLE SOURCE OF TRUTH
 * 
 * This replaces multiple conflicting storage systems:
 * - UnifiedStorageManager.ts
 * - enhanced-file-storage.ts  
 * - file-system-visual-storage.ts
 * - visual-content-storage.ts
 * 
 * Provides consistent interface across localStorage, filesystem, and IndexedDB
 */

import { VisualContent, Document, AIAnalysisData } from '../rag/types'

// Define storage data types
type StorageData = Document | VisualContent | AIAnalysisData | Record<string, unknown>

// Storage adapter interface
interface StorageAdapter {
  name: string
  available: boolean
  store(key: string, data: StorageData): Promise<void>
  retrieve(key: string): Promise<StorageData | null>
  delete(key: string): Promise<void>
  list(): Promise<string[]>
  clear(): Promise<void>
  getStats(): Promise<StorageStats>
}

interface StorageStats {
  itemCount: number
  totalSize: number
  freeSpace?: number
  lastModified: Date
}

interface StorageConfig {
  preferredAdapter: 'localStorage' | 'filesystem' | 'indexeddb' | 'auto'
  fallbackChain: string[]
  enableCompression: boolean
  enableEncryption: boolean
  autoCleanup: boolean
  maxCacheSize: number
}

// LocalStorage Adapter
class LocalStorageAdapter implements StorageAdapter {
  name = 'localStorage'
  
  get available(): boolean {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }
  
  async store(key: string, data: StorageData): Promise<void> {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      })
      localStorage.setItem(`rag_unified_${key}`, serialized)
    } catch (error) {
      throw new Error(`LocalStorage store failed: ${error}`)
    }
  }
  
  async retrieve(key: string): Promise<StorageData | null> {
    try {
      const stored = localStorage.getItem(`rag_unified_${key}`)
      if (!stored) return null
      
      const parsed = JSON.parse(stored)
      return parsed.data
    } catch (error) {
      console.warn(`LocalStorage retrieve failed for ${key}:`, error)
      return null
    }
  }
  
  async delete(key: string): Promise<void> {
    localStorage.removeItem(`rag_unified_${key}`)
  }
  
  async list(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('rag_unified_')) {
        keys.push(key.replace('rag_unified_', ''))
      }
    }
    return keys
  }
  
  async clear(): Promise<void> {
    const keys = await this.list()
    keys.forEach(key => this.delete(key))
  }
  
  async getStats(): Promise<StorageStats> {
    const keys = await this.list()
    let totalSize = 0
    
    keys.forEach(key => {
      const stored = localStorage.getItem(`rag_unified_${key}`)
      if (stored) totalSize += stored.length
    })
    
    return {
      itemCount: keys.length,
      totalSize,
      freeSpace: 5 * 1024 * 1024 - totalSize, // 5MB limit estimate
      lastModified: new Date()
    }
  }
}

// Filesystem Adapter (for Node.js/Electron environments)
class FilesystemAdapter implements StorageAdapter {
  name = 'filesystem'
  private basePath: string
  
  constructor(basePath: string = './storage') {
    this.basePath = basePath
  }
  
  get available(): boolean {
    return typeof window === 'undefined' || Boolean((window as any).electronAPI)
  }
  
  async store(key: string, data: StorageData): Promise<void> {
    if (!this.available) throw new Error('Filesystem not available')
    
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      await fs.mkdir(this.basePath, { recursive: true })
      
      const filePath = path.join(this.basePath, `${key}.json`)
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      }, null, 2)
      
      await fs.writeFile(filePath, serialized, 'utf8')
    } catch (error) {
      throw new Error(`Filesystem store failed: ${error}`)
    }
  }
  
  async retrieve(key: string): Promise<StorageData | null> {
    if (!this.available) return null
    
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const filePath = path.join(this.basePath, `${key}.json`)
      const content = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)
      
      return parsed.data
    } catch (error) {
      console.warn(`Filesystem retrieve failed for ${key}:`, error)
      return null
    }
  }
  
  async delete(key: string): Promise<void> {
    if (!this.available) return
    
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const filePath = path.join(this.basePath, `${key}.json`)
      await fs.unlink(filePath)
    } catch (error) {
      console.warn(`Filesystem delete failed for ${key}:`, error)
    }
  }
  
  async list(): Promise<string[]> {
    if (!this.available) return []
    
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const files = await fs.readdir(this.basePath)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'))
    } catch (error) {
      console.warn('Filesystem list failed:', error)
      return []
    }
  }
  
  async clear(): Promise<void> {
    const keys = await this.list()
    await Promise.all(keys.map(key => this.delete(key)))
  }
  
  async getStats(): Promise<StorageStats> {
    const keys = await this.list()
    let totalSize = 0
    
    if (this.available) {
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        
        for (const key of keys) {
          const filePath = path.join(this.basePath, `${key}.json`)
          const stats = await fs.stat(filePath)
          totalSize += stats.size
        }
      } catch (error) {
        console.warn('Filesystem stats failed:', error)
      }
    }
    
    return {
      itemCount: keys.length,
      totalSize,
      lastModified: new Date()
    }
  }
}

// IndexedDB Adapter (for larger client-side storage)
class IndexedDBAdapter implements StorageAdapter {
  name = 'indexeddb'
  private dbName = 'rag_unified_storage'
  private version = 1
  
  get available(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window
  }
  
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' })
        }
      }
    })
  }
  
  async store(key: string, data: StorageData): Promise<void> {
    if (!this.available) throw new Error('IndexedDB not available')
    
    const db = await this.getDB()
    const transaction = db.transaction(['storage'], 'readwrite')
    const store = transaction.objectStore('storage')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        version: '1.0'
      })
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async retrieve(key: string): Promise<StorageData | null> {
    if (!this.available) return null
    
    try {
      const db = await this.getDB()
      const transaction = db.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.data : null)
        }
      })
    } catch (error) {
      console.warn(`IndexedDB retrieve failed for ${key}:`, error)
      return null
    }
  }
  
  async delete(key: string): Promise<void> {
    if (!this.available) return
    
    const db = await this.getDB()
    const transaction = db.transaction(['storage'], 'readwrite')
    const store = transaction.objectStore('storage')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async list(): Promise<string[]> {
    if (!this.available) return []
    
    try {
      const db = await this.getDB()
      const transaction = db.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result as string[])
      })
    } catch (error) {
      console.warn('IndexedDB list failed:', error)
      return []
    }
  }
  
  async clear(): Promise<void> {
    if (!this.available) return
    
    const db = await this.getDB()
    const transaction = db.transaction(['storage'], 'readwrite')
    const store = transaction.objectStore('storage')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async getStats(): Promise<StorageStats> {
    const keys = await this.list()
    let totalSize = 0
    
    // Estimate size (IndexedDB doesn't provide direct size info)
    if (this.available) {
      try {
        const db = await this.getDB()
        const transaction = db.transaction(['storage'], 'readonly')
        const store = transaction.objectStore('storage')
        
        await new Promise<void>((resolve, reject) => {
          const request = store.getAll()
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const results = request.result
            totalSize = JSON.stringify(results).length
            resolve()
          }
        })
      } catch (error) {
        console.warn('IndexedDB stats failed:', error)
      }
    }
    
    return {
      itemCount: keys.length,
      totalSize,
      lastModified: new Date()
    }
  }
}

// Main Unified Storage Manager
export class UnifiedStorageManager {
  private adapters: Map<string, StorageAdapter> = new Map()
  private config: StorageConfig
  private activeAdapter: StorageAdapter | null = null
  
  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      preferredAdapter: 'auto',
      fallbackChain: ['indexeddb', 'localStorage', 'filesystem'],
      enableCompression: false,
      enableEncryption: false,
      autoCleanup: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      ...config
    }
    
    this.initializeAdapters()
  }
  
  private initializeAdapters(): void {
    // Register all available adapters
    this.adapters.set('localStorage', new LocalStorageAdapter())
    this.adapters.set('filesystem', new FilesystemAdapter())
    this.adapters.set('indexeddb', new IndexedDBAdapter())
    
    // Select active adapter
    this.selectActiveAdapter()
  }
  
  private selectActiveAdapter(): void {
    if (this.config.preferredAdapter !== 'auto') {
      const preferred = this.adapters.get(this.config.preferredAdapter)
      if (preferred?.available) {
        this.activeAdapter = preferred
        console.log(`✅ Using preferred storage adapter: ${preferred.name}`)
        return
      }
    }
    
    // Auto-select from fallback chain
    for (const adapterName of this.config.fallbackChain) {
      const adapter = this.adapters.get(adapterName)
      if (adapter?.available) {
        this.activeAdapter = adapter
        console.log(`✅ Auto-selected storage adapter: ${adapter.name}`)
        return
      }
    }
    
    throw new Error('No storage adapter available')
  }
  
  // Public API
  async storeDocument(document: Document): Promise<void> {
    if (!this.activeAdapter) throw new Error('No storage adapter available')
    
    const key = `document_${document.id}`
    await this.activeAdapter.store(key, document)
    console.log(`📄 Stored document: ${document.name}`)
  }
  
  async retrieveDocument(documentId: string): Promise<Document | null> {
    if (!this.activeAdapter) return null
    
    const key = `document_${documentId}`
    const result = await this.activeAdapter.retrieve(key)
    return result as Document | null
  }
  
  async storeVisualContent(visualContent: VisualContent[]): Promise<void> {
    if (!this.activeAdapter) throw new Error('No storage adapter available')
    
    for (const visual of visualContent) {
      const key = `visual_${visual.id}`
      await this.activeAdapter.store(key, visual)
    }
    
    console.log(`🎨 Stored ${visualContent.length} visual content items`)
  }
  
  async retrieveVisualContent(documentId?: string): Promise<VisualContent[]> {
    if (!this.activeAdapter) return []
    
    const keys = await this.activeAdapter.list()
    const visualKeys = keys.filter(key => key.startsWith('visual_'))
    
    const visuals: VisualContent[] = []
    for (const key of visualKeys) {
      const visual = await this.activeAdapter.retrieve(key) as VisualContent | null
      if (visual && (!documentId || (visual as VisualContent).documentId === documentId)) {
        visuals.push(visual as VisualContent)
      }
    }
    
    return visuals
  }
  
  async storeAIAnalysis(documentId: string, analysis: AIAnalysisData): Promise<void> {
    if (!this.activeAdapter) throw new Error('No storage adapter available')
    
    const key = `analysis_${documentId}`
    await this.activeAdapter.store(key, analysis)
    console.log(`🧠 Stored AI analysis for: ${documentId}`)
  }
  
  async retrieveAIAnalysis(documentId: string): Promise<AIAnalysisData | null> {
    if (!this.activeAdapter) return null
    
    const key = `analysis_${documentId}`
    const result = await this.activeAdapter.retrieve(key)
    return result as AIAnalysisData | null
  }
  
  async getStorageStats(): Promise<StorageStats> {
    if (!this.activeAdapter) {
      return {
        itemCount: 0,
        totalSize: 0,
        lastModified: new Date()
      }
    }
    
    return await this.activeAdapter.getStats()
  }
  
  async clearAll(): Promise<void> {
    if (!this.activeAdapter) return
    
    await this.activeAdapter.clear()
    console.log('🗑️ Cleared all storage')
  }
  
  async migrate(fromAdapter: string, toAdapter: string): Promise<void> {
    const from = this.adapters.get(fromAdapter)
    const to = this.adapters.get(toAdapter)
    
    if (!from?.available || !to?.available) {
      throw new Error('Migration adapters not available')
    }
    
    console.log(`🔄 Migrating from ${fromAdapter} to ${toAdapter}...`)
    
    const keys = await from.list()
    let migrated = 0
    
    for (const key of keys) {
      try {
        const data = await from.retrieve(key)
        if (data) {
          await to.store(key, data)
          migrated++
        }
      } catch (error) {
        console.warn(`Failed to migrate key ${key}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${migrated}/${keys.length} items`)
    
    // Switch to new adapter
    this.activeAdapter = to
  }
  
  getActiveAdapter(): string {
    return this.activeAdapter?.name || 'none'
  }
  
  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.entries())
      .filter(([, adapter]) => adapter.available)
      .map(([name]) => name)
  }
}

// Export singleton instance
export const unifiedStorage = new UnifiedStorageManager()
export default unifiedStorage
