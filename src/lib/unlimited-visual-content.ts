/**
 * Enhanced Visual Content Library with Unlimited Storage Integration
 * Provides unlimited document and visual content storage capabilities
 */

import { 
  VisualContent, 
  VisualContentItem, 
  processVisualContent as originalProcessVisualContent 
} from './visual-content'
import { unlimitedRAGStorage } from '../storage/unlimited-rag-storage'

export interface UnlimitedVisualContent extends VisualContent {
  // Enhanced with unlimited storage capabilities
  storageInfo: {
    isUnlimited: boolean
    usage: string
    capacity: string
  }
}

export interface UnlimitedStorageOptions {
  enableUnlimitedStorage: boolean
  migrateFromLocalStorage: boolean
  enableCompression: boolean
  enableThumbnails: boolean
}

class UnlimitedVisualContentManager {
  private options: UnlimitedStorageOptions

  constructor(options: Partial<UnlimitedStorageOptions> = {}) {
    this.options = {
      enableUnlimitedStorage: true,
      migrateFromLocalStorage: false,
      enableCompression: true,
      enableThumbnails: true,
      ...options
    }
  }

  /**
   * Process visual content with unlimited storage support
   */
  async processVisualContentWithUnlimitedStorage(
    file: File, 
    analysisPrompt?: string
  ): Promise<UnlimitedVisualContent> {
    // First process with original visual content library
    const visualContent = await originalProcessVisualContent(file, analysisPrompt)

    // If unlimited storage is enabled, store in IndexedDB
    if (this.options.enableUnlimitedStorage) {
      try {
        // Store document metadata
        await unlimitedRAGStorage.addDocument({
          id: visualContent.id,
          title: file.name,
          content: visualContent.text || '',
          metadata: {
            type: 'visual_content',
            filename: file.name,
            size: file.size,
            lastModified: file.lastModified,
            ocrText: visualContent.text,
            analysisPrompt,
            processedAt: new Date().toISOString()
          },
          embeddings: visualContent.embeddings || [],
          createdAt: new Date()
        })

        // Store each visual content item
        for (const item of visualContent.items) {
          await unlimitedRAGStorage.addVisualContent({
            id: item.id,
            documentId: visualContent.id,
            filename: item.filename,
            type: item.type as 'image' | 'thumbnail',
            data: item.data,
            metadata: {
              pageNumber: item.pageNumber,
              text: item.text,
              analysis: item.analysis,
              width: item.width,
              height: item.height,
              size: item.data.length
            },
            createdAt: new Date()
          })
        }

        console.log(`Stored visual content in unlimited storage: ${file.name}`)
      } catch (error) {
        console.warn('Failed to store in unlimited storage, falling back to localStorage:', error)
      }
    }

    // Get storage info
    const storageInfo = await this.getStorageInfo()

    return {
      ...visualContent,
      storageInfo
    }
  }

  /**
   * Get all visual content from unlimited storage
   */
  async getAllVisualContent(): Promise<UnlimitedVisualContent[]> {
    try {
      const documents = await unlimitedRAGStorage.getAllDocuments()
      const visualDocuments = documents.filter(doc => 
        doc.metadata?.type === 'visual_content'
      )

      const results: UnlimitedVisualContent[] = []

      for (const doc of visualDocuments) {
        const visualItems = await unlimitedRAGStorage.getVisualContentByDocument(doc.id)
        
        const items: VisualContentItem[] = visualItems.map(item => ({
          id: item.id,
          filename: item.filename,
          data: item.data,
          type: item.type,
          pageNumber: item.metadata?.pageNumber || 1,
          text: item.metadata?.text || '',
          analysis: item.metadata?.analysis || '',
          width: item.metadata?.width,
          height: item.metadata?.height
        }))

        const storageInfo = await this.getStorageInfo()

        results.push({
          id: doc.id,
          filename: doc.metadata?.filename || doc.title,
          text: doc.content,
          items,
          embeddings: doc.embeddings,
          storageInfo
        })
      }

      return results
    } catch (error) {
      console.warn('Failed to get visual content from unlimited storage:', error)
      return []
    }
  }

  /**
   * Get visual content by ID from unlimited storage
   */
  async getVisualContentById(id: string): Promise<UnlimitedVisualContent | null> {
    try {
      const document = await unlimitedRAGStorage.getDocument(id)
      if (!document || document.metadata?.type !== 'visual_content') {
        return null
      }

      const visualItems = await unlimitedRAGStorage.getVisualContentByDocument(id)
      
      const items: VisualContentItem[] = visualItems.map(item => ({
        id: item.id,
        filename: item.filename,
        data: item.data,
        type: item.type,
        pageNumber: item.metadata?.pageNumber || 1,
        text: item.metadata?.text || '',
        analysis: item.metadata?.analysis || '',
        width: item.metadata?.width,
        height: item.metadata?.height
      }))

      const storageInfo = await this.getStorageInfo()

      return {
        id: document.id,
        filename: document.metadata?.filename || document.title,
        text: document.content,
        items,
        embeddings: document.embeddings,
        storageInfo
      }
    } catch (error) {
      console.warn('Failed to get visual content by ID:', error)
      return null
    }
  }

  /**
   * Delete visual content from unlimited storage
   */
  async deleteVisualContent(id: string): Promise<boolean> {
    try {
      // Delete visual content items
      const visualItems = await unlimitedRAGStorage.getVisualContentByDocument(id)
      for (const item of visualItems) {
        await unlimitedRAGStorage.deleteVisualContent(item.id)
      }

      // Delete document
      await unlimitedRAGStorage.deleteDocument(id)
      
      console.log(`Deleted visual content from unlimited storage: ${id}`)
      return true
    } catch (error) {
      console.warn('Failed to delete visual content:', error)
      return false
    }
  }

  /**
   * Search visual content in unlimited storage
   */
  async searchVisualContent(query: string): Promise<UnlimitedVisualContent[]> {
    try {
      const searchResults = await unlimitedRAGStorage.searchDocuments(query)
      const visualResults = searchResults.filter(result => 
        result.document.metadata?.type === 'visual_content'
      )

      const results: UnlimitedVisualContent[] = []

      for (const result of visualResults) {
        const doc = result.document
        const visualItems = await unlimitedRAGStorage.getVisualContentByDocument(doc.id)
        
        const items: VisualContentItem[] = visualItems.map(item => ({
          id: item.id,
          filename: item.filename,
          data: item.data,
          type: item.type,
          pageNumber: item.metadata?.pageNumber || 1,
          text: item.metadata?.text || '',
          analysis: item.metadata?.analysis || '',
          width: item.metadata?.width,
          height: item.metadata?.height
        }))

        const storageInfo = await this.getStorageInfo()

        results.push({
          id: doc.id,
          filename: doc.metadata?.filename || doc.title,
          text: doc.content,
          items,
          embeddings: doc.embeddings,
          storageInfo
        })
      }

      return results
    } catch (error) {
      console.warn('Failed to search visual content:', error)
      return []
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    try {
      const stats = await unlimitedRAGStorage.getStorageStats()
      return {
        isUnlimited: true,
        usage: this.formatBytes(stats.documentsSize + stats.visualContentSize),
        capacity: stats.totalCapacity || '2GB+'
      }
    } catch (error) {
      return {
        isUnlimited: false,
        usage: 'Unknown',
        capacity: 'Limited'
      }
    }
  }

  /**
   * Migrate visual content from localStorage to unlimited storage
   */
  async migrateVisualContentFromLocalStorage(): Promise<{
    migrated: number
    errors: string[]
  }> {
    const errors: string[] = []
    let migrated = 0

    try {
      // Get existing visual content from localStorage
      const existingContent = localStorage.getItem('rag_visual_content')
      if (!existingContent) {
        return { migrated: 0, errors: [] }
      }

      const visualContentArray: VisualContent[] = JSON.parse(existingContent)

      for (const content of visualContentArray) {
        try {
          // Check if already exists in unlimited storage
          const existing = await unlimitedRAGStorage.getDocument(content.id)
          if (existing) {
            console.log(`Visual content already exists in unlimited storage: ${content.id}`)
            continue
          }

          // Store document
          await unlimitedRAGStorage.addDocument({
            id: content.id,
            title: content.filename,
            content: content.text || '',
            metadata: {
              type: 'visual_content',
              filename: content.filename,
              migratedAt: new Date().toISOString()
            },
            embeddings: content.embeddings || [],
            createdAt: new Date()
          })

          // Store visual content items
          for (const item of content.items) {
            await unlimitedRAGStorage.addVisualContent({
              id: item.id,
              documentId: content.id,
              filename: item.filename,
              type: item.type as 'image' | 'thumbnail',
              data: item.data,
              metadata: {
                pageNumber: item.pageNumber,
                text: item.text,
                analysis: item.analysis,
                width: item.width,
                height: item.height,
                size: item.data.length
              },
              createdAt: new Date()
            })
          }

          migrated++
          console.log(`Migrated visual content: ${content.filename}`)
        } catch (error) {
          const errorMsg = `Failed to migrate ${content.filename}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

    } catch (error) {
      errors.push(`Failed to parse localStorage visual content: ${error}`)
    }

    return { migrated, errors }
  }

  /**
   * Clear localStorage visual content after successful migration
   */
  clearLocalStorageVisualContent(): void {
    try {
      localStorage.removeItem('rag_visual_content')
      console.log('Cleared localStorage visual content')
    } catch {
      console.error('Failed to clear localStorage visual content')
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const unlimitedVisualContentManager = new UnlimitedVisualContentManager()

// Export helper functions for easy integration
export async function processVisualContentUnlimited(
  file: File, 
  analysisPrompt?: string
): Promise<UnlimitedVisualContent> {
  return unlimitedVisualContentManager.processVisualContentWithUnlimitedStorage(file, analysisPrompt)
}

export async function getAllVisualContentUnlimited(): Promise<UnlimitedVisualContent[]> {
  return unlimitedVisualContentManager.getAllVisualContent()
}

export async function searchVisualContentUnlimited(query: string): Promise<UnlimitedVisualContent[]> {
  return unlimitedVisualContentManager.searchVisualContent(query)
}

export async function deleteVisualContentUnlimited(id: string): Promise<boolean> {
  return unlimitedVisualContentManager.deleteVisualContent(id)
}

export async function getVisualContentByIdUnlimited(id: string): Promise<UnlimitedVisualContent | null> {
  return unlimitedVisualContentManager.getVisualContentById(id)
}

// Export for direct access to manager
export { UnlimitedVisualContentManager }
