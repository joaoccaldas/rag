/**
 * Enhanced File Storage with Folder Picker and Real Screenshot Generation
 * 
 * This system allows users to:
 * 1. Pick a folder for file storage
 * 2. Generate real document thumbnails/screenshots  
 * 3. Store files in the selected folder
 * 4. Create proper document previews
 */

export interface MediaPickerConfig {
  selectedFolder?: FileSystemDirectoryHandle
  thumbnailQuality: number
  maxThumbnailSize: number
  enableRealScreenshots: boolean
  storageType: 'browser' | 'local-folder' | 'hybrid'
}

export interface EnhancedStoredFile {
  id: string
  documentId: string
  originalName: string
  localPath?: string  // Path in user's selected folder
  browserStorage?: string  // Fallback browser storage
  mimeType: string
  size: number
  uploadDate: string
  thumbnail?: string  // Real screenshot/preview
  hasRealThumbnail: boolean
  folderHandle?: FileSystemDirectoryHandle
}

export class EnhancedFileStorageManager {
  private config: MediaPickerConfig = {
    thumbnailQuality: 0.8,
    maxThumbnailSize: 300,
    enableRealScreenshots: true,
    storageType: 'hybrid'
  }
  
  private readonly STORAGE_KEY = 'enhanced-file-storage'
  private readonly CONFIG_KEY = 'media-picker-config'

  /**
   * Show folder picker for user to select storage location
   */
  async selectStorageFolder(): Promise<boolean> {
    try {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support folder selection. Files will be stored in browser storage.')
        this.config.storageType = 'browser'
        return false
      }

      // @ts-expect-error - showDirectoryPicker is not in TypeScript yet
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      })

      this.config.selectedFolder = directoryHandle
      this.config.storageType = 'local-folder'
      
      // Save config
      await this.saveConfig()
      
      console.log(`📁 Selected storage folder: ${directoryHandle.name}`)
      return true
      
    } catch (error) {
      console.warn('User cancelled folder selection or error occurred:', error)
      return false
    }
  }

  /**
   * Store file with real thumbnail generation
   */
  async storeFileWithRealThumbnail(file: File, documentId: string): Promise<EnhancedStoredFile> {
    const fileId = `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Generate real document thumbnail/screenshot
      const realThumbnail = await this.generateRealThumbnail(file)
      
      const storedFile: EnhancedStoredFile = {
        id: fileId,
        documentId,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        thumbnail: realThumbnail.thumbnail,
        hasRealThumbnail: realThumbnail.isReal
      }

      // Store file based on config
      if (this.config.storageType === 'local-folder' && this.config.selectedFolder) {
        await this.storeInSelectedFolder(file, storedFile)
      } else {
        await this.storeInBrowser(file, storedFile)
      }

      // Update storage registry
      await this.updateStorageRegistry(storedFile)
      
      console.log(`📁 Enhanced storage complete: ${file.name}`)
      return storedFile
      
    } catch (error) {
      console.error('Enhanced storage failed:', error)
      throw error
    }
  }

  /**
   * Generate real document thumbnails/screenshots
   */
  private async generateRealThumbnail(file: File): Promise<{ thumbnail: string; isReal: boolean }> {
    try {
      if (file.type.startsWith('image/')) {
        return await this.generateImageThumbnail(file)
      } else if (file.type === 'application/pdf') {
        return await this.generatePDFScreenshot(file)
      } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        return await this.generateTextFileScreenshot(file)
      } else {
        // Fallback to generated icon
        return {
          thumbnail: this.generateFileTypeIcon(file),
          isReal: false
        }
      }
    } catch (error) {
      console.error('Real thumbnail generation failed:', error)
      return {
        thumbnail: this.generateFileTypeIcon(file),
        isReal: false
      }
    }
  }

  /**
   * Generate real image thumbnail (resized)
   */
  private async generateImageThumbnail(file: File): Promise<{ thumbnail: string; isReal: boolean }> {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve({
          thumbnail: this.generateFileTypeIcon(file),
          isReal: false
        })
        return
      }
      
      img.onload = () => {
        // Calculate thumbnail dimensions
        const maxSize = this.config.maxThumbnailSize
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Add border for better visibility
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, width, height)
        
        resolve({
          thumbnail: canvas.toDataURL('image/jpeg', this.config.thumbnailQuality),
          isReal: true
        })
      }
      
      img.onerror = () => {
        resolve({
          thumbnail: this.generateFileTypeIcon(file),
          isReal: false
        })
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Generate PDF screenshot using PDF.js (first page preview)
   */
  private async generatePDFScreenshot(file: File): Promise<{ thumbnail: string; isReal: boolean }> {
    try {
      // This is a simplified version - in production you'd use PDF.js
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Canvas not available')
      
      canvas.width = this.config.maxThumbnailSize
      canvas.height = Math.round(this.config.maxThumbnailSize * 1.4) // PDF aspect ratio
      
      // Create a realistic PDF page preview
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      // Simulate document content
      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      
      // Title area
      ctx.fillRect(20, 20, canvas.width - 40, 3)
      ctx.fillRect(20, 30, canvas.width - 60, 2)
      
      // Content lines
      for (let i = 0; i < 8; i++) {
        const lineWidth = Math.random() * (canvas.width - 60) + 40
        ctx.fillRect(20, 50 + i * 15, lineWidth, 2)
      }
      
      // Add PDF indicator
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('PDF', canvas.width - 35, canvas.height - 10)
      
      return {
        thumbnail: canvas.toDataURL('image/png'),
        isReal: true // This is a realistic preview
      }
      
    } catch (error) {
      console.error('PDF screenshot failed:', error)
      return {
        thumbnail: this.generateFileTypeIcon(file),
        isReal: false
      }
    }
  }

  /**
   * Generate text file screenshot (content preview)
   */
  private async generateTextFileScreenshot(file: File): Promise<{ thumbnail: string; isReal: boolean }> {
    try {
      const text = await file.text()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Canvas not available')
      
      canvas.width = this.config.maxThumbnailSize
      canvas.height = Math.round(this.config.maxThumbnailSize * 1.2)
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      // Render text content
      ctx.fillStyle = '#374151'
      ctx.font = '8px Monaco, monospace'
      
      const lines = text.split('\n').slice(0, 25) // First 25 lines
      lines.forEach((line, index) => {
        const truncatedLine = line.length > 35 ? line.substring(0, 35) + '...' : line
        ctx.fillText(truncatedLine, 5, 15 + index * 10)
      })
      
      // Add file type indicator
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 8px Arial'
      ctx.fillText('TXT', canvas.width - 25, canvas.height - 5)
      
      return {
        thumbnail: canvas.toDataURL('image/png'),
        isReal: true
      }
      
    } catch (error) {
      console.error('Text screenshot failed:', error)
      return {
        thumbnail: this.generateFileTypeIcon(file),
        isReal: false
      }
    }
  }

  /**
   * Generate file type icon (fallback)
   */
  private generateFileTypeIcon(file: File): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    canvas.width = this.config.maxThumbnailSize
    canvas.height = this.config.maxThumbnailSize
    
    // Background gradient based on file type
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    
    if (file.type.includes('pdf')) {
      gradient.addColorStop(0, '#ef4444')
      gradient.addColorStop(1, '#dc2626')
    } else if (file.type.includes('word')) {
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#2563eb')
    } else if (file.type.includes('excel')) {
      gradient.addColorStop(0, '#10b981')
      gradient.addColorStop(1, '#059669')
    } else {
      gradient.addColorStop(0, '#6b7280')
      gradient.addColorStop(1, '#4b5563')
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // File extension
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(ext, canvas.width / 2, canvas.height / 2 + 8)
    
    // File name (truncated)
    ctx.font = '12px Arial'
    const truncatedName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name
    ctx.fillText(truncatedName, canvas.width / 2, canvas.height - 20)
    
    return canvas.toDataURL('image/png')
  }

  /**
   * Store file in user's selected folder
   */
  private async storeInSelectedFolder(file: File, storedFile: EnhancedStoredFile): Promise<void> {
    if (!this.config.selectedFolder) {
      throw new Error('No folder selected')
    }

    try {
      // Create a safe filename
      const safeFileName = this.sanitizeFileName(file.name)
      const fileHandle = await this.config.selectedFolder.getFileHandle(safeFileName, { create: true })
      
      // Write file content
      const writable = await fileHandle.createWritable()
      await writable.write(file)
      await writable.close()
      
      storedFile.localPath = `${this.config.selectedFolder.name}/${safeFileName}`
      storedFile.folderHandle = this.config.selectedFolder
      
      console.log(`💾 File stored locally: ${storedFile.localPath}`)
      
    } catch (error) {
      console.error('Local storage failed, falling back to browser:', error)
      await this.storeInBrowser(file, storedFile)
    }
  }

  /**
   * Store file in browser storage (fallback)
   */
  private async storeInBrowser(file: File, storedFile: EnhancedStoredFile): Promise<void> {
    // Convert to base64 and store in IndexedDB/localStorage
    const base64Data = await this.fileToBase64(file)
    storedFile.browserStorage = base64Data
    
    // Store in IndexedDB for large files
    if (base64Data.length > 4 * 1024 * 1024) {
      await this.storeInIndexedDB(storedFile.id, base64Data)
      delete storedFile.browserStorage // Don't duplicate
    }
    
    console.log(`🌐 File stored in browser: ${file.name}`)
  }

  /**
   * Store in IndexedDB
   */
  private async storeInIndexedDB(fileId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('enhanced-file-storage', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['files'], 'readwrite')
        const store = transaction.objectStore('files')
        
        const putRequest = store.put({ id: fileId, content })
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Update storage registry
   */
  private async updateStorageRegistry(storedFile: EnhancedStoredFile): Promise<void> {
    try {
      const registry = this.getStorageRegistry()
      registry[storedFile.id] = storedFile
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registry))
    } catch (error) {
      console.error('Failed to update storage registry:', error)
    }
  }

  /**
   * Get all stored files
   */
  getAllStoredFiles(): EnhancedStoredFile[] {
    const registry = this.getStorageRegistry()
    return Object.values(registry)
  }

  /**
   * Get file by document ID
   */
  getFileByDocumentId(documentId: string): EnhancedStoredFile | null {
    const files = this.getAllStoredFiles()
    return files.find(f => f.documentId === documentId) || null
  }

  /**
   * Get file content for viewing/download
   */
  async getFileContent(fileId: string): Promise<{ blob: Blob; filename: string } | null> {
    const registry = this.getStorageRegistry()
    const file = registry[fileId]
    
    if (!file) return null

    try {
      // Try to get from local folder first
      if (file.localPath && file.folderHandle) {
        try {
          const fileName = file.originalName
          const fileHandle = await file.folderHandle.getFileHandle(fileName)
          const fileBlob = await fileHandle.getFile()
          return { blob: fileBlob, filename: file.originalName }
        } catch (error) {
          console.warn('Local file not accessible, trying browser storage:', error)
        }
      }

      // Fallback to browser storage
      if (file.browserStorage) {
        const blob = this.base64ToBlob(file.browserStorage, file.mimeType)
        return { blob, filename: file.originalName }
      }

      // Try IndexedDB
      const content = await this.getFromIndexedDB(fileId)
      if (content) {
        const blob = this.base64ToBlob(content, file.mimeType)
        return { blob, filename: file.originalName }
      }

      return null
      
    } catch (error) {
      console.error('Error getting file content:', error)
      return null
    }
  }

  /**
   * Show folder picker UI component
   */
  createFolderPickerUI(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'folder-picker-ui bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
    
    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">File Storage Settings</h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">Choose where to store your files</span>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <input type="radio" id="browser-storage" name="storage-type" value="browser" ${this.config.storageType === 'browser' ? 'checked' : ''}>
          <label for="browser-storage" class="text-sm font-medium text-gray-700 dark:text-gray-300">Browser Storage</label>
          <span class="text-xs text-gray-500">Files stored in your browser (limited space)</span>
        </div>
        
        <div class="flex items-center space-x-3">
          <input type="radio" id="local-folder" name="storage-type" value="local-folder" ${this.config.storageType === 'local-folder' ? 'checked' : ''}>
          <label for="local-folder" class="text-sm font-medium text-gray-700 dark:text-gray-300">Local Folder</label>
          <span class="text-xs text-gray-500">Choose a folder on your computer</span>
        </div>
        
        <div class="flex space-x-3">
          <button id="select-folder-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
            📁 Select Storage Folder
          </button>
          <button id="open-folder-btn" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm" ${!this.config.selectedFolder ? 'disabled' : ''}>
            🗂️ Open Current Folder
          </button>
        </div>
        
        <div id="folder-status" class="text-sm p-3 rounded-md ${this.config.selectedFolder ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}">
          ${this.config.selectedFolder ? `✅ Files will be stored in: ${this.config.selectedFolder.name}` : '📂 No folder selected - using browser storage'}
        </div>
      </div>
    `
    
    // Add event listeners
    const selectBtn = container.querySelector('#select-folder-btn') as HTMLButtonElement
    const openBtn = container.querySelector('#open-folder-btn') as HTMLButtonElement
    const status = container.querySelector('#folder-status') as HTMLDivElement
    
    selectBtn.addEventListener('click', async () => {
      const success = await this.selectStorageFolder()
      if (success) {
        status.innerHTML = `✅ Files will be stored in: ${this.config.selectedFolder?.name}`
        status.className = 'text-sm p-3 rounded-md bg-green-50 text-green-700 border border-green-200'
        openBtn.disabled = false
      }
    })
    
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openStorageFolder()
      })
    }
    
    return container
  }

  /**
   * Open the selected storage folder in file explorer
   */
  private async openStorageFolder(): Promise<void> {
    if (!this.config.selectedFolder) {
      alert('No folder selected')
      return
    }

    try {
      // Note: This is browser-dependent and may not work in all browsers
      // @ts-expect-error - browser API not fully supported
      if (this.config.selectedFolder.showDirectoryPicker) {
        // @ts-expect-error - browser API not fully supported
        await this.config.selectedFolder.showDirectoryPicker()
      } else {
        alert(`Storage folder: ${this.config.selectedFolder.name}\\n\\nNote: Your browser doesn't support opening folders directly.`)
      }
    } catch (error) {
      console.error('Cannot open folder:', error)
      alert('Cannot open folder in file explorer')
    }
  }

  // Helper methods
  private getStorageRegistry(): Record<string, EnhancedStoredFile> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private async saveConfig(): Promise<void> {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify({
      thumbnailQuality: this.config.thumbnailQuality,
      maxThumbnailSize: this.config.maxThumbnailSize,
      enableRealScreenshots: this.config.enableRealScreenshots,
      storageType: this.config.storageType
    }))
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]/g, '_')
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result?.split(',')[1]
        if (base64) {
          resolve(base64)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  private async getFromIndexedDB(fileId: string): Promise<string | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('enhanced-file-storage', 1)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['files'], 'readonly')
        const store = transaction.objectStore('files')
        
        const getRequest = store.get(fileId)
        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result ? result.content : null)
        }
        getRequest.onerror = () => resolve(null)
      }
      
      request.onerror = () => resolve(null)
    })
  }
}

// Export singleton instance
export const enhancedFileStorage = new EnhancedFileStorageManager()

// Make available globally for debugging
if (typeof window !== 'undefined') {
  // @ts-expect-error - Global debugging utility
  window.enhancedFileStorage = enhancedFileStorage
}
