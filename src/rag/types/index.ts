// RAG System Types

export interface Document {
  id: string
  name: string
  type: DocumentType
  content: string
  metadata: DocumentMetadata
  embedding?: number[]
  chunks?: DocumentChunk[]
  status: DocumentStatus
  uploadedAt: Date
  lastModified: Date
  size: number // in bytes
  url?: string
  aiAnalysis?: AIAnalysisData // New field for AI-generated metadata
  visualContent?: VisualContent[] // Add visual content to document
}

export interface AIAnalysisData {
  summary: string
  keywords: string[]
  tags: string[]
  topics: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  complexity: 'low' | 'medium' | 'high'
  documentType: string
  confidence: number
  analyzedAt: Date
  model: string // Which AI model was used for analysis
  // Extended fields for unified prompt system
  mainMessages?: string[]
  mainNumbers?: Array<{ key: string; value: string; context: string }>
  mainAnalysis?: string[]
  explanations?: string[]
  actions?: string[]
  visualInsights?: string[]
}

export interface VisualContent {
  id: string
  documentId: string
  type: 'image' | 'chart' | 'table' | 'graph' | 'diagram'
  title?: string
  description?: string
  source?: string // For compatibility with renderer
  data?: {
    // For charts/graphs
    chartType?: 'bar' | 'line' | 'pie' | 'scatter'
    dataPoints?: Array<{x: string | number, y: string | number, label?: string}>
    
    // For tables
    headers?: string[]
    rows?: string[][]
    
    // For images/diagrams
    base64?: string
    url?: string
  }
  metadata?: {
    size?: string
    format?: string
    dimensions?: string
    extractedText?: string
    dataPoints?: number
    columns?: string[]
    pageNumber?: number
    boundingBox?: {x: number, y: number, width: number, height: number}
    extractedAt?: string
    confidence?: number
    documentTitle?: string
  }
  thumbnail?: string
  fullContent?: string | Array<{[key: string]: string | number | boolean}>
  llmSummary?: {
    keyInsights: string[]
    challenges: string[]
    mainContent: string
    significance: string
  }
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  startIndex: number
  endIndex: number
  metadata: ChunkMetadata
}

export interface DocumentMetadata {
  title?: string
  author?: string
  createdAt?: Date
  language?: string
  tags?: string[]
  summary?: string
  pageCount?: number
  wordCount?: number
  keywords?: string[]
  domain?: string
  // Original file storage references
  originalFileId?: string
  originalFileName?: string
  originalFileSize?: number
  originalFilePath?: string
  // Processing statistics
  processingStats?: {
    startTime: number
    endTime: number
    duration: number
    chunks: number
    totalTokens: number
  }
  // Enhanced visual analysis metadata
  enhancedVisualAnalysis?: {
    totalElements: number
    primaryVisualTypes: string[]
    visualContentDensity: 'low' | 'medium' | 'high'
    processedAt: string
    confidence: number
  }
}

export interface ChunkMetadata {
  page?: number
  section?: string
  importance?: number
  chunkIndex?: number
  tokenCount?: number
}

export type DocumentType = 
  | 'pdf' 
  | 'txt' 
  | 'docx' 
  | 'markdown' 
  | 'json' 
  | 'csv' 
  | 'xlsx'
  | 'html'
  | 'xml'
  | 'pptx'
  | 'image'
  | 'rtf'     // Rich Text Format
  | 'odt'     // OpenDocument Text
  | 'ods'     // OpenDocument Spreadsheet  
  | 'odp'     // OpenDocument Presentation
  | 'epub'    // Electronic Publication
  | 'mobi'    // Mobipocket eBook
  | 'azw'     // Amazon Kindle
  | 'log'     // Log files
  | 'yaml'    // YAML files
  | 'toml'    // TOML files
  | 'ini'     // INI/Config files  
  | 'cfg'     // Config files
  // Code file types
  | 'js'      // JavaScript/TypeScript
  | 'py'      // Python
  | 'css'     // CSS/SCSS/LESS
  | 'sql'     // SQL
  | 'php'     // PHP
  | 'java'    // Java
  | 'cpp'     // C/C++
  | 'ruby'    // Ruby
  | 'go'      // Go
  | 'rust'    // Rust
  | 'swift'   // Swift
  | 'kotlin'  // Kotlin

export type DocumentStatus = 
  | 'uploading' 
  | 'processing' 
  | 'chunking' 
  | 'embedding' 
  | 'ready' 
  | 'error'

export interface UploadProgress {
  documentId: string
  filename: string
  status: DocumentStatus
  progress: number // 0-100
  error?: string
  stage?: ProcessingStage
}

export type ProcessingStage = 
  | 'upload' 
  | 'parse' 
  | 'chunk' 
  | 'embed' 
  | 'store' 
  | 'index'

export interface SearchQuery {
  text: string
  filters?: SearchFilters
  limit?: number
  threshold?: number
}

export interface SearchFilters {
  documentTypes?: DocumentType[]
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  authors?: string[]
}

export interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, unknown>
  chunk?: DocumentChunk
  document?: Document
  similarity?: number
  relevantText?: string
}

export interface EmbeddingResult {
  vector: number[]
  text: string
  model: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  query: string
  confidence: number
  processingTime: number
}

export interface VectorStore {
  id: string
  name: string
  description?: string
  documentCount: number
  createdAt: Date
  lastUpdated: Date
}

export interface ProcessingStats {
  totalDocuments: number
  readyDocuments: number
  processingDocuments: number
  errorDocuments: number
  totalChunks: number
  storageUsed: number // in bytes
}
