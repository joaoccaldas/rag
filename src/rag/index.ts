// RAG Module Exports

// Main Components
export { RAGView } from './components/rag-view'
export { DocumentManager } from './components/document-manager'
export { SearchInterface } from './components/search-interface'
export { UploadProgress } from './components/upload-progress'
export { ProcessingStats } from './components/processing-stats'

// Context and Hooks
export { RAGProvider, useRAG } from './contexts/RAGContext'

// Types
export type {
  Document,
  DocumentChunk,
  DocumentMetadata,
  ChunkMetadata,
  DocumentType,
  DocumentStatus,
  UploadProgress as UploadProgressType,
  ProcessingStage,
  SearchQuery,
  SearchFilters,
  SearchResult,
  RAGResponse,
  VectorStore,
  ProcessingStats as ProcessingStatsType
} from './types'
