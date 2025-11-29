/**
 * Unified File Storage Manager
 * Consolidates all file storage systems and resolves conflicts
 */

export interface UnifiedStoredFile {
  id: string
  documentId: string
  originalName: string
  storedPath: string
  mimeType: string
  size: number
  uploadDate: string
  thumbnail?: string
  previewUrl?: string
}

export class UnifiedFileStorageManager {
  // Storage keys for different systems
  private readonly NEW_STORAGE_KEY = 'rag-stored-files' // file-storage.ts
  private readonly OLD_STORAGE_KEY = 'rag_original_files' // visual-content-fixes.ts
  private readonly DB_NAME = 'rag-file-storage'
  private readonly DB_VERSION = 1
  private readonly OBJECT_STORE_NAME = 'files'
  private readonly MAX_LOCALSTORAGE_SIZE = 4 * 1024 * 1024 // 4MB

  /**
   * Get all stored files from BOTH storage systems and merge them
   */
  getAllStoredFiles(): UnifiedStoredFile[] {
    const newSystemFiles = this.getNewSystemFiles()
    const oldSystemFiles = this.getOldSystemFiles()
    
    // Merge and deduplicate by documentId
    const allFiles = [...newSystemFiles, ...oldSystemFiles]
    const uniqueFiles = new Map<string, UnifiedStoredFile>()
    
    allFiles.forEach(file => {
      if (!uniqueFiles.has(file.documentId) || file.id.startsWith('file_')) {
        // Prefer new system files (they have 'file_' prefix)
        uniqueFiles.set(file.documentId, file)
      }
    })
    
    return Array.from(uniqueFiles.values())
  }

  /**
   * Get file by document ID from either storage system
   */
  getFileByDocumentId(documentId: string): UnifiedStoredFile | null {
    // Try new system first
    const newSystemFiles = this.getNewSystemFiles()
    const newFile = newSystemFiles.find(f => f.documentId === documentId)
    if (newFile) return newFile

    // Fallback to old system
    const oldSystemFiles = this.getOldSystemFiles()
    return oldSystemFiles.find(f => f.documentId === documentId) || null
  }

  /**
   * Get file content for download/view - works with both systems
   */
  async getFileContent(documentId: string): Promise<{ blob: Blob; filename: string } | null> {
    // Try new system first
    const newSystemContent = await this.getNewSystemContent(documentId)
    if (newSystemContent) return newSystemContent

    // Fallback to old system
    return this.getOldSystemContent(documentId)
  }

  /**
   * Migrate old system files to new system
   */
  async migrateOldToNew(): Promise<void> {
    console.log('🔄 Starting file storage migration...')
    
    const oldFiles = this.getOldSystemFiles()
    console.log(`📦 Found ${oldFiles.length} files in old storage system`)
    
    for (const oldFile of oldFiles) {
      try {
        // Check if already exists in new system
        const newSystemFiles = this.getNewSystemFiles()
        const exists = newSystemFiles.some(f => f.documentId === oldFile.documentId)
        
        if (!exists) {
          // Migrate to new system format
          const newFile: UnifiedStoredFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            documentId: oldFile.documentId,
            originalName: oldFile.originalName,
            storedPath: `/data/uploads/${oldFile.originalName}`,
            mimeType: this.getOldSystemFileType(oldFile.documentId) || 'application/octet-stream',
            size: this.getOldSystemFileSize(oldFile.documentId) || 0,
            uploadDate: new Date().toISOString(),
            thumbnail: oldFile.thumbnail
          }
          
          // Get file content from old system
          const oldContent = await this.getOldSystemRawContent(oldFile.documentId)
          if (oldContent) {
            // Store in new system
            await this.storeInNewSystem(newFile, oldContent)
            console.log(`✅ Migrated: ${oldFile.originalName}`)
          }
        }
      } catch (error) {
        console.error(`❌ Failed to migrate file ${oldFile.originalName}:`, error)
      }
    }
    
    console.log('✅ Migration complete')
  }

  /**
   * Get files from new storage system (file-storage.ts)
   */
  private getNewSystemFiles(): UnifiedStoredFile[] {
    try {
      const stored = localStorage.getItem(this.NEW_STORAGE_KEY)
      if (!stored) return []
      
      const files = JSON.parse(stored)
      return Object.values(files).map((file: any) => ({
        id: file.id,
        documentId: file.documentId,
        originalName: file.originalName,
        storedPath: file.storedPath,
        mimeType: file.mimeType,
        size: file.size,
        uploadDate: file.uploadDate,
        thumbnail: file.thumbnail,
        previewUrl: file.previewUrl
      }))
    } catch (error) {
      console.error('Error loading new system files:', error)
      return []
    }
  }

  /**
   * Get files from old storage system (visual-content-fixes.ts)
   */
  private getOldSystemFiles(): UnifiedStoredFile[] {
    try {
      const stored = localStorage.getItem(this.OLD_STORAGE_KEY)
      if (!stored) return []
      
      const files = JSON.parse(stored)
      return files.map((file: any) => ({
        id: `old_${file.documentId}`,
        documentId: file.documentId,
        originalName: file.fileName,
        storedPath: `/legacy/${file.fileName}`,
        mimeType: file.fileType || 'application/octet-stream',
        size: file.fileSize || 0,
        uploadDate: file.storedAt || new Date().toISOString(),
        thumbnail: undefined
      }))
    } catch (error) {
      console.error('Error loading old system files:', error)
      return []
    }
  }

  /**
   * Get content from new system
   */
  private async getNewSystemContent(documentId: string): Promise<{ blob: Blob; filename: string } | null> {
    try {
      // Dynamic import to avoid circular dependencies
      const { FileStorageManager } = await import('../../rag/utils/file-storage')
      const storage = new FileStorageManager()
      
      const files = this.getNewSystemFiles()
      const file = files.find(f => f.documentId === documentId)
      if (!file) return null
      
      return await storage.getFileBlob(file.id)
    } catch (error) {
      console.error('Error getting new system content:', error)
      return null
    }
  }

  /**
   * Get content from old system
   */
  private getOldSystemContent(documentId: string): { blob: Blob; filename: string } | null {
    try {
      const stored = localStorage.getItem(this.OLD_STORAGE_KEY)
      if (!stored) return null
      
      const files = JSON.parse(stored)
      const file = files.find((f: any) => f.documentId === documentId)
      if (!file) return null
      
      const blob = this.base64ToBlob(file.data, file.fileType)
      return {
        blob,
        filename: file.fileName
      }
    } catch (error) {
      console.error('Error getting old system content:', error)
      return null
    }
  }

  /**
   * Get raw content from old system for migration
   */
  private async getOldSystemRawContent(documentId: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.OLD_STORAGE_KEY)
      if (!stored) return null
      
      const files = JSON.parse(stored)
      const file = files.find((f: any) => f.documentId === documentId)
      return file?.data || null
    } catch (error) {
      console.error('Error getting old system raw content:', error)
      return null
    }
  }

  /**
   * Store file in new system during migration
   */
  private async storeInNewSystem(file: UnifiedStoredFile, base64Content: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.NEW_STORAGE_KEY) || '{}'
      const files = JSON.parse(stored)
      
      // Check size and decide storage location
      const estimatedSize = base64Content.length * 2
      
      if (estimatedSize > this.MAX_LOCALSTORAGE_SIZE) {
        // Store in IndexedDB
        await this.storeInIndexedDB(file.id, base64Content)
        files[file.id] = file // Just metadata
      } else {
        // Store in localStorage
        files[file.id] = { ...file, base64Content }
      }
      
      localStorage.setItem(this.NEW_STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error('Error storing in new system:', error)
      throw error
    }
  }

  /**
   * Store large files in IndexedDB
   */
  private async storeInIndexedDB(fileId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.OBJECT_STORE_NAME)
        
        const putRequest = store.put({ id: fileId, content })
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.OBJECT_STORE_NAME)) {
          db.createObjectStore(this.OBJECT_STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Utility: Convert base64 to blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Get file type from old system (helper for migration)
   */
  private getOldSystemFileType(documentId: string): string | null {
    try {
      const stored = localStorage.getItem(this.OLD_STORAGE_KEY)
      if (!stored) return null
      
      const files = JSON.parse(stored)
      const file = files.find((f: any) => f.documentId === documentId)
      return file?.fileType || null
    } catch {
      return null
    }
  }

  /**
   * Get file size from old system (helper for migration)
   */
  private getOldSystemFileSize(documentId: string): number | null {
    try {
      const stored = localStorage.getItem(this.OLD_STORAGE_KEY)
      if (!stored) return null
      
      const files = JSON.parse(stored)
      const file = files.find((f: any) => f.documentId === documentId)
      return file?.fileSize || null
    } catch {
      return null
    }
  }

  /**
   * Clean up duplicate files and optimize storage
   */
  async cleanupDuplicates(): Promise<void> {
    console.log('🧹 Cleaning up duplicate files...')
    
    const allFiles = this.getAllStoredFiles()
    const duplicates = new Map<string, UnifiedStoredFile[]>()
    
    // Group by documentId
    allFiles.forEach(file => {
      if (!duplicates.has(file.documentId)) {
        duplicates.set(file.documentId, [])
      }
      duplicates.get(file.documentId)!.push(file)
    })
    
    // Remove duplicates, keep newest
    for (const [documentId, files] of duplicates) {
      if (files.length > 1) {
        const newest = files.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        )[0]
        
        console.log(`🔄 Document ${documentId}: keeping ${newest.originalName}, removing ${files.length - 1} duplicates`)
      }
    }
    
    console.log('✅ Cleanup complete')
  }
}

// Export singleton instance
export const unifiedFileStorage = new UnifiedFileStorageManager()
