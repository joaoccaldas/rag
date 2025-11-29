/**
 * Database Export/Import System
 * Comprehensive solution for transferring RAG dashboard data between machines
 */

"use client"

export interface DatabaseExportData {
  version: string
  timestamp: string
  machine: string
  data: {
    localStorage: Record<string, string>
    indexedDB: {
      [databaseName: string]: {
        [storeName: string]: Record<string, any>[]
      }
    }
    configuration: any
  }
  metadata: {
    totalSize: number
    fileCount: number
    documentCount: number
    features: string[]
  }
}

export interface ExportOptions {
  includeFiles: boolean
  includeAnalytics: boolean
  includeHistory: boolean
  includeSettings: boolean
  compressionLevel: 'none' | 'standard' | 'maximum'
}

export interface ImportOptions {
  overwriteExisting: boolean
  skipDuplicates: boolean
  preserveSettings: boolean
  validateData: boolean
}

export class DatabaseExportImport {
  private readonly EXPORT_VERSION = '1.0.0'
  private readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks for large exports
  
  // Storage keys to export
  private readonly STORAGE_KEYS = [
    'rag_documents',           // Main document storage
    'rag_search_history',      // Search history
    'rag_analytics',           // Analytics data
    'rag_settings',            // User settings
    'rag_visual_content',      // Visual content fixes
    'enhanced-file-storage',   // Enhanced file storage
    'enhanced-config',         // Enhanced configuration
    'storage_migration_v1',    // Migration status
    'error-session-id'         // Error tracking
  ]
  
  // IndexedDB databases to export
  private readonly INDEXED_DB_NAMES = [
    'RAGDatabase',             // Main RAG database
    'enhanced-file-storage',   // Enhanced file storage
    'file-storage-db'          // File storage database
  ]

  /**
   * Export entire database to downloadable file
   */
  async exportDatabase(options: ExportOptions = {
    includeFiles: true,
    includeAnalytics: true,
    includeHistory: true,
    includeSettings: true,
    compressionLevel: 'standard'
  }): Promise<Blob> {
    try {
      console.log('🚀 Starting database export...')
      
      const exportData: DatabaseExportData = {
        version: this.EXPORT_VERSION,
        timestamp: new Date().toISOString(),
        machine: this.getMachineIdentifier(),
        data: {
          localStorage: {},
          indexedDB: {},
          configuration: this.getSystemConfiguration()
        },
        metadata: {
          totalSize: 0,
          fileCount: 0,
          documentCount: 0,
          features: []
        }
      }

      // Export localStorage data
      if (options.includeSettings || options.includeHistory || options.includeAnalytics) {
        exportData.data.localStorage = await this.exportLocalStorage(options)
      }

      // Export IndexedDB data
      if (options.includeFiles) {
        exportData.data.indexedDB = await this.exportIndexedDB()
      }

      // Calculate metadata
      exportData.metadata = await this.calculateMetadata(exportData)

      // Apply compression if requested
      let finalData: Blob
      if (options.compressionLevel === 'none') {
        finalData = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      } else {
        finalData = await this.compressData(exportData, options.compressionLevel)
      }

      console.log('✅ Database export completed:', {
        size: `${(finalData.size / 1024 / 1024).toFixed(2)}MB`,
        documents: exportData.metadata.documentCount,
        files: exportData.metadata.fileCount
      })

      return finalData
    } catch (error) {
      console.error('❌ Database export failed:', error)
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Import database from file
   */
  async importDatabase(file: File, options: ImportOptions = {
    overwriteExisting: false,
    skipDuplicates: true,
    preserveSettings: false,
    validateData: true
  }): Promise<void> {
    try {
      console.log('🚀 Starting database import...')
      
      // Read and parse import file
      const importData = await this.parseImportFile(file)
      
      // Validate import data
      if (options.validateData) {
        await this.validateImportData(importData)
      }

      // Create backup before import
      const backupData = await this.createBackup()
      
      try {
        // Import localStorage data
        await this.importLocalStorage(importData.data.localStorage, options)
        
        // Import IndexedDB data
        await this.importIndexedDB(importData.data.indexedDB, options)
        
        // Import configuration if needed
        if (!options.preserveSettings) {
          await this.importConfiguration(importData.data.configuration)
        }

        console.log('✅ Database import completed successfully')
        
        // Clean up old backup after successful import
        setTimeout(() => this.cleanupBackup(backupData), 60000) // 1 minute delay
        
      } catch (importError) {
        console.error('❌ Import failed, restoring backup...')
        await this.restoreBackup(backupData)
        throw importError
      }
    } catch (error) {
      console.error('❌ Database import failed:', error)
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Export localStorage data
   */
  private async exportLocalStorage(options: ExportOptions): Promise<Record<string, string>> {
    const exported: Record<string, string> = {}
    
    for (const key of this.STORAGE_KEYS) {
      try {
        const value = localStorage.getItem(key)
        if (value !== null) {
          // Apply filtering based on options
          if (this.shouldIncludeKey(key, options)) {
            exported[key] = value
          }
        }
      } catch (error) {
        console.warn(`Failed to export localStorage key "${key}":`, error)
      }
    }

    // Also export any keys starting with 'rag_' or 'batch_job_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('rag_') || key.startsWith('batch_job_')) && !exported[key]) {
        const value = localStorage.getItem(key)
        if (value && this.shouldIncludeKey(key, options)) {
          exported[key] = value
        }
      }
    }

    return exported
  }

  /**
   * Export IndexedDB data
   */
  private async exportIndexedDB(): Promise<Record<string, Record<string, Record<string, any>[]>>> {
    const exported: Record<string, Record<string, Record<string, any>[]>> = {}
    
    for (const dbName of this.INDEXED_DB_NAMES) {
      try {
        const dbData = await this.exportSingleIndexedDB(dbName)
        if (Object.keys(dbData).length > 0) {
          exported[dbName] = dbData
        }
      } catch (error) {
        console.warn(`Failed to export IndexedDB "${dbName}":`, error)
      }
    }

    return exported
  }

  /**
   * Export single IndexedDB database
   */
  private async exportSingleIndexedDB(dbName: string): Promise<Record<string, Record<string, any>[]>> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)
      
      request.onerror = () => reject(new Error(`Failed to open database ${dbName}`))
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const exported: Record<string, Record<string, any>[]> = {}
        
        try {
          const storeNames = Array.from(db.objectStoreNames)
          
          for (const storeName of storeNames) {
            try {
              const storeData = await this.exportObjectStore(db, storeName)
              exported[storeName] = storeData
            } catch (error) {
              console.warn(`Failed to export store "${storeName}" from database "${dbName}":`, error)
            }
          }
          
          db.close()
          resolve(exported)
        } catch (error) {
          db.close()
          reject(error)
        }
      }
    })
  }

  /**
   * Export object store data
   */
  private async exportObjectStore(db: IDBDatabase, storeName: string): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onerror = () => reject(new Error(`Failed to read store ${storeName}`))
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * Import localStorage data
   */
  private async importLocalStorage(data: Record<string, string>, options: ImportOptions): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      try {
        const existingValue = localStorage.getItem(key)
        
        if (existingValue && !options.overwriteExisting) {
          if (options.skipDuplicates) {
            console.log(`⏭️ Skipping existing localStorage key: ${key}`)
            continue
          }
        }
        
        localStorage.setItem(key, value)
        console.log(`✅ Imported localStorage key: ${key}`)
      } catch (error) {
        console.warn(`Failed to import localStorage key "${key}":`, error)
      }
    }
  }

  /**
   * Import IndexedDB data
   */
  private async importIndexedDB(data: Record<string, Record<string, Record<string, any>[]>>, options: ImportOptions): Promise<void> {
    for (const [dbName, dbData] of Object.entries(data)) {
      try {
        await this.importSingleIndexedDB(dbName, dbData, options)
      } catch (error) {
        console.warn(`Failed to import IndexedDB "${dbName}":`, error)
      }
    }
  }

  /**
   * Import single IndexedDB database
   */
  private async importSingleIndexedDB(
    dbName: string, 
    dbData: Record<string, Record<string, any>[]>, 
    options: ImportOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)
      
      request.onerror = () => reject(new Error(`Failed to open database ${dbName}`))
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores if they don't exist
        for (const storeName of Object.keys(dbData)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
          }
        }
      }
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        try {
          for (const [storeName, storeData] of Object.entries(dbData)) {
            await this.importObjectStore(db, storeName, storeData, options)
          }
          
          db.close()
          resolve()
        } catch (error) {
          db.close()
          reject(error)
        }
      }
    })
  }

  /**
   * Import object store data
   */
  private async importObjectStore(
    db: IDBDatabase, 
    storeName: string, 
    data: Record<string, any>[], 
    options: ImportOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      transaction.onerror = () => reject(new Error(`Transaction failed for store ${storeName}`))
      transaction.oncomplete = () => resolve()
      
      for (const item of data) {
        try {
          if (options.overwriteExisting) {
            store.put(item)
          } else {
            store.add(item)
          }
        } catch (error) {
          if (!options.skipDuplicates) {
            console.warn(`Failed to import item to store "${storeName}":`, error)
          }
        }
      }
    })
  }

  /**
   * Parse import file (handle compression)
   */
  private async parseImportFile(file: File): Promise<DatabaseExportData> {
    const text = await file.text()
    
    try {
      // Try to parse as JSON first
      return JSON.parse(text)
    } catch {
      // If that fails, try to decompress
      return await this.decompressData(file)
    }
  }

  /**
   * Validate import data structure
   */
  private async validateImportData(data: DatabaseExportData): Promise<void> {
    if (!data.version || !data.timestamp || !data.data) {
      throw new Error('Invalid export file format')
    }
    
    if (data.version !== this.EXPORT_VERSION) {
      console.warn(`Version mismatch: expected ${this.EXPORT_VERSION}, got ${data.version}`)
    }
    
    // Additional validation logic can be added here
  }

  /**
   * Utility methods
   */
  private shouldIncludeKey(key: string, options: ExportOptions): boolean {
    if (!options.includeAnalytics && key.includes('analytics')) return false
    if (!options.includeHistory && key.includes('history')) return false
    if (!options.includeSettings && key.includes('settings')) return false
    return true
  }

  private getMachineIdentifier(): string {
    return `${navigator.userAgent.slice(0, 50)}_${Date.now()}`
  }

  private getSystemConfiguration(): any {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Add more system info as needed
    }
  }

  private async calculateMetadata(data: DatabaseExportData): Promise<typeof data.metadata> {
    let totalSize = 0
    let fileCount = 0
    let documentCount = 0
    const features: string[] = []

    // Calculate sizes and counts
    const jsonString = JSON.stringify(data)
    totalSize = new Blob([jsonString]).size

    // Count documents and files from localStorage
    for (const [key, value] of Object.entries(data.data.localStorage)) {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          if (key.includes('document')) documentCount += parsed.length
          if (key.includes('file')) fileCount += parsed.length
        } else if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed)
          if (key.includes('document')) documentCount += keys.length
          if (key.includes('file')) fileCount += keys.length
        }
      } catch {
        // Skip non-JSON values
      }
    }

    // Detect features
    if (Object.keys(data.data.localStorage).some(k => k.includes('analytics'))) features.push('Analytics')
    if (Object.keys(data.data.localStorage).some(k => k.includes('history'))) features.push('Search History')
    if (Object.keys(data.data.indexedDB).length > 0) features.push('File Storage')
    if (Object.keys(data.data.localStorage).some(k => k.includes('visual'))) features.push('Visual Content')

    return { totalSize, fileCount, documentCount, features }
  }

  private async compressData(data: DatabaseExportData, level: 'standard' | 'maximum'): Promise<Blob> {
    // For now, return as JSON (compression can be implemented with pako or similar library)
    console.log(`📦 Compression level: ${level} (implementation pending)`)
    return new Blob([JSON.stringify(data)], { type: 'application/json' })
  }

  private async decompressData(file: File): Promise<DatabaseExportData> {
    // Decompression implementation (matches compression method)
    const text = await file.text()
    return JSON.parse(text)
  }

  private async createBackup(): Promise<any> {
    // Create a lightweight backup of current state
    return {
      timestamp: new Date().toISOString(),
      localStorage: { ...localStorage },
      // Simplified backup - full implementation would backup IndexedDB too
    }
  }

  private async restoreBackup(backup: any): Promise<void> {
    console.log('🔄 Restoring backup from:', backup.timestamp)
    // Restore implementation
    for (const [key, value] of Object.entries(backup.localStorage)) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      }
    }
  }

  private async cleanupBackup(backup: any): Promise<void> {
    console.log('🧹 Cleaning up backup from:', backup.timestamp)
    // Cleanup logic
  }

  private async importConfiguration(config: any): Promise<void> {
    console.log('⚙️ Importing configuration:', config)
    // Configuration import logic
  }
}

// Export singleton instance
export const databaseExportImport = new DatabaseExportImport()
