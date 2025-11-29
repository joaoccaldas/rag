/**
 * Document Utilities
 * 
 * Utility functions for document management including:
 * - Unique ID generation
 * - Document validation
 * - File type detection
 * - Content extraction helpers
 * 
 * Why these utilities:
 * - Consistent document identification across the system
 * - Proper validation prevents corrupted data
 * - File type detection enables proper processing
 * - Content helpers standardize data extraction
 */

import { Document, DocumentType, DocumentStatus } from '../rag/types'

/**
 * Generate a unique document ID
 * Uses timestamp + random suffix for collision avoidance
 */
export function generateDocumentId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `doc_${timestamp}_${random}`
}

/**
 * Generate a deterministic ID based on file content
 * Useful for deduplication
 */
export function generateContentBasedId(file: File): string {
  const content = `${file.name}_${file.size}_${file.lastModified}`
  return `doc_${btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`
}

/**
 * Detect document type from file extension and MIME type
 */
export function detectDocumentType(file: File): DocumentType {
  const extension = getFileExtension(file.name).toLowerCase()
  const mimeType = file.type.toLowerCase()

  // PDF files
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf'
  }

  // Text files
  if (extension === 'txt' || mimeType === 'text/plain') {
    return 'txt'
  }

  // Word documents
  if (
    extension === 'docx' || 
    extension === 'doc' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return 'docx'
  }

  // PowerPoint presentations
  if (
    extension === 'pptx' || 
    extension === 'ppt' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return 'pptx'
  }

  // Excel spreadsheets
  if (
    extension === 'xlsx' || 
    extension === 'xls' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'xlsx'
  }

  // Image files
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension) ||
    mimeType.startsWith('image/')
  ) {
    return 'image'
  }

  // HTML files
  if (
    extension === 'html' || 
    extension === 'htm' ||
    mimeType === 'text/html'
  ) {
    return 'html'
  }

  // Markdown files
  if (
    extension === 'md' || 
    extension === 'markdown' ||
    mimeType === 'text/markdown'
  ) {
    return 'markdown'
  }

  // CSV files
  if (
    extension === 'csv' ||
    mimeType === 'text/csv'
  ) {
    return 'csv'
  }

  // JSON files
  if (
    extension === 'json' ||
    mimeType === 'application/json'
  ) {
    return 'json'
  }

  // XML files
  if (
    extension === 'xml' ||
    mimeType === 'application/xml' ||
    mimeType === 'text/xml'
  ) {
    return 'xml'
  }

  // Default to unknown type for unsupported files
  return 'txt' // Default to text for unknown types
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex + 1)
}

/**
 * Validate document object structure
 */
export function validateDocument(document: Partial<Document>): document is Document {
  return !!(
    document.id &&
    document.name &&
    document.type &&
    document.status &&
    document.uploadedAt &&
    typeof document.size === 'number'
  )
}

/**
 * Create a new document object with defaults
 */
export function createDocument(
  file: File,
  options: {
    id?: string
    status?: DocumentStatus
    metadata?: Record<string, unknown>
  } = {}
): Document {
  const now = new Date()
  
  return {
    id: options.id || generateDocumentId(),
    name: file.name,
    type: detectDocumentType(file),
    status: options.status || 'processing',
    uploadedAt: now,
    lastModified: now,
    size: file.size,
    metadata: {
      originalFileName: file.name,
      originalFileSize: file.size,
      ...options.metadata
    },
    content: '', // Will be filled during processing
    embedding: undefined, // Will be generated during processing
    aiAnalysis: undefined, // Will be generated during processing
    visualContent: undefined // Will be generated for images/PDFs
  }
}

/**
 * Update document status with timestamp
 */
export function updateDocumentStatus(
  document: Document, 
  status: DocumentStatus,
  updates: Partial<Document> = {}
): Document {
  return {
    ...document,
    ...updates,
    status,
    lastModified: new Date()
  }
}

/**
 * Check if document supports visual content extraction
 */
export function supportsVisualContent(document: Document): boolean {
  return ['pdf', 'image'].includes(document.type)
}

/**
 * Check if document supports text extraction
 */
export function supportsTextExtraction(document: Document): boolean {
  return !['image'].includes(document.type) // All except pure images
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get document processing priority based on type and size
 */
export function getProcessingPriority(document: Document): 'high' | 'medium' | 'low' {
  // High priority for small text files
  if (document.type === 'txt' && document.size < 100000) { // < 100KB
    return 'high'
  }
  
  // Medium priority for documents
  if (['pdf', 'docx', 'html', 'markdown'].includes(document.type)) {
    return 'medium'
  }
  
  // Low priority for large files and images
  return 'low'
}

/**
 * Extract keywords from document name and metadata
 */
export function extractKeywords(document: Document): string[] {
  const keywords = new Set<string>()
  
  // Extract from filename
  const nameWords = document.name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .split(/[^a-zA-Z0-9]+/)
    .filter(word => word.length > 2)
    .map(word => word.toLowerCase())
  
  nameWords.forEach(word => keywords.add(word))
  
  // Extract from metadata tags
  if (document.metadata?.tags) {
    document.metadata.tags.forEach((tag: string) => keywords.add(tag.toLowerCase()))
  }
  
  // Extract from metadata keywords
  if (document.metadata?.keywords) {
    document.metadata.keywords.forEach((keyword: string) => 
      keywords.add(keyword.toLowerCase())
    )
  }
  
  return Array.from(keywords)
}

/**
 * Check if document needs reprocessing
 */
export function needsReprocessing(document: Document): boolean {
  // Document failed processing
  if (document.status === 'error') {
    return true
  }
  
  // Document is missing required data
  if (document.status === 'ready') {
    // Text documents should have content
    if (supportsTextExtraction(document) && !document.content) {
      return true
    }
    
    // Visual documents should have visual content
    if (supportsVisualContent(document) && !document.visualContent) {
      return true
    }
    
    // All documents should have embeddings for search
    if (!document.embedding) {
      return true
    }
  }
  
  return false
}

/**
 * Calculate document complexity score for processing estimation
 */
export function calculateComplexityScore(document: Document): number {
  let score = 0
  
  // Base score by type
  const typeScores: Record<DocumentType, number> = {
    txt: 1,
    markdown: 1,
    html: 2,
    csv: 1,
    json: 1,
    xml: 2,
    pdf: 4,
    docx: 3,
    pptx: 3,
    xlsx: 2,
    image: 3,
    rtf: 2,
    odt: 3,
    ods: 2,
    odp: 3,
    epub: 3,
    mobi: 3,
    azw: 3,
    log: 1,
    yaml: 1,
    toml: 1,
    ini: 1,
    cfg: 1,
    js: 2,
    py: 2,
    css: 1,
    sql: 2,
    php: 2,
    java: 2,
    cpp: 3,
    ruby: 2,
    go: 2,
    rust: 3,
    swift: 2,
    kotlin: 2
  }
  
  score += typeScores[document.type] || 2
  
  // Size factor (logarithmic)
  const sizeMB = document.size / (1024 * 1024)
  score += Math.log10(sizeMB + 1) * 2
  
  // Visual content increases complexity
  if (supportsVisualContent(document)) {
    score += 2
  }
  
  return Math.round(score * 10) / 10
}

/**
 * Estimate processing time in seconds
 */
export function estimateProcessingTime(document: Document): number {
  const complexity = calculateComplexityScore(document)
  const baseTime = 5 // 5 seconds base
  
  return Math.round(baseTime * complexity)
}

/**
 * Create a document summary for display
 */
export function createDocumentSummary(document: Document): {
  id: string
  name: string
  type: DocumentType
  status: DocumentStatus
  size: string
  uploadedAt: string
  hasContent: boolean
  hasEmbedding: boolean
  hasVisualContent: boolean
  complexity: number
  keywords: string[]
} {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    status: document.status,
    size: formatFileSize(document.size),
    uploadedAt: document.uploadedAt.toLocaleDateString(),
    hasContent: !!document.content,
    hasEmbedding: !!document.embedding,
    hasVisualContent: !!document.visualContent,
    complexity: calculateComplexityScore(document),
    keywords: extractKeywords(document)
  }
}
