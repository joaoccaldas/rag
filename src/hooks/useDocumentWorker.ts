/**
 * React hook for using document processing workers
 */

import { useCallback, useRef } from 'react'
import { DocumentChunk, DocumentType } from '../rag/types'

interface ProcessingOptions {
  enableOCR?: boolean
  chunkSize?: number
  chunkOverlap?: number
}

interface ProcessingResult {
  chunks: DocumentChunk[]
  metadata: {
    title: string
    type: DocumentType
    size: number
    pages?: number
    processingTime: number
  }
}

interface ProcessingProgress {
  progress: number
  message: string
}

export function useDocumentWorker() {
  const workerRef = useRef<Worker | null>(null)
  const processingRef = useRef<Map<string, {
    resolve: (result: ProcessingResult) => void
    reject: (error: Error) => void
    onProgress?: (progress: ProcessingProgress) => void
  }>>(new Map())

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/document-processing.worker.ts', import.meta.url),
          { type: 'module' }
        )

        workerRef.current.onmessage = (event) => {
          const { success, id, result, error, progress } = event.data
          const pending = processingRef.current.get(id)

          if (!pending) return

          if (progress !== undefined) {
            // Progress update
            pending.onProgress?.({
              progress,
              message: result?.metadata?.title || 'Processing...'
            })
          } else if (success && result) {
            // Completion
            pending.resolve(result)
            processingRef.current.delete(id)
          } else {
            // Error
            pending.reject(new Error(error || 'Processing failed'))
            processingRef.current.delete(id)
          }
        }

        workerRef.current.onerror = (error) => {
          console.error('Worker error:', error)
          // Reject all pending operations
          processingRef.current.forEach(({ reject }) => {
            reject(new Error('Worker error occurred'))
          })
          processingRef.current.clear()
        }
      } catch (error) {
        console.error('Failed to create worker:', error)
        throw new Error('Web Workers not supported in this environment')
      }
    }
    return workerRef.current
  }, [])

  const processDocument = useCallback(
    (
      file: File, 
      options: ProcessingOptions = {},
      onProgress?: (progress: ProcessingProgress) => void
    ): Promise<ProcessingResult> => {
      return new Promise((resolve, reject) => {
        try {
          const worker = initWorker()
          const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          // Store promise handlers
          processingRef.current.set(id, { resolve, reject, onProgress })

          // Send processing request
          worker.postMessage({
            type: 'PROCESS_DOCUMENT',
            data: { file, options },
            id
          })

          // Set timeout for long-running operations
          const timeout = setTimeout(() => {
            processingRef.current.delete(id)
            reject(new Error('Processing timeout'))
          }, 5 * 60 * 1000) // 5 minutes

          // Clear timeout on completion
          const originalResolve = resolve
          const originalReject = reject
          
          processingRef.current.set(id, {
            resolve: (result) => {
              clearTimeout(timeout)
              originalResolve(result)
            },
            reject: (error) => {
              clearTimeout(timeout)
              originalReject(error)
            },
            onProgress
          })

        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to start processing'))
        }
      })
    },
    [initWorker]
  )

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    // Reject all pending operations
    processingRef.current.forEach(({ reject }) => {
      reject(new Error('Worker terminated'))
    })
    processingRef.current.clear()
  }, [])

  const isWorkerSupported = useCallback(() => {
    return typeof Worker !== 'undefined' && typeof window !== 'undefined'
  }, [])

  return {
    processDocument,
    terminate,
    isWorkerSupported
  }
}
