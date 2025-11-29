/**
 * 🚀 PERFORMANCE OPTIMIZATION SYSTEM
 * 
 * Provides React performance optimizations including virtual scrolling,
 * memoization, debouncing, and background processing for the RAG system.
 */

"use client"

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo, 
  useLayoutEffect,
  startTransition
} from 'react'

// Simple debounce function to avoid lodash dependency
function debounce<Args extends unknown[]>(
  func: (...args: Args) => Promise<void>, 
  delay: number
): ((...args: Args) => void) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout
  
  const debounced = ((...args: Args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as ((...args: Args) => void) & { cancel: () => void }
  
  debounced.cancel = () => clearTimeout(timeoutId)
  
  return debounced
}

// ==================== VIRTUAL SCROLLING ====================

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  onScroll?: (scrollTop: number) => void
}

interface VirtualScrollReturn {
  startIndex: number
  endIndex: number
  totalHeight: number
  scrollTop: number
  containerRef: React.RefObject<HTMLDivElement>
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

export function useVirtualScroll(
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollReturn {
  const { itemHeight, containerHeight, overscan = 5, onScroll } = options
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const totalHeight = itemCount * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  return {
    startIndex,
    endIndex,
    totalHeight,
    scrollTop,
    containerRef,
    handleScroll
  }
}

// ==================== OPTIMIZED SEARCH DEBOUNCING ====================

interface DebouncedSearchOptions {
  delay?: number
  minLength?: number
  maxResults?: number
}

export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: DebouncedSearchOptions = {}
) {
  const { delay = 300, minLength = 2, maxResults = 50 } = options
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      
      try {
        const searchResults = await searchFunction(searchQuery)
        
        // Use startTransition for non-urgent updates
        startTransition(() => {
          setResults(searchResults.slice(0, maxResults))
          setIsSearching(false)
          
          // Update search history
          setSearchHistory(prev => {
            const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)]
            return newHistory.slice(0, 10) // Keep last 10 searches
          })
        })
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setIsSearching(false)
      }
    }, delay),
    [searchFunction, delay, minLength, maxResults]
  )

  // Update search query and trigger debounced search
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }, [debouncedSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setIsSearching(false)
    debouncedSearch.cancel()
  }, [debouncedSearch])

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return {
    query,
    results,
    isSearching,
    searchHistory,
    updateQuery,
    clearSearch
  }
}

// ==================== BACKGROUND PROCESSING ====================

interface BackgroundTaskOptions {
  maxConcurrent?: number
  onProgress?: (completed: number, total: number) => void
  onComplete?: () => void
  onError?: (error: Error, taskId: string) => void
}

interface BackgroundTask<T = unknown> {
  id: string
  task: () => Promise<T>
  priority?: number
}

export function useBackgroundProcessor<T = unknown>(options: BackgroundTaskOptions = {}) {
  const { maxConcurrent = 3, onProgress, onComplete, onError } = options
  const [tasks, setTasks] = useState<BackgroundTask<T>[]>([])
  const [activeTasks, setActiveTasks] = useState<Set<string>>(new Set())
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Map<string, T>>(new Map())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())

  // Process tasks in background
  const processTask = useCallback(async (task: BackgroundTask<T>) => {
    setActiveTasks(prev => new Set([...prev, task.id]))
    
    try {
      const result = await task.task()
      
      setResults(prev => new Map([...prev, [task.id, result]]))
      setCompletedTasks(prev => new Set([...prev, task.id]))
      
      onProgress?.(completedTasks.size + 1, tasks.length)
    } catch (error) {
      const taskError = error as Error
      setErrors(prev => new Map([...prev, [task.id, taskError]]))
      onError?.(taskError, task.id)
    } finally {
      setActiveTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(task.id)
        return newSet
      })
    }
  }, [tasks.length, completedTasks.size, onProgress, onError])

  // Add task to queue
  const addTask = useCallback((task: BackgroundTask<T>) => {
    setTasks(prev => [...prev, task])
  }, [])

  // Add multiple tasks
  const addTasks = useCallback((newTasks: BackgroundTask<T>[]) => {
    setTasks(prev => [...prev, ...newTasks])
  }, [])

  // Clear all tasks
  const clearTasks = useCallback(() => {
    setTasks([])
    setActiveTasks(new Set())
    setCompletedTasks(new Set())
    setResults(new Map())
    setErrors(new Map())
  }, [])

  // Process pending tasks
  useEffect(() => {
    const pendingTasks = tasks.filter(
      task => !activeTasks.has(task.id) && !completedTasks.has(task.id)
    )

    if (pendingTasks.length === 0) {
      if (tasks.length > 0 && completedTasks.size === tasks.length) {
        onComplete?.()
      }
      return
    }

    const slotsAvailable = maxConcurrent - activeTasks.size
    const tasksToProcess = pendingTasks
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, slotsAvailable)

    tasksToProcess.forEach(processTask)
  }, [tasks, activeTasks, completedTasks, maxConcurrent, processTask, onComplete])

  const isProcessing = activeTasks.size > 0
  const progress = tasks.length > 0 ? completedTasks.size / tasks.length : 0

  return {
    addTask,
    addTasks,
    clearTasks,
    isProcessing,
    progress,
    activeTasks: Array.from(activeTasks),
    completedTasks: Array.from(completedTasks),
    results,
    errors,
    totalTasks: tasks.length,
    completedCount: completedTasks.size
  }
}

// ==================== OPTIMIZED MEMO HOOKS ====================

/**
 * Memoized document filtering with optimized comparisons
 */
export function useOptimizedDocumentFilter<T extends { id: string; type?: string; status?: string }>(
  documents: T[],
  filters: {
    searchQuery?: string
    types?: string[]
    statuses?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
) {
  return useMemo(() => {
    let filtered = [...documents]

    // Apply search filter
    if (filters.searchQuery && filters.searchQuery.length > 0) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        JSON.stringify(doc).toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(doc => 
        filters.types?.includes(doc.type || '')
      )
    }

    // Apply status filter
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(doc => 
        filters.statuses?.includes(doc.status || '')
      )
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[filters.sortBy!]
        const bVal = (b as Record<string, unknown>)[filters.sortBy!]
        
        // Handle different types safely
        if (aVal === undefined && bVal === undefined) return 0
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        
        // Convert to string for comparison if needed
        const aStr = String(aVal)
        const bStr = String(bVal)
        
        let comparison = 0
        if (aStr < bStr) comparison = -1
        if (aStr > bStr) comparison = 1
        
        return filters.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    return filtered
  }, [documents, filters.searchQuery, filters.types, filters.statuses, filters.sortBy, filters.sortOrder])
}

/**
 * Optimized bulk selection state
 */
export function useOptimizedSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [selectedIds.size, items.length, clearSelection, selectAll])

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.has(item.id)), 
    [items, selectedIds]
  )

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isNoneSelected: selectedIds.size === 0,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll
  }
}

// ==================== PERFORMANCE MONITORING ====================

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const lastRenderTime = useRef(Date.now())

  useLayoutEffect(() => {
    renderCount.current += 1
    const currentTime = Date.now()
    const renderTime = currentTime - lastRenderTime.current
    
    renderTimes.current.push(renderTime)
    
    // Keep only last 100 render times
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift()
    }

    lastRenderTime.current = currentTime

    // Log performance warnings
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime}ms`)
    }

    if (renderCount.current % 10 === 0) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      console.log(`📊 ${componentName} - Renders: ${renderCount.current}, Avg: ${avgRenderTime.toFixed(2)}ms`)
    }
  })

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0
  }
}

// ==================== OPTIMIZED IMAGE LOADING ====================

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage = React.memo<LazyImageProps>(({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onLoad,
  onError 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          // Create actual img element to load the image
          const imageLoader = new Image()
          imageLoader.onload = () => {
            setIsLoaded(true)
            onLoad?.()
          }
          imageLoader.onerror = () => {
            setHasError(true)
            onError?.()
          }
          imageLoader.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(img)

    return () => observer.disconnect()
  }, [src, onLoad, onError])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  if (hasError && placeholder) {
    return <div className={`${className} bg-gray-200 flex items-center justify-center`}>{placeholder}</div>
  }

  return (
    <div
      ref={imgRef as React.RefObject<HTMLDivElement>}
      className={`${className} transition-opacity duration-300 bg-cover bg-center ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundImage: isLoaded ? `url(${src})` : undefined }}
      role="img"
      aria-label={alt}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
})

LazyImage.displayName = 'LazyImage'
