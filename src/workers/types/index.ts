/**
 * Web Worker Type Definitions for RAG System
 * Defines all message types and interfaces for worker communication
 */

// Base message interface for all worker communications
export interface BaseWorkerMessage {
  id: string
  type: string
  timestamp: number
}

// Document Processing Worker Messages
export interface DocumentProcessingMessage extends BaseWorkerMessage {
  type: 'PROCESS_DOCUMENT' | 'PROCESS_DOCUMENT_SUCCESS' | 'PROCESS_DOCUMENT_ERROR' | 'PROCESS_DOCUMENT_PROGRESS'
}

export interface ProcessDocumentRequest extends DocumentProcessingMessage {
  type: 'PROCESS_DOCUMENT'
  payload: {
    file: File
    options: {
      enableAI?: boolean
      enableKeywords?: boolean
      aiModel?: string
      chunkSize?: number
      chunkOverlap?: number
    }
  }
}

export interface ProcessDocumentProgress extends DocumentProcessingMessage {
  type: 'PROCESS_DOCUMENT_PROGRESS'
  payload: {
    stage: 'parsing' | 'chunking' | 'ai-analysis' | 'keywords' | 'visual-extraction' | 'storage'
    progress: number // 0-100
    message: string
    estimatedTimeRemaining?: number
  }
}

export interface ProcessDocumentSuccess extends DocumentProcessingMessage {
  type: 'PROCESS_DOCUMENT_SUCCESS'
  payload: {
    content: string
    chunks: DocumentChunk[]
    wordCount: number
    visualContent?: VisualContent[]
    aiSummary?: SummaryData
    extractedKeywords?: ExtractedKeywords
    processingMetadata: ProcessingMetadata
  }
}

export interface ProcessDocumentError extends DocumentProcessingMessage {
  type: 'PROCESS_DOCUMENT_ERROR'
  payload: {
    error: string
    stage?: string
    partialResults?: Partial<ProcessDocumentSuccess['payload']>
  }
}

// Vector Processing Worker Messages
export interface VectorProcessingMessage extends BaseWorkerMessage {
  type: 'COMPUTE_EMBEDDINGS' | 'COMPUTE_EMBEDDINGS_SUCCESS' | 'COMPUTE_EMBEDDINGS_ERROR' | 'COMPUTE_EMBEDDINGS_PROGRESS' | 'SEARCH_VECTORS' | 'SEARCH_VECTORS_SUCCESS' | 'SEARCH_VECTORS_ERROR'
}

export interface ComputeEmbeddingsRequest extends VectorProcessingMessage {
  type: 'COMPUTE_EMBEDDINGS'
  payload: {
    texts: string[]
    model?: string
    batchSize?: number
  }
}

export interface ComputeEmbeddingsProgress extends VectorProcessingMessage {
  type: 'COMPUTE_EMBEDDINGS_PROGRESS'
  payload: {
    processed: number
    total: number
    estimatedTimeRemaining?: number
  }
}

export interface ComputeEmbeddingsSuccess extends VectorProcessingMessage {
  type: 'COMPUTE_EMBEDDINGS_SUCCESS'
  payload: {
    embeddings: Float32Array[]
    processingTime: number
  }
}

export interface ComputeEmbeddingsError extends VectorProcessingMessage {
  type: 'COMPUTE_EMBEDDINGS_ERROR'
  payload: {
    error: string
    processed: number
    total: number
  }
}

export interface SearchVectorsError extends VectorProcessingMessage {
  type: 'SEARCH_VECTORS_ERROR'
  payload: {
    error: string
    querySize?: number
  }
}

export interface SearchVectorsRequest extends VectorProcessingMessage {
  type: 'SEARCH_VECTORS'
  payload: {
    queryEmbedding: Float32Array
    vectorDatabase: VectorDatabase
    topK?: number
    threshold?: number
  }
}

export interface SearchVectorsSuccess extends VectorProcessingMessage {
  type: 'SEARCH_VECTORS_SUCCESS'
  payload: {
    results: SearchResult[]
    processingTime: number
  }
}

// AI Analysis Worker Messages
export interface AIAnalysisMessage extends BaseWorkerMessage {
  type: 'ANALYZE_DOCUMENT' | 'ANALYZE_DOCUMENT_SUCCESS' | 'ANALYZE_DOCUMENT_ERROR' | 'EXTRACT_KEYWORDS' | 'EXTRACT_KEYWORDS_SUCCESS' | 'EXTRACT_KEYWORDS_ERROR'
}

export interface AnalyzeDocumentRequest extends AIAnalysisMessage {
  type: 'ANALYZE_DOCUMENT'
  payload: {
    content: string
    filename: string
    model?: string
    options?: {
      enableSummarization?: boolean
      enableSentimentAnalysis?: boolean
      enableComplexityAnalysis?: boolean
    }
  }
}

export interface AnalyzeDocumentSuccess extends AIAnalysisMessage {
  type: 'ANALYZE_DOCUMENT_SUCCESS'
  payload: SummaryData
}

export interface AnalyzeDocumentError extends AIAnalysisMessage {
  type: 'ANALYZE_DOCUMENT_ERROR'
  payload: {
    error: string
    stage?: string
    partialResults?: Partial<SummaryData>
  }
}

// Visual Content Worker Messages
export interface VisualContentMessage extends BaseWorkerMessage {
  type: 'EXTRACT_VISUAL_CONTENT' | 'EXTRACT_VISUAL_CONTENT_SUCCESS' | 'EXTRACT_VISUAL_CONTENT_ERROR' | 'GENERATE_PREVIEW' | 'GENERATE_PREVIEW_SUCCESS' | 'GENERATE_PREVIEW_ERROR'
}

export interface ExtractVisualContentRequest extends VisualContentMessage {
  type: 'EXTRACT_VISUAL_CONTENT'
  payload: {
    content: string
    documentType: string
    filename: string
  }
}

export interface ExtractVisualContentSuccess extends VisualContentMessage {
  type: 'EXTRACT_VISUAL_CONTENT_SUCCESS'
  payload: {
    visualContent: VisualContent[]
    processingTime: number
  }
}

export interface GeneratePreviewRequest extends VisualContentMessage {
  type: 'GENERATE_PREVIEW'
  payload: {
    visualContent: VisualContent
    size?: { width: number; height: number }
  }
}

export interface ExtractVisualContentError extends VisualContentMessage {
  type: 'EXTRACT_VISUAL_CONTENT_ERROR'
  payload: {
    error: string
    stage?: string
  }
}

export interface GeneratePreviewSuccess extends VisualContentMessage {
  type: 'GENERATE_PREVIEW_SUCCESS'
  payload: {
    previewUrl: string
    thumbnailUrl?: string
  }
}

export interface GeneratePreviewError extends VisualContentMessage {
  type: 'GENERATE_PREVIEW_ERROR'
  payload: {
    error: string
  }
}

// Storage Worker Messages
export interface StorageWorkerMessage extends BaseWorkerMessage {
  type: 'BULK_STORE' | 'BULK_STORE_SUCCESS' | 'BULK_STORE_ERROR' | 'BULK_RETRIEVE' | 'BULK_RETRIEVE_SUCCESS' | 'OPTIMIZE_STORAGE' | 'OPTIMIZE_STORAGE_SUCCESS'
}

export interface BulkStoreRequest extends StorageWorkerMessage {
  type: 'BULK_STORE'
  payload: {
    documents: DocumentToStore[]
    chunks: ChunkToStore[]
    visualContent?: VisualContentToStore[]
  }
}

export interface BulkStoreSuccess extends StorageWorkerMessage {
  type: 'BULK_STORE_SUCCESS'
  payload: {
    storedDocuments: number
    storedChunks: number
    storedVisualContent: number
    processingTime: number
  }
}

export interface BulkStoreError extends StorageWorkerMessage {
  type: 'BULK_STORE_ERROR'
  payload: {
    error: string
    storedDocuments: number
    storedChunks: number
    storedVisualContent: number
  }
}

// Worker Pool Management
export interface WorkerPoolConfig {
  maxWorkers: number
  workerTimeout: number
  retryAttempts: number
  enableLogging: boolean
}

export interface WorkerTask {
  id: string
  type: string
  priority: 'low' | 'normal' | 'high'
  payload: Record<string, unknown>
  createdAt: number
  retryCount: number
  onProgress?: (progress: WorkerResponse) => void
  onSuccess?: (result: WorkerResponse) => void
  onError?: (error: { message: string; stack?: string }) => void
}

export interface WorkerStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageProcessingTime: number
  activeWorkers: number
  queuedTasks: number
}

// Supporting Types (imported from existing types)
export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  tokens: number
  embedding?: Float32Array
  metadata: {
    chunkIndex: number
    startOffset: number
    endOffset: number
    contextualKeywords?: string[]
  }
}

export interface VisualContent {
  id: string
  type: 'chart' | 'table' | 'image' | 'diagram' | 'graph'
  data: {
    chartData?: { labels: string[]; values: number[] }
    tableData?: { headers: string[]; rows: string[][] }
    imageData?: { src: string; alt?: string }
    diagramData?: { nodes: unknown[]; edges: unknown[] }
  }
  metadata: {
    documentId: string
    documentTitle?: string
    pageNumber?: number
    position?: { x: number; y: number; width: number; height: number }
    extractedAt: string
    confidence: number
  }
}

export interface SummaryData {
  summary: string
  keywords: string[]
  tags: string[]
  topics: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  complexity: 'low' | 'medium' | 'high'
  documentType: string
  confidence: number
  // Enhanced unified prompt fields
  mainMessages?: string[]
  mainNumbers?: Array<{ key: string; value: string; context: string }>
  mainAnalysis?: string[]
  explanations?: string[]
  actions?: string[]
  visualInsights?: string[]
}

export interface ExtractedKeywords {
  conceptual: string[]
  technical: string[]
  entities: string[]
  contextual: string[]
}

export interface ProcessingMetadata {
  processingTime: number
  status: 'completed' | 'partial' | 'failed'
  aiAnalysisEnabled: boolean
  keywordExtractionEnabled: boolean
  errors?: string[]
}

export interface VectorDatabase {
  vectors: Float32Array[]
  metadata: Record<string, unknown>[]
  dimension: number
}

export interface SearchResult {
  id: string
  score: number
  content: string
  metadata: Record<string, unknown>
}

export interface DocumentToStore {
  id: string
  name: string
  content: string
  type: string
  size: number
  chunks: DocumentChunk[]
  visualContent?: VisualContent[]
  aiAnalysis?: SummaryData
  keywords?: ExtractedKeywords
}

export interface ChunkToStore {
  id: string
  documentId: string
  content: string
  embedding: Float32Array
  metadata: Record<string, unknown>
}

export interface VisualContentToStore {
  id: string
  documentId: string
  type: string
  data: Record<string, unknown>
  metadata: Record<string, unknown>
}

// Union types for type safety
export type WorkerMessage = 
  | DocumentProcessingMessage
  | VectorProcessingMessage
  | AIAnalysisMessage
  | VisualContentMessage
  | StorageWorkerMessage

export type WorkerRequest = 
  | ProcessDocumentRequest
  | ComputeEmbeddingsRequest
  | SearchVectorsRequest
  | AnalyzeDocumentRequest
  | ExtractVisualContentRequest
  | GeneratePreviewRequest
  | BulkStoreRequest

export type WorkerResponse = 
  | ProcessDocumentSuccess
  | ProcessDocumentError
  | ProcessDocumentProgress
  | ComputeEmbeddingsSuccess
  | ComputeEmbeddingsError
  | ComputeEmbeddingsProgress
  | SearchVectorsSuccess
  | SearchVectorsError
  | AnalyzeDocumentSuccess
  | AnalyzeDocumentError
  | ExtractVisualContentSuccess
  | ExtractVisualContentError
  | GeneratePreviewSuccess
  | GeneratePreviewError
  | BulkStoreSuccess
  | BulkStoreError
