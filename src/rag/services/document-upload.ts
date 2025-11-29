/**
 * Document Upload Integration Service
 * Connects OCR extraction with document management and storage
 */

import { Document, VisualContent, DocumentType } from '../types'
import { ocrExtractionService, OCRExtractionOptions } from './ocr-extraction'
import { getVisualContentByDocument, storeVisualContent, deleteVisualContentByDocument } from '../utils/visual-content-storage'

export interface DocumentUploadResult {
  document: Document
  visualElements: VisualContent[]
  success: boolean
  error?: string
  processingTime: number
}

export interface DocumentUploadOptions extends OCRExtractionOptions {
  generateAISummary?: boolean
  extractKeywords?: boolean
  autoStore?: boolean
}

/**
 * Service for handling document uploads with OCR and AI processing
 */
export class DocumentUploadService {
  private static instance: DocumentUploadService | null = null

  private constructor() {}

  static getInstance(): DocumentUploadService {
    if (!DocumentUploadService.instance) {
      DocumentUploadService.instance = new DocumentUploadService()
    }
    return DocumentUploadService.instance
  }

  /**
   * Process and upload a document with OCR extraction
   */
  async processDocument(
    file: File,
    options: DocumentUploadOptions = {}
  ): Promise<DocumentUploadResult> {
    const startTime = Date.now()
    
    try {
      console.log(`📄 Processing document: ${file.name}`)

      // Extract OCR data
      const ocrResult = await ocrExtractionService.extractFromFile(file, options)
      console.log(`✅ OCR completed in ${ocrResult.processingTime}ms`)

      // Create document object
      const document: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: this.getDocumentType(file.type),
        content: ocrResult.text,
        status: 'ready',
        uploadedAt: new Date(),
        lastModified: new Date(file.lastModified),
        size: file.size,
        metadata: {
          title: file.name,
          pageCount: ocrResult.visualElements.filter(el => el.metadata?.pageNumber).length || 1,
          wordCount: ocrResult.text.split(/\s+/).length
        },
        aiAnalysis: {
          summary: '',
          keywords: [],
          tags: [],
          topics: [],
          sentiment: 'neutral',
          complexity: 'medium',
          documentType: file.type,
          confidence: ocrResult.confidence,
          analyzedAt: new Date(),
          model: 'ocr-extraction'
        }
      }

      // Add AI-generated summary if requested
      if (options.generateAISummary && ocrResult.text.trim().length > 0) {
        try {
          const summary = await this.generateAISummary(ocrResult.text)
          document.aiAnalysis!.summary = summary
        } catch (error) {
          console.warn('AI summary generation failed:', error)
        }
      }

      // Extract keywords if requested
      if (options.extractKeywords && ocrResult.text.trim().length > 0) {
        try {
          const keywords = await this.extractKeywords(ocrResult.text)
          document.aiAnalysis!.keywords = keywords
        } catch (error) {
          console.warn('Keyword extraction failed:', error)
        }
      }

      // Update visual elements with document ID and ensure proper structure
      const visualElements = ocrResult.visualElements.map(element => ({
        ...element,
        documentId: document.id,
        data: element.data || {},
        metadata: {
          ...element.metadata,
          extractedAt: element.metadata?.extractedAt || new Date().toISOString(),
          confidence: element.metadata?.confidence || ocrResult.confidence,
          documentTitle: element.metadata?.documentTitle || file.name
        }
      }))

      // Store visual content if auto-store is enabled
      if (options.autoStore !== false && visualElements.length > 0) {
        try {
          // Store using the standardized visual content storage
          await storeVisualContent(visualElements)
          console.log(`💾 Stored ${visualElements.length} visual elements`)
        } catch (error) {
          console.warn('Failed to store visual elements:', error)
        }
      }

      // Store document in localStorage (basic storage)
      this.storeDocument(document)

      const processingTime = Date.now() - startTime

      return {
        document,
        visualElements,
        success: true,
        processingTime
      }

    } catch (error) {
      console.error('Document processing failed:', error)
      
      return {
        document: {} as Document,
        visualElements: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Generate AI summary using local LLM
   */
  private async generateAISummary(text: string): Promise<string> {
    try {
      // Mock AI summary for now - in production, integrate with Ollama
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.substring(0, 4000), // Limit text length
          maxLength: 200
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const result = await response.json()
      return result.summary || 'Summary generation failed'

    } catch (error) {
      console.warn('Using fallback summary generation:', error)
      
      // Fallback: simple text truncation
      const sentences = text.split('. ').filter(s => s.length > 10)
      const summary = sentences.slice(0, 3).join('. ')
      return summary.length > 0 ? summary + '.' : 'No summary available'
    }
  }

  /**
   * Extract keywords using AI
   */
  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await fetch('/api/ai/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.substring(0, 2000), // Limit text length
          maxKeywords: 10
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const result = await response.json()
      return result.keywords || []

    } catch (error) {
      console.warn('Using fallback keyword extraction:', error)
      
      // Fallback: simple word frequency analysis
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)

      const frequency: { [key: string]: number } = {}
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1
      })

      return Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([word]) => word)
    }
  }

  /**
   * Get document type from MIME type
   */
  private getDocumentType(mimeType: string): DocumentType {
    const typeMap: { [key: string]: DocumentType } = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/markdown': 'markdown',
      'application/json': 'json',
      'text/csv': 'csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/html': 'html',
      'application/xml': 'xml',
      'text/xml': 'xml',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image'
    }
    
    return typeMap[mimeType] || 'txt'
  }

  /**
   * Store document in localStorage
   */
  private storeDocument(document: Document): void {
    try {
      const existingDocs = this.getStoredDocuments()
      const updatedDocs = [...existingDocs, document]
      localStorage.setItem('rag_documents', JSON.stringify(updatedDocs))
      console.log(`💾 Document stored: ${document.id}`)
    } catch (error) {
      console.error('Failed to store document:', error)
    }
  }

  /**
   * Get all stored documents
   */
  getStoredDocuments(): Document[] {
    try {
      const docs = localStorage.getItem('rag_documents')
      return docs ? JSON.parse(docs) : []
    } catch (error) {
      console.error('Failed to retrieve documents:', error)
      return []
    }
  }

  /**
   * Get document by ID with visual content
   */
  async getDocumentWithVisualContent(documentId: string): Promise<{
    document: Document | null
    visualContent: VisualContent[]
  }> {
    const documents = this.getStoredDocuments()
    const document = documents.find(doc => doc.id === documentId) || null
    
    let visualContent: VisualContent[] = []
    if (document) {
      try {
        visualContent = await getVisualContentByDocument(documentId)
      } catch (error) {
        console.warn('Failed to load visual content:', error)
      }
    }

    return { document, visualContent }
  }

  /**
   * Delete document and associated visual content
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Remove from documents storage
      const documents = this.getStoredDocuments()
      const filteredDocs = documents.filter(doc => doc.id !== documentId)
      localStorage.setItem('rag_documents', JSON.stringify(filteredDocs))

      // Remove associated visual content using standardized storage
      try {
        await deleteVisualContentByDocument(documentId)
      } catch (error) {
        console.warn(`Failed to delete visual content for document ${documentId}:`, error)
      }

      console.log(`🗑️ Document deleted: ${documentId}`)
      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      return false
    }
  }

  /**
   * Search documents by text content
   */
  searchDocuments(query: string): Document[] {
    const documents = this.getStoredDocuments()
    const lowercaseQuery = query.toLowerCase()
    
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.content.toLowerCase().includes(lowercaseQuery) ||
      doc.metadata?.summary?.toLowerCase().includes(lowercaseQuery) ||
      doc.aiAnalysis?.keywords?.some((keyword: string) => 
        keyword.toLowerCase().includes(lowercaseQuery)
      )
    )
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalDocuments: number
    totalVisualElements: number
    averageProcessingTime: number
    totalStorage: number
  } {
    const documents = this.getStoredDocuments()
    
    const totalDocuments = documents.length
    const totalProcessingTime = documents.reduce((sum, doc) => 
      sum + (doc.aiAnalysis?.confidence ? 1000 : 0), 0 // Estimate processing time
    )
    const averageProcessingTime = totalDocuments > 0 ? totalProcessingTime / totalDocuments : 0
    
    // Estimate storage usage
    const documentsSize = JSON.stringify(documents).length
    const visualContentSize = (localStorage.getItem('visual_content') || '').length
    const totalStorage = documentsSize + visualContentSize

    // Count visual elements
    const visualContentString = localStorage.getItem('visual_content') || '[]'
    let totalVisualElements = 0
    try {
      const visualContent = JSON.parse(visualContentString)
      totalVisualElements = Array.isArray(visualContent) ? visualContent.length : 0
    } catch {
      totalVisualElements = 0
    }

    return {
      totalDocuments,
      totalVisualElements,
      averageProcessingTime,
      totalStorage
    }
  }
}

// Export singleton instance
export const documentUploadService = DocumentUploadService.getInstance()
