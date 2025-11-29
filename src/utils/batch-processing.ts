/**
 * Batch Processing System
 * Handles multiple document uploads with queue management, progress tracking, and retry logic
 */

import { documentWorkerManager } from '../workers/worker-manager'
import { errorHandler, ErrorCategory } from '../utils/error-handling'
import { DocumentChunk, DocumentType } from '../rag/types'

export interface BatchJob {
  id: string
  files: File[]
  options: BatchProcessingOptions
  status: BatchJobStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  progress: BatchProgress
  results: BatchResult[]
  errors: BatchError[]
}

export interface BatchProcessingOptions {
  enableOCR?: boolean
  chunkSize?: number
  chunkOverlap?: number
  maxConcurrentJobs?: number
  retryAttempts?: number
  priority?: 'low' | 'normal' | 'high'
  enableAI?: boolean
  generateSummaries?: boolean
}

export enum BatchJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED'
}

export interface BatchProgress {
  totalFiles: number
  processedFiles: number
  failedFiles: number
  currentFile?: string
  overallProgress: number // 0-100
  estimatedTimeRemaining?: number
  processingSpeed?: number // files per minute
}

export interface BatchResult {
  fileId: string
  fileName: string
  success: boolean
  chunks?: DocumentChunk[]
  metadata?: {
    title: string
    type: DocumentType
    size: number
    pages?: number
    processingTime: number
  }
  error?: string
  retryCount: number
}

export interface BatchError {
  fileId: string
  fileName: string
  error: string
  timestamp: Date
  retryCount: number
}

export interface QueueStats {
  totalJobs: number
  activeJobs: number
  queuedJobs: number
  completedJobs: number
  failedJobs: number
  averageProcessingTime: number
}

class BatchProcessingService {
  private jobQueue: BatchJob[] = []
  private activeJobs = new Map<string, BatchJob>()
  private maxConcurrentJobs = 3
  private nextJobId = 1
  private processingInterval?: NodeJS.Timeout
  private jobCallbacks = new Map<string, Array<(job: BatchJob) => void>>()

  constructor() {
    // Start the processing loop
    this.startProcessingLoop()
    
    // Listen for storage events to sync across tabs (client-side only)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageSync.bind(this))
    }
  }

  /**
   * Submit files for batch processing
   */
  async submitBatch(
    files: File[], 
    options: BatchProcessingOptions = {}
  ): Promise<string> {
    if (!files.length) {
      throw new Error('No files provided for batch processing')
    }

    // Validate files
    this.validateFiles(files)

    const jobId = `batch_${this.nextJobId++}_${Date.now()}`
    const job: BatchJob = {
      id: jobId,
      files,
      options: {
        maxConcurrentJobs: 2,
        retryAttempts: 3,
        priority: 'normal',
        ...options
      },
      status: BatchJobStatus.QUEUED,
      createdAt: new Date(),
      progress: {
        totalFiles: files.length,
        processedFiles: 0,
        failedFiles: 0,
        overallProgress: 0
      },
      results: [],
      errors: []
    }

    // Add to queue based on priority
    this.addToQueue(job)
    
    // Persist to storage
    await this.persistJob(job)
    
    // Notify callbacks
    this.notifyJobCallbacks(job)
    
    console.log(`📁 Batch job ${jobId} queued with ${files.length} files`)
    return jobId
  }

  /**
   * Get job status
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId) || 
           this.jobQueue.find(job => job.id === jobId)
  }

  /**
   * Cancel a batch job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.getJob(jobId)
    if (!job) return false

    const previousStatus = job.status
    job.status = BatchJobStatus.CANCELLED
    
    // Remove from queue if not started
    if (previousStatus === BatchJobStatus.QUEUED) {
      this.jobQueue = this.jobQueue.filter(j => j.id !== jobId)
    }
    
    // Remove from active jobs
    this.activeJobs.delete(jobId)
    
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
    
    console.log(`❌ Batch job ${jobId} cancelled`)
    return true
  }

  /**
   * Pause a batch job
   */
  async pauseJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job || job.status !== BatchJobStatus.PROCESSING) return false

    job.status = BatchJobStatus.PAUSED
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
    
    console.log(`⏸️ Batch job ${jobId} paused`)
    return true
  }

  /**
   * Resume a paused batch job
   */
  async resumeJob(jobId: string): Promise<boolean> {
    const job = this.getJob(jobId)
    if (!job || job.status !== BatchJobStatus.PAUSED) return false

    job.status = BatchJobStatus.QUEUED
    this.addToQueue(job)
    
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
    
    console.log(`▶️ Batch job ${jobId} resumed`)
    return true
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    const allJobs = [...this.jobQueue, ...Array.from(this.activeJobs.values())]
    
    const completedJobs = allJobs.filter(job => job.status === BatchJobStatus.COMPLETED)
    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = job.completedAt && job.startedAt 
            ? job.completedAt.getTime() - job.startedAt.getTime()
            : 0
          return sum + duration
        }, 0) / completedJobs.length
      : 0

    return {
      totalJobs: allJobs.length,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.filter(job => job.status === BatchJobStatus.QUEUED).length,
      completedJobs: completedJobs.length,
      failedJobs: allJobs.filter(job => job.status === BatchJobStatus.FAILED).length,
      averageProcessingTime
    }
  }

  /**
   * Register callback for job updates
   */
  onJobUpdate(jobId: string, callback: (job: BatchJob) => void): () => void {
    if (!this.jobCallbacks.has(jobId)) {
      this.jobCallbacks.set(jobId, [])
    }
    
    this.jobCallbacks.get(jobId)!.push(callback)
    
    return () => {
      const callbacks = this.jobCallbacks.get(jobId)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Clear completed jobs from queue
   */
  clearCompletedJobs(): void {
    const completedJobIds: string[] = []
    
    this.jobQueue = this.jobQueue.filter(job => {
      if (job.status === BatchJobStatus.COMPLETED || job.status === BatchJobStatus.FAILED) {
        completedJobIds.push(job.id)
        return false
      }
      return true
    })
    
    completedJobIds.forEach(id => {
      this.activeJobs.delete(id)
      this.jobCallbacks.delete(id)
    })
    
    console.log(`🧹 Cleared ${completedJobIds.length} completed jobs`)
  }

  private validateFiles(files: File[]): void {
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    const supportedTypes = ['.pdf', '.docx', '.txt', '.md', '.html', '.rtf']
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        throw new Error(`File "${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 50MB.`)
      }
      
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!supportedTypes.includes(extension)) {
        throw new Error(`File "${file.name}" has unsupported format. Supported formats: ${supportedTypes.join(', ')}`)
      }
    }
  }

  private addToQueue(job: BatchJob): void {
    // Insert based on priority
    const priority = job.options.priority || 'normal'
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    
    let insertIndex = this.jobQueue.length
    for (let i = 0; i < this.jobQueue.length; i++) {
      const existing = this.jobQueue[i]
      const existingPriority = priorityOrder[existing.options.priority || 'normal']
      const newPriority = priorityOrder[priority]
      
      if (newPriority < existingPriority) {
        insertIndex = i
        break
      }
    }
    
    this.jobQueue.splice(insertIndex, 0, job)
  }

  private startProcessingLoop(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000) // Check every second
  }

  private async processQueue(): Promise<void> {
    // Process jobs that can run
    while (
      this.activeJobs.size < this.maxConcurrentJobs && 
      this.jobQueue.length > 0
    ) {
      const job = this.jobQueue.find(j => j.status === BatchJobStatus.QUEUED)
      if (!job) break

      // Remove from queue and start processing
      this.jobQueue = this.jobQueue.filter(j => j.id !== job.id)
      this.activeJobs.set(job.id, job)
      
      this.processJob(job).catch(error => {
        console.error(`Error processing job ${job.id}:`, error)
      })
    }
  }

  private async processJob(job: BatchJob): Promise<void> {
    job.status = BatchJobStatus.PROCESSING
    job.startedAt = new Date()
    
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
    
    console.log(`🚀 Started processing batch job ${job.id} with ${job.files.length} files`)
    
    const startTime = Date.now()
    
    try {
      // Process files with concurrency control
      const concurrency = Math.min(
        job.options.maxConcurrentJobs || 2,
        job.files.length
      )
      
      await this.processFilesWithConcurrency(job, concurrency)
      
      // Determine final status
      const hasErrors = job.errors.length > 0
      const allFailed = job.results.every(r => !r.success)
      
      if (allFailed && hasErrors) {
        job.status = BatchJobStatus.FAILED
      } else {
        job.status = BatchJobStatus.COMPLETED
      }
      
      job.completedAt = new Date()
      
      // Calculate final stats
      const processingTime = Date.now() - startTime
      job.progress.processingSpeed = (job.files.length / processingTime) * 60000 // files per minute
      
      console.log(`✅ Batch job ${job.id} completed in ${Math.round(processingTime / 1000)}s`)
      
    } catch (error) {
      job.status = BatchJobStatus.FAILED
      job.completedAt = new Date()
      
      await errorHandler.handleError(error, {
        jobId: job.id,
        fileCount: job.files.length,
        category: ErrorCategory.DOCUMENT_PROCESSING
      })
      
      console.error(`❌ Batch job ${job.id} failed:`, error)
    }
    
    // Remove from active jobs
    this.activeJobs.delete(job.id)
    
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
  }

  private async processFilesWithConcurrency(
    job: BatchJob, 
    concurrency: number
  ): Promise<void> {
    const filesToProcess = [...job.files]
    const processing: Promise<void>[] = []
    
    while (filesToProcess.length > 0 || processing.length > 0) {
      // Start new file processing up to concurrency limit
      while (processing.length < concurrency && filesToProcess.length > 0) {
        const file = filesToProcess.shift()!
        const filePromise = this.processFile(job, file)
        processing.push(filePromise)
      }
      
      // Wait for at least one to complete
      if (processing.length > 0) {
        await Promise.race(processing)
        
        // Remove completed promises
        for (let i = processing.length - 1; i >= 0; i--) {
          const promise = processing[i]
          if (await this.isPromiseResolved(promise)) {
            processing.splice(i, 1)
          }
        }
      }
      
      // Check if job was cancelled or paused
      if (job.status === BatchJobStatus.CANCELLED || job.status === BatchJobStatus.PAUSED) {
        break
      }
    }
  }

  private async processFile(job: BatchJob, file: File): Promise<void> {
    const fileId = `${job.id}_${file.name}_${file.size}`
    job.progress.currentFile = file.name
    
    let retryCount = 0
    const maxRetries = job.options.retryAttempts || 3
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`📄 Processing file: ${file.name} (attempt ${retryCount + 1})`)
        
        const result = await documentWorkerManager.processDocument(
          file,
          fileId,
          {
            enableOCR: job.options.enableOCR,
            chunkSize: job.options.chunkSize,
            chunkOverlap: job.options.chunkOverlap
          }
        ) as {
          chunks?: DocumentChunk[]
          metadata?: {
            title: string
            type: DocumentType
            size: number
            pages?: number
            processingTime: number
          }
        }
        
        // Success
        job.results.push({
          fileId,
          fileName: file.name,
          success: true,
          chunks: result?.chunks || [],
          metadata: result?.metadata,
          retryCount
        })
        
        job.progress.processedFiles++
        break
        
      } catch (error) {
        retryCount++
        
        if (retryCount > maxRetries) {
          // Final failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          job.results.push({
            fileId,
            fileName: file.name,
            success: false,
            error: errorMessage,
            retryCount: retryCount - 1
          })
          
          job.errors.push({
            fileId,
            fileName: file.name,
            error: errorMessage,
            timestamp: new Date(),
            retryCount: retryCount - 1
          })
          
          job.progress.failedFiles++
          
          console.error(`❌ Failed to process ${file.name} after ${maxRetries} attempts:`, error)
        } else {
          console.warn(`⚠️ Retry ${retryCount} for ${file.name}:`, error)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        }
      }
    }
    
    // Update progress
    job.progress.overallProgress = Math.round(
      ((job.progress.processedFiles + job.progress.failedFiles) / job.progress.totalFiles) * 100
    )
    
    // Estimate time remaining
    if (job.startedAt && job.progress.processedFiles > 0) {
      const elapsed = Date.now() - job.startedAt.getTime()
      const avgTimePerFile = elapsed / (job.progress.processedFiles + job.progress.failedFiles)
      const remainingFiles = job.progress.totalFiles - job.progress.processedFiles - job.progress.failedFiles
      job.progress.estimatedTimeRemaining = Math.round(avgTimePerFile * remainingFiles)
    }
    
    await this.persistJob(job)
    this.notifyJobCallbacks(job)
  }

  private async isPromiseResolved(promise: Promise<unknown>): Promise<boolean> {
    try {
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 0))
      ])
      return true
    } catch {
      return true // Rejected promises are also "resolved"
    }
  }

  private async persistJob(job: BatchJob): Promise<void> {
    try {
      const jobData = {
        ...job,
        files: job.files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          lastModified: f.lastModified
        })) // Don't store actual file objects
      }
      
      if (typeof window !== 'undefined' && localStorage) {
        localStorage.setItem(`batch_job_${job.id}`, JSON.stringify(jobData))
      }
    } catch (error) {
      console.warn('Failed to persist batch job:', error)
    }
  }

  private notifyJobCallbacks(job: BatchJob): void {
    const callbacks = this.jobCallbacks.get(job.id) || []
    callbacks.forEach(callback => {
      try {
        callback(job)
      } catch (error) {
        console.error('Error in job callback:', error)
      }
    })
  }

  private handleStorageSync(event: StorageEvent): void {
    if (event.key?.startsWith('batch_job_')) {
      // Handle job updates from other tabs
      // Implementation would sync job state across tabs
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageSync.bind(this))
    }
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessingService()
