/**
 * Browser-Compatible Visual Content Storage
 * Uses localStorage with improved organization instead of Node.js file system
 */

import { VisualContent } from '../types'

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
 * Store visual content with browser-compatible storage
 */
export async function storeVisualContentToFiles(visuals: VisualContent[]): Promise<void> {
  try {
    const existingMetadata = getStoredVisualMetadata()
    const newMetadata: VisualContentMetadata[] = []
    
    console.log(`💾 Storing ${visuals.length} visual items (browser mode)`)
    
    for (const visual of visuals) {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const baseFileName = `${visual.documentId}_${visual.type}_${timestamp}_${randomId}`
      
      const metadata: VisualContentMetadata = {
        id: visual.id,
        documentId: visual.documentId,
        type: visual.type,
        title: visual.title,
        description: visual.description,
        fileName: `${baseFileName}.png`,
        metadata: visual.metadata,
        llmSummary: visual.llmSummary,
        createdAt: new Date().toISOString(),
        fileSize: 0
      }
      
      // Store visual data in localStorage
      try {
        const storageKey = `visual_file_${visual.id}`
        localStorage.setItem(storageKey, JSON.stringify({
          id: visual.id,
          data: visual.data,
          source: visual.source,
          thumbnail: visual.thumbnail
        }))
        
        if (visual.data?.base64) {
          metadata.fileSize = Math.round(visual.data.base64.length * 0.75)
        }
        
        console.log(`💾 Stored visual data for ${visual.id}`)
      } catch (error) {
        console.warn(`Failed to store visual data for ${visual.id}:`, error)
      }
      
      // Store thumbnail separately
      if (visual.thumbnail && visual.thumbnail.startsWith('data:')) {
        try {
          metadata.thumbnailFileName = `${baseFileName}_thumb.jpg`
          const thumbnailKey = `visual_thumb_${visual.id}`
          localStorage.setItem(thumbnailKey, visual.thumbnail)
          
          const base64Data = visual.thumbnail.split(',')[1]
          metadata.thumbnailSize = Math.round(base64Data.length * 0.75)
        } catch (error) {
          console.warn(`Failed to store thumbnail for ${visual.id}:`, error)
        }
      }
      
      newMetadata.push(metadata)
    }
    
    // Store metadata
    const updatedMetadata = [...existingMetadata, ...newMetadata]
    localStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata))
    
    console.log(`✅ Stored ${newMetadata.length} visual items`)
    
  } catch (error) {
    console.error('Error storing visual content:', error)
    // Fallback to original localStorage method
    const { storeVisualContent } = await import('./visual-content-storage')
    await storeVisualContent(visuals)
  }
}

/**
 * Get stored visual metadata
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
 * Convert metadata back to VisualContent format
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
      
      // Retrieve stored data
      try {
        const storageKey = `visual_file_${meta.id}`
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          visual.data = parsedData.data
          visual.source = parsedData.source
        }
      } catch (error) {
        console.warn(`Failed to retrieve data for visual ${meta.id}:`, error)
      }
      
      // Retrieve thumbnail
      try {
        const thumbnailKey = `visual_thumb_${meta.id}`
        const thumbnail = localStorage.getItem(thumbnailKey)
        if (thumbnail) {
          visual.thumbnail = thumbnail
        }
      } catch (error) {
        console.warn(`Failed to retrieve thumbnail for visual ${meta.id}:`, error)
      }
      
      visualContent.push(visual)
    }
    
    return visualContent
    
  } catch (error) {
    console.error('Error loading visual content:', error)
    // Fallback to original storage
    const { getStoredVisualContent } = await import('./visual-content-storage')
    return await getStoredVisualContent()
  }
}

/**
 * Delete visual content
 */
export async function deleteVisualContentFiles(contentIds: string[]): Promise<void> {
  try {
    const metadata = getStoredVisualMetadata()
    const updatedMetadata = metadata.filter(meta => !contentIds.includes(meta.id))
    
    // Remove from localStorage
    contentIds.forEach(id => {
      localStorage.removeItem(`visual_file_${id}`)
      localStorage.removeItem(`visual_thumb_${id}`)
    })
    
    localStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata))
    console.log(`🗑️ Deleted ${contentIds.length} visual content items`)
    
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
  
  const totalFileSize = metadata.reduce((sum, meta) => sum + (meta.fileSize || 0), 0)
  const totalThumbnailSize = metadata.reduce((sum, meta) => sum + (meta.thumbnailSize || 0), 0)
  
  return {
    totalItems: metadata.length,
    totalFileSize,
    totalThumbnailSize,
    storageLocation: 'localStorage (browser)',
    hasFileSystemAccess: false
  }
}

/**
 * Clear all visual content storage
 */
export async function clearVisualContentFiles(): Promise<void> {
  try {
    const metadata = getStoredVisualMetadata()
    
    // Remove all visual content from localStorage
    metadata.forEach(meta => {
      localStorage.removeItem(`visual_file_${meta.id}`)
      localStorage.removeItem(`visual_thumb_${meta.id}`)
    })
    
    // Clear metadata
    localStorage.removeItem(METADATA_KEY)
    
    console.log('🧹 Cleared all visual content storage')
    
  } catch (error) {
    console.error('Error clearing visual content storage:', error)
    throw error
  }
}
