/**
 * Request Optimizer for RAG System
 * Handles request deduplication, batching, and intelligent queuing
 */

import type { SearchResult, EmbeddingResult } from '../types'

// Request types
interface PendingRequest<T> {
  id: string
  timestamp: number
  resolve: (value: T) => void
  reject: (error: Error) => void
  timeoutId?: NodeJS.Timeout
}

interface BatchRequest {
  texts: string[]
  type: 'embedding' | 'search'
  timestamp: number
  requests: Map<string, PendingRequest<EmbeddingResult | SearchResult[]>>
}

interface RequestStats {
  totalRequests: number
  deduplicatedRequests: number
  batchedRequests: number
  averageWaitTime: number
  timeoutCount: number
}

/**
 * Request Deduplication Manager
 * Prevents duplicate requests and returns cached promises
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>()
  private stats: RequestStats = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    batchedRequests: 0,
    averageWaitTime: 0,
    timeoutCount: 0
  }

  /**
   * Execute request with deduplication
   */
  async execute<T>(
    key: string,
    executor: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> {
    this.stats.totalRequests++

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      this.stats.deduplicatedRequests++
      return this.pendingRequests.get(key) as Promise<T>
    }

    // Create new request with timeout
    const startTime = Date.now()
    const requestPromise = Promise.race([
      executor(),
      this.createTimeoutPromise<T>(timeout)
    ])

    // Store pending request
    this.pendingRequests.set(key, requestPromise)

    try {
      const result = await requestPromise
      
      // Update stats
      const waitTime = Date.now() - startTime
      this.updateAverageWaitTime(waitTime)
      
      return result
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        this.stats.timeoutCount++
      }
      throw error
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Get deduplication statistics
   */
  getStats(): RequestStats {
    return { ...this.stats }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)
    })
  }

  /**
   * Update average wait time using moving average
   */
  private updateAverageWaitTime(newWaitTime: number): void {
    const alpha = 0.1 // Smoothing factor
    this.stats.averageWaitTime = 
      this.stats.averageWaitTime * (1 - alpha) + newWaitTime * alpha
  }
}

/**
 * Request Batch Manager
 * Batches similar requests together for efficient processing
 */
class RequestBatcher {
  private embeddingBatch: string[] = []
  private searchBatch: string[] = []
  private pendingEmbeddings = new Map<string, PendingRequest<EmbeddingResult>>()
  private pendingSearches = new Map<string, PendingRequest<SearchResult[]>>()
  
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly maxBatchSize: number = 10
  private readonly batchDelay: number = 100 // ms

  /**
   * Add embedding request to batch
   */
  async requestEmbedding(
    text: string,
    executor: (texts: string[]) => Promise<EmbeddingResult[]>
  ): Promise<EmbeddingResult> {
    return new Promise((resolve, reject) => {
      const request: PendingRequest<EmbeddingResult> = {
        id: this.generateRequestId(),
        timestamp: Date.now(),
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          reject(new Error('Embedding request timeout'))
        }, 30000)
      }

      this.pendingEmbeddings.set(text, request)
      this.embeddingBatch.push(text)

      this.scheduleBatchProcessing(executor, 'embedding')
    })
  }

  /**
   * Add search request to batch
   */
  async requestSearch(
    query: string,
    executor: (queries: string[]) => Promise<SearchResult[][]>
  ): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const request: PendingRequest<SearchResult[]> = {
        id: this.generateRequestId(),
        timestamp: Date.now(),
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          reject(new Error('Search request timeout'))
        }, 30000)
      }

      this.pendingSearches.set(query, request)
      this.searchBatch.push(query)

      this.scheduleBatchProcessing(executor, 'search')
    })
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(
    executor: ((texts: string[]) => Promise<EmbeddingResult[]>) | ((queries: string[]) => Promise<SearchResult[][]>),
    type: 'embedding' | 'search'
  ): void {
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    // Check if we should process immediately
    const shouldProcessNow = 
      (type === 'embedding' && this.embeddingBatch.length >= this.maxBatchSize) ||
      (type === 'search' && this.searchBatch.length >= this.maxBatchSize)

    if (shouldProcessNow) {
      this.processBatch(executor, type)
    } else {
      // Schedule delayed processing
      this.batchTimeout = setTimeout(() => {
        this.processBatch(executor, type)
      }, this.batchDelay)
    }
  }

  /**
   * Process current batch
   */
  private async processBatch(
    executor: ((texts: string[]) => Promise<EmbeddingResult[]>) | ((queries: string[]) => Promise<SearchResult[][]>),
    type: 'embedding' | 'search'
  ): Promise<void> {
    if (type === 'embedding' && this.embeddingBatch.length > 0) {
      await this.processEmbeddingBatch(executor)
    } else if (type === 'search' && this.searchBatch.length > 0) {
      await this.processSearchBatch(executor)
    }
  }

  /**
   * Process embedding batch
   */
  private async processEmbeddingBatch(
    executor: (texts: string[]) => Promise<EmbeddingResult[]>
  ): Promise<void> {
    const batch = [...this.embeddingBatch]
    const requests = new Map(this.pendingEmbeddings)
    
    // Clear current batch
    this.embeddingBatch = []
    this.pendingEmbeddings.clear()

    try {
      const results = await executor(batch)
      
      // Resolve individual requests
      batch.forEach((text, index) => {
        const request = requests.get(text)
        if (request) {
          if (request.timeoutId) {
            clearTimeout(request.timeoutId)
          }
          request.resolve(results[index])
        }
      })
    } catch (error) {
      // Reject all requests in batch
      requests.forEach(request => {
        if (request.timeoutId) {
          clearTimeout(request.timeoutId)
        }
        request.reject(error as Error)
      })
    }
  }

  /**
   * Process search batch
   */
  private async processSearchBatch(
    executor: (queries: string[]) => Promise<SearchResult[][]>
  ): Promise<void> {
    const batch = [...this.searchBatch]
    const requests = new Map(this.pendingSearches)
    
    // Clear current batch
    this.searchBatch = []
    this.pendingSearches.clear()

    try {
      const results = await executor(batch)
      
      // Resolve individual requests
      batch.forEach((query, index) => {
        const request = requests.get(query)
        if (request) {
          if (request.timeoutId) {
            clearTimeout(request.timeoutId)
          }
          request.resolve(results[index])
        }
      })
    } catch (error) {
      // Reject all requests in batch
      requests.forEach(request => {
        if (request.timeoutId) {
          clearTimeout(request.timeoutId)
        }
        request.reject(error as Error)
      })
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Priority Queue for Request Management
 */
class RequestPriorityQueue<T> {
  private queue: Array<{ item: T; priority: number; timestamp: number }> = []

  /**
   * Add item to queue with priority
   */
  enqueue(item: T, priority: number = 1): void {
    const entry = {
      item,
      priority,
      timestamp: Date.now()
    }

    // Insert in priority order (higher priority first)
    let inserted = false
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        this.queue.splice(i, 0, entry)
        inserted = true
        break
      }
    }

    if (!inserted) {
      this.queue.push(entry)
    }
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): T | null {
    const entry = this.queue.shift()
    return entry ? entry.item : null
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.queue = []
  }
}

/**
 * Main Request Optimizer
 * Coordinates deduplication, batching, and prioritization
 */
export class RequestOptimizer {
  private deduplicator = new RequestDeduplicator()
  private batcher = new RequestBatcher()
  private priorityQueue = new RequestPriorityQueue<() => Promise<unknown>>()
  
  private processing = false
  private maxConcurrentRequests = 5
  private activeRequests = 0

  constructor(maxConcurrentRequests: number = 5) {
    this.maxConcurrentRequests = maxConcurrentRequests
    this.startProcessing()
  }

  /**
   * Optimized embedding request
   */
  async requestEmbedding(
    text: string,
    executor: (texts: string[]) => Promise<EmbeddingResult[]>
  ): Promise<EmbeddingResult> {
    const key = `embedding:${this.hashText(text)}`
    
    return this.deduplicator.execute(
      key,
      () => this.batcher.requestEmbedding(text, executor),
      30000
    ) as Promise<EmbeddingResult>
  }

  /**
   * Optimized search request
   */
  async requestSearch(
    query: string,
    executor: (queries: string[]) => Promise<SearchResult[][]>
  ): Promise<SearchResult[]> {
    const key = `search:${this.hashText(query)}`
    
    return this.deduplicator.execute(
      key,
      () => this.batcher.requestSearch(query, executor),
      30000
    ) as Promise<SearchResult[]>
  }

  /**
   * Add high-priority request to queue
   */
  async requestHighPriority<T>(
    executor: () => Promise<T>,
    priority: number = 10
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.priorityQueue.enqueue(
        async () => {
          try {
            const result = await executor()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        priority
      )
    })
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): {
    deduplication: RequestStats
    queueSize: number
    activeRequests: number
    maxConcurrentRequests: number
  } {
    return {
      deduplication: this.deduplicator.getStats(),
      queueSize: this.priorityQueue.size(),
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.maxConcurrentRequests
    }
  }

  /**
   * Update configuration
   */
  updateConfig(maxConcurrentRequests: number): void {
    this.maxConcurrentRequests = maxConcurrentRequests
  }

  /**
   * Clear all pending requests and reset state
   */
  reset(): void {
    this.deduplicator.clear()
    this.priorityQueue.clear()
    this.activeRequests = 0
  }

  /**
   * Start processing priority queue
   */
  private startProcessing(): void {
    if (this.processing) return
    
    this.processing = true
    this.processQueue()
  }

  /**
   * Process priority queue
   */
  private async processQueue(): Promise<void> {
    while (this.processing) {
      if (
        this.activeRequests < this.maxConcurrentRequests &&
        !this.priorityQueue.isEmpty()
      ) {
        const executor = this.priorityQueue.dequeue()
        if (executor) {
          this.activeRequests++
          executor()
            .finally(() => {
              this.activeRequests--
            })
            .catch(error => {
              console.warn('[RequestOptimizer] Request failed:', error)
            })
        }
      }

      // Small delay to prevent busy waiting
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Hash text for consistent keys
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// Export singleton instance
export const requestOptimizer = new RequestOptimizer()

// Export types
export type { PendingRequest, BatchRequest, RequestStats }
