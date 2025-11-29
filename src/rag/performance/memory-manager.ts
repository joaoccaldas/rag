/**
 * Memory Manager for RAG System
 * Handles memory optimization, monitoring, and cleanup for large document processing
 */

import type { Document } from '../types'

// Memory monitoring types
interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  memoryUsagePercentage: number
  lastUpdated: number
}

interface MemoryThresholds {
  warning: number // Percentage
  critical: number // Percentage
  cleanup: number // Percentage
}

interface MemoryCleanupTarget {
  type: 'documents' | 'embeddings' | 'cache' | 'temporary'
  priority: number
  estimatedSavings: number // bytes
  cleanup: () => Promise<number> // returns bytes freed
}

/**
 * Memory Usage Tracker
 */
class MemoryTracker {
  private stats: MemoryStats | null = null
  private thresholds: MemoryThresholds = {
    warning: 70,
    critical: 85,
    cleanup: 90
  }
  private callbacks: Map<string, (stats: MemoryStats) => void> = new Map()

  constructor() {
    this.startMonitoring()
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats | null {
    return this.stats ? { ...this.stats } : null
  }

  /**
   * Update memory thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Register callback for memory threshold events
   */
  onThresholdReached(
    id: string,
    callback: (stats: MemoryStats) => void
  ): void {
    this.callbacks.set(id, callback)
  }

  /**
   * Unregister callback
   */
  removeCallback(id: string): void {
    this.callbacks.delete(id)
  }

  /**
   * Check if memory usage exceeds threshold
   */
  isAboveThreshold(threshold: keyof MemoryThresholds): boolean {
    if (!this.stats) return false
    return this.stats.memoryUsagePercentage > this.thresholds[threshold]
  }

  /**
   * Start monitoring memory usage
   */
  private startMonitoring(): void {
    const updateStats = () => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as unknown as { memory: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }}).memory

        this.stats = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          lastUpdated: Date.now()
        }

        this.checkThresholds()
      }
    }

    // Update every 5 seconds
    setInterval(updateStats, 5000)
    updateStats() // Initial update
  }

  /**
   * Check thresholds and trigger callbacks
   */
  private checkThresholds(): void {
    if (!this.stats) return

    const { memoryUsagePercentage } = this.stats

    let thresholdReached: keyof MemoryThresholds | null = null

    if (memoryUsagePercentage > this.thresholds.cleanup) {
      thresholdReached = 'cleanup'
    } else if (memoryUsagePercentage > this.thresholds.critical) {
      thresholdReached = 'critical'
    } else if (memoryUsagePercentage > this.thresholds.warning) {
      thresholdReached = 'warning'
    }

    if (thresholdReached) {
      this.callbacks.forEach(callback => {
        try {
          callback(this.stats!)
        } catch (error) {
          console.warn('[MemoryTracker] Callback error:', error)
        }
      })
    }
  }
}

/**
 * Object Pool for Reusable Objects
 */
class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  /**
   * Get object from pool or create new one
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  /**
   * Return object to pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool = []
  }

  /**
   * Get pool statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.pool.length,
      maxSize: this.maxSize
    }
  }
}

/**
 * Document Chunk Manager
 * Manages large document processing in memory-efficient chunks
 */
class DocumentChunkManager {
  private chunks = new Map<string, string[]>()
  private chunkSize: number = 1000 // characters
  private maxChunksInMemory: number = 50

  constructor(chunkSize: number = 1000, maxChunksInMemory: number = 50) {
    this.chunkSize = chunkSize
    this.maxChunksInMemory = maxChunksInMemory
  }

  /**
   * Process document in chunks
   */
  async processDocument<T>(
    document: Document,
    processor: (chunk: string, index: number) => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T[]> {
    const chunks = this.createChunks(document.content)
    const results: T[] = []

    for (let i = 0; i < chunks.length; i++) {
      // Process chunk
      const result = await processor(chunks[i], i)
      results.push(result)

      // Report progress
      if (onProgress) {
        onProgress((i + 1) / chunks.length)
      }

      // Memory management: release processed chunks
      if (i > this.maxChunksInMemory) {
        chunks[i - this.maxChunksInMemory] = '' // Clear old chunk
      }

      // Yield control to prevent blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    // Clean up
    this.chunks.delete(document.id)

    return results
  }

  /**
   * Create text chunks from document
   */
  private createChunks(content: string): string[] {
    const chunks: string[] = []
    
    // Split by sentences to preserve context
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      
      if (currentChunk.length + trimmedSentence.length > this.chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = trimmedSentence
      } else {
        currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }
}

/**
 * Memory Cleanup Manager
 */
class MemoryCleanupManager {
  private cleanupTargets: MemoryCleanupTarget[] = []
  private isCleaningUp = false

  /**
   * Register cleanup target
   */
  registerCleanupTarget(target: MemoryCleanupTarget): void {
    this.cleanupTargets.push(target)
    // Sort by priority (higher priority first)
    this.cleanupTargets.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Perform memory cleanup
   */
  async performCleanup(targetBytes?: number): Promise<number> {
    if (this.isCleaningUp) {
      console.warn('[MemoryCleanup] Cleanup already in progress')
      return 0
    }

    this.isCleaningUp = true
    let totalFreed = 0

    try {
      console.log('[MemoryCleanup] Starting memory cleanup...')

      for (const target of this.cleanupTargets) {
        if (targetBytes && totalFreed >= targetBytes) {
          break
        }

        try {
          const freed = await target.cleanup()
          totalFreed += freed
          console.log(`[MemoryCleanup] Freed ${freed} bytes from ${target.type}`)
        } catch (error) {
          console.warn(`[MemoryCleanup] Failed to cleanup ${target.type}:`, error)
        }
      }

      // Force garbage collection if available
      if (typeof globalThis.gc === 'function') {
        globalThis.gc()
      }

      console.log(`[MemoryCleanup] Total freed: ${totalFreed} bytes`)
    } finally {
      this.isCleaningUp = false
    }

    return totalFreed
  }

  /**
   * Get estimated cleanup potential
   */
  getCleanupPotential(): number {
    return this.cleanupTargets.reduce((total, target) => total + target.estimatedSavings, 0)
  }
}

/**
 * Main Memory Manager
 * Coordinates all memory management functionality
 */
export class MemoryManager {
  private tracker = new MemoryTracker()
  private cleanupManager = new MemoryCleanupManager()
  private chunkManager = new DocumentChunkManager()
  private objectPools = new Map<string, ObjectPool<unknown>>()

  constructor() {
    this.setupAutomaticCleanup()
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    return this.tracker.getStats()
  }

  /**
   * Set memory thresholds
   */
  setMemoryThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.tracker.setThresholds(thresholds)
  }

  /**
   * Process large document efficiently
   */
  async processLargeDocument<T>(
    document: Document,
    processor: (chunk: string, index: number) => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T[]> {
    return this.chunkManager.processDocument(document, processor, onProgress)
  }

  /**
   * Create object pool
   */
  createObjectPool<T>(
    name: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFn, resetFn, maxSize)
    this.objectPools.set(name, pool as ObjectPool<unknown>)
    return pool
  }

  /**
   * Get object pool
   */
  getObjectPool<T>(name: string): ObjectPool<T> | null {
    return (this.objectPools.get(name) as ObjectPool<T>) || null
  }

  /**
   * Register cleanup target
   */
  registerCleanupTarget(target: MemoryCleanupTarget): void {
    this.cleanupManager.registerCleanupTarget(target)
  }

  /**
   * Force memory cleanup
   */
  async forceCleanup(targetBytes?: number): Promise<number> {
    return this.cleanupManager.performCleanup(targetBytes)
  }

  /**
   * Get cleanup potential
   */
  getCleanupPotential(): number {
    return this.cleanupManager.getCleanupPotential()
  }

  /**
   * Check memory health
   */
  isMemoryHealthy(): boolean {
    return !this.tracker.isAboveThreshold('warning')
  }

  /**
   * Setup automatic cleanup
   */
  private setupAutomaticCleanup(): void {
    this.tracker.onThresholdReached('auto-cleanup', async (stats) => {
      if (stats.memoryUsagePercentage > 90) {
        console.warn('[MemoryManager] Critical memory usage, performing cleanup')
        await this.forceCleanup()
      }
    })
  }

  /**
   * Get comprehensive memory report
   */
  getMemoryReport(): {
    stats: MemoryStats | null
    cleanupPotential: number
    objectPools: Record<string, { size: number; maxSize: number }>
    isHealthy: boolean
  } {
    const poolStats: Record<string, { size: number; maxSize: number }> = {}
    
    this.objectPools.forEach((pool, name) => {
      poolStats[name] = pool.getStats()
    })

    return {
      stats: this.getMemoryStats(),
      cleanupPotential: this.getCleanupPotential(),
      objectPools: poolStats,
      isHealthy: this.isMemoryHealthy()
    }
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager()

// Export types
export type { 
  MemoryStats, 
  MemoryThresholds, 
  MemoryCleanupTarget 
}
