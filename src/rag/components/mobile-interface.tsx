/**
 * PRIORITY 6: Responsive Mobile Interface
 * 
 * Creates touch-optimized, mobile-first components for the RAG pipeline.
 * Implements responsive design patterns with gesture support and 
 * optimized mobile interactions.
 * 
 * Features:
 * - Touch-optimized document browsing
 * - Mobile-friendly search interface
 * - Swipe gestures for navigation
 * - Responsive layout breakpoints
 * - Mobile keyboard optimization
 * - Voice search integration
 */

import React, { useState, useRef, useCallback } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Document } from '../types'
import { Button } from '@/design-system/components/button'
import { Input } from '@/design-system/components/input'
import { Card, CardContent } from '@/design-system/components/card'

export interface MobileViewportConfig {
  breakpoints: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl?: number // Optional for extra large screens
  }
  touchTargetSize: number
  gestureThreshold: number
  scrollThreshold: number
}

export interface TouchGestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress'
  direction?: 'left' | 'right' | 'up' | 'down'
  deltaX?: number
  deltaY?: number
  scale?: number
  target: HTMLElement
  timestamp: number
}

export interface MobileSearchProps {
  onSearch: (query: string) => void
  onVoiceSearch?: () => void
  placeholder?: string
  suggestions?: string[]
  isVoiceSupported?: boolean
}

export interface MobileDocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  onRefresh?: () => void
  loading?: boolean
  error?: string
}

export class MobileInterfaceManager {
  private viewport: MobileViewportConfig
  private touchHandlers: Map<string, (event: TouchGestureEvent) => void> = new Map()
  private isClient: boolean = typeof window !== 'undefined'

  constructor(config: Partial<MobileViewportConfig> = {}) {
    this.viewport = {
      breakpoints: {
        xs: 320,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        xxl: 1536
      },
      touchTargetSize: 44,
      gestureThreshold: 50,
      scrollThreshold: 100,
      ...config
    }

    if (this.isClient) {
      this.initializeMobileOptimizations()
    }
  }

  /**
   * Initialize mobile-specific optimizations
   */
  private initializeMobileOptimizations(): void {
    // Prevent zoom on double tap
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    }

    // Optimize touch scrolling
    document.body.style.touchAction = 'pan-x pan-y'
    // Note: webkitOverflowScrolling removed due to deprecation

    // Add mobile CSS classes
    document.documentElement.classList.add('mobile-optimized')

    console.log('📱 Mobile interface optimizations initialized')
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): string {
    if (!this.isClient) return 'md'

    const width = window.innerWidth
    
    if (width < this.viewport.breakpoints.sm) return 'xs'
    if (width < this.viewport.breakpoints.md) return 'sm'
    if (width < this.viewport.breakpoints.lg) return 'md'
    if (width < this.viewport.breakpoints.xl) return 'lg'
    return 'xl'
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    if (!this.isClient) return false

    return (
      window.innerWidth <= this.viewport.breakpoints.md ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )
  }

  /**
   * Register touch gesture handler
   */
  registerGestureHandler(id: string, handler: (event: TouchGestureEvent) => void): void {
    this.touchHandlers.set(id, handler)
  }

  /**
   * Unregister touch gesture handler
   */
  unregisterGestureHandler(id: string): void {
    this.touchHandlers.delete(id)
  }

  /**
   * Trigger haptic feedback (if supported)
   */
  triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      }
      navigator.vibrate(patterns[type])
    }
  }

  /**
   * Handle virtual keyboard visibility
   */
  handleVirtualKeyboard(callback: (visible: boolean) => void): () => void {
    if (!this.isClient) return () => {}

    const handleResize = () => {
      const heightDiff = window.screen.height - window.innerHeight
      const isKeyboardVisible = heightDiff > 150 // Threshold for keyboard
      callback(isKeyboardVisible)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }
}

/**
 * Mobile-optimized Search Interface
 */
export const MobileSearchInterface: React.FC<MobileSearchProps> = ({
  onSearch,
  onVoiceSearch,
  placeholder = 'Search documents...',
  suggestions = [],
  isVoiceSupported = false
}) => {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  return (
    <div className="mobile-search-container relative">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setShowSuggestions(suggestions.length > 0)
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow for selection
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            placeholder={placeholder}
            className="text-lg touch-manipulation"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
          
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Voice Search Button */}
        {isVoiceSupported && (
          <Button
            type="button"
            onClick={onVoiceSearch}
            variant="miele"
            size="default"
            className="touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </Button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full justify-start text-left border-b last:border-b-0 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">{suggestion}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Mobile-optimized Document List with Pull-to-Refresh
 */
export const MobileDocumentList: React.FC<MobileDocumentListProps> = ({
  documents,
  onDocumentSelect,
  onRefresh,
  loading = false,
  error
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (eventData.dir === 'Down' && containerRef.current?.scrollTop === 0 && onRefresh) {
        setIsRefreshing(true)
        onRefresh()
        setTimeout(() => setIsRefreshing(false), 1000)
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false
  })

  const handleDocumentTap = useCallback((document: Document) => {
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    onDocumentSelect(document)
  }, [onDocumentSelect])

  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="text-center p-6">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="miele"
              className="touch-manipulation"
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div 
      {...swipeHandlers}
      ref={containerRef}
      className="mobile-document-list h-full overflow-y-auto"
    >
      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Loading State */}
      {loading && documents.length === 0 && (
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-neutral-200 dark:bg-neutral-700 h-16 rounded-lg"></div>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="space-y-2 p-4">
        {documents.map((document) => (
          <MobileDocumentCard
            key={document.id}
            document={document}
            onSelect={handleDocumentTap}
          />
        ))}
      </div>

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No documents found</p>
        </div>
      )}
    </div>
  )
}

/**
 * Mobile-optimized Document Card
 */
export const MobileDocumentCard: React.FC<{
  document: Document
  onSelect: (document: Document) => void
}> = ({ document, onSelect }) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleTouchStart = () => setIsPressed(true)
  const handleTouchEnd = () => setIsPressed(false)

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      txt: '📄',
      image: '🖼️',
      default: '📄'
    }
    return icons[type] || icons['default']
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      onClick={() => onSelect(document)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        mobile-document-card p-4 bg-white border border-gray-200 rounded-lg shadow-sm 
        touch-manipulation active:bg-gray-50 transition-colors cursor-pointer
        ${isPressed ? 'bg-gray-50 scale-[0.98]' : ''}
      `}
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-start space-x-3">
        {/* Document Icon */}
        <div className="flex-shrink-0 text-2xl">
          {getDocumentIcon(document.type)}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {document.name}
          </h3>
          
          <div className="mt-1 text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>{formatFileSize(document.size)}</span>
              <span>{formatDate(document.uploadedAt?.toString() || new Date().toISOString())}</span>
            </div>
            
            {document.aiAnalysis?.summary && (
              <p className="text-gray-600 line-clamp-2 leading-relaxed">
                {document.aiAnalysis.summary}
              </p>
            )}
          </div>

          {/* Keywords */}
          {document.aiAnalysis?.keywords && document.aiAnalysis.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {document.aiAnalysis.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {keyword}
                </span>
              ))}
              {document.aiAnalysis.keywords.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{document.aiAnalysis.keywords.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile Navigation Hook
 */
export const useMobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('documents')

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const openMenu = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab)
    closeMenu()
  }, [closeMenu])

  return {
    isMenuOpen,
    activeTab,
    closeMenu,
    openMenu,
    switchTab
  }
}

// Export singleton instance
export const mobileInterfaceManager = new MobileInterfaceManager()
