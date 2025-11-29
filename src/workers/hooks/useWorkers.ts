/**
 * React hooks for Web Workers integration
 * Provides easy-to-use hooks for heavy processing tasks
 */

import { useRef, useCallback, useState } from 'react'
import { WorkerPool } from '../utils/worker-pool'
import type { 
  ProcessDocumentRequest,
  ProcessDocumentSuccess,
  ProcessDocumentProgress,
  ComputeEmbeddingsRequest,
  ComputeEmbeddingsSuccess,
  ComputeEmbeddingsProgress,
  WorkerResponse
} from '../types'

// Worker pool singleton
let workerPool: WorkerPool | null = null

function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool({
      maxWorkers: navigator.hardwareConcurrency || 4
    })
  }
  return workerPool
}

// Document processing hook
export function useDocumentProcessor() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const processDocument = useCallback(async (
    file: File,
    options: {
      enableAI?: boolean
      enableKeywords?: boolean
      chunkSize?: number
      chunkOverlap?: number
    } = {},
    onProgress?: (progress: number, message: string, stage?: string) => void
  ): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true)
      setProgress(0)
      setError(null)

      // Create abort controller for this task
      abortControllerRef.current = new AbortController()
      
      const pool = getWorkerPool()
      const taskId = Date.now().toString() + Math.random().toString(36)
      
      const request: ProcessDocumentRequest = {
        id: taskId,
        type: 'PROCESS_DOCUMENT',
        timestamp: Date.now(),
        payload: {
          file,
          options: {
            enableAI: options.enableAI ?? true,
            enableKeywords: options.enableKeywords ?? true,
            chunkSize: options.chunkSize ?? 1000,
            chunkOverlap: options.chunkOverlap ?? 200
          }
        }
      }

      pool.addTask({
        type: 'document-processing',
        priority: 'normal',
        payload: { request },
        onProgress: (response: unknown) => {
          const message = response as ProcessDocumentProgress
          if (message.type === 'PROCESS_DOCUMENT_PROGRESS') {
            setProgress(message.payload.progress)
            onProgress?.(message.payload.progress, message.payload.message, message.payload.stage)
          }
        },
        onSuccess: (response: unknown) => {
          const message = response as ProcessDocumentSuccess
          setIsLoading(false)
          setProgress(100)
          resolve(message.payload)
        },
        onError: (error) => {
          setIsLoading(false)
          setError(error.message)
          reject(new Error(error.message))
        }
      })
    })
  }, [])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setError('Task aborted')
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setIsLoading(false)
  }, [])

  return {
    processDocument,
    abort,
    reset,
    isLoading,
    progress,
    error
  }
}

// Vector processing hook
export function useVectorProcessor() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const computeEmbeddings = useCallback(async (
    texts: string[],
    options: {
      model?: string
      batchSize?: number
    } = {},
    onProgress?: (progress: number, message: string) => void
  ): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true)
      setProgress(0)
      setError(null)

      abortControllerRef.current = new AbortController()
      
      const pool = getWorkerPool()
      const taskId = Date.now().toString() + Math.random().toString(36)
      
      const request: ComputeEmbeddingsRequest = {
        id: taskId,
        type: 'COMPUTE_EMBEDDINGS',
        timestamp: Date.now(),
        payload: {
          texts,
          model: options.model || 'text-embedding-ada-002',
          batchSize: options.batchSize || 10
        }
      }

      pool.addTask({
        type: 'vector-processing',
        priority: 'normal',
        payload: { request },
        onProgress: (response: unknown) => {
          const message = response as ComputeEmbeddingsProgress
          if (message.type === 'COMPUTE_EMBEDDINGS_PROGRESS') {
            const progressPercent = (message.payload.processed / message.payload.total) * 100
            setProgress(progressPercent)
            onProgress?.(progressPercent, `Processed ${message.payload.processed}/${message.payload.total}`)
          }
        },
        onSuccess: (response: unknown) => {
          const message = response as ComputeEmbeddingsSuccess
          setIsLoading(false)
          setProgress(100)
          resolve(message.payload)
        },
        onError: (error) => {
          setIsLoading(false)
          setError(error.message)
          reject(new Error(error.message))
        }
      })
    })
  }, [])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setError('Task aborted')
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setIsLoading(false)
  }, [])

  return {
    computeEmbeddings,
    abort,
    reset,
    isLoading,
    progress,
    error
  }
}

// Combined processing hook for full RAG pipeline
export function useRAGProcessor() {
  const documentProcessor = useDocumentProcessor()
  const vectorProcessor = useVectorProcessor()

  const [overallProgress, setOverallProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const processFullPipeline = useCallback(async (
    file: File,
    options: {
      enableAI?: boolean
      generateEmbeddings?: boolean
      chunkSize?: number
      chunkOverlap?: number
      embeddingModel?: string
    } = {}
  ) => {
    setIsProcessing(true)
    setOverallProgress(0)
    
    try {
      // Stage 1: Document Processing (60% of total)
      setCurrentStage('Processing document...')
      const documentResult = await documentProcessor.processDocument(
        file,
        {
          enableAI: options.enableAI,
          chunkSize: options.chunkSize,
          chunkOverlap: options.chunkOverlap
        },
        (progress) => {
          setOverallProgress(progress * 0.6)
        }
      )
      
      let embeddings = null
      if (options.generateEmbeddings && documentResult && typeof documentResult === 'object' && 'chunks' in documentResult) {
        // Stage 2: Vector Processing (40% of total)
        setCurrentStage('Generating embeddings...')
        const chunks = (documentResult as { chunks: Array<{ content: string }> }).chunks
        const chunkTexts = chunks.map(chunk => chunk.content)
        
        const embeddingResult = await vectorProcessor.computeEmbeddings(
          chunkTexts,
          {
            model: options.embeddingModel,
            batchSize: 10
          },
          (progress) => {
            setOverallProgress(60 + progress * 0.4)
          }
        )
        
        embeddings = embeddingResult && typeof embeddingResult === 'object' && 'embeddings' in embeddingResult 
          ? (embeddingResult as { embeddings: unknown }).embeddings 
          : null
      }
      
      setOverallProgress(100)
      setCurrentStage('Complete')
      
      return {
        document: documentResult,
        embeddings
      }
      
    } catch (error) {
      console.error('RAG pipeline error:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [documentProcessor, vectorProcessor])

  const abort = useCallback(() => {
    documentProcessor.abort()
    vectorProcessor.abort()
    setIsProcessing(false)
    setCurrentStage('Aborted')
  }, [documentProcessor, vectorProcessor])

  const reset = useCallback(() => {
    documentProcessor.reset()
    vectorProcessor.reset()
    setOverallProgress(0)
    setCurrentStage('')
    setIsProcessing(false)
  }, [documentProcessor, vectorProcessor])

  return {
    processFullPipeline,
    abort,
    reset,
    isProcessing,
    overallProgress,
    currentStage,
    // Individual processors for granular control
    documentProcessor,
    vectorProcessor
  }
}

// Performance monitoring hook
export function useWorkerPerformance() {
  const [metrics, setMetrics] = useState({
    activeTasks: 0,
    totalTasks: 0
  })

  const getMetrics = useCallback(() => {
    const pool = getWorkerPool()
    setMetrics({
      activeTasks: pool.getActiveTaskCount(),
      totalTasks: pool.getActiveTaskCount() // Simplified for now
    })
  }, [])

  const terminateAllWorkers = useCallback(() => {
    if (workerPool) {
      // WorkerPool doesn't have terminate method, so we'll recreate it
      workerPool = null
    }
  }, [])

  return {
    metrics,
    getMetrics,
    terminateAllWorkers
  }
}
