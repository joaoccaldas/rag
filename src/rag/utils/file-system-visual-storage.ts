/**
 * Browser-Compatible Visual Content Storage
 * Uses localStorage with enhanced organization instead of Node.js file system
 */

import { VisualContent } from '../types'

// Browser-compatible path utilities
const pathJoin = (...parts: string[]) => parts.join('/')
const pathResolve = (base: string, ...parts: string[]) => 
  base + (base.endsWith('/') ? '' : '/') + parts.join('/')

// Define storage paths (browser-compatible)
const STORAGE_BASE_PATH = typeof window !== 'undefined' 
  ? '/visual-content-storage' 
  : (process.env['NEXT_PUBLIC_VISUAL_STORAGE_PATH'] || './visual-content-storage')

const THUMBNAILS_PATH = pathJoin(STORAGE_BASE_PATH, 'thumbnails')
const FULL_IMAGES_PATH = pathJoin(STORAGE_BASE_PATH, 'images')
const METADATA_KEY = 'rag_visual_metadata'

interface VisualContentMetadata {
  id: string
  documentId: string
  type: VisualContent['type']
  title?: string
  description?: string
  fileName: string
  thumbnailFileName?: string
  metadata?: {
    size?: string
    format?: string
    dimensions?: string
    extractedText?: string
    dataPoints?: number
    columns?: string[]
    pageNumber?: number
    extractedAt?: string
    confidence?: number
    documentTitle?: string
  }
  llmSummary?: {
    keyInsights: string[]
    challenges: string[]
    mainContent: string
    significance: string
  }
  createdAt: string
  fileSize: number
  thumbnailSize?: number
}

/**
 * Generate thumbnail from image data URL
 */
async function generateThumbnailFromDataURL(dataURL: string, maxWidth = 150, maxHeight = 150): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null // Can't generate thumbnails in Node.js environment
  }
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      const aspectRatio = width / height

      if (width > height) {
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
      } else {
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      const thumbnailDataURL = canvas.toDataURL('image/jpeg', 0.7)
      resolve(thumbnailDataURL)
    }
    img.onerror = () => resolve(null)
    img.src = dataURL
  })
}

/**
 * Convert data URL to buffer (browser-compatible)
 */
async function dataURLToBuffer(dataURL: string): Promise<Uint8Array> {
  const base64Data = dataURL.split(',')[1]
  if (!base64Data) {
    throw new Error('Invalid data URL format')
  }
  
  // Convert base64 to Uint8Array (browser-compatible)
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Get file extension based on content type
 */
function getFileExtension(content: VisualContent): string {
  if (content.type === 'image') return 'png'
  if (content.type === 'diagram') return 'png'
  if (content.type === 'table') return 'png'
  return 'png'
}

/**
 * Check if we're in a Node.js environment with file system access
 */
function hasFileSystemAccess(): boolean {
  return typeof window === 'undefined' || 
         (typeof window !== 'undefined' && Boolean((window as Window & { electronAPI?: unknown }).electronAPI)) ||
         (typeof process !== 'undefined' && Boolean(process.versions?.node))
}

/**
 * Create necessary storage directories
 */
async function ensureStorageDirectories(): Promise<void> {
  console.log('📁 Using browser-compatible storage - no directory creation needed')
  return
}

/**
 * Save image data to local file system
 */
async function saveImageToFile(
  imageData: string | Blob, 
  fileName: string, 
  isFullImage: boolean = true
): Promise<string> {
  if (!hasFileSystemAccess()) {
    throw new Error('File system access not available')
  }

  try {
    const fs = await import('fs/promises')
    const targetPath = isFullImage ? FULL_IMAGES_PATH : THUMBNAILS_PATH
    const filePath = pathJoin(targetPath, fileName)
    
    let buffer: Uint8Array
    
    if (typeof imageData === 'string') {
      // Handle base64 data
      buffer = await dataURLToBuffer(imageData)
    } else {
      // Handle Blob data
      const arrayBuffer = await imageData.arrayBuffer()
      buffer = new Uint8Array(arrayBuffer)
    }
    
    await fs.writeFile(filePath, buffer)
    console.log(`💾 Saved ${isFullImage ? 'image' : 'thumbnail'}: ${fileName} (${buffer.length} bytes)`)
    
    return filePath
  } catch (error) {
    console.error('Failed to save image to file:', error)
    throw error
  }
}

/**
 * Generate a unique filename for an image
 */
function generateImageFileName(contentId: string, extension: string = 'png'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${contentId}_${timestamp}_${random}.${extension}`
}

/**
 * Store visual content with file system storage
 */
export async function storeVisualContentToFiles(visuals: VisualContent[]): Promise<void> {
  try {
    // Ensure directories exist
    await ensureStorageDirectories()
    
    // Get existing metadata
    const existingMetadata = getStoredVisualMetadata()
    const newMetadata: VisualContentMetadata[] = []
    
    for (const visual of visuals) {
      const metadata: VisualContentMetadata = {
        id: visual.id,
        documentId: visual.documentId,
        type: visual.type,
        title: visual.title,
        description: visual.description,
        fileName: '',
        metadata: visual.metadata,
        llmSummary: visual.llmSummary,
        createdAt: new Date().toISOString(),
        fileSize: 0
      }
      
      // Save full image if available
      if (visual.data?.base64 || visual.data?.url || visual.source) {
        const imageData = visual.data?.base64 || visual.data?.url || visual.source
        if (imageData) {
          const fileName = generateImageFileName(visual.id)
          metadata.fileName = fileName
          
          try {
            await saveImageToFile(imageData, fileName, true)
            
            // Calculate file size for metadata
            if (typeof imageData === 'string' && imageData.startsWith('data:')) {
              const base64Data = imageData.split(',')[1]
              metadata.fileSize = Math.round(base64Data.length * 0.75) // Approximate binary size
            }
          } catch (error) {
            console.warn(`Failed to save full image for ${visual.id}:`, error)
          }
        }
      }
      
      // Save thumbnail if available
      if (visual.thumbnail) {
        const thumbnailFileName = generateImageFileName(`${visual.id}_thumb`)
        metadata.thumbnailFileName = thumbnailFileName
        
        try {
          await saveImageToFile(visual.thumbnail, thumbnailFileName, false)
          
          // Calculate thumbnail size
          if (visual.thumbnail.startsWith('data:')) {
            const base64Data = visual.thumbnail.split(',')[1]
            metadata.thumbnailSize = Math.round(base64Data.length * 0.75)
          }
        } catch (error) {
          console.warn(`Failed to save thumbnail for ${visual.id}:`, error)
        }
      }
      
      newMetadata.push(metadata)
    }
    
    // Store metadata in localStorage (lightweight)
    const updatedMetadata = [...existingMetadata, ...newMetadata]
    localStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata))
    
    console.log(`✅ Stored ${newMetadata.length} visual items to file system`)
    
  } catch (error) {
    console.error('Error storing visual content to files:', error)
    
    // Fallback to original localStorage method for browser environments
    if (!hasFileSystemAccess()) {
      console.log('Falling back to localStorage storage...')
      await fallbackToLocalStorage(visuals)
    } else {
      throw error
    }
  }
}

/**
 * Fallback to localStorage when file system is not available
 */
async function fallbackToLocalStorage(visuals: VisualContent[]): Promise<void> {
  try {
    // Import the original storage function
    const { storeVisualContent } = await import('./visual-content-storage')
    await storeVisualContent(visuals)
  } catch (error) {
    console.error('Fallback storage also failed:', error)
    throw new Error('Both file system and localStorage storage failed')
  }
}

/**
 * Get stored visual metadata from localStorage
 */
export function getStoredVisualMetadata(): VisualContentMetadata[] {
  try {
    const stored = localStorage.getItem(METADATA_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error retrieving visual metadata:', error)
    return []
  }
}

/**
 * Convert metadata back to VisualContent format for display
 */
export async function getVisualContentFromFiles(): Promise<VisualContent[]> {
  try {
    const metadata = getStoredVisualMetadata()
    const visualContent: VisualContent[] = []
    
    for (const meta of metadata) {
      const visual: VisualContent = {
        id: meta.id,
        documentId: meta.documentId,
        type: meta.type,
        title: meta.title,
        description: meta.description,
        metadata: meta.metadata,
        llmSummary: meta.llmSummary
      }
      
      // Generate file URLs for accessing stored images
      if (meta.fileName) {
        visual.source = `/api/visual-content/image/${meta.fileName}`
        visual.data = {
          url: `/api/visual-content/image/${meta.fileName}`
        }
      }
      
      if (meta.thumbnailFileName) {
        visual.thumbnail = `/api/visual-content/thumbnail/${meta.thumbnailFileName}`
      }
      
      visualContent.push(visual)
    }
    
    return visualContent
  } catch (error) {
    console.error('Error loading visual content from files:', error)
    
    // Fallback to original localStorage method
    const { getStoredVisualContent } = await import('./visual-content-storage')
    return await getStoredVisualContent()
  }
}

/**
 * Delete visual content files and metadata
 */
export async function deleteVisualContentFiles(contentIds: string[]): Promise<void> {
  try {
    const metadata = getStoredVisualMetadata()
    const toDelete = metadata.filter(m => contentIds.includes(m.id))
    
    if (hasFileSystemAccess()) {
      const fs = await import('fs/promises')
      
      // Delete image files
      for (const meta of toDelete) {
        if (meta.fileName) {
          try {
            const fullPath = pathJoin(FULL_IMAGES_PATH, meta.fileName)
            await fs.unlink(fullPath)
            console.log(`🗑️ Deleted image: ${meta.fileName}`)
          } catch (error) {
            console.warn(`Failed to delete image ${meta.fileName}:`, error)
          }
        }
        
        if (meta.thumbnailFileName) {
          try {
            const thumbPath = pathJoin(THUMBNAILS_PATH, meta.thumbnailFileName)
            await fs.unlink(thumbPath)
            console.log(`🗑️ Deleted thumbnail: ${meta.thumbnailFileName}`)
          } catch (error) {
            console.warn(`Failed to delete thumbnail ${meta.thumbnailFileName}:`, error)
          }
        }
      }
    }
    
    // Update metadata
    const remaining = metadata.filter(m => !contentIds.includes(m.id))
    localStorage.setItem(METADATA_KEY, JSON.stringify(remaining))
    
    console.log(`✅ Deleted ${toDelete.length} visual content items`)
    
  } catch (error) {
    console.error('Error deleting visual content:', error)
    throw error
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalItems: number
  totalFileSize: number
  totalThumbnailSize: number
  storageLocation: string
  hasFileSystemAccess: boolean
}> {
  const metadata = getStoredVisualMetadata()
  
  const totalFileSize = metadata.reduce((sum, m) => sum + (m.fileSize || 0), 0)
  const totalThumbnailSize = metadata.reduce((sum, m) => sum + (m.thumbnailSize || 0), 0)
  
  return {
    totalItems: metadata.length,
    totalFileSize,
    totalThumbnailSize,
    storageLocation: STORAGE_BASE_PATH,
    hasFileSystemAccess: hasFileSystemAccess()
  }
}

/**
 * Clear all visual content storage
 */
export async function clearVisualContentFiles(): Promise<void> {
  try {
    const metadata = getStoredVisualMetadata()
    
    if (hasFileSystemAccess() && metadata.length > 0) {
      const fs = await import('fs/promises')
      
      // Delete all files
      for (const meta of metadata) {
        if (meta.fileName) {
          try {
            await fs.unlink(pathJoin(FULL_IMAGES_PATH, meta.fileName))
          } catch (error) {
            console.warn(`Failed to delete ${meta.fileName}:`, error)
          }
        }
        
        if (meta.thumbnailFileName) {
          try {
            await fs.unlink(pathJoin(THUMBNAILS_PATH, meta.thumbnailFileName))
          } catch (error) {
            console.warn(`Failed to delete ${meta.thumbnailFileName}:`, error)
          }
        }
      }
    }
    
    // Clear metadata
    localStorage.removeItem(METADATA_KEY)
    
    console.log('✅ Cleared all visual content storage')
    
  } catch (error) {
    console.error('Error clearing visual content:', error)
    throw error
  }
}
