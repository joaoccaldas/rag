/**
 * Optimized Visual Content Processor
 * 
 * This module provides optimized visual content processing with:
 * - Efficient image loading and caching
 * - Progressive loading strategies
 * - Memory-efficient processing
 * - Performance optimizations
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { 
  addVisualContent, 
  updateVisualContent, 
  selectAllVisualContentItems,
  updateThumbnailCache,
  setError as setVisualContentError
} from '../store/slices/visualContentSlice'
import { 
  useLazyImage, 
  useIntersectionObserver, 
  useDebounce,
  usePerformanceMonitor 
} from '../utils/performance'
import { Card, LoadingSkeleton } from './ui/modular-components'
import type { VisualContent, VisualContentMetadata } from '../types/enhanced-types'

// Image processing utilities
export class ImageProcessor {
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
   * Generate thumbnail from image source
   */
  static async generateThumbnail(
    src: string, 
    maxWidth: number = 200, 
    maxHeight: number = 150,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const canvas = this.getCanvas()
          const ctx = this.ctx!
          
          // Calculate dimensions maintaining aspect ratio
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          )
          
          canvas.width = width
          canvas.height = height
          
          // Clear canvas and draw image
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob and then to data URL
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              } else {
                reject(new Error('Failed to create thumbnail'))
              }
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Calculate dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight
    
    let width = originalWidth
    let height = originalHeight
    
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }
    
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }
    
    return { width: Math.round(width), height: Math.round(height) }
  }

  /**
   * Extract image metadata
   */
  static async extractMetadata(src: string): Promise<Partial<VisualContentMetadata>> {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: this.getImageFormat(src)
        })
      }
      
      img.onerror = () => {
        resolve({}) // Return empty metadata on error
      }
      
      img.src = src
    })
  }

  /**
   * Determine image format from source
   */
  private static getImageFormat(src: string): string {
    if (src.startsWith('data:image/')) {
      const match = src.match(/data:image\/([^;]+)/)
      return match ? match[1] : 'unknown'
    }
    
    const extension = src.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  /**
   * Compress image for storage
   */
  static async compressImage(
    src: string, 
    maxSize: number = 1024 * 1024, // 1MB
    quality: number = 0.9
  ): Promise<string> {
    const canvas = this.getCanvas()
    const ctx = this.ctx!
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.clearRect(0, 0, img.width, img.height)
        ctx.drawImage(img, 0, 0)
        
        const compressAndCheck = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= maxSize || currentQuality <= 0.1) {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.onerror = reject
                  reader.readAsDataURL(blob)
                } else {
                  // Reduce quality and try again
                  compressAndCheck(currentQuality - 0.1)
                }
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            currentQuality
          )
        }
        
        compressAndCheck(quality)
      }
      
      img.onerror = reject
      img.src = src
    })
  }
}

// Visual Content Item Component
interface VisualContentItemProps {
  content: VisualContent
  onSelect?: (id: string) => void
  onPreview?: (id: string) => void
  isSelected?: boolean
  viewMode?: 'grid' | 'list'
  showDetails?: boolean
}

const VisualContentItem = React.memo<VisualContentItemProps>(({
  content,
  onSelect,
  onPreview,
  isSelected = false,
  viewMode = 'grid',
  showDetails = false
}) => {
  usePerformanceMonitor(`VisualContentItem-${content.id}`)
  
  const dispatch = useAppDispatch()
  const itemRef = useRef<HTMLDivElement>(null)
  const isInView = useIntersectionObserver(itemRef, { threshold: 0.1 })
  
  // Lazy load image only when in view
  const { imgRef, imageSrc, isLoaded, isError } = useLazyImage(
    content.source,
    { 
      placeholder: '/api/placeholder/200/150',
      threshold: 0.1 
    }
  )

  // Generate thumbnail if not exists
  useEffect(() => {
    if (isInView && isLoaded && !content.thumbnail && imageSrc) {
      ImageProcessor.generateThumbnail(imageSrc, 200, 150, 0.8)
        .then(thumbnail => {
          dispatch(updateThumbnailCache({
            itemId: content.id,
            thumbnail
          }))
          dispatch(updateVisualContent({
            id: content.id,
            thumbnail
          }))
        })
        .catch(error => {
          console.warn(`Failed to generate thumbnail for ${content.id}:`, error)
        })
    }
  }, [isInView, isLoaded, imageSrc, content.id, content.thumbnail, dispatch])

  const handleClick = useCallback(() => {
    onSelect?.(content.id)
  }, [content.id, onSelect])

  const handlePreview = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview?.(content.id)
  }, [content.id, onPreview])

  if (viewMode === 'list') {
    return (
      <div
        ref={itemRef}
        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }`}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-12 mr-4">
          {isError ? (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">Error</span>
            </div>
          ) : (
            <img
              ref={imgRef}
              src={imageSrc}
              alt={content.title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {content.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {content.type} • {content.metadata.format}
          </p>
          {showDetails && content.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {content.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={handlePreview}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
          >
            Preview
          </button>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : 'hover:shadow-md'
      }`}
      onClick={handleClick}
    >
      <div ref={itemRef} className="relative">
        {/* Image */}
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {isError ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-2">⚠️</div>
                <p className="text-xs text-gray-500">Failed to load</p>
              </div>
            </div>
          ) : (
            <img
              ref={imgRef}
              src={imageSrc}
              alt={content.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
            />
          )}
          
          {!isLoaded && !isError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSkeleton lines={1} className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {content.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {content.type} • {content.metadata.width}×{content.metadata.height}
          </p>
          
          {showDetails && (
            <>
              {content.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                  {content.description}
                </p>
              )}
              
              {content.llmSummary && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {content.llmSummary.keyInsights.slice(0, 2).map((insight, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePreview}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  )
})

VisualContentItem.displayName = 'VisualContentItem'

// Main Visual Content Grid Component
interface OptimizedVisualContentGridProps {
  searchQuery?: string
  filters?: any
  viewMode?: 'grid' | 'list'
  showDetails?: boolean
  onItemSelect?: (id: string) => void
  onItemPreview?: (id: string) => void
}

export const OptimizedVisualContentGrid = React.memo<OptimizedVisualContentGridProps>(({
  searchQuery = '',
  filters = {},
  viewMode = 'grid',
  showDetails = false,
  onItemSelect,
  onItemPreview
}) => {
  usePerformanceMonitor('OptimizedVisualContentGrid')
  
  const dispatch = useAppDispatch()
  const allVisualContent = useAppSelector(selectAllVisualContentItems)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  
  // Debounce search for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Memoized filtered content
  const filteredContent = useMemo(() => {
    let filtered = allVisualContent
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Apply additional filters
    if (filters.types?.length > 0) {
      filtered = filtered.filter(item => filters.types.includes(item.type))
    }
    
    if (filters.showFavoritesOnly) {
      filtered = filtered.filter(item => item.isFavorite)
    }
    
    if (filters.showVisibleOnly) {
      filtered = filtered.filter(item => item.isVisible)
    }
    
    return filtered
  }, [allVisualContent, debouncedSearchQuery, filters])

  const handleItemSelect = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
    onItemSelect?.(id)
  }, [onItemSelect])

  const handleItemPreview = useCallback((id: string) => {
    onItemPreview?.(id)
  }, [onItemPreview])

  if (filteredContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No visual content found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          {debouncedSearchQuery 
            ? `No visual content matches "${debouncedSearchQuery}"`
            : 'Upload documents with images, charts, or tables to see visual content here'
          }
        </p>
      </div>
    )
  }

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'space-y-4'

  return (
    <div className={gridClasses}>
      {filteredContent.map(item => (
        <VisualContentItem
          key={item.id}
          content={item}
          onSelect={handleItemSelect}
          onPreview={handleItemPreview}
          isSelected={selectedItems.has(item.id)}
          viewMode={viewMode}
          showDetails={showDetails}
        />
      ))}
    </div>
  )
})

OptimizedVisualContentGrid.displayName = 'OptimizedVisualContentGrid'

export default OptimizedVisualContentGrid
