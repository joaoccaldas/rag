import { useCallback, useRef, useState } from 'react'

// Extend Performance interface for memory monitoring
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

interface PerformanceMetrics {
  operationName: string
  duration: number
  timestamp: number
  memoryUsage?: number
  success: boolean
  error?: string
}

interface PerformanceStats {
  totalOperations: number
  avgDuration: number
  totalErrors: number
  errorRate: number
  recentMetrics: PerformanceMetrics[]
  memoryTrend: number[]
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const startTimer = useCallback((operationName: string) => {
    const id = `${operationName}-${Date.now()}`
    timers.current.set(id, performance.now())
    return id
  }, [])

  const endTimer = useCallback((
    timerId: string,
    operationName: string,
    success: boolean = true,
    error?: string
  ) => {
    const startTime = timers.current.get(timerId)
    if (!startTime) {
      console.warn(`Timer ${timerId} not found`)
      return
    }

    const duration = performance.now() - startTime
    timers.current.delete(timerId)

    // Get memory usage if available (Chrome/Edge only)
    const perfWithMemory = performance as PerformanceWithMemory
    const memoryUsage = perfWithMemory.memory?.usedJSHeapSize

    const metric: PerformanceMetrics = {
      operationName,
      duration,
      timestamp: Date.now(),
      memoryUsage,
      success,
      error
    }

    setMetrics(prev => {
      const newMetrics = [...prev, metric]
      // Keep only last 100 metrics to prevent memory bloat
      return newMetrics.slice(-100)
    })

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`)
    }
  }, [])

  const getStats = useCallback((): PerformanceStats => {
    const totalOperations = metrics.length
    const successfulOperations = metrics.filter(m => m.success)
    const avgDuration = totalOperations > 0 
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0
    const totalErrors = totalOperations - successfulOperations.length
    const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0

    // Get recent memory usage trend
    const memoryTrend = metrics
      .filter(m => m.memoryUsage)
      .slice(-10)
      .map(m => m.memoryUsage!)

    return {
      totalOperations,
      avgDuration,
      totalErrors,
      errorRate,
      recentMetrics: metrics.slice(-20),
      memoryTrend
    }
  }, [metrics])

  const clearMetrics = useCallback(() => {
    setMetrics([])
    timers.current.clear()
  }, [])

  // Helper function to time async operations
  const timeOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const timerId = startTimer(operationName)
    try {
      const result = await operation()
      endTimer(timerId, operationName, true)
      return result
    } catch (error) {
      endTimer(timerId, operationName, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }, [startTimer, endTimer])

  return {
    startTimer,
    endTimer,
    timeOperation,
    getStats,
    clearMetrics,
    metrics
  }
}
