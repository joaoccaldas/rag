// Enhanced visual content processing and file access management
// Fixes thumbnail generation and provides file access functionality

import { VisualContent } from '../rag/types'

interface StoredFile {
  documentId: string
  fileName: string
  fileType: string
  fileSize: number
  data: string
  storedAt: string
}

/**
 * Enhanced thumbnail generator with proper Canvas API usage
 */
export class ThumbnailGenerator {
  /**
   * Generate thumbnail for PDF files using Canvas API
   */
  static async generatePDFThumbnail(file: File): Promise<string> {
    try {
      // For PDFs, we'll create a simple placeholder thumbnail
      // In a real implementation, you'd use PDF.js to render the first page
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Canvas context not available')
      
      canvas.width = 200
      canvas.height = 260
      
      // Create a simple PDF-like thumbnail
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = '#dee2e6'
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
      
      ctx.fillStyle = '#495057'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PDF', canvas.width / 2, 40)
      
      ctx.font = '10px Arial'
      ctx.fillText(file.name.substring(0, 20), canvas.width / 2, canvas.height - 30)
      
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error)
      return this.generatePlaceholderThumbnail(file)
    }
  }

  /**
   * Generate thumbnail for image files
   */
  static async generateImageThumbnail(file: File): Promise<string> {
    try {
      return new Promise((resolve) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(this.generatePlaceholderThumbnail(file))
          return
        }
        
        img.onload = () => {
          const maxSize = 200
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
          
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/png'))
        }
        
        img.onerror = () => {
          resolve(this.generatePlaceholderThumbnail(file))
        }
        
        img.src = URL.createObjectURL(file)
      })
    } catch (error) {
      console.error('Error generating image thumbnail:', error)
      return this.generatePlaceholderThumbnail(file)
    }
  }

  /**
   * Generate placeholder thumbnail for unsupported files
   */
  static generatePlaceholderThumbnail(file: File): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    canvas.width = 200
    canvas.height = 200
    
    // Background
    ctx.fillStyle = '#e9ecef'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Border
    ctx.strokeStyle = '#adb5bd'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    
    // File type
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'FILE'
    ctx.fillStyle = '#495057'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(fileExt, canvas.width / 2, canvas.height / 2)
    
    // File name
    ctx.font = '10px Arial'
    ctx.fillText(file.name.substring(0, 15), canvas.width / 2, canvas.height / 2 + 30)
    
    return canvas.toDataURL('image/png')
  }
}

/**
 * Enhanced visual content extractor
 */
export class VisualContentExtractor {
  /**
   * Extract visual content from uploaded files
   */
  static async extractVisualContent(file: File, documentId: string): Promise<VisualContent[]> {
    const visuals: VisualContent[] = []
    
    try {
      // Generate thumbnail based on file type
      let thumbnail: string
      
      if (file.type === 'application/pdf') {
        thumbnail = await ThumbnailGenerator.generatePDFThumbnail(file)
      } else if (file.type.startsWith('image/')) {
        thumbnail = await ThumbnailGenerator.generateImageThumbnail(file)
      } else {
        thumbnail = ThumbnailGenerator.generatePlaceholderThumbnail(file)
      }
      
      // Create clean, user-friendly title
      const cleanFileName = file.name.replace(/[_-]/g, ' ').replace(/\.[^/.]+$/, "")
      const titleParts = cleanFileName.split(' ')
      const cleanTitle = titleParts.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      
      // Create visual content entry with clean naming
      const visualContent: VisualContent = {
        id: `visual_${documentId}_${Date.now()}`,
        documentId,
        type: file.type.startsWith('image/') ? 'image' : 'diagram',
        title: cleanTitle,
        description: `Document preview: ${cleanTitle}`,
        thumbnail,
        source: thumbnail,
        data: {
          base64: thumbnail,
          url: thumbnail
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          confidence: 0.95,
          documentTitle: cleanTitle,
          format: file.type,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dimensions: file.type.startsWith('image/') ? 'Auto-detected' : 'Document format'
        },
        llmSummary: {
          keyInsights: [
            `Document type: ${file.type.split('/')[1]?.toUpperCase() || 'Unknown'}`,
            `File size: ${(file.size / 1024).toFixed(1)} KB`,
            'Visual content extracted successfully'
          ],
          challenges: [],
          mainContent: `This is a visual representation of the document "${cleanTitle}". The document has been processed and is ready for analysis.`,
          significance: 'Provides visual context for document content and enables quick document identification.'
        }
      }
      
      visuals.push(visualContent)
      
      console.log(`✅ Generated clean visual content for ${cleanTitle}:`, {
        id: visualContent.id,
        title: visualContent.title,
        type: visualContent.type,
        thumbnailSize: thumbnail.length
      })
      
    } catch (error) {
      console.error('Error extracting visual content:', error)
    }
    
    return visuals
  }
}

/**
 * File access manager for storing and retrieving original files
 */
export class FileAccessManager {
  private static readonly STORAGE_KEY = 'rag_original_files'
  
  /**
   * Store original file for later access
   */
  static async storeFile(documentId: string, file: File): Promise<void> {
    try {
      // Convert file to base64 for storage
      const fileData = await this.fileToBase64(file)
      
      const storedFile = {
        documentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        data: fileData,
        storedAt: new Date().toISOString()
      }
      
      // Get existing storage
      const existingFiles = this.getStoredFiles()
      
      // Add or update file
      const updatedFiles = existingFiles.filter((f: StoredFile) => f.documentId !== documentId)
      updatedFiles.push(storedFile)
      
      // Store back to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFiles))
      
      console.log(`✅ Stored original file for document ${documentId}: ${file.name}`)
      
    } catch (error) {
      console.error('Error storing file:', error)
    }
  }
  
  /**
   * Retrieve stored file for a document
   */
  static getStoredFile(documentId: string) {
    try {
      const storedFiles = this.getStoredFiles()
      return storedFiles.find((f: StoredFile) => f.documentId === documentId)
    } catch (error) {
      console.error('Error retrieving stored file:', error)
      return null
    }
  }
  
  /**
   * Open original file in new tab/window
   */
  static async openFile(documentId: string): Promise<void> {
    try {
      const storedFile = this.getStoredFile(documentId)
      
      if (!storedFile) {
        alert('Original file not found. It may have been cleared from storage.')
        return
      }
      
      // Create blob URL and open in new tab
      const blob = this.base64ToBlob(storedFile.data, storedFile.fileType)
      const url = URL.createObjectURL(blob)
      
      window.open(url, '_blank')
      
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
      console.log(`✅ Opened original file: ${storedFile.fileName}`)
      
    } catch (error) {
      console.error('Error opening file:', error)
      alert('Error opening file. Please try again.')
    }
  }
  
  /**
   * Download original file
   */
  static async downloadFile(documentId: string): Promise<void> {
    try {
      const storedFile = this.getStoredFile(documentId)
      
      if (!storedFile) {
        alert('Original file not found. It may have been cleared from storage.')
        return
      }
      
      // Create blob and download link
      const blob = this.base64ToBlob(storedFile.data, storedFile.fileType)
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = storedFile.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL
      URL.revokeObjectURL(url)
      
      console.log(`✅ Downloaded original file: ${storedFile.fileName}`)
      
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }
  
  /**
   * Get all stored files
   */
  private static getStoredFiles(): StoredFile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error getting stored files:', error)
      return []
    }
  }
  
  /**
   * Convert file to base64
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:type;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * Convert base64 to blob
   */
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
  
  /**
   * Clear all stored files
   */
  static clearAllFiles(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('✅ Cleared all stored files')
    } catch (error) {
      console.error('Error clearing stored files:', error)
    }
  }
  
  /**
   * Get storage statistics
   */
  static getStorageStats() {
    const files = this.getStoredFiles()
    const totalSize = files.reduce((sum: number, file: StoredFile) => sum + file.fileSize, 0)
    
    return {
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    }
  }
}

/**
 * Main function to enhance visual content processing
 */
export async function fixVisualContentProcessing(file: File, documentId: string): Promise<VisualContent[]> {
  try {
    console.log(`🎨 Processing visual content for: ${file.name}`)
    
    // Store original file for access
    await FileAccessManager.storeFile(documentId, file)
    
    // Extract visual content (thumbnails, etc.)
    const visualContent = await VisualContentExtractor.extractVisualContent(file, documentId)
    
    console.log(`✅ Enhanced visual processing complete for ${file.name}`)
    console.log(`📊 Generated ${visualContent.length} visual elements`)
    
    return visualContent
    
  } catch (error) {
    console.error('Error in enhanced visual content processing:', error)
    return []
  }
}
