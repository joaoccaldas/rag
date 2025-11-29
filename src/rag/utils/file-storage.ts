/**
 * File Storage Utility
 * Handles storing original files and providing access to them
 */

export interface StoredFile {
  id: string
  originalName: string
  storedPath: string
  mimeType: string
  size: number
  uploadDate: string
  documentId: string
  thumbnail?: string // Base64 encoded thumbnail image
  previewUrl?: string // URL for file preview
}

export class FileStorageManager {
  private readonly STORAGE_KEY = 'rag-stored-files'
  private readonly DATA_FOLDER = '/data/uploads'
  private readonly DB_NAME = 'rag-file-storage'
  private readonly DB_VERSION = 1
  private readonly OBJECT_STORE_NAME = 'files'
  private readonly MAX_LOCALSTORAGE_SIZE = 4 * 1024 * 1024 // 4MB limit for localStorage

  /**
   * Initialize IndexedDB for large file storage
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.OBJECT_STORE_NAME)) {
          db.createObjectStore(this.OBJECT_STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Store file data in IndexedDB
   */
  private async storeFileInDB(fileId: string, base64Data: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(this.OBJECT_STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id: fileId, content: base64Data })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get file data from IndexedDB
   */
  private async getFileFromDB(fileId: string): Promise<string | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.OBJECT_STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.get(fileId)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.content : null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Failed to retrieve file from IndexedDB:', error)
      return null
    }
  }

  /**
   * Store metadata in IndexedDB (fallback when localStorage is full)
   */
  private async storeMetadataInDB(fileId: string, metadata: StoredFile): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.OBJECT_STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.put({ 
          id: `metadata_${fileId}`, 
          metadata: metadata 
        })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to store metadata in IndexedDB:', error)
      throw error
    }
  }

  /**
   * Emergency cleanup of localStorage when quota is exceeded
   */
  private async emergencyCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting emergency localStorage cleanup...')
      
      // Get current stored files
      const storedFiles = this.getStoredFiles()
      const fileEntries = Object.entries(storedFiles)
      
      // Sort by file size (largest first) and date (oldest first)
      const sortedEntries = fileEntries.sort(([, a], [, b]) => {
        const aHasContent = 'base64Content' in a
        const bHasContent = 'base64Content' in b
        
        if (aHasContent && bHasContent) {
          return (b.base64Content?.length || 0) - (a.base64Content?.length || 0)
        }
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
      })
      
      let cleanedCount = 0
      let spaceSaved = 0
      
      // Move largest files to IndexedDB
      for (const [fileId, fileData] of sortedEntries) {
        if ('base64Content' in fileData && fileData.base64Content) {
          console.log(`🔄 Moving large file to IndexedDB: ${fileData.originalName}`)
          
          // Store content in IndexedDB
          await this.storeFileInDB(fileId, fileData.base64Content)
          
          // Remove content from localStorage entry
          const metadataOnly = { ...fileData }
          delete metadataOnly.base64Content
          storedFiles[fileId] = metadataOnly
          
          spaceSaved += fileData.base64Content.length
          cleanedCount++
          
          // Try to save after each cleanup to see if we have enough space
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedFiles))
            break // Success! We have enough space now
          } catch {
            // Continue cleaning up more files
            continue
          }
        }
      }
      
      console.log(`✅ Emergency cleanup completed: ${cleanedCount} files moved, ${(spaceSaved / 1024 / 1024).toFixed(2)}MB freed`)
      
    } catch (error) {
      console.error('Emergency cleanup failed:', error)
      throw error
    }
  }

  /**
   * Cleanup localStorage by moving file content to IndexedDB
   * This ensures we have space for metadata
   */
  private async cleanupLocalStorageForMetadata(): Promise<void> {
    try {
      const existingFiles = this.getStoredFiles()
      let migratedCount = 0
      let spaceSaved = 0
      
      // Move all base64Content to IndexedDB
      for (const [fileId, fileData] of Object.entries(existingFiles)) {
        if ('base64Content' in fileData && fileData.base64Content) {
          try {
            // Store content in IndexedDB
            await this.storeFileInDB(fileId, fileData.base64Content)
            
            // Remove content from metadata
            const contentSize = fileData.base64Content.length
            delete fileData.base64Content
            
            spaceSaved += contentSize
            migratedCount++
            
            console.log(`🔄 Migrated ${fileData.originalName} to IndexedDB (${(contentSize / 1024).toFixed(1)}KB)`)
          } catch (dbError) {
            console.warn(`Failed to migrate file ${fileId}:`, dbError)
          }
        }
      }
      
      if (migratedCount > 0) {
        // Save cleaned metadata back to localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFiles))
        console.log(`✅ Cleanup complete: ${migratedCount} files migrated, ${(spaceSaved / 1024 / 1024).toFixed(2)}MB freed`)
      }
    } catch (error) {
      console.error('localStorage cleanup failed:', error)
      throw error
    }
  }

  /**
   * Store original file and return storage information
   * ALWAYS uses IndexedDB for file content, localStorage only for lightweight metadata
   */
  async storeFile(file: File, documentId: string): Promise<StoredFile> {
    try {
      // Create unique filename to avoid conflicts
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 9)
      const storedFilename = `${timestamp}_${randomId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      // Convert file to base64 for storage
      const base64Data = await this.fileToBase64(file)
      
      // Generate thumbnail for supported file types
      const thumbnail = await this.generateThumbnail(file)
      
      const storedFile: StoredFile = {
        id: `file_${timestamp}_${randomId}`,
        originalName: file.name,
        storedPath: `${this.DATA_FOLDER}/${storedFilename}`,
        mimeType: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        documentId,
        thumbnail: thumbnail || undefined
      }

      // ALWAYS store file content in IndexedDB (never in localStorage)
      await this.storeFileInDB(storedFile.id, base64Data)
      console.log(`📁 File stored in IndexedDB: ${file.name} (${(base64Data.length / 1024 / 1024).toFixed(2)}MB)`)
      
      // Try to store lightweight metadata in localStorage
      const storedFiles = this.getStoredFiles()
      storedFiles[storedFile.id] = storedFile
      
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedFiles))
        console.log('✅ Metadata stored in localStorage')
      } catch (metadataError) {
        // localStorage full - cleanup and retry
        console.warn('⚠️ localStorage full, cleaning up...', metadataError instanceof Error ? metadataError.message : 'Unknown error')
        
        try {
          // Move all file content from localStorage to IndexedDB
          await this.cleanupLocalStorageForMetadata()
          
          // Retry storing metadata after cleanup
          const refreshedFiles = this.getStoredFiles()
          refreshedFiles[storedFile.id] = storedFile
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(refreshedFiles))
          console.log('✅ Metadata stored after cleanup')
        } catch (cleanupError) {
          // If cleanup fails or localStorage still full, use IndexedDB for metadata too
          console.error('❌ Cannot store metadata in localStorage even after cleanup, using IndexedDB:', cleanupError)
          await this.storeMetadataInDB(storedFile.id, storedFile)
        }
      }

      console.log(`📁 File stored successfully: ${file.name}`)
      return storedFile

    } catch (error) {
      console.error('Error storing file:', error)
      throw new Error(`Failed to store file: ${file.name}`)
    }
  }

  /**
   * Retrieve stored file by ID
   */
  async getStoredFile(fileId: string): Promise<StoredFile | null> {
    const storedFiles = this.getStoredFiles()
    const localFile = storedFiles[fileId]
    
    if (localFile) {
      return localFile
    }
    
    // Check IndexedDB for metadata if not found in localStorage
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.OBJECT_STORE_NAME)
      
      return new Promise((resolve) => {
        const request = store.get(`metadata_${fileId}`)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.metadata : null)
        }
        request.onerror = () => resolve(null)
      })
    } catch (error) {
      console.warn('Failed to retrieve metadata from IndexedDB:', error)
      return null
    }
  }

  /**
   * Synchronous version for backward compatibility
   */
  getStoredFileSync(fileId: string): StoredFile | null {
    const storedFiles = this.getStoredFiles()
    return storedFiles[fileId] || null
  }

  /**
   * Get file content (base64) by ID - checks both localStorage and IndexedDB
   */
  async getFileContent(fileId: string): Promise<string | null> {
    // First check localStorage for small files
    const storedFiles = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}')
    const fileData = storedFiles[fileId]
    
    if (fileData && 'base64Content' in fileData) {
      return fileData.base64Content as string
    }
    
    // If not in localStorage, check IndexedDB for large files
    return await this.getFileFromDB(fileId)
  }

  /**
   * Get stored file by document ID
   */
  getFilesByDocumentId(documentId: string): StoredFile[] {
    const storedFiles = this.getStoredFiles()
    return Object.values(storedFiles).filter(file => file.documentId === documentId)
  }

  /**
   * Get file content for viewing/downloading
   */
  async getFileBlob(fileId: string): Promise<{ blob: Blob; filename: string } | null> {
    const storedFiles = this.getStoredFiles()
    const fileMetadata = storedFiles[fileId]
    
    if (!fileMetadata) {
      return null
    }

    // Get base64 content from either localStorage or IndexedDB
    const base64Content = await this.getFileContent(fileId)
    if (!base64Content) {
      return null
    }

    try {
      // Convert base64 back to blob
      const blob = this.base64ToBlob(base64Content, fileMetadata.mimeType)
      return {
        blob,
        filename: fileMetadata.originalName
      }
    } catch (error) {
      console.error('Error retrieving file content:', error)
      return null
    }
  }

  /**
   * Create download link for original file
   */
  async createDownloadLink(fileId: string): Promise<string | null> {
    const fileContent = await this.getFileBlob(fileId)
    if (!fileContent) return null

    const url = URL.createObjectURL(fileContent.blob)
    return url
  }

  /**
   * Delete file from IndexedDB
   */
  private async deleteFileFromDB(fileId: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.OBJECT_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.OBJECT_STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.delete(fileId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Failed to delete file from IndexedDB:', error)
    }
  }

  /**
   * Delete stored file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const storedFiles = this.getStoredFiles()
      if (storedFiles[fileId]) {
        // Delete from localStorage metadata
        delete storedFiles[fileId]
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedFiles))
        
        // Also try to delete from IndexedDB in case it was stored there
        await this.deleteFileFromDB(fileId)
        
        console.log(`🗑️ File deleted: ${fileId}`)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * Get all stored files
   */
  getAllStoredFiles(): StoredFile[] {
    const storedFiles = this.getStoredFiles()
    return Object.values(storedFiles).map((file) => {
      // Extract only StoredFile properties, excluding base64Content
      const {
        id,
        originalName,
        storedPath,
        mimeType,
        size,
        uploadDate,
        documentId,
        thumbnail,
        previewUrl
      } = file as StoredFile
      
      return {
        id,
        originalName,
        storedPath,
        mimeType,
        size,
        uploadDate,
        documentId,
        thumbnail,
        previewUrl
      }
    })
  }

  /**
   * Get storage stats
   */
  getStorageStats(): { totalFiles: number; totalSize: number; totalSizeMB: number } {
    const files = this.getAllStoredFiles()
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100
    }
  }

  /**
   * Public method to fix localStorage quota issues
   * Can be called from browser console: window.fileStorage.fixQuotaIssues()
   */
  async fixQuotaIssues(): Promise<{ success: boolean; message: string; details: { cleaned: number; sizeSaved: number } }> {
    try {
      console.log('🔧 Starting quota fix...')
      
      const storedFiles = this.getStoredFiles()
      const fileEntries = Object.entries(storedFiles)
      
      let cleaned = 0
      let sizeSaved = 0
      
      for (const [fileId, fileData] of fileEntries) {
        if ('base64Content' in fileData && fileData.base64Content) {
          const contentSize = fileData.base64Content.length
          
          // Move content to IndexedDB
          try {
            await this.storeFileInDB(fileId, fileData.base64Content)
            
            // Remove content from localStorage
            delete fileData.base64Content
            sizeSaved += contentSize
            cleaned++
            
          } catch (error) {
            console.warn(`Failed to migrate file ${fileId}:`, error)
          }
        }
      }
      
      // Update localStorage with cleaned data
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedFiles))
        
        const message = `✅ Fixed localStorage quota issues!\n🧹 Cleaned: ${cleaned} files\n💾 Saved: ${(sizeSaved / 1024 / 1024).toFixed(2)} MB`
        console.log(message)
        
        return {
          success: true,
          message,
          details: { cleaned, sizeSaved }
        }
        
      } catch {
        throw new Error('Failed to update localStorage after cleanup')
      }
      
    } catch (error) {
      const errorMessage = `❌ Quota fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMessage)
      
      return {
        success: false,
        message: errorMessage,
        details: { cleaned: 0, sizeSaved: 0 }
      }
    }
  }

  /**
   * Clear all stored files (use with caution)
   */
  clearAllFiles(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('🧹 All stored files cleared')
  }

  /**
   * Open/view original file in browser
   */
  async openOriginalFile(fileId: string): Promise<boolean> {
    try {
      const fileContent = await this.getFileBlob(fileId)
      if (!fileContent) return false

      const url = URL.createObjectURL(fileContent.blob)
      
      // Open in new tab/window
      const newWindow = window.open(url, '_blank')
      if (newWindow) {
        // Clean up URL after a delay to allow the browser to load it
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        return true
      }
      
      // Fallback: trigger download if popup blocked
      const link = document.createElement('a')
      link.href = url
      link.download = fileContent.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Error opening file:', error)
      return false
    }
  }

  // Private helper methods
  private getStoredFiles(): Record<string, StoredFile & { base64Content?: string }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error reading stored files:', error)
      return {}
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private base64ToBlob(base64Data: string, mimeType: string): Blob {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Generate thumbnail for file based on type
   */
  private async generateThumbnail(file: File): Promise<string | null> {
    try {
      if (file.type.startsWith('image/')) {
        return await this.generateImageThumbnail(file)
      } else if (file.type === 'application/pdf') {
        return await this.generatePDFThumbnail(file)
      } else {
        return this.generateFileTypeThumbnail(file.type, file.name)
      }
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error)
      return null
    }
  }

  /**
   * Generate thumbnail for image files
   */
  private async generateImageThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate thumbnail size (max 120x80, maintaining aspect ratio)
        const maxWidth = 120
        const maxHeight = 80
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Generate thumbnail for PDF files (first page)
   */
  private async generatePDFThumbnail(file: File): Promise<string | null> {
    try {
      // For now, return a PDF icon placeholder
      // In a full implementation, you'd use PDF.js to render the first page
      return this.generateFileTypeThumbnail('application/pdf', file.name)
    } catch (error) {
      console.warn('PDF thumbnail generation failed:', error)
      return null
    }
  }

  /**
   * Generate a file type icon thumbnail
   */
  private generateFileTypeThumbnail(mimeType: string, fileName: string): string {
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 80
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 80)
    
    if (mimeType.includes('pdf')) {
      gradient.addColorStop(0, '#ef4444')
      gradient.addColorStop(1, '#dc2626')
    } else if (mimeType.includes('word') || mimeType.includes('docx')) {
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#2563eb')
    } else if (mimeType.includes('excel') || mimeType.includes('csv')) {
      gradient.addColorStop(0, '#10b981')
      gradient.addColorStop(1, '#059669')
    } else if (mimeType.includes('powerpoint')) {
      gradient.addColorStop(0, '#f97316')
      gradient.addColorStop(1, '#ea580c')
    } else {
      gradient.addColorStop(0, '#6b7280')
      gradient.addColorStop(1, '#4b5563')
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 120, 80)

    // File extension
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(ext, 60, 35)

    // File icon (simplified)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(40, 45, 40, 25)
    ctx.fillStyle = gradient
    ctx.fillRect(42, 47, 36, 21)

    return canvas.toDataURL('image/png')
  }
}

// Export singleton instance
export const fileStorage = new FileStorageManager()

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  // @ts-ignore - Adding to window for debugging purposes
  window.fileStorage = fileStorage
}

// Utility functions for easy access
export const storeOriginalFile = (file: File, documentId: string) => fileStorage.storeFile(file, documentId)
export const getStoredFilesByDocument = (documentId: string) => fileStorage.getFilesByDocumentId(documentId)
export const downloadOriginalFile = async (fileId: string) => {
  const url = await fileStorage.createDownloadLink(fileId)
  if (url) {
    const fileContent = await fileStorage.getFileBlob(fileId)
    if (fileContent) {
      const link = document.createElement('a')
      link.href = url
      link.download = fileContent.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}
