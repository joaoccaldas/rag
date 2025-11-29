/**
 * Worker Manager Service
 * Manages web worker lifecycle and provides a clean API for document processing
 */

import type { DocumentChunk, DocumentType } from '../rag/types'

export interface WorkerPoolOptions {
  maxWorkers?: number
  idleTimeout?: number
  retryAttempts?: number
}

export interface DocumentProcessingOptions {
  enableOCR?: boolean
  chunkSize?: number
  chunkOverlap?: number
}

export interface WorkerMessage {
  type: 'PROCESS_DOCUMENT' | 'PROCESS_WITH_AI' | 'GENERATE_EMBEDDING'
  data: {
    file?: File
    options?: DocumentProcessingOptions
    text?: string
    documentId?: string
  }
  id: string
}

export interface WorkerResponse {
  success: boolean
  id: string
  result?: {
    chunks: DocumentChunk[]
    metadata: {
      title: string
      type: DocumentType
      size: number
      pages?: number
      processingTime: number
    }
  } | number[] | unknown // For embeddings or other results
  error?: string
  progress?: number
}

interface ActiveWorker {
  worker: Worker
  busy: boolean
  lastUsed: number
  requests: Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
    timeout?: NodeJS.Timeout
  }>
}

export type ProcessingResult = WorkerResponse['result']

export class DocumentWorkerManager {
  private workers: ActiveWorker[] = []
  private maxWorkers: number
  private idleTimeout: number
  private retryAttempts: number
  private nextRequestId = 0

  constructor(options: WorkerPoolOptions = {}) {
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4
    this.idleTimeout = options.idleTimeout || 60000 // 1 minute
    this.retryAttempts = options.retryAttempts || 3
    
    // Cleanup idle workers periodically
    setInterval(() => this.cleanupIdleWorkers(), this.idleTimeout / 2)
  }

  /**
   * Process document using web worker
   */
  async processDocument(
    file: File, 
    documentId: string, 
    options: DocumentProcessingOptions = {}
  ): Promise<ProcessingResult> {
    return this.executeInWorker('PROCESS_DOCUMENT', {
      file,
      documentId,
      options
    })
  }

  /**
   * Process document with AI using web worker
   */
  async processDocumentWithAI(
    file: File, 
    documentId: string, 
    options: DocumentProcessingOptions = {}
  ): Promise<ProcessingResult> {
    return this.executeInWorker('PROCESS_WITH_AI', {
      file,
      documentId,
      options
    })
  }

  /**
   * Generate embedding using web worker
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.executeInWorker('GENERATE_EMBEDDING', { text })
    return result as number[]
  }

  /**
   * Execute a task in an available worker
   */
  private async executeInWorker(
    type: WorkerMessage['type'], 
    payload: Partial<WorkerMessage['data']>
  ): Promise<unknown> {
    const worker = await this.getAvailableWorker()
    const requestId = `req_${++this.nextRequestId}_${Date.now()}`
    
    return new Promise((resolve, reject) => {
      // Set up request tracking
      worker.requests.set(requestId, { resolve, reject })
      
      // Set up timeout
      const timeout = setTimeout(() => {
        worker.requests.delete(requestId)
        reject(new Error('Worker request timeout'))
      }, 30000) // 30 second timeout
      
      worker.requests.get(requestId)!.timeout = timeout
      
      // Send message to worker
      const message: WorkerMessage = {
        id: requestId,
        type,
        data: payload
      }
      
      worker.worker.postMessage(message)
      worker.busy = true
      worker.lastUsed = Date.now()
    })
  }

  /**
   * Get or create an available worker
   */
  private async getAvailableWorker(): Promise<ActiveWorker> {
    // Find an idle worker
    const idleWorker = this.workers.find(w => !w.busy)
    if (idleWorker) {
      return idleWorker
    }

    // Create new worker if under limit
    if (this.workers.length < this.maxWorkers) {
      return this.createWorker()
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkForAvailable = () => {
        const available = this.workers.find(w => !w.busy)
        if (available) {
          resolve(available)
        } else {
          setTimeout(checkForAvailable, 100)
        }
      }
      checkForAvailable()
    })
  }

  /**
   * Create a new worker
   */
  private createWorker(): ActiveWorker {
    const worker = new Worker(
      new URL('./document-processing.worker.ts', import.meta.url)
    )
    
    const activeWorker: ActiveWorker = {
      worker,
      busy: false,
      lastUsed: Date.now(),
      requests: new Map()
    }

    // Handle worker messages
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, success, result, error } = event.data
      const request = activeWorker.requests.get(id)
      
      if (request) {
        if (request.timeout) {
          clearTimeout(request.timeout)
        }
        
        activeWorker.requests.delete(id)
        activeWorker.busy = activeWorker.requests.size > 0
        
        if (success) {
          request.resolve(result)
        } else {
          request.reject(new Error(error || 'Worker task failed'))
        }
      }
    }

    // Handle worker errors
    worker.onerror = (error) => {
      console.error('Worker error:', error)
      // Reject all pending requests
      activeWorker.requests.forEach(({ reject, timeout }) => {
        if (timeout) clearTimeout(timeout)
        reject(new Error('Worker error'))
      })
      activeWorker.requests.clear()
      
      // Remove worker from pool
      this.removeWorker(activeWorker)
    }

    this.workers.push(activeWorker)
    return activeWorker
  }

  /**
   * Remove a worker from the pool
   */
  private removeWorker(workerToRemove: ActiveWorker): void {
    const index = this.workers.indexOf(workerToRemove)
    if (index !== -1) {
      workerToRemove.worker.terminate()
      this.workers.splice(index, 1)
    }
  }

  /**
   * Clean up idle workers
   */
  private cleanupIdleWorkers(): void {
    const now = Date.now()
    const idleWorkers = this.workers.filter(
      w => !w.busy && (now - w.lastUsed) > this.idleTimeout
    )
    
    idleWorkers.forEach(worker => this.removeWorker(worker))
    
    if (idleWorkers.length > 0) {
      console.log(`🧹 Cleaned up ${idleWorkers.length} idle workers`)
    }
  }

  /**
   * Get worker pool status
   */
  getStatus() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length,
      maxWorkers: this.maxWorkers,
      pendingRequests: this.workers.reduce((sum, w) => sum + w.requests.size, 0)
    }
  }

  /**
   * Terminate all workers
   */
  dispose(): void {
    this.workers.forEach(({ worker, requests }) => {
      // Reject all pending requests
      requests.forEach(({ reject, timeout }) => {
        if (timeout) clearTimeout(timeout)
        reject(new Error('Worker manager disposed'))
      })
      worker.terminate()
    })
    this.workers = []
  }
}

// Export singleton instance
export const documentWorkerManager = new DocumentWorkerManager()
