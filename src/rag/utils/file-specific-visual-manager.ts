// File-Specific Visual Content Management
// Addresses Issue 3: Visual content not separated by file

import { VisualContent, Document } from '../types'

interface FileVisualGroup {
  documentId: string
  documentName: string
  documentType: string
  uploadedAt: Date
  visualCount: number
  totalSize: number
  lastUpdated: Date
  visualContent: VisualContent[]
}

interface VisualContentFilter {
  documentIds?: string[]
  contentTypes?: Array<'image' | 'chart' | 'table' | 'graph' | 'diagram'>
  dateRange?: {
    start: Date
    end: Date
  }
  hasLLMSummary?: boolean
  minConfidence?: number
}

interface VisualContentSearch {
  query: string
  searchFields: Array<'title' | 'description' | 'extractedText' | 'llmSummary'>
  fuzzyMatch?: boolean
}

interface FileVisualExport {
  file: {
    id: string
    name: string
    type: string
    uploadedAt: Date
    lastUpdated: Date
  }
  visualContent: Array<{
    id: string
    type: string
    title?: string
    description?: string
    metadata?: Record<string, unknown>
    llmSummary?: Record<string, unknown>
    extractedData?: Record<string, unknown>
  }>
  statistics: {
    totalItems: number
    totalSize: number
    typeDistribution: Record<string, number>
  }
}

export class FileSpecificVisualManager {
  private visualGroups: Map<string, FileVisualGroup> = new Map()
  private searchIndex: Map<string, Set<string>> = new Map() // word -> visual content IDs

  constructor() {
    this.loadPersistedData()
  }

  /**
   * Add visual content to a specific file
   */
  async addVisualContent(documentId: string, document: Document, visualContent: VisualContent[]): Promise<void> {
    // Ensure each visual content is properly linked to the document
    const processedContent = visualContent.map(content => ({
      ...content,
      documentId,
      metadata: {
        ...content.metadata,
        documentTitle: document.metadata?.title || document.name,
        extractedAt: new Date().toISOString()
      }
    }))

    let group = this.visualGroups.get(documentId)
    
    if (!group) {
      // Create new group for this file
      group = {
        documentId,
        documentName: document.name,
        documentType: document.type,
        uploadedAt: document.uploadedAt,
        visualCount: 0,
        totalSize: 0,
        lastUpdated: new Date(),
        visualContent: []
      }
    }

    // Add new visual content
    group.visualContent.push(...processedContent)
    group.visualCount = group.visualContent.length
    group.totalSize = this.calculateGroupSize(group.visualContent)
    group.lastUpdated = new Date()

    this.visualGroups.set(documentId, group)

    // Update search index
    this.updateSearchIndex(processedContent)

    // Persist changes
    this.persistData()

    console.log(`📁 Added ${visualContent.length} visual items to file: ${document.name}`)
  }

  /**
   * Get visual content for a specific file
   */
  getFileVisualContent(documentId: string): FileVisualGroup | null {
    return this.visualGroups.get(documentId) || null
  }

  /**
   * Get all files with visual content
   */
  getAllFileGroups(): FileVisualGroup[] {
    return Array.from(this.visualGroups.values())
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
  }

  /**
   * Filter visual content by criteria
   */
  filterVisualContent(filter: VisualContentFilter): FileVisualGroup[] {
    let groups = Array.from(this.visualGroups.values())

    // Filter by document IDs
    if (filter.documentIds && filter.documentIds.length > 0) {
      groups = groups.filter(group => filter.documentIds!.includes(group.documentId))
    }

    // Filter by date range
    if (filter.dateRange) {
      groups = groups.filter(group => {
        const uploadDate = group.uploadedAt.getTime()
        return uploadDate >= filter.dateRange!.start.getTime() && 
               uploadDate <= filter.dateRange!.end.getTime()
      })
    }

    // Filter by content types and other criteria
    if (filter.contentTypes || filter.hasLLMSummary || filter.minConfidence) {
      groups = groups.map(group => ({
        ...group,
        visualContent: group.visualContent.filter(content => {
          if (filter.contentTypes && !filter.contentTypes.includes(content.type)) {
            return false
          }
          
          if (filter.hasLLMSummary && !content.llmSummary) {
            return false
          }
          
          if (filter.minConfidence && (!content.metadata?.confidence || content.metadata.confidence < filter.minConfidence)) {
            return false
          }
          
          return true
        })
      })).filter(group => group.visualContent.length > 0)
    }

    return groups
  }

  /**
   * Search visual content across files
   */
  searchVisualContent(search: VisualContentSearch): FileVisualGroup[] {
    const queryWords = search.query.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    const matchingContentIds = new Set<string>()

    // Find matching content IDs from search index
    for (const word of queryWords) {
      const wordMatches = this.searchIndex.get(word) || new Set()
      if (matchingContentIds.size === 0) {
        // First word - add all matches
        wordMatches.forEach(id => matchingContentIds.add(id))
      } else {
        // Subsequent words - intersect with existing matches
        const intersection = new Set<string>()
        for (const id of matchingContentIds) {
          if (wordMatches.has(id)) {
            intersection.add(id)
          }
        }
        matchingContentIds.clear()
        intersection.forEach(id => matchingContentIds.add(id))
      }
    }

    // If fuzzy match is enabled and no exact matches found, try partial matches
    if (search.fuzzyMatch && matchingContentIds.size === 0) {
      for (const word of queryWords) {
        for (const [indexWord, contentIds] of this.searchIndex.entries()) {
          if (indexWord.includes(word) || word.includes(indexWord)) {
            contentIds.forEach(id => matchingContentIds.add(id))
          }
        }
      }
    }

    // Build result groups with matching content
    const resultGroups: FileVisualGroup[] = []

    for (const group of this.visualGroups.values()) {
      const matchingContent = group.visualContent.filter(content => 
        matchingContentIds.has(content.id)
      )

      if (matchingContent.length > 0) {
        resultGroups.push({
          ...group,
          visualContent: matchingContent,
          visualCount: matchingContent.length
        })
      }
    }

    return resultGroups.sort((a, b) => b.visualCount - a.visualCount)
  }

  /**
   * Remove visual content for a file
   */
  removeFileVisualContent(documentId: string): boolean {
    const group = this.visualGroups.get(documentId)
    if (!group) return false

    // Remove from search index
    group.visualContent.forEach(content => {
      this.removeFromSearchIndex(content)
    })

    // Remove group
    this.visualGroups.delete(documentId)
    this.persistData()

    console.log(`🗑️ Removed visual content for file: ${group.documentName}`)
    return true
  }

  /**
   * Update visual content metadata (e.g., after LLM analysis)
   */
  updateVisualContentMetadata(
    contentId: string, 
    metadata: Partial<VisualContent>
  ): boolean {
    for (const group of this.visualGroups.values()) {
      const contentIndex = group.visualContent.findIndex(c => c.id === contentId)
      if (contentIndex !== -1) {
        const oldContent = group.visualContent[contentIndex]
        const updatedContent = { ...oldContent, ...metadata }
        group.visualContent[contentIndex] = updatedContent
        group.lastUpdated = new Date()

        // Update search index
        this.removeFromSearchIndex(oldContent)
        this.updateSearchIndex([updatedContent])

        this.persistData()
        return true
      }
    }
    return false
  }

  /**
   * Get statistics about visual content organization
   */
  getOrganizationStats() {
    const stats = {
      totalFiles: this.visualGroups.size,
      totalVisualItems: 0,
      totalSize: 0,
      fileTypes: new Map<string, number>(),
      contentTypes: new Map<string, number>(),
      filesWithLLMSummaries: 0,
      averageItemsPerFile: 0,
      lastUpdate: new Date(0)
    }

    for (const group of this.visualGroups.values()) {
      stats.totalVisualItems += group.visualCount
      stats.totalSize += group.totalSize

      // File type distribution
      const currentCount = stats.fileTypes.get(group.documentType) || 0
      stats.fileTypes.set(group.documentType, currentCount + 1)

      // Content type distribution
      group.visualContent.forEach(content => {
        const currentCount = stats.contentTypes.get(content.type) || 0
        stats.contentTypes.set(content.type, currentCount + 1)

        if (content.llmSummary) {
          stats.filesWithLLMSummaries++
        }
      })

      // Track latest update
      if (group.lastUpdated > stats.lastUpdate) {
        stats.lastUpdate = group.lastUpdated
      }
    }

    stats.averageItemsPerFile = stats.totalFiles > 0 ? stats.totalVisualItems / stats.totalFiles : 0

    return stats
  }

  /**
   * Export visual content data for a specific file
   */
  exportFileVisualData(documentId: string): FileVisualExport | null {
    const group = this.getFileVisualContent(documentId)
    if (!group) return null

    return {
      file: {
        id: group.documentId,
        name: group.documentName,
        type: group.documentType,
        uploadedAt: group.uploadedAt,
        lastUpdated: group.lastUpdated
      },
      visualContent: group.visualContent.map(content => ({
        id: content.id,
        type: content.type,
        title: content.title,
        description: content.description,
        metadata: content.metadata,
        llmSummary: content.llmSummary,
        extractedData: content.data
      })),
      statistics: {
        totalItems: group.visualCount,
        totalSize: group.totalSize,
        typeDistribution: this.getContentTypeDistribution(group.visualContent)
      }
    }
  }

  /**
   * Calculate total size of visual content in a group
   */
  private calculateGroupSize(visualContent: VisualContent[]): number {
    return visualContent.reduce((total, content) => {
      // Estimate size based on content
      let size = 0
      
      if (content.data?.base64) {
        size += content.data.base64.length * 0.75 // Base64 overhead
      }
      
      if (content.thumbnail) {
        size += content.thumbnail.length * 0.75
      }
      
      if (content.data?.rows) {
        size += JSON.stringify(content.data.rows).length
      }
      
      return total + size
    }, 0)
  }

  /**
   * Update search index with new visual content
   */
  private updateSearchIndex(visualContent: VisualContent[]): void {
    visualContent.forEach(content => {
      const searchableText = [
        content.title,
        content.description,
        content.metadata?.extractedText,
        content.llmSummary?.mainContent,
        content.llmSummary?.keyInsights?.join(' ')
      ].filter(Boolean).join(' ').toLowerCase()

      const words = searchableText.split(/\s+/).filter(word => word.length > 2)
      
      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set())
        }
        this.searchIndex.get(word)!.add(content.id)
      })
    })
  }

  /**
   * Remove content from search index
   */
  private removeFromSearchIndex(content: VisualContent): void {
    for (const [word, contentIds] of this.searchIndex.entries()) {
      contentIds.delete(content.id)
      if (contentIds.size === 0) {
        this.searchIndex.delete(word)
      }
    }
  }

  /**
   * Get content type distribution for visual content
   */
  private getContentTypeDistribution(visualContent: VisualContent[]) {
    const distribution = new Map<string, number>()
    visualContent.forEach(content => {
      const current = distribution.get(content.type) || 0
      distribution.set(content.type, current + 1)
    })
    return Object.fromEntries(distribution)
  }

  /**
   * Load persisted data
   */
  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('file_specific_visual_content')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore visual groups
        if (data.visualGroups) {
          this.visualGroups = new Map(data.visualGroups.map(([id, group]: [string, Record<string, unknown>]) => [
            id,
            {
              ...group,
              uploadedAt: new Date(group.uploadedAt as string),
              lastUpdated: new Date(group.lastUpdated as string)
            }
          ]))
        }

        // Rebuild search index
        this.rebuildSearchIndex()
      }
    } catch (error) {
      console.warn('Failed to load persisted visual content data:', error)
    }
  }

  /**
   * Persist data to localStorage
   */
  private persistData(): void {
    try {
      const data = {
        visualGroups: Array.from(this.visualGroups.entries())
      }
      localStorage.setItem('file_specific_visual_content', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist visual content data:', error)
    }
  }

  /**
   * Rebuild search index from existing data
   */
  private rebuildSearchIndex(): void {
    this.searchIndex.clear()
    for (const group of this.visualGroups.values()) {
      this.updateSearchIndex(group.visualContent)
    }
  }
}

// Singleton instance
export const fileVisualManager = new FileSpecificVisualManager()
