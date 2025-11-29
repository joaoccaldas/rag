/**
 * Worker Pool Manager
 * Manages a pool of web workers for different processing tasks
 */

import { 
  WorkerPoolConfig, 
  WorkerTask, 
  WorkerStats, 
  WorkerRequest, 
  WorkerResponse 
} from '../types'

export class WorkerPool {
  private workers: Map<string, Worker> = new Map()
  private workerTypes: Map<string, string> = new Map() // workerId -> workerType
  private taskQueue: WorkerTask[] = []
  private activeTasks: Map<string, WorkerTask> = new Map()
  private completedTasks: Set<string> = new Set()
  private failedTasks: Set<string> = new Set()
  private config: WorkerPoolConfig
  private stats: WorkerStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    activeWorkers: 0,
    queuedTasks: 0
  }

  constructor(config: Partial<WorkerPoolConfig> = {}) {
    this.config = {
      maxWorkers: 4,
      workerTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    }

    // Initialize workers for different types
    this.initializeWorkers()

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup())
    }
  }

  private initializeWorkers(): void {
    const workerTypes = [
      'document-processing',
      'vector-processing', 
      'ai-analysis',
      'visual-content',
      'storage'
    ]

    workerTypes.forEach(type => {
      this.createWorker(type)
    })
  }

  private createWorker(type: string): string {
    const workerId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Create worker with dynamic import to handle different worker types
      const worker = new Worker(
        new URL(`../handlers/${type}.worker.ts`, import.meta.url),
        { type: 'module' }
      )

      worker.onmessage = (event) => this.handleWorkerMessage(workerId, event.data)
      worker.onerror = (error) => this.handleWorkerError(workerId, error)
      worker.onmessageerror = (error) => this.handleWorkerMessageError(workerId, error)

      this.workers.set(workerId, worker)
      this.workerTypes.set(workerId, type)
      this.stats.activeWorkers++

      if (this.config.enableLogging) {
        console.log(`🚀 Created ${type} worker:`, workerId)
      }

      return workerId
    } catch (error) {
      console.error(`Failed to create ${type} worker:`, error)
      throw error
    }
  }

  private handleWorkerMessage(workerId: string, message: WorkerResponse): void {
    const task = this.activeTasks.get(message.id)
    if (!task) {
      console.warn('Received message for unknown task:', message.id)
      return
    }

    if (this.config.enableLogging) {
      console.log(`📨 Worker ${workerId} message:`, message.type)
    }

    switch (message.type) {
      case 'PROCESS_DOCUMENT_PROGRESS':
      case 'COMPUTE_EMBEDDINGS_PROGRESS':
        task.onProgress?.(message)
        break

      case 'PROCESS_DOCUMENT_SUCCESS':
      case 'COMPUTE_EMBEDDINGS_SUCCESS':
      case 'SEARCH_VECTORS_SUCCESS':
      case 'ANALYZE_DOCUMENT_SUCCESS':
      case 'EXTRACT_VISUAL_CONTENT_SUCCESS':
      case 'GENERATE_PREVIEW_SUCCESS':
      case 'BULK_STORE_SUCCESS':
        this.handleTaskSuccess(task, message)
        break

      case 'PROCESS_DOCUMENT_ERROR':
      case 'COMPUTE_EMBEDDINGS_ERROR':
      case 'SEARCH_VECTORS_ERROR':
      case 'ANALYZE_DOCUMENT_ERROR':
      case 'EXTRACT_VISUAL_CONTENT_ERROR':
      case 'BULK_STORE_ERROR':
        this.handleTaskError(task, message)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`❌ Worker ${workerId} error:`, error)
    
    // Find and retry tasks for this worker
    const workerType = this.workerTypes.get(workerId)
    if (workerType) {
      // Terminate and recreate worker
      this.terminateWorker(workerId)
      this.createWorker(workerType)
    }
  }

  private handleWorkerMessageError(workerId: string, error: MessageEvent): void {
    console.error(`❌ Worker ${workerId} message error:`, error)
    
    // Find and retry tasks for this worker
    const workerType = this.workerTypes.get(workerId)
    if (workerType) {
      // Terminate and recreate worker
      this.terminateWorker(workerId)
      this.createWorker(workerType)
    }
  }

  private handleTaskSuccess(task: WorkerTask, message: WorkerResponse): void {
    const startTime = task.createdAt
    const processingTime = Date.now() - startTime

    // Update stats
    this.stats.completedTasks++
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.completedTasks - 1) + processingTime) / 
      this.stats.completedTasks

    // Clean up task
    this.activeTasks.delete(task.id)
    this.completedTasks.add(task.id)

    // Call success callback
    task.onSuccess?.(message)

    // Process next task in queue
    this.processNextTask()

    if (this.config.enableLogging) {
      console.log(`✅ Task ${task.id} completed in ${processingTime}ms`)
    }
  }

  private handleTaskError(task: WorkerTask, message: WorkerResponse): void {
    task.retryCount++

    if (task.retryCount < this.config.retryAttempts) {
      // Retry task
      if (this.config.enableLogging) {
        console.log(`🔄 Retrying task ${task.id} (attempt ${task.retryCount + 1})`)
      }
      this.taskQueue.unshift(task) // Add to front of queue for immediate retry
      this.activeTasks.delete(task.id)
      this.processNextTask()
    } else {
      // Task failed permanently
      this.stats.failedTasks++
      this.activeTasks.delete(task.id)
      this.failedTasks.add(task.id)
      
      task.onError?.({
        message: this.getErrorMessage(message),
        stack: this.getErrorStage(message)
      })

      if (this.config.enableLogging) {
        console.error(`❌ Task ${task.id} failed permanently after ${task.retryCount} attempts`)
      }

      this.processNextTask()
    }
  }

  private getErrorMessage(message: WorkerResponse): string {
    if ('payload' in message && typeof message.payload === 'object' && message.payload !== null) {
      const payload = message.payload as Record<string, unknown>
      return (payload.error as string) || 'Unknown error'
    }
    return 'Unknown error'
  }

  private getErrorStage(message: WorkerResponse): string | undefined {
    if ('payload' in message && typeof message.payload === 'object' && message.payload !== null) {
      const payload = message.payload as Record<string, unknown>
      return payload.stage as string | undefined
    }
    return undefined
  }

  private terminateWorker(workerId: string): void {
    const worker = this.workers.get(workerId)
    if (worker) {
      worker.terminate()
      this.workers.delete(workerId)
      this.workerTypes.delete(workerId)
      this.stats.activeWorkers--
    }
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const task = this.taskQueue.shift()
    if (!task) return

    // Find available worker for this task type
    const requiredWorkerType = this.getRequiredWorkerType(task.type)
    const availableWorker = this.findAvailableWorker(requiredWorkerType)

    if (availableWorker) {
      this.activeTasks.set(task.id, task)
      this.stats.queuedTasks = this.taskQueue.length

      // Send task to worker
      const worker = this.workers.get(availableWorker)
      if (worker) {
        const message: WorkerRequest = {
          id: task.id,
          type: task.type,
          timestamp: Date.now(),
          payload: task.payload
        } as WorkerRequest

        worker.postMessage(message)

        // Set timeout for task
        setTimeout(() => {
          if (this.activeTasks.has(task.id)) {
            this.handleTaskError(task, {
              id: task.id,
              type: 'PROCESS_DOCUMENT_ERROR',
              timestamp: Date.now(),
              payload: { error: 'Task timeout', stage: 'timeout' }
            } as WorkerResponse)
          }
        }, this.config.workerTimeout)

        if (this.config.enableLogging) {
          console.log(`📤 Sent task ${task.id} to worker ${availableWorker}`)
        }
      }
    } else {
      // No available worker, put task back in queue
      this.taskQueue.unshift(task)
    }
  }

  private getRequiredWorkerType(taskType: string): string {
    const typeMapping: Record<string, string> = {
      'PROCESS_DOCUMENT': 'document-processing',
      'COMPUTE_EMBEDDINGS': 'vector-processing',
      'SEARCH_VECTORS': 'vector-processing',
      'ANALYZE_DOCUMENT': 'ai-analysis',
      'EXTRACT_KEYWORDS': 'ai-analysis',
      'EXTRACT_VISUAL_CONTENT': 'visual-content',
      'GENERATE_PREVIEW': 'visual-content',
      'BULK_STORE': 'storage',
      'BULK_RETRIEVE': 'storage',
      'OPTIMIZE_STORAGE': 'storage'
    }

    return typeMapping[taskType] || 'document-processing'
  }

  private findAvailableWorker(workerType: string): string | null {
    for (const [workerId, type] of this.workerTypes.entries()) {
      if (type === workerType) {
        // Check if this worker is currently busy
        const isBusy = Array.from(this.activeTasks.values()).some(task => 
          this.getRequiredWorkerType(task.type) === workerType
        )
        
        if (!isBusy) {
          return workerId
        }
      }
    }
    return null
  }

  // Public API Methods

  public addTask(task: Omit<WorkerTask, 'id' | 'createdAt' | 'retryCount'>): string {
    const fullTask: WorkerTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0
    }

    this.taskQueue.push(fullTask)
    this.stats.totalTasks++
    this.stats.queuedTasks = this.taskQueue.length

    // Try to process immediately
    setTimeout(() => this.processNextTask(), 0)

    return fullTask.id
  }

  public cancelTask(taskId: string): boolean {
    // Remove from queue
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId)
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1)
      this.stats.queuedTasks = this.taskQueue.length
      return true
    }

    // Cancel active task (note: worker will continue but result will be ignored)
    const activeTask = this.activeTasks.get(taskId)
    if (activeTask) {
      this.activeTasks.delete(taskId)
      return true
    }

    return false
  }

  public getStats(): WorkerStats {
    return { ...this.stats }
  }

  public getQueueLength(): number {
    return this.taskQueue.length
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size
  }

  public cleanup(): void {
    // Cancel all tasks
    this.taskQueue.length = 0
    this.activeTasks.clear()

    // Terminate all workers
    for (const [workerId] of this.workers) {
      this.terminateWorker(workerId)
    }

    if (this.config.enableLogging) {
      console.log('🧹 Worker pool cleaned up')
    }
  }

  public restartWorkers(): void {
    const workerTypes = Array.from(new Set(this.workerTypes.values()))
    this.cleanup()
    workerTypes.forEach(type => this.createWorker(type))
  }
}

// Singleton instance
let workerPoolInstance: WorkerPool | null = null

export function getWorkerPool(config?: Partial<WorkerPoolConfig>): WorkerPool {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool(config)
  }
  return workerPoolInstance
}

export function destroyWorkerPool(): void {
  if (workerPoolInstance) {
    workerPoolInstance.cleanup()
    workerPoolInstance = null
  }
}
