/**
 * Batch Processing System
 * 
 * Handles bulk operations on documents including upload, processing,
 * deletion, and metadata updates with progress tracking and error handling.
 * 
 * Why: Users need to efficiently process multiple documents at once,
 * especially for large document collections or initial system setup.
 */

export interface BatchJob {
  id: string
  type: BatchJobType
  status: BatchJobStatus
  progress: number
  totalItems: number
  processedItems: number
  failedItems: number
  startTime: Date
  endTime?: Date
  estimatedTimeRemaining?: number
  results: BatchJobResult[]
  errors: BatchJobError[]
  metadata?: Record<string, unknown>
}

export type BatchJobType = 
  | 'upload' | 'delete' | 'update_metadata' 
  | 'reprocess' | 'export' | 'compress'
  | 'index' | 'backup' | 'analyze'

export type BatchJobStatus = 
  | 'pending' | 'running' | 'paused' 
  | 'completed' | 'failed' | 'cancelled'

export interface BatchJobResult {
  itemId: string
  status: 'success' | 'failed' | 'skipped'
  message?: string
  processingTime?: number
  outputData?: unknown
}

export interface BatchJobError {
  itemId: string
  error: string
  code?: string
  timestamp: Date
  retryable: boolean
}

export interface BatchProcessingConfig {
  maxConcurrentJobs: number
  maxConcurrentItems: number
  retryAttempts: number
  retryDelay: number
  pauseOnError: boolean
  progressUpdateInterval: number
  autoCleanupCompleted: boolean
  cleanupAfterHours: number
}

export interface BatchOperationOptions {
  priority: 'low' | 'normal' | 'high'
  retryFailed: boolean
  maxRetries: number
  onProgress?: (progress: BatchJobProgress) => void
  onComplete?: (results: BatchJobResult[]) => void
  onError?: (error: BatchJobError) => void
}

export interface BatchJobProgress {
  jobId: string
  progress: number
  currentItem: string
  estimatedTimeRemaining: number
  itemsPerSecond: number
}

export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map()
  private activeJobs: Set<string> = new Set()
  private config: BatchProcessingConfig
  private jobQueue: string[] = []

  constructor(config: Partial<BatchProcessingConfig> = {}) {
    this.config = {
      maxConcurrentJobs: 3,
      maxConcurrentItems: 5,
      retryAttempts: 3,
      retryDelay: 1000,
      pauseOnError: false,
      progressUpdateInterval: 1000,
      autoCleanupCompleted: true,
      cleanupAfterHours: 24,
      ...config
    }

    // Start background cleanup
    setInterval(() => this.cleanupCompletedJobs(), 60000) // Every minute
  }

  // Create a new batch job
  async createJob(
    type: BatchJobType,
    items: string[],
    options: BatchOperationOptions = { priority: 'normal', retryFailed: true, maxRetries: 3 }
  ): Promise<string> {
    const jobId = this.generateJobId()
    
    const job: BatchJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      totalItems: items.length,
      processedItems: 0,
      failedItems: 0,
      startTime: new Date(),
      results: [],
      errors: [],
      metadata: {
        items,
        options
      }
    }

    this.jobs.set(jobId, job)
    
    // Add to queue based on priority
    if (options.priority === 'high') {
      this.jobQueue.unshift(jobId)
    } else {
      this.jobQueue.push(jobId)
    }

    // Start processing if capacity allows
    this.processQueue()

    return jobId
  }

  // Process the job queue
  private async processQueue(): Promise<void> {
    while (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
      const jobId = this.jobQueue.shift()
      if (jobId && this.jobs.has(jobId)) {
        this.activeJobs.add(jobId)
        this.processJob(jobId).catch(error => {
          console.error(`Error processing job ${jobId}:`, error)
          this.updateJobStatus(jobId, 'failed')
        }).finally(() => {
          this.activeJobs.delete(jobId)
          // Continue processing queue
          this.processQueue()
        })
      }
    }
  }

  // Process a single job
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    try {
      this.updateJobStatus(jobId, 'running')
      
      const items = job.metadata?.items as string[]
      const options = job.metadata?.options as BatchOperationOptions

      let currentIndex = 0

      // Process items in batches to control concurrency
      while (currentIndex < items.length) {
        const batchSize = Math.min(this.config.maxConcurrentItems, items.length - currentIndex)
        const batch = items.slice(currentIndex, currentIndex + batchSize)

        const batchPromises = batch.map(async (item, index) => {
          const itemIndex = currentIndex + index
          try {
            const result = await this.processItem(job.type, item, itemIndex, options)
            job.results.push(result)
            
            if (result.status === 'failed') {
              job.failedItems++
            } else {
              job.processedItems++
            }
            
            // Update progress
            this.updateJobProgress(jobId)
            
            // Call progress callback
            if (options.onProgress) {
              const progress = this.calculateProgress(jobId)
              if (progress) {
                options.onProgress(progress)
              }
            }
          } catch (error) {
            const errorResult: BatchJobError = {
              itemId: item,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date(),
              retryable: true
            }
            
            job.errors.push(errorResult)
            job.failedItems++
            
            if (options.onError) {
              options.onError(errorResult)
            }

            // Pause on error if configured
            if (this.config.pauseOnError) {
              this.pauseJob(jobId)
              return
            }
          }
        })

        await Promise.allSettled(batchPromises)
        currentIndex += batchSize

        // Small delay between batches to prevent overwhelming
        if (currentIndex < items.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Handle retries for failed items
      if (options.retryFailed && job.errors.length > 0) {
        await this.retryFailedItems(jobId, options)
      }

      // Complete the job
      job.endTime = new Date()
      this.updateJobStatus(jobId, 'completed')

      if (options.onComplete) {
        options.onComplete(job.results)
      }

    } catch (error) {
      job.endTime = new Date()
      this.updateJobStatus(jobId, 'failed')
      console.error(`Job ${jobId} failed:`, error)
    }
  }

  // Process a single item within a job
  private async processItem(
    type: BatchJobType,
    itemId: string,
    _index: number,
    _options: BatchOperationOptions
  ): Promise<BatchJobResult> {
    const startTime = Date.now()

    try {
      let result: unknown

      switch (type) {
        case 'upload':
          result = await this.processUpload(itemId)
          break
        case 'delete':
          result = await this.processDelete(itemId)
          break
        case 'update_metadata':
          result = await this.processMetadataUpdate(itemId)
          break
        case 'reprocess':
          result = await this.processReprocess(itemId)
          break
        case 'compress':
          result = await this.processCompress(itemId)
          break
        case 'index':
          result = await this.processIndex(itemId)
          break
        case 'analyze':
          result = await this.processAnalyze(itemId)
          break
        default:
          throw new Error(`Unknown batch job type: ${type}`)
      }

      return {
        itemId,
        status: 'success',
        processingTime: Date.now() - startTime,
        outputData: result
      }
    } catch (error) {
      return {
        itemId,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime
      }
    }
  }

  // Specific processing methods
  private async processUpload(itemId: string): Promise<unknown> {
    // Simulate file upload processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
    return { uploadedAt: new Date(), fileId: itemId }
  }

  private async processDelete(itemId: string): Promise<unknown> {
    // Simulate file deletion
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
    return { deletedAt: new Date(), fileId: itemId }
  }

  private async processMetadataUpdate(itemId: string): Promise<unknown> {
    // Simulate metadata update
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200))
    return { updatedAt: new Date(), fileId: itemId }
  }

  private async processReprocess(itemId: string): Promise<unknown> {
    // Simulate document reprocessing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000))
    return { reprocessedAt: new Date(), fileId: itemId }
  }

  private async processCompress(itemId: string): Promise<unknown> {
    // Simulate compression
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 300))
    return { compressedAt: new Date(), fileId: itemId, compressionRatio: Math.random() * 0.5 + 0.3 }
  }

  private async processIndex(itemId: string): Promise<unknown> {
    // Simulate indexing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2500 + 500))
    return { indexedAt: new Date(), fileId: itemId }
  }

  private async processAnalyze(itemId: string): Promise<unknown> {
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, Math.random() * 4000 + 1000))
    return { 
      analyzedAt: new Date(), 
      fileId: itemId, 
      sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
      keywords: ['sample', 'keywords']
    }
  }

  // Retry failed items
  private async retryFailedItems(jobId: string, options: BatchOperationOptions): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    const retryableErrors = job.errors.filter(error => error.retryable)
    const maxRetries = options.maxRetries || this.config.retryAttempts

    for (const error of retryableErrors) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt))
          
          const result = await this.processItem(job.type, error.itemId, 0, options)
          
          if (result.status === 'success') {
            // Remove from errors and add to results
            job.errors = job.errors.filter(e => e.itemId !== error.itemId)
            job.results.push(result)
            job.failedItems--
            job.processedItems++
            break
          }
        } catch {
          if (attempt === maxRetries) {
            error.retryable = false
          }
        }
      }
    }
  }

  // Job management methods
  pauseJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'paused'
    }
  }

  resumeJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'paused') {
      job.status = 'pending'
      this.jobQueue.unshift(jobId) // High priority for resumed jobs
      this.processQueue()
    }
  }

  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (job && ['pending', 'running', 'paused'].includes(job.status)) {
      job.status = 'cancelled'
      job.endTime = new Date()
      this.activeJobs.delete(jobId)
      this.jobQueue = this.jobQueue.filter(id => id !== jobId)
    }
  }

  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId)
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values())
  }

  getActiveJobs(): BatchJob[] {
    return Array.from(this.jobs.values()).filter(job => 
      ['pending', 'running', 'paused'].includes(job.status)
    )
  }

  // Progress calculation
  private calculateProgress(jobId: string): BatchJobProgress | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    const progress = job.totalItems > 0 ? (job.processedItems + job.failedItems) / job.totalItems : 0
    const elapsedTime = Date.now() - job.startTime.getTime()
    const itemsPerSecond = elapsedTime > 0 ? (job.processedItems + job.failedItems) / (elapsedTime / 1000) : 0
    const remainingItems = job.totalItems - job.processedItems - job.failedItems
    const estimatedTimeRemaining = itemsPerSecond > 0 ? remainingItems / itemsPerSecond : 0

    return {
      jobId,
      progress: progress * 100,
      currentItem: `${job.processedItems + job.failedItems}/${job.totalItems}`,
      estimatedTimeRemaining: estimatedTimeRemaining * 1000, // Convert to milliseconds
      itemsPerSecond
    }
  }

  private updateJobProgress(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    const totalProcessed = job.processedItems + job.failedItems
    job.progress = job.totalItems > 0 ? (totalProcessed / job.totalItems) * 100 : 0
  }

  private updateJobStatus(jobId: string, status: BatchJobStatus): void {
    const job = this.jobs.get(jobId)
    if (job) {
      job.status = status
    }
  }

  // Cleanup
  private cleanupCompletedJobs(): void {
    if (!this.config.autoCleanupCompleted) return

    const cutoffTime = Date.now() - (this.config.cleanupAfterHours * 60 * 60 * 1000)
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (['completed', 'failed', 'cancelled'].includes(job.status) && 
          job.endTime && job.endTime.getTime() < cutoffTime) {
        this.jobs.delete(jobId)
      }
    }
  }

  // Utility methods
  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Statistics
  getStatistics(): {
    totalJobs: number
    activeJobs: number
    completedJobs: number
    failedJobs: number
    totalItemsProcessed: number
    totalItemsFailed: number
    averageProcessingTime: number
  } {
    const jobs = Array.from(this.jobs.values())
    const completedJobs = jobs.filter(job => job.status === 'completed')
    const failedJobs = jobs.filter(job => job.status === 'failed')
    const activeJobs = jobs.filter(job => ['pending', 'running', 'paused'].includes(job.status))

    const totalItemsProcessed = jobs.reduce((sum, job) => sum + job.processedItems, 0)
    const totalItemsFailed = jobs.reduce((sum, job) => sum + job.failedItems, 0)

    const totalProcessingTime = jobs
      .filter(job => job.endTime)
      .reduce((sum, job) => sum + (job.endTime!.getTime() - job.startTime.getTime()), 0)
    
    const averageProcessingTime = completedJobs.length > 0 ? totalProcessingTime / completedJobs.length : 0

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      totalItemsProcessed,
      totalItemsFailed,
      averageProcessingTime
    }
  }
}
