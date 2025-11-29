/**
 * Background Processor for RAG System
 * Handles background indexing, precomputation, and maintenance tasks
 */

import type { Document, EmbeddingResult, SearchResult } from '../types'
import { ragCacheManager } from './cache-manager'
import { memoryManager } from './memory-manager'

// Background task types
interface BackgroundTask {
  id: string
  type: 'indexing' | 'embedding' | 'optimization' | 'cleanup' | 'precomputation'
  priority: number
  estimatedDuration: number // milliseconds
  payload: unknown
  createdAt: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  retryCount: number
  maxRetries: number
}

interface TaskProgress {
  taskId: string
  progress: number
  message: string
  estimatedTimeRemaining: number
}

interface BackgroundWorkerStats {
  tasksProcessed: number
  tasksInQueue: number
  averageProcessingTime: number
  failureRate: number
  lastProcessedAt: number
}

/**
 * Task Queue Manager
 */
class TaskQueue {
  private queue: BackgroundTask[] = []
  private maxQueueSize = 1000

  /**
   * Add task to queue
   */
  enqueue(task: Omit<BackgroundTask, 'id' | 'createdAt' | 'status' | 'progress' | 'retryCount'>): string {
    if (this.queue.length >= this.maxQueueSize) {
      // Remove oldest low-priority task
      this.removeLowPriorityTask()
    }

    const taskId = this.generateTaskId()
    const fullTask: BackgroundTask = {
      ...task,
      id: taskId,
      createdAt: Date.now(),
      status: 'pending',
      progress: 0,
      retryCount: 0
    }

    // Insert in priority order
    this.insertByPriority(fullTask)
    return taskId
  }

  /**
   * Get next task to process
   */
  dequeue(): BackgroundTask | null {
    return this.queue.shift() || null
  }

  /**
   * Update task status
   */
  updateTask(taskId: string, updates: Partial<BackgroundTask>): boolean {
    const taskIndex = this.queue.findIndex(task => task.id === taskId)
    if (taskIndex >= 0) {
      this.queue[taskIndex] = { ...this.queue[taskIndex], ...updates }
      return true
    }
    return false
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): BackgroundTask | null {
    return this.queue.find(task => task.id === taskId) || null
  }

  /**
   * Get queue statistics
   */
  getStats(): { size: number; pendingTasks: number; runningTasks: number } {
    const pendingTasks = this.queue.filter(task => task.status === 'pending').length
    const runningTasks = this.queue.filter(task => task.status === 'running').length
    
    return {
      size: this.queue.length,
      pendingTasks,
      runningTasks
    }
  }

  /**
   * Clear completed and failed tasks
   */
  cleanup(): number {
    const originalLength = this.queue.length
    this.queue = this.queue.filter(task => 
      task.status !== 'completed' && task.status !== 'failed'
    )
    return originalLength - this.queue.length
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Insert task maintaining priority order
   */
  private insertByPriority(task: BackgroundTask): void {
    let inserted = false
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < task.priority) {
        this.queue.splice(i, 0, task)
        inserted = true
        break
      }
    }
    
    if (!inserted) {
      this.queue.push(task)
    }
  }

  /**
   * Remove lowest priority task to make room
   */
  private removeLowPriorityTask(): void {
    if (this.queue.length === 0) return
    
    let lowestPriorityIndex = 0
    let lowestPriority = this.queue[0].priority
    
    for (let i = 1; i < this.queue.length; i++) {
      if (this.queue[i].priority < lowestPriority && this.queue[i].status === 'pending') {
        lowestPriority = this.queue[i].priority
        lowestPriorityIndex = i
      }
    }
    
    this.queue.splice(lowestPriorityIndex, 1)
  }
}

/**
 * Document Indexing Worker
 */
class DocumentIndexer {
  private isIndexing = false

  /**
   * Index document in background
   */
  async indexDocument(
    document: Document,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<void> {
    this.isIndexing = true
    
    try {
      // Step 1: Generate embeddings
      onProgress?.({
        taskId: document.id,
        progress: 0.1,
        message: 'Generating embeddings...',
        estimatedTimeRemaining: 30000
      })

      await this.generateDocumentEmbeddings(document, onProgress)

      // Step 2: Extract metadata
      onProgress?.({
        taskId: document.id,
        progress: 0.6,
        message: 'Extracting metadata...',
        estimatedTimeRemaining: 10000
      })

      await this.extractDocumentMetadata(document, onProgress)

      // Step 3: Update search index
      onProgress?.({
        taskId: document.id,
        progress: 0.9,
        message: 'Updating search index...',
        estimatedTimeRemaining: 2000
      })

      await this.updateSearchIndex(document)

      onProgress?.({
        taskId: document.id,
        progress: 1.0,
        message: 'Indexing completed',
        estimatedTimeRemaining: 0
      })

    } finally {
      this.isIndexing = false
    }
  }

  /**
   * Generate embeddings for document chunks
   */
  private async generateDocumentEmbeddings(
    document: Document,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<void> {
    const chunkProcessor = async (chunk: string): Promise<EmbeddingResult> => {
      // Check cache first
      const cached = ragCacheManager.getEmbedding(chunk)
      if (cached) {
        return cached
      }

      // Generate new embedding (mock implementation)
      const embedding: EmbeddingResult = {
        vector: new Array(384).fill(0).map(() => Math.random()),
        text: chunk,
        model: 'background-indexer',
        timestamp: Date.now()
      }

      // Cache the result
      ragCacheManager.setEmbedding(chunk, embedding)

      return embedding
    }

    const progressWrapper = (progress: number): void => {
      onProgress?.({
        taskId: document.id,
        progress: 0.1 + (progress * 0.5), // Map to 10%-60% of total progress
        message: `Processing chunk ${Math.floor(progress * 100)}%...`,
        estimatedTimeRemaining: (1 - progress) * 20000
      })
    }

    await memoryManager.processLargeDocument(
      document,
      chunkProcessor,
      progressWrapper
    )
  }

  /**
   * Extract metadata from document
   */
  private async extractDocumentMetadata(
    document: Document,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<void> {
    const steps = [
      { name: 'Extracting keywords', duration: 2000 },
      { name: 'Analyzing sentiment', duration: 1500 },
      { name: 'Identifying entities', duration: 2500 },
      { name: 'Generating summary', duration: 4000 }
    ]

    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0)
    let elapsed = 0

    for (const step of steps) {
      onProgress?.({
        taskId: document.id,
        progress: 0.6 + (elapsed / totalDuration) * 0.3,
        message: step.name,
        estimatedTimeRemaining: totalDuration - elapsed
      })

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.min(step.duration, 100)))
      elapsed += step.duration
    }
  }

  /**
   * Update search index
   */
  private async updateSearchIndex(document: Document): Promise<void> {
    // Mock implementation - would update actual search index
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log(`[DocumentIndexer] Updated search index for document ${document.id}`)
  }
}

/**
 * Precomputation Engine
 */
class PrecomputationEngine {
  /**
   * Precompute frequently accessed data
   */
  async precomputeFrequentQueries(
    queries: string[],
    onProgress?: (progress: TaskProgress) => void
  ): Promise<void> {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      const progress = (i + 1) / queries.length

      onProgress?.({
        taskId: `precompute-${Date.now()}`,
        progress,
        message: `Precomputing query: ${query.substring(0, 50)}...`,
        estimatedTimeRemaining: (queries.length - i - 1) * 1000
      })

      // Check if already cached
      if (!ragCacheManager.getSearchResults(query)) {
        // Generate and cache results
        const mockResults: SearchResult[] = [
          {
            id: `result-${i}`,
            content: `Precomputed result for: ${query}`,
            score: 0.9,
            metadata: { precomputed: true }
          }
        ]

        ragCacheManager.setSearchResults(query, mockResults)
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  /**
   * Optimize embeddings storage
   */
  async optimizeEmbeddings(onProgress?: (progress: TaskProgress) => void): Promise<void> {
    onProgress?.({
      taskId: 'optimize-embeddings',
      progress: 0.1,
      message: 'Analyzing embedding storage...',
      estimatedTimeRemaining: 5000
    })

    // Mock optimization process
    await new Promise(resolve => setTimeout(resolve, 1000))

    onProgress?.({
      taskId: 'optimize-embeddings',
      progress: 0.5,
      message: 'Compressing embedding vectors...',
      estimatedTimeRemaining: 3000
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    onProgress?.({
      taskId: 'optimize-embeddings',
      progress: 1.0,
      message: 'Optimization completed',
      estimatedTimeRemaining: 0
    })
  }
}

/**
 * Main Background Processor
 */
export class BackgroundProcessor {
  private taskQueue = new TaskQueue()
  private documentIndexer = new DocumentIndexer()
  private precomputationEngine = new PrecomputationEngine()
  
  private isProcessing = false
  private maxConcurrentTasks = 2
  private activeTasks = 0
  
  private stats: BackgroundWorkerStats = {
    tasksProcessed: 0,
    tasksInQueue: 0,
    averageProcessingTime: 0,
    failureRate: 0,
    lastProcessedAt: 0
  }

  private progressCallbacks = new Map<string, (progress: TaskProgress) => void>()

  constructor() {
    this.startProcessing()
    this.setupPeriodicCleanup()
  }

  /**
   * Queue document for background indexing
   */
  indexDocument(
    document: Document,
    priority: number = 5,
    onProgress?: (progress: TaskProgress) => void
  ): string {
    const taskId = this.taskQueue.enqueue({
      type: 'indexing',
      priority,
      estimatedDuration: 60000, // 1 minute
      payload: document,
      maxRetries: 3
    })

    if (onProgress) {
      this.progressCallbacks.set(taskId, onProgress)
    }

    return taskId
  }

  /**
   * Queue precomputation task
   */
  precomputeQueries(
    queries: string[],
    priority: number = 3,
    onProgress?: (progress: TaskProgress) => void
  ): string {
    const taskId = this.taskQueue.enqueue({
      type: 'precomputation',
      priority,
      estimatedDuration: queries.length * 1000,
      payload: { queries },
      maxRetries: 2
    })

    if (onProgress) {
      this.progressCallbacks.set(taskId, onProgress)
    }

    return taskId
  }

  /**
   * Queue optimization task
   */
  optimizeSystem(
    type: 'embeddings' | 'cache' | 'memory',
    priority: number = 2,
    onProgress?: (progress: TaskProgress) => void
  ): string {
    const taskId = this.taskQueue.enqueue({
      type: 'optimization',
      priority,
      estimatedDuration: 30000,
      payload: { optimizationType: type },
      maxRetries: 1
    })

    if (onProgress) {
      this.progressCallbacks.set(taskId, onProgress)
    }

    return taskId
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): BackgroundTask | null {
    return this.taskQueue.getTask(taskId)
  }

  /**
   * Get processor statistics
   */
  getStats(): BackgroundWorkerStats & { queue: { size: number; pendingTasks: number; runningTasks: number } } {
    return {
      ...this.stats,
      queue: this.taskQueue.getStats()
    }
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.isProcessing = false
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (!this.isProcessing) {
      this.isProcessing = true
      this.startProcessing()
    }
  }

  /**
   * Clear completed tasks
   */
  cleanup(): number {
    return this.taskQueue.cleanup()
  }

  /**
   * Start task processing loop
   */
  private startProcessing(): void {
    if (!this.isProcessing) {
      this.isProcessing = true
    }

    const processNext = async (): Promise<void> => {
      while (this.isProcessing) {
        if (this.activeTasks < this.maxConcurrentTasks) {
          const task = this.taskQueue.dequeue()
          
          if (task) {
            this.activeTasks++
            this.processTask(task)
              .finally(() => {
                this.activeTasks--
              })
          } else {
            // No tasks available, wait a bit
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } else {
          // Max concurrent tasks reached, wait
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    processNext().catch(error => {
      console.error('[BackgroundProcessor] Processing error:', error)
    })
  }

  /**
   * Process individual task
   */
  private async processTask(task: BackgroundTask): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.taskQueue.updateTask(task.id, { status: 'running' })
      
      const onProgress = (progress: TaskProgress): void => {
        this.taskQueue.updateTask(task.id, { progress: progress.progress })
        const callback = this.progressCallbacks.get(task.id)
        callback?.(progress)
      }

      switch (task.type) {
        case 'indexing':
          await this.documentIndexer.indexDocument(task.payload as Document, onProgress)
          break
        case 'precomputation':
          const { queries } = task.payload as { queries: string[] }
          await this.precomputationEngine.precomputeFrequentQueries(queries, onProgress)
          break
        case 'optimization':
          const { optimizationType } = task.payload as { optimizationType: string }
          if (optimizationType === 'embeddings') {
            await this.precomputationEngine.optimizeEmbeddings(onProgress)
          }
          break
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      this.taskQueue.updateTask(task.id, { status: 'completed', progress: 1.0 })
      this.stats.tasksProcessed++
      
    } catch (error) {
      console.error(`[BackgroundProcessor] Task ${task.id} failed:`, error)
      
      if (task.retryCount < task.maxRetries) {
        // Retry task
        this.taskQueue.updateTask(task.id, {
          status: 'pending',
          retryCount: task.retryCount + 1,
          progress: 0
        })
      } else {
        // Mark as failed
        this.taskQueue.updateTask(task.id, { status: 'failed' })
      }
    } finally {
      // Update statistics
      const processingTime = Date.now() - startTime
      this.updateAverageProcessingTime(processingTime)
      this.stats.lastProcessedAt = Date.now()
      
      // Clean up progress callback
      this.progressCallbacks.delete(task.id)
    }
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(newTime: number): void {
    const alpha = 0.1
    this.stats.averageProcessingTime = 
      this.stats.averageProcessingTime * (1 - alpha) + newTime * alpha
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      const cleaned = this.cleanup()
      if (cleaned > 0) {
        console.log(`[BackgroundProcessor] Cleaned up ${cleaned} completed tasks`)
      }
    }, 300000) // Every 5 minutes
  }
}

// Export singleton instance
export const backgroundProcessor = new BackgroundProcessor()

// Export types
export type { 
  BackgroundTask, 
  TaskProgress, 
  BackgroundWorkerStats 
}
