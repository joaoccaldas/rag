/**
 * Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing React component performance
 * including memoization helpers, debounce utilities, and performance monitoring.
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'

/**
 * Custom hook for debouncing values
 * Prevents excessive API calls or expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for throttling function calls
 * Limits function execution frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttleRef = useRef<NodeJS.Timeout | null>(null)
  const lastExecRef = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastExecRef.current > delay) {
        lastExecRef.current = now
        return callback(...args)
      } else {
        if (throttleRef.current) {
          clearTimeout(throttleRef.current)
        }
        
        throttleRef.current = setTimeout(() => {
          lastExecRef.current = Date.now()
          callback(...args)
        }, delay - (now - lastExecRef.current))
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * Custom hook for memoizing expensive calculations
 * Provides more control than useMemo with dependency validation
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    maxAge?: number // Cache duration in ms
    onCacheHit?: () => void
    onCacheMiss?: () => void
  }
): T {
  const cacheRef = useRef<{
    value: T
    deps: React.DependencyList
    timestamp: number
  } | null>(null)

  return useMemo(() => {
    const { maxAge = Infinity, onCacheHit, onCacheMiss } = options || {}
    const now = Date.now()
    
    // Check if cache is valid
    if (
      cacheRef.current &&
      cacheRef.current.deps.length === deps.length &&
      cacheRef.current.deps.every((dep, index) => dep === deps[index]) &&
      now - cacheRef.current.timestamp < maxAge
    ) {
      onCacheHit?.()
      return cacheRef.current.value
    }
    
    // Cache miss - recalculate
    onCacheMiss?.()
    const value = factory()
    
    cacheRef.current = {
      value,
      deps,
      timestamp: now
    }
    
    return value
  }, deps)
}

/**
 * Custom hook for intersection observer (lazy loading)
 * Optimizes rendering of off-screen components
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

/**
 * Custom hook for virtual scrolling optimization
 * Renders only visible items in large lists
 */
export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  scrollTop,
  overscan = 3
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  scrollTop: number
  overscan?: number
}) {
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      startIndex + visibleItemCount + overscan * 2
    )

    return {
      startIndex,
      endIndex,
      visibleItemCount,
      totalHeight: itemCount * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [itemCount, itemHeight, containerHeight, scrollTop, overscan])
}

/**
 * Performance monitoring hook
 * Tracks component render times and performance metrics
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)
  const totalTimeRef = useRef<number>(0)

  useEffect(() => {
    renderStartRef.current = performance.now()
    renderCountRef.current += 1
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current
    totalTimeRef.current += renderTime
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`)
      
      if (renderCountRef.current % 10 === 0) {
        const averageTime = totalTimeRef.current / renderCountRef.current
        console.log(`${componentName} average render time: ${averageTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount: renderCountRef.current,
    averageRenderTime: totalTimeRef.current / renderCountRef.current || 0
  }
}

/**
 * Optimized event handler creator
 * Prevents unnecessary re-renders by stabilizing event handlers
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args)
    }) as T,
    []
  )
}

/**
 * Batch state updates for better performance
 * Groups multiple state updates into a single re-render
 */
export function useBatchedUpdates() {
  const [, forceUpdate] = useState({})
  const batchRef = useRef<{ [key: string]: any }>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setBatch = useCallback((updates: { [key: string]: any }) => {
    batchRef.current = { ...batchRef.current, ...updates }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      forceUpdate({})
      batchRef.current = {}
    }, 0)
  }, [])

  const getBatch = useCallback(() => batchRef.current, [])

  return { setBatch, getBatch }
}

/**
 * Image lazy loading hook with performance optimization
 */
export function useLazyImage(src: string, options?: {
  placeholder?: string
  threshold?: number
}) {
  const [imageSrc, setImageSrc] = useState(options?.placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  
  const isIntersecting = useIntersectionObserver(imgRef, {
    threshold: options?.threshold || 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (isIntersecting && src && !isLoaded && !isError) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      
      img.onerror = () => {
        setIsError(true)
      }
      
      img.src = src
    }
  }, [isIntersecting, src, isLoaded, isError])

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    isIntersecting
  }
}

/**
 * Optimized component wrapper for expensive operations
 */
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    displayName?: string
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean
  }
) {
  const MemoizedComponent = React.memo(Component, options?.shouldUpdate)
  
  if (options?.displayName) {
    MemoizedComponent.displayName = options.displayName
  }
  
  return MemoizedComponent
}

/**
 * Hook for managing component loading states efficiently
 */
export function useLoadingState(initialState = false) {
  const [loading, setLoading] = useState(initialState)
  const loadingRef = useRef(loading)
  
  const setLoadingOptimized = useCallback((newLoading: boolean) => {
    if (loadingRef.current !== newLoading) {
      loadingRef.current = newLoading
      setLoading(newLoading)
    }
  }, [])
  
  const withLoading = useCallback(async <T>(asyncOperation: () => Promise<T>): Promise<T> => {
    setLoadingOptimized(true)
    try {
      const result = await asyncOperation()
      return result
    } finally {
      setLoadingOptimized(false)
    }
  }, [setLoadingOptimized])
  
  return {
    loading,
    setLoading: setLoadingOptimized,
    withLoading
  }
}
