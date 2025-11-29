/**
 * React Hook for Performance Optimization Features
 * Provides easy integration of caching, memory management, and background processing
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  CacheStats,
  MemoryStats,
  BackgroundWorkerStats,
  TaskProgress,
  BackgroundTask
} from '../performance'
import type { Document } from '../types'

import { ragCacheManager } from '../performance/cache-manager'
import { memoryManager } from '../performance/memory-manager'
import { backgroundProcessor } from '../performance/background-processor'
import { requestOptimizer } from '../performance/request-optimizer'

// Define local types for hook
type EmbeddingData = Record<string, unknown>
type SearchFilters = Record<string, unknown>
type SearchResultData = Record<string, unknown>[]

// Hook return types
interface PerformanceMetrics {
  cache: {
    embeddings: CacheStats
    search: CacheStats
    documents: CacheStats
    computations: CacheStats
    totalMemoryUsage: number
  }
  memory: MemoryStats | null
  backgroundWorker: BackgroundWorkerStats & { 
    queue: { 
      size: number
      pendingTasks: number
      runningTasks: number 
    } 
  }
  requestOptimization: {
    deduplication: {
      totalRequests: number
      deduplicatedRequests: number
      batchedRequests: number
      averageWaitTime: number
      timeoutCount: number
    }
    queueSize: number
    activeRequests: number
    maxConcurrentRequests: number
  }
}

interface PerformanceActions {
  // Cache management
  clearCache: (type?: 'embeddings' | 'search' | 'documents' | 'computations' | 'all') => void
  preloadFrequentData: () => Promise<void>
  
  // Memory management
  forceMemoryCleanup: (targetBytes?: number) => Promise<number>
  getMemoryReport: () => ReturnType<typeof memoryManager.getMemoryReport>
  
  // Background processing
  indexDocument: (document: any, priority?: number) => string
  precomputeQueries: (queries: string[], priority?: number) => string
  optimizeSystem: (type: 'embeddings' | 'cache' | 'memory', priority?: number) => string
  getTaskStatus: (taskId: string) => any
  
  // Request optimization
  updateRequestConfig: (maxConcurrentRequests: number) => void
  resetRequestOptimizer: () => void
}

interface UsePerformanceOptimizationOptions {
  enableRealTimeMetrics?: boolean
  metricsUpdateInterval?: number
  enableMemoryMonitoring?: boolean
  enableBackgroundProcessing?: boolean
  onMemoryThreshold?: (stats: MemoryStats) => void
  onTaskProgress?: (progress: TaskProgress) => void
}

/**
 * Hook for RAG Performance Optimization
 */
export function usePerformanceOptimization(
  options: UsePerformanceOptimizationOptions = {}
): {
  metrics: PerformanceMetrics
  actions: PerformanceActions
  isOptimizing: boolean
  lastUpdated: Date | null
} {
  const {
    enableRealTimeMetrics = true,
    metricsUpdateInterval = 5000,
    enableMemoryMonitoring = true,
    enableBackgroundProcessing = true,
    onMemoryThreshold,
    onTaskProgress
  } = options

  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cache: {
      embeddings: { hits: 0, misses: 0, evictions: 0, totalSize: 0, entryCount: 0, hitRate: 0 },
      search: { hits: 0, misses: 0, evictions: 0, totalSize: 0, entryCount: 0, hitRate: 0 },
      documents: { hits: 0, misses: 0, evictions: 0, totalSize: 0, entryCount: 0, hitRate: 0 },
      computations: { hits: 0, misses: 0, evictions: 0, totalSize: 0, entryCount: 0, hitRate: 0 },
      totalMemoryUsage: 0
    },
    memory: null,
    backgroundWorker: {
      tasksProcessed: 0,
      tasksInQueue: 0,
      averageProcessingTime: 0,
      failureRate: 0,
      lastProcessedAt: 0,
      queue: { size: 0, pendingTasks: 0, runningTasks: 0 }
    },
    requestOptimization: {
      deduplication: {
        totalRequests: 0,
        deduplicatedRequests: 0,
        batchedRequests: 0,
        averageWaitTime: 0,
        timeoutCount: 0
      },
      queueSize: 0,
      activeRequests: 0,
      maxConcurrentRequests: 5
    }
  })

  const [isOptimizing, setIsOptimizing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const memoryCallbackRef = useRef<string | null>(null)

  // Update metrics
  const updateMetrics = useCallback(() => {
    try {
      setMetrics({
        cache: ragCacheManager.getOverallStats(),
        memory: memoryManager.getMemoryStats(),
        backgroundWorker: backgroundProcessor.getStats(),
        requestOptimization: requestOptimizer.getStats()
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.warn('[usePerformanceOptimization] Failed to update metrics:', error)
    }
  }, [])

  // Cache management actions
  const clearCache = useCallback((type?: 'embeddings' | 'search' | 'documents' | 'computations' | 'all') => {
    ragCacheManager.clearCache(type || 'all')
    updateMetrics()
  }, [updateMetrics])

  const preloadFrequentData = useCallback(async () => {
    setIsOptimizing(true)
    try {
      await ragCacheManager.preloadFrequentData()
      updateMetrics()
    } finally {
      setIsOptimizing(false)
    }
  }, [updateMetrics])

  // Memory management actions
  const forceMemoryCleanup = useCallback(async (targetBytes?: number) => {
    setIsOptimizing(true)
    try {
      const freed = await memoryManager.forceCleanup(targetBytes)
      updateMetrics()
      return freed
    } finally {
      setIsOptimizing(false)
    }
  }, [updateMetrics])

  const getMemoryReport = useCallback(() => {
    return memoryManager.getMemoryReport()
  }, [])

  // Background processing actions
  const indexDocument = useCallback((document: any, priority: number = 5) => {
    const taskId = backgroundProcessor.indexDocument(document, priority, onTaskProgress)
    updateMetrics()
    return taskId
  }, [onTaskProgress, updateMetrics])

  const precomputeQueries = useCallback((queries: string[], priority: number = 3) => {
    const taskId = backgroundProcessor.precomputeQueries(queries, priority, onTaskProgress)
    updateMetrics()
    return taskId
  }, [onTaskProgress, updateMetrics])

  const optimizeSystem = useCallback((type: 'embeddings' | 'cache' | 'memory', priority: number = 2) => {
    const taskId = backgroundProcessor.optimizeSystem(type, priority, onTaskProgress)
    updateMetrics()
    return taskId
  }, [onTaskProgress, updateMetrics])

  const getTaskStatus = useCallback((taskId: string) => {
    return backgroundProcessor.getTaskStatus(taskId)
  }, [])

  // Request optimization actions
  const updateRequestConfig = useCallback((maxConcurrentRequests: number) => {
    requestOptimizer.updateConfig(maxConcurrentRequests)
    updateMetrics()
  }, [updateMetrics])

  const resetRequestOptimizer = useCallback(() => {
    requestOptimizer.reset()
    updateMetrics()
  }, [updateMetrics])

  // Actions object
  const actions: PerformanceActions = {
    clearCache,
    preloadFrequentData,
    forceMemoryCleanup,
    getMemoryReport,
    indexDocument,
    precomputeQueries,
    optimizeSystem,
    getTaskStatus,
    updateRequestConfig,
    resetRequestOptimizer
  }

  // Setup real-time metrics updates
  useEffect(() => {
    if (!enableRealTimeMetrics) return

    // Initial update
    updateMetrics()

    // Setup interval
    intervalRef.current = setInterval(updateMetrics, metricsUpdateInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enableRealTimeMetrics, metricsUpdateInterval, updateMetrics])

  // Setup memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring || !onMemoryThreshold) return

    const callbackId = `hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    memoryManager.setMemoryThresholds({ warning: 70, critical: 85, cleanup: 90 })
    
    // Note: This is a placeholder - the actual memory manager would need to support callback registration
    memoryCallbackRef.current = callbackId

    return () => {
      if (memoryCallbackRef.current) {
        // Would remove callback from memory manager
        memoryCallbackRef.current = null
      }
    }
  }, [enableMemoryMonitoring, onMemoryThreshold])

  // Background processing setup
  useEffect(() => {
    if (!enableBackgroundProcessing) {
      backgroundProcessor.pause()
    } else {
      backgroundProcessor.resume()
    }

    return () => {
      // Cleanup is handled by the background processor itself
    }
  }, [enableBackgroundProcessing])

  return {
    metrics,
    actions,
    isOptimizing,
    lastUpdated
  }
}

/**
 * Hook for monitoring specific performance aspects
 */
export function usePerformanceMonitor(
  aspect: 'cache' | 'memory' | 'background' | 'requests'
) {
  const { metrics, lastUpdated } = usePerformanceOptimization({
    enableRealTimeMetrics: true,
    metricsUpdateInterval: 2000
  })

  switch (aspect) {
    case 'cache':
      return { data: metrics.cache, lastUpdated }
    case 'memory':
      return { data: metrics.memory, lastUpdated }
    case 'background':
      return { data: metrics.backgroundWorker, lastUpdated }
    case 'requests':
      return { data: metrics.requestOptimization, lastUpdated }
    default:
      return { data: null, lastUpdated }
  }
}

/**
 * Hook for cache-specific operations
 */
export function useRAGCache() {
  const { actions, metrics } = usePerformanceOptimization()

  const getCacheStats = useCallback(() => {
    return metrics.cache
  }, [metrics.cache])

  const getCachedEmbedding = useCallback((text: string) => {
    return ragCacheManager.getEmbedding(text)
  }, [])

  const setCachedEmbedding = useCallback((text: string, embedding: any) => {
    ragCacheManager.setEmbedding(text, embedding)
  }, [])

  const getCachedSearchResults = useCallback((query: string, filters?: any) => {
    return ragCacheManager.getSearchResults(query, filters)
  }, [])

  const setCachedSearchResults = useCallback((query: string, results: any[], filters?: any) => {
    ragCacheManager.setSearchResults(query, results, filters)
  }, [])

  return {
    stats: getCacheStats(),
    clearCache: actions.clearCache,
    preloadData: actions.preloadFrequentData,
    getEmbedding: getCachedEmbedding,
    setEmbedding: setCachedEmbedding,
    getSearchResults: getCachedSearchResults,
    setSearchResults: setCachedSearchResults
  }
}

/**
 * Hook for background task management
 */
export function useBackgroundTasks() {
  const [activeTasks, setActiveTasks] = useState<string[]>([])
  const [taskProgress, setTaskProgress] = useState<Map<string, TaskProgress>>(new Map())

  const addTask = useCallback((taskId: string) => {
    setActiveTasks(prev => [...prev, taskId])
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setActiveTasks(prev => prev.filter(id => id !== taskId))
    setTaskProgress(prev => {
      const next = new Map(prev)
      next.delete(taskId)
      return next
    })
  }, [])

  const updateTaskProgress = useCallback((progress: TaskProgress) => {
    setTaskProgress(prev => new Map(prev.set(progress.taskId, progress)))
  }, [])

  const indexDocument = useCallback((document: any, priority?: number) => {
    const taskId = backgroundProcessor.indexDocument(document, priority, updateTaskProgress)
    addTask(taskId)
    return taskId
  }, [addTask, updateTaskProgress])

  const precomputeQueries = useCallback((queries: string[], priority?: number) => {
    const taskId = backgroundProcessor.precomputeQueries(queries, priority, updateTaskProgress)
    addTask(taskId)
    return taskId
  }, [addTask, updateTaskProgress])

  const optimizeSystem = useCallback((type: 'embeddings' | 'cache' | 'memory', priority?: number) => {
    const taskId = backgroundProcessor.optimizeSystem(type, priority, updateTaskProgress)
    addTask(taskId)
    return taskId
  }, [addTask, updateTaskProgress])

  return {
    activeTasks,
    taskProgress: Object.fromEntries(taskProgress),
    indexDocument,
    precomputeQueries,
    optimizeSystem,
    removeTask,
    getTaskStatus: backgroundProcessor.getTaskStatus.bind(backgroundProcessor)
  }
}

// Export types
export type { 
  PerformanceMetrics, 
  PerformanceActions, 
  UsePerformanceOptimizationOptions 
}
