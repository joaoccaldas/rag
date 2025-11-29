/**
 * Enhanced Visual Content Processing System
 * 
 * Addresses core issues:
 * 1. Real thumbnail generation from documents
 * 2. Proper media picker with folder selection
 * 3. Enhanced storage with external folder support
 * 4. Visual content rendering with actual images
 */

import { VisualContent } from '../types'

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
    }) => Promise<FileSystemDirectoryHandle>
  }
}

// Enhanced Media Picker Configuration
interface MediaPickerConfig {
  enableFolderPicker: boolean
  thumbnailQuality: number
  maxThumbnailSize: number
  supportedFormats: string[]
  storageLocation: 'browser' | 'local-folder' | 'hybrid'
  selectedFolder?: FileSystemDirectoryHandle
}

// Real Thumbnail Generation System
export class RealThumbnailGenerator {
  private static canvas: HTMLCanvasElement | null = null
  private static ctx: CanvasRenderingContext2D | null = null

  private static getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
    }
    return this.canvas
  }

  /**
   * Generate real image thumbnail (actual image processing)
   */
  static async generateImageThumbnail(file: File, maxSize: number = 300): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = this.getCanvas()
      const ctx = this.ctx

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        // Calculate thumbnail dimensions maintaining aspect ratio
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

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Get base64 data URL
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnailData)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Generate PDF first page thumbnail using PDF.js
   */
  static async generatePDFThumbnail(file: File): Promise<string> {
    try {
      // Import PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist')
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      // Get first page
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.0 })

      // Calculate scale to fit within thumbnail size
      const maxSize = 300
      const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height)
      const scaledViewport = page.getViewport({ scale })

      const canvas = this.getCanvas()
      const ctx = this.ctx

      if (!ctx) throw new Error('Canvas context not available')

      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height

      // Render PDF page to canvas
      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: scaledViewport
      }).promise

      return canvas.toDataURL('image/jpeg', 0.8)

    } catch (error) {
      console.warn('PDF thumbnail generation failed, using fallback:', error)
      return this.generateFileTypeIcon(file, 'PDF Document')
    }
  }

  /**
   * Generate text file content preview
   */
  static async generateTextThumbnail(file: File): Promise<string> {
    try {
      const text = await file.text()
      const canvas = this.getCanvas()
      const ctx = this.ctx

      if (!ctx) throw new Error('Canvas context not available')

      canvas.width = 300
      canvas.height = 200

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Border
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

      // Text content preview
      ctx.fillStyle = '#374151'
      ctx.font = '12px monospace'
      ctx.textAlign = 'left'

      const lines = text.split('\n').slice(0, 12) // First 12 lines
      const lineHeight = 14
      const startY = 20

      lines.forEach((line, index) => {
        const truncatedLine = line.length > 35 ? line.substring(0, 35) + '...' : line
        ctx.fillText(truncatedLine, 10, startY + (index * lineHeight))
      })

      // File info
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px Arial'
      ctx.fillText(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 10, canvas.height - 10)

      return canvas.toDataURL('image/jpeg', 0.8)

    } catch (error) {
      console.warn('Text thumbnail generation failed:', error)
      return this.generateFileTypeIcon(file, 'Text Document')
    }
  }

  /**
   * Generate file type icon (fallback)
   */
  static generateFileTypeIcon(file: File, label?: string): string {
    const canvas = this.getCanvas()
    const ctx = this.ctx

    if (!ctx) return ''

    canvas.width = 300
    canvas.height = 200

    // Background based on file type
    const getTypeColor = (mimeType: string) => {
      if (mimeType.includes('pdf')) return ['#ef4444', '#dc2626']
      if (mimeType.includes('image')) return ['#8b5cf6', '#7c3aed']
      if (mimeType.includes('text')) return ['#10b981', '#059669']
      if (mimeType.includes('video')) return ['#f59e0b', '#d97706']
      return ['#6b7280', '#4b5563']
    }

    const [color1, color2] = getTypeColor(file.type)
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, color1 || '#6b7280')
    gradient.addColorStop(1, color2 || '#4b5563')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Icon
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('📄', canvas.width / 2, 80)

    // Label
    ctx.font = 'bold 16px Arial'
    ctx.fillText(label || file.name.split('.').pop()?.toUpperCase() || 'FILE', canvas.width / 2, 120)

    // File name
    ctx.font = '12px Arial'
    const fileName = file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name
    ctx.fillText(fileName, canvas.width / 2, 145)

    // File size
    ctx.font = '10px Arial'
    ctx.fillText(`${(file.size / 1024).toFixed(1)} KB`, canvas.width / 2, 165)

    return canvas.toDataURL('image/jpeg', 0.8)
  }
}

// Enhanced Media Picker with Folder Selection
export class EnhancedMediaPicker {
  private config: MediaPickerConfig = {
    enableFolderPicker: true,
    thumbnailQuality: 0.8,
    maxThumbnailSize: 300,
    supportedFormats: ['image/*', 'application/pdf', 'text/*'],
    storageLocation: 'hybrid'
  }

  /**
   * Show folder picker for user to select storage location
   */
  async selectStorageFolder(): Promise<FileSystemDirectoryHandle | null> {
    try {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        console.warn('File System Access API not supported')
        return null
      }

      const directoryHandle = await window.showDirectoryPicker!({
        mode: 'readwrite',
        startIn: 'documents'
      })

      this.config.selectedFolder = directoryHandle
      console.log('📁 Storage folder selected:', directoryHandle.name)
      
      return directoryHandle
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Folder selection failed:', error)
      }
      return null
    }
  }

  /**
   * Process uploaded file with real thumbnail generation
   */
  async processFile(file: File, documentId: string): Promise<VisualContent> {
    console.log(`🎨 Processing file: ${file.name} (${file.type})`)

    // Generate real thumbnail based on file type
    let thumbnail: string
    let isRealThumbnail = true

    try {
      if (file.type.startsWith('image/')) {
        thumbnail = await RealThumbnailGenerator.generateImageThumbnail(file, this.config.maxThumbnailSize)
      } else if (file.type === 'application/pdf') {
        thumbnail = await RealThumbnailGenerator.generatePDFThumbnail(file)
      } else if (file.type.includes('text')) {
        thumbnail = await RealThumbnailGenerator.generateTextThumbnail(file)
      } else {
        thumbnail = RealThumbnailGenerator.generateFileTypeIcon(file)
        isRealThumbnail = false
      }
    } catch (error) {
      console.warn('Thumbnail generation failed, using fallback:', error)
      thumbnail = RealThumbnailGenerator.generateFileTypeIcon(file)
      isRealThumbnail = false
    }

    // Save to selected folder if available
    if (this.config.selectedFolder && this.config.storageLocation !== 'browser') {
      await this.saveToFolder(file, thumbnail)
    }

    // Create visual content object
    const visualContent: VisualContent = {
      id: `visual_${documentId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      documentId,
      type: this.getContentType(file),
      title: this.formatFileName(file.name),
      description: `Real ${isRealThumbnail ? 'screenshot' : 'icon'} of ${file.name}`,
      thumbnail,
      source: thumbnail,
      data: {
        base64: thumbnail,
        url: thumbnail
      },
      metadata: {
        extractedAt: new Date().toISOString(),
        confidence: isRealThumbnail ? 0.95 : 0.8,
        documentTitle: this.formatFileName(file.name),
        format: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dimensions: isRealThumbnail ? `${this.config.maxThumbnailSize}px` : 'Generated',
        extractedText: `Real ${isRealThumbnail ? 'screenshot' : 'icon'} generated for ${file.name}`
      }
    }

    console.log(`✅ File processed: ${file.name}, real thumbnail: ${isRealThumbnail}`)
    return visualContent
  }

  /**
   * Save file and thumbnail to selected folder
   */
  private async saveToFolder(file: File, thumbnail: string): Promise<void> {
    if (!this.config.selectedFolder) return

    try {
      // Create thumbnails subfolder
      const thumbnailsFolder = await this.config.selectedFolder.getDirectoryHandle('thumbnails', { create: true })
      
      // Save original file
      const fileHandle = await this.config.selectedFolder.getFileHandle(file.name, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(file)
      await writable.close()

      // Save thumbnail
      const thumbnailName = `thumb_${file.name.split('.')[0]}.jpg`
      const thumbnailHandle = await thumbnailsFolder.getFileHandle(thumbnailName, { create: true })
      const thumbnailWritable = await thumbnailHandle.createWritable()
      
      // Convert base64 to blob
      const response = await fetch(thumbnail)
      const blob = await response.blob()
      await thumbnailWritable.write(blob)
      await thumbnailWritable.close()

      console.log(`💾 Saved to folder: ${file.name} and ${thumbnailName}`)
    } catch (error) {
      console.warn('Failed to save to folder:', error)
    }
  }

  /**
   * Determine content type from file
   */
  private getContentType(file: File): VisualContent['type'] {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf') return 'diagram'
    return 'diagram'
  }

  /**
   * Format file name for display
   */
  private formatFileName(fileName: string): string {
    return fileName
      .replace(/[_-]/g, ' ')
      .replace(/\.[^/.]+$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Get current configuration
   */
  getConfig(): MediaPickerConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MediaPickerConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}

// Singleton instance
export const enhancedMediaPicker = new EnhancedMediaPicker()

/**
 * Main processing function for document uploads
 */
export async function processDocumentWithRealThumbnails(
  file: File, 
  documentId: string
): Promise<VisualContent[]> {
  try {
    console.log(`🚀 Starting enhanced processing for: ${file.name}`)
    
    const visualContent = await enhancedMediaPicker.processFile(file, documentId)
    
    // Store in visual content storage
    const { storeVisualContent } = await import('./visual-content-storage')
    await storeVisualContent([visualContent])
    
    console.log(`🎯 Enhanced processing complete for: ${file.name}`)
    return [visualContent]
    
  } catch (error) {
    console.error('Enhanced document processing failed:', error)
    return []
  }
}

/**
 * Initialize folder picker UI
 */
export async function initializeFolderPicker(): Promise<boolean> {
  try {
    const folder = await enhancedMediaPicker.selectStorageFolder()
    return !!folder
  } catch (error) {
    console.error('Folder picker initialization failed:', error)
    return false
  }
}
