/**
 * Document Virtualization System
 * 
 * Implements progressive loading and virtualization for handling large document collections
 * efficiently. Uses React Window for rendering optimization and intersection observer
 * for progressive loading.
 * 
 * Features:
 * - Virtual scrolling for thousands of documents
 * - Progressive loading with intersection observer
 * - Document preview caching
 * - Efficient memory management
 * - Smooth scrolling with dynamic item sizing
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { VariableSizeList } from 'react-window'
import Image from 'next/image'
import { Document } from '../types'

export interface VirtualizedDocumentItem {
  document: Document
  isLoaded: boolean
  isVisible: boolean
  previewCache?: string
  thumbnailCache?: string
  height: number
}

export interface VirtualizationConfig {
  itemHeight: number
  bufferSize: number
  previewCacheSize: number
  loadBatchSize: number
  enablePreviewCache: boolean
  enableThumbnailCache: boolean
  intersectionThreshold: number
}

export interface VirtualizedDocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  onDocumentPreview: (document: Document) => void
  renderItem?: (props: DocumentItemProps) => React.ReactElement
  config?: Partial<VirtualizationConfig>
  className?: string
  style?: React.CSSProperties
}

export interface DocumentItemProps {
  index: number
  style: React.CSSProperties
  data: {
    items: VirtualizedDocumentItem[]
    onSelect: (document: Document) => void
    onPreview: (document: Document) => void
    onLoadMore: (startIndex: number) => void
    isLoading: boolean
  }
}

export class DocumentVirtualizationManager {
  private documents: Document[] = []
  private virtualizedItems: Map<string, VirtualizedDocumentItem> = new Map()
  private previewCache: Map<string, string> = new Map()
  private thumbnailCache: Map<string, string> = new Map()
  private loadedRanges: Set<string> = new Set()
  public config: VirtualizationConfig
  private intersectionObserver?: IntersectionObserver

  constructor(config: Partial<VirtualizationConfig> = {}) {
    this.config = {
      itemHeight: 120,
      bufferSize: 10,
      previewCacheSize: 50,
      loadBatchSize: 20,
      enablePreviewCache: true,
      enableThumbnailCache: true,
      intersectionThreshold: 0.1,
      ...config
    }

    this.setupIntersectionObserver()
  }

  /**
   * Initialize with document collection
   */
  setDocuments(documents: Document[]): void {
    this.documents = documents
    this.virtualizedItems.clear()
    this.loadedRanges.clear()

    // Create virtualized items with initial state
    documents.forEach((doc, index) => {
      this.virtualizedItems.set(doc.id, {
        document: doc,
        isLoaded: index < this.config.loadBatchSize, // Load first batch immediately
        isVisible: false,
        height: this.config.itemHeight
      })
    })

    console.log(`📄 Initialized virtualization for ${documents.length} documents`)
  }

  /**
   * Get virtualized items for a specific range
   */
  getItemsInRange(startIndex: number, endIndex: number): VirtualizedDocumentItem[] {
    const items: VirtualizedDocumentItem[] = []
    
    for (let i = startIndex; i <= Math.min(endIndex, this.documents.length - 1); i++) {
      const doc = this.documents[i]
      const item = this.virtualizedItems.get(doc.id)
      if (item) {
        items.push(item)
      }
    }

    return items
  }

  /**
   * Load documents in a specific range
   */
  async loadRange(startIndex: number, endIndex: number): Promise<void> {
    const rangeKey = `${startIndex}-${endIndex}`
    if (this.loadedRanges.has(rangeKey)) {
      return
    }

    console.log(`📥 Loading document range: ${startIndex}-${endIndex}`)
    
    const loadPromises: Promise<void>[] = []

    for (let i = startIndex; i <= Math.min(endIndex, this.documents.length - 1); i++) {
      const doc = this.documents[i]
      const item = this.virtualizedItems.get(doc.id)
      
      if (item && !item.isLoaded) {
        loadPromises.push(this.loadDocumentDetails(doc, item))
      }
    }

    await Promise.all(loadPromises)
    this.loadedRanges.add(rangeKey)
  }

  /**
   * Load individual document details
   */
  private async loadDocumentDetails(document: Document, item: VirtualizedDocumentItem): Promise<void> {
    try {
      // Generate preview if enabled
      if (this.config.enablePreviewCache && !item.previewCache) {
        item.previewCache = await this.generateDocumentPreview(document)
      }

      // Generate thumbnail if enabled
      if (this.config.enableThumbnailCache && !item.thumbnailCache) {
        item.thumbnailCache = await this.generateDocumentThumbnail(document)
      }

      // Calculate dynamic height based on content
      item.height = this.calculateItemHeight(document, item)
      item.isLoaded = true

      this.virtualizedItems.set(document.id, item)
    } catch (error) {
      console.error(`Failed to load details for document ${document.id}:`, error)
      item.isLoaded = true // Mark as loaded to avoid retry loops
    }
  }

  /**
   * Generate document preview
   */
  private async generateDocumentPreview(document: Document): Promise<string> {
    if (this.previewCache.has(document.id)) {
      return this.previewCache.get(document.id)!
    }

    let preview: string
    
    if (document.aiAnalysis?.summary) {
      preview = document.aiAnalysis.summary
    } else if (document.content.length > 200) {
      preview = document.content.substring(0, 200) + '...'
    } else {
      preview = document.content
    }

    // Cache the preview
    if (this.previewCache.size >= this.config.previewCacheSize) {
      // Remove oldest cache entry
      const firstKey = this.previewCache.keys().next().value
      if (firstKey) {
        this.previewCache.delete(firstKey)
      }
    }

    this.previewCache.set(document.id, preview)
    return preview
  }

  /**
   * Generate document thumbnail
   */
  private async generateDocumentThumbnail(document: Document): Promise<string> {
    if (this.thumbnailCache.has(document.id)) {
      return this.thumbnailCache.get(document.id)!
    }

    let thumbnail: string

    // Check if document has visual content for thumbnail
    if (document.visualContent && document.visualContent.length > 0) {
      const firstVisual = document.visualContent[0]
      thumbnail = firstVisual.thumbnail || firstVisual.data?.url || this.generateDefaultThumbnail(document)
    } else {
      thumbnail = this.generateDefaultThumbnail(document)
    }

    // Cache the thumbnail
    if (this.thumbnailCache.size >= this.config.previewCacheSize) {
      const firstKey = this.thumbnailCache.keys().next().value
      if (firstKey) {
        this.thumbnailCache.delete(firstKey)
      }
    }

    this.thumbnailCache.set(document.id, thumbnail)
    return thumbnail
  }

  /**
   * Generate default thumbnail based on document type
   */
  private generateDefaultThumbnail(document: Document): string {
    const color = this.getDocumentTypeColor(document.type)
    const svg = `<svg width="80" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="100" fill="${color}" rx="4"/>
      <text x="40" y="30" font-family="Arial" font-size="12" fill="white" text-anchor="middle" font-weight="bold">
        ${document.type.toUpperCase()}
      </text>
      <text x="40" y="70" font-family="Arial" font-size="8" fill="white" text-anchor="middle">
        ${this.formatFileSize(document.size)}
      </text>
    </svg>`
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  /**
   * Calculate dynamic item height based on content
   */
  private calculateItemHeight(document: Document, item: VirtualizedDocumentItem): number {
    let height = this.config.itemHeight

    // Adjust height based on content
    if (item.previewCache && item.previewCache.length > 100) {
      height += 20 // Extra height for longer previews
    }

    // Adjust height based on visual content
    if (document.visualContent && document.visualContent.length > 0) {
      height += 30 // Extra height for visual indicators
    }

    // Adjust height based on AI analysis
    if (document.aiAnalysis?.keywords && document.aiAnalysis.keywords.length > 3) {
      height += 15 // Extra height for keyword tags
    }

    return height
  }

  /**
   * Set up intersection observer for progressive loading
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const documentId = entry.target.getAttribute('data-document-id')
          if (documentId) {
            const item = this.virtualizedItems.get(documentId)
            if (item) {
              item.isVisible = entry.isIntersecting
              this.virtualizedItems.set(documentId, item)
            }
          }
        })
      },
      {
        threshold: this.config.intersectionThreshold,
        rootMargin: '50px'
      }
    )
  }

  /**
   * Observe element for intersection
   */
  observeElement(element: HTMLElement, documentId: string): void {
    if (this.intersectionObserver) {
      element.setAttribute('data-document-id', documentId)
      this.intersectionObserver.observe(element)
    }
  }

  /**
   * Unobserve element
   */
  unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element)
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.previewCache.clear()
    this.thumbnailCache.clear()
    this.loadedRanges.clear()
    console.log('🧹 Cleared document virtualization caches')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    previewCacheSize: number
    thumbnailCacheSize: number
    loadedRanges: number
    virtualizedItems: number
  } {
    return {
      previewCacheSize: this.previewCache.size,
      thumbnailCacheSize: this.thumbnailCache.size,
      loadedRanges: this.loadedRanges.size,
      virtualizedItems: this.virtualizedItems.size
    }
  }

  /**
   * Helper methods
   */
  private getDocumentTypeColor(type: string): string {
    const colors: Record<string, string> = {
      pdf: '#e53e3e',
      docx: '#3182ce',
      txt: '#38a169',
      html: '#d69e2e',
      json: '#805ad5',
      csv: '#dd6b20',
      xlsx: '#2b8a3e',
      image: '#c53030',
      default: '#718096'
    }
    return colors[type] || colors.default
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    this.clearCaches()
  }
}

/**
 * Default Document Item Component
 */
export const VirtualizedDocumentItem: React.FC<DocumentItemProps> = ({ index, style, data }) => {
  const { items, onSelect, onPreview, onLoadMore } = data
  const item = items[index]
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (itemRef.current && item) {
      // Set up intersection observer for this item
      const manager = documentVirtualizationManager
      const element = itemRef.current
      manager.observeElement(element, item.document.id)

      return () => {
        manager.unobserveElement(element)
      }
    }
  }, [item])

  useEffect(() => {
    // Trigger progressive loading
    const bufferStart = Math.max(0, index - 5)
    onLoadMore(bufferStart)
  }, [index, onLoadMore])

  if (!item) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
      </div>
    )
  }

  const { document, isLoaded, previewCache, thumbnailCache } = item

  return (
    <div
      ref={itemRef}
      style={style}
      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onSelect(document)}
      onMouseEnter={() => onPreview(document)}
    >
      <div className="flex items-start space-x-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {thumbnailCache ? (
            <Image
              src={thumbnailCache}
              alt={document.name}
              width={48}
              height={64}
              className="object-cover rounded border"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
              <span className="text-xs text-gray-500">{document.type}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.name}
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(document.uploadedAt).toLocaleDateString()}
            </span>
          </div>

          {isLoaded && previewCache && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {previewCache}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {document.type.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {documentVirtualizationManager.formatFileSize(document.size)}
              </span>
            </div>

            {document.aiAnalysis?.keywords && (
              <div className="flex items-center space-x-1">
                {document.aiAnalysis.keywords.slice(0, 2).map((keyword, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  )
}

/**
 * Main Virtualized Document List Component
 */
export const VirtualizedDocumentList: React.FC<VirtualizedDocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentPreview,
  renderItem = VirtualizedDocumentItem,
  config = {},
  className = '',
  style = {}
}) => {
  const [virtualizedItems, setVirtualizedItems] = useState<VirtualizedDocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [manager] = useState(() => new DocumentVirtualizationManager(config))
  const listRef = useRef<VariableSizeList>(null)

  // Initialize manager with documents
  useEffect(() => {
    manager.setDocuments(documents)
    setVirtualizedItems(manager.getItemsInRange(0, documents.length - 1))
  }, [documents, manager])

  // Handle progressive loading
  const handleLoadMore = useCallback(async (startIndex: number) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const endIndex = Math.min(startIndex + manager.config.loadBatchSize, documents.length - 1)
      await manager.loadRange(startIndex, endIndex)
      setVirtualizedItems(manager.getItemsInRange(0, documents.length - 1))
    } catch (error) {
      console.error('Failed to load more documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, manager, documents.length])

  // Get item height for variable sizing
  const getItemHeight = useCallback((index: number): number => {
    const item = virtualizedItems[index]
    return item?.height || manager.config.itemHeight
  }, [virtualizedItems, manager.config.itemHeight])

  // Item data for the virtualized list
  const itemData = useMemo(() => ({
    items: virtualizedItems,
    onSelect: onDocumentSelect,
    onPreview: onDocumentPreview,
    onLoadMore: handleLoadMore,
    isLoading
  }), [virtualizedItems, onDocumentSelect, onDocumentPreview, handleLoadMore, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.dispose()
    }
  }, [manager])

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No documents to display
      </div>
    )
  }

  return (
    <div className={`h-full ${className}`} style={style}>
      <VariableSizeList
        ref={listRef}
        height={500} // Will be overridden by parent container
        width="100%"
        itemCount={documents.length}
        itemSize={getItemHeight}
        itemData={itemData}
        overscanCount={manager.config.bufferSize}
      >
        {renderItem}
      </VariableSizeList>
    </div>
  )
}

// Export singleton manager instance
export const documentVirtualizationManager = new DocumentVirtualizationManager()
