/**
 * Enhanced RAG Context Adapter
 * 
 * Adapts the new Enhanced RAG Pipeline to work with the existing RAG Context.
 * Provides backward compatibility while enabling the new features.
 * 
 * Why: Maintains existing API compatibility while gradually introducing improvements.
 * Components can opt-in to enhanced features without breaking existing functionality.
 */

import { Document, SearchResult, DocumentType, DocumentStatus, DocumentChunk } from '../types'
import { EnhancedRAGPipeline, ProcessedDocument, EnhancedSearchResult, RAGPerformanceMetrics } from '../utils/enhanced-rag-pipeline'

export interface SearchOptions {
  limit?: number
  threshold?: number
  useHybridSearch?: boolean
  enableCaching?: boolean
}

export interface RAGContextAdapter {
  // Enhanced pipeline instance
  pipeline: EnhancedRAGPipeline
  
  // Conversion methods
  convertDocumentToProcessed: (doc: Document) => Promise<ProcessedDocument>
  convertProcessedToDocument: (processed: ProcessedDocument) => Document
  convertEnhancedToSearchResult: (enhanced: EnhancedSearchResult) => SearchResult
  
  // Enhanced methods
  processDocumentEnhanced: (file: File) => Promise<Document>
  searchEnhanced: (query: string, options?: SearchOptions) => Promise<SearchResult[]>
  getPerformanceMetrics: () => RAGPerformanceMetrics | null
}

export class EnhancedRAGAdapter implements RAGContextAdapter {
  pipeline: EnhancedRAGPipeline
  private initialized = false

  constructor() {
    this.pipeline = new EnhancedRAGPipeline({
      vectorDB: {
        type: 'indexeddb',
        collectionName: 'miele_rag_enhanced'
      },
      chunking: {
        chunkingStrategy: 'hybrid',
        maxTokens: 500,
        preserveSemanticBoundaries: true
      },
      caching: {
        enabled: true,
        maxEntries: 1000,
        ttl: 30 * 60 * 1000
      },
      hybridSearch: {
        enabled: true,
        bm25Weight: 0.7,
        vectorWeight: 0.3
      },
      monitoring: {
        enabled: true,
        logQueries: true,
        trackPerformance: true
      }
    })
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.pipeline.initialize()
      this.initialized = true
      console.log('✅ Enhanced RAG Adapter initialized')
    }
  }

  async convertDocumentToProcessed(doc: Document): Promise<ProcessedDocument> {
    await this.ensureInitialized()
    
    return this.pipeline.processDocument(doc.content, {
      id: doc.id,
      title: doc.name,
      type: doc.type,
      sourceFile: doc.name // Use name instead of file property
    })
  }

  convertProcessedToDocument(processed: ProcessedDocument): Document {
    // Create a compatible document with simplified structure
    const doc: Partial<Document> = {
      id: processed.id,
      name: processed.title,
      content: processed.content,
      size: new Blob([processed.content]).size,
      uploadedAt: processed.metadata.processedAt,
      lastModified: processed.metadata.processedAt,
      embedding: processed.embedding || []
    }
    
    return doc as Document
  }

  convertEnhancedToSearchResult(enhanced: EnhancedSearchResult): SearchResult {
    // Create a simplified search result that matches the expected interface
    const result: Partial<SearchResult> = {
      similarity: enhanced.similarity,
      relevantText: enhanced.content.substring(0, 200)
    }
    
    return result as SearchResult
  }

  async processDocumentEnhanced(file: File): Promise<Document> {
    await this.ensureInitialized()
    
    try {
      const content = await this.extractTextFromFile(file)
      
      const processed = await this.pipeline.processDocument(content, {
        id: this.generateDocumentId(),
        title: file.name,
        type: this.getFileType(file),
        sourceFile: file.name
      })

      return this.convertProcessedToDocument(processed)
    } catch (error) {
      console.error('❌ Enhanced document processing failed:', error)
      throw error
    }
  }

  async searchEnhanced(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    await this.ensureInitialized()
    
    try {
      const enhancedResults = await this.pipeline.search(query, {
        limit: options.limit || 10,
        threshold: options.threshold || 0.3,
        useHybridSearch: options.useHybridSearch ?? true,
        enableCaching: options.enableCaching ?? true
      })

      return enhancedResults.map(result => this.convertEnhancedToSearchResult(result))
    } catch (error) {
      console.error('❌ Enhanced search failed:', error)
      throw error
    }
  }

  getPerformanceMetrics(): RAGPerformanceMetrics | null {
    if (!this.initialized) return null
    return this.pipeline.getMetrics()
  }

  // Helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  private generateDocumentId(): string {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf': return 'pdf'
      case 'docx':
      case 'doc': return 'document'
      case 'txt': return 'text'
      case 'md': return 'markdown'
      case 'json': return 'json'
      default: return 'unknown'
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    // For now, just handle text files directly
    // In production, you'd want proper file processing for PDFs, DOCX, etc.
    
    const fileType = this.getFileType(file)
    
    if (fileType === 'text' || fileType === 'markdown' || fileType === 'json') {
      return await file.text()
    }
    
    // For other file types, you'd integrate with file processing utilities
    // For now, return a placeholder
    return `[File content: ${file.name}, Type: ${fileType}, Size: ${file.size} bytes]`
  }

  private generateSummary(content: string): string {
    // Simple summary generation - first 200 characters
    if (content.length <= 200) return content
    
    const truncated = content.substring(0, 200)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...'
  }

  // Clean up methods
  async destroy(): Promise<void> {
    if (this.initialized) {
      await this.pipeline.destroy()
      this.initialized = false
      console.log('✅ Enhanced RAG Adapter destroyed')
    }
  }
}

// Singleton instance for use across the application
export const enhancedRAGAdapter = new EnhancedRAGAdapter()
