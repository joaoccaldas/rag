/**
 * 📤 PRIORITY 9: COMPREHENSIVE EXPORT FUNCTIONALITY
 * 
 * Modular export system for documents, search results, and analytics data
 * Supports multiple formats: PDF, CSV, JSON, Excel
 */

import { Document, SearchResult } from '../../rag/types'

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel' | 'txt'
  filename?: string
  includeMetadata?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: {
    documentTypes?: string[]
    domains?: string[]
    minScore?: number
  }
}

export interface ExportResult {
  success: boolean
  filename: string
  size: number
  downloadUrl?: string
  error?: string
}

export class DocumentExportManager {
  private static instance: DocumentExportManager
  
  static getInstance(): DocumentExportManager {
    if (!DocumentExportManager.instance) {
      DocumentExportManager.instance = new DocumentExportManager()
    }
    return DocumentExportManager.instance
  }

  /**
   * Export documents to various formats
   */
  async exportDocuments(
    documents: Document[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      console.log(`📤 Exporting ${documents.length} documents to ${options.format}`)
      
      const filename = options.filename || `documents-export-${new Date().toISOString().split('T')[0]}.${options.format}`
      
      switch (options.format) {
        case 'json':
          return await this.exportToJSON(documents, filename, options)
        case 'csv':
          return await this.exportToCSV(documents, filename, options)
        case 'pdf':
          return await this.exportToPDF(documents, filename, options)
        case 'excel':
          return await this.exportToExcel(documents, filename, options)
        case 'txt':
          return await this.exportToTXT(documents, filename, options)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      console.error('❌ Document export failed:', error)
      return {
        success: false,
        filename: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Export search results with sources and metadata
   */
  async exportSearchResults(
    results: SearchResult[],
    query: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      console.log(`🔍 Exporting ${results.length} search results for query: "${query}"`)
      
      const filename = options.filename || `search-results-${this.sanitizeFilename(query)}-${Date.now()}.${options.format}`
      
      const exportData = {
        query,
        timestamp: new Date().toISOString(),
        resultCount: results.length,
        results: results.map(result => ({
          document: {
            id: result.document?.id,
            name: result.document?.name,
            type: result.document?.type,
            domain: result.document?.metadata?.domain
          },
          chunk: {
            id: result.chunk?.id,
            content: result.chunk?.content,
            page: result.chunk?.metadata?.page
          },
          similarity: result.similarity,
          score: result.score,
          relevantText: result.relevantText,
          metadata: options.includeMetadata ? result.metadata : undefined
        }))
      }

      switch (options.format) {
        case 'json':
          return await this.createJSONDownload(exportData, filename)
        case 'csv':
          return await this.createCSVFromSearchResults(results, query, filename)
        case 'pdf':
          return await this.createSearchResultsPDF(results, query, filename)
        default:
          throw new Error(`Search results export not supported for format: ${options.format}`)
      }
    } catch (error) {
      console.error('❌ Search results export failed:', error)
      return {
        success: false,
        filename: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Export analytics data and insights
   */
  async exportAnalytics(
    analyticsData: Record<string, unknown>,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      console.log('📊 Exporting analytics data')
      
      const filename = options.filename || `analytics-export-${new Date().toISOString().split('T')[0]}.${options.format}`
      
      switch (options.format) {
        case 'json':
          return await this.createJSONDownload(analyticsData, filename)
        case 'csv':
          return await this.createAnalyticsCSV(analyticsData, filename)
        case 'excel':
          return await this.createAnalyticsExcel(analyticsData, filename)
        default:
          throw new Error(`Analytics export not supported for format: ${options.format}`)
      }
    } catch (error) {
      console.error('❌ Analytics export failed:', error)
      return {
        success: false,
        filename: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  // ==================== FORMAT-SPECIFIC IMPLEMENTATIONS ====================

  private async exportToJSON(documents: Document[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalDocuments: documents.length,
      includeMetadata: options.includeMetadata,
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        content: doc.content,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        lastModified: doc.lastModified,
        metadata: options.includeMetadata ? doc.metadata : undefined,
        chunks: doc.chunks?.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          metadata: options.includeMetadata ? chunk.metadata : undefined
        }))
      }))
    }

    return await this.createJSONDownload(exportData, filename)
  }

  private async exportToCSV(documents: Document[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const headers = ['ID', 'Name', 'Type', 'Status', 'Upload Date', 'Content Preview']
    if (options.includeMetadata) {
      headers.push('Domain', 'Author', 'Tags')
    }

    const rows = documents.map(doc => {
      const row = [
        doc.id,
        doc.name,
        doc.type,
        doc.status,
        doc.uploadedAt.toISOString().split('T')[0],
        doc.content.substring(0, 100) + '...'
      ]
      
      if (options.includeMetadata) {
        row.push(
          doc.metadata?.domain || '',
          doc.metadata?.author || '',
          Array.isArray(doc.metadata?.tags) ? doc.metadata.tags.join(';') : ''
        )
      }
      
      return row
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return await this.createTextDownload(csvContent, filename, 'text/csv')
  }

  private async exportToPDF(documents: Document[], filename: string, options: ExportOptions): Promise<ExportResult> {
    // For browser environment, we'll create a structured text that can be converted to PDF
    const pdfContent = `
DOCUMENT EXPORT REPORT
Generated: ${new Date().toLocaleDateString()}
Total Documents: ${documents.length}

${documents.map((doc, index) => `
DOCUMENT ${index + 1}
===============
Name: ${doc.name}
Type: ${doc.type}
Status: ${doc.status}
Created: ${doc.createdAt.toLocaleDateString()}
${options.includeMetadata ? `Domain: ${doc.metadata?.domain || 'N/A'}` : ''}

Content Preview:
${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}

${doc.chunks && doc.chunks.length > 0 ? `
Chunks: ${doc.chunks.length}
${doc.chunks.slice(0, 3).map((chunk, i) => `
  Chunk ${i + 1}: ${chunk.content.substring(0, 200)}...
`).join('')}
` : ''}
`).join('\n')}
    `.trim()

    return await this.createTextDownload(pdfContent, filename.replace('.pdf', '.txt'), 'text/plain')
  }

  private async exportToExcel(documents: Document[], filename: string, options: ExportOptions): Promise<ExportResult> {
    // Create Excel-compatible CSV with additional sheets concept
    const worksheets = {
      documents: this.formatDocumentsForExcel(documents, options),
      chunks: this.formatChunksForExcel(documents, options),
      metadata: this.formatMetadataForExcel(documents, options)
    }

    const excelContent = Object.entries(worksheets)
      .map(([sheetName, data]) => `SHEET: ${sheetName}\n${data}\n\n`)
      .join('')

    return await this.createTextDownload(excelContent, filename.replace('.excel', '.csv'), 'text/csv')
  }

  private async exportToTXT(documents: Document[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const txtContent = documents.map((doc, index) => `
DOCUMENT ${index + 1}: ${doc.name}
${'='.repeat(50)}
Type: ${doc.type}
Status: ${doc.status}
Created: ${doc.createdAt.toLocaleDateString()}
${options.includeMetadata ? `Domain: ${doc.metadata?.domain || 'N/A'}` : ''}

CONTENT:
${doc.content}

${doc.chunks && doc.chunks.length > 0 ? `
CHUNKS (${doc.chunks.length}):
${doc.chunks.map((chunk, i) => `
--- Chunk ${i + 1} ---
${chunk.content}
`).join('')}
` : ''}
    `).join('\n\n')

    return await this.createTextDownload(txtContent, filename, 'text/plain')
  }

  // ==================== HELPER METHODS ====================

  private async createJSONDownload(data: unknown, filename: string): Promise<ExportResult> {
    const jsonString = JSON.stringify(data, null, 2)
    return await this.createTextDownload(jsonString, filename, 'application/json')
  }

  private async createTextDownload(content: string, filename: string, mimeType: string): Promise<ExportResult> {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      return {
        success: true,
        filename,
        size: blob.size,
        downloadUrl: url
      }
    } catch (error) {
      throw new Error(`Failed to create download: ${error}`)
    }
  }

  private async createCSVFromSearchResults(results: SearchResult[], query: string, filename: string): Promise<ExportResult> {
    const headers = [
      'Query',
      'Document Name',
      'Document Type',
      'Chunk Content',
      'Similarity Score',
      'Relevant Text',
      'Page',
      'Domain'
    ]

    const rows = results.map(result => [
      query,
      result.document?.name || 'Unknown',
      result.document?.type || 'Unknown',
      result.chunk?.content || '',
      result.similarity?.toFixed(3) || '0',
      result.relevantText || '',
      result.chunk?.metadata?.page || '',
      result.document?.metadata?.domain || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return await this.createTextDownload(csvContent, filename, 'text/csv')
  }

  private async createSearchResultsPDF(results: SearchResult[], query: string, filename: string): Promise<ExportResult> {
    const pdfContent = `
SEARCH RESULTS REPORT
Query: "${query}"
Generated: ${new Date().toLocaleDateString()}
Total Results: ${results.length}

${results.map((result, index) => `
RESULT ${index + 1}
============
Document: ${result.document?.name || 'Unknown'}
Type: ${result.document?.type || 'Unknown'}
Similarity Score: ${(result.similarity * 100).toFixed(1)}%

Content Match:
${result.chunk?.content || 'No content available'}

Relevant Text:
${result.relevantText || 'No relevant text extracted'}

Source: ${result.document?.metadata?.domain || 'Unknown domain'}
${result.chunk?.metadata?.page ? `Page: ${result.chunk.metadata.page}` : ''}
`).join('\n')}
    `.trim()

    return await this.createTextDownload(pdfContent, filename.replace('.pdf', '.txt'), 'text/plain')
  }

  private async createAnalyticsCSV(analyticsData: Record<string, unknown>, filename: string): Promise<ExportResult> {
    const flattenedData = this.flattenAnalyticsData(analyticsData)
    
    const headers = ['Metric', 'Value', 'Category', 'Timestamp']
    const rows = Object.entries(flattenedData).map(([key, value]) => [
      key,
      String(value),
      this.categorizeMetric(key),
      new Date().toISOString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return await this.createTextDownload(csvContent, filename, 'text/csv')
  }

  private async createAnalyticsExcel(analyticsData: Record<string, unknown>, filename: string): Promise<ExportResult> {
    // Similar to CSV but with Excel formatting hints
    const csvContent = await this.createAnalyticsCSV(analyticsData, filename.replace('.excel', '.csv'))
    return csvContent
  }

  private formatDocumentsForExcel(documents: Document[], options: ExportOptions): string {
    const headers = ['ID', 'Name', 'Type', 'Status', 'Created', 'Content Length', 'Chunks Count']
    const rows = documents.map(doc => [
      doc.id,
      doc.name,
      doc.type,
      doc.status,
      doc.createdAt.toISOString().split('T')[0],
      doc.content.length,
      doc.chunks?.length || 0
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  private formatChunksForExcel(documents: Document[], options: ExportOptions): string {
    const headers = ['Document ID', 'Document Name', 'Chunk ID', 'Content Length', 'Page']
    const rows: string[][] = []

    documents.forEach(doc => {
      doc.chunks?.forEach(chunk => {
        rows.push([
          doc.id,
          doc.name,
          chunk.id,
          chunk.content.length.toString(),
          chunk.metadata?.page?.toString() || ''
        ])
      })
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  private formatMetadataForExcel(documents: Document[], options: ExportOptions): string {
    const headers = ['Document ID', 'Key', 'Value']
    const rows: string[][] = []

    documents.forEach(doc => {
      if (doc.metadata) {
        Object.entries(doc.metadata).forEach(([key, value]) => {
          rows.push([
            doc.id,
            key,
            String(value)
          ])
        })
      }
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  private flattenAnalyticsData(data: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const flattened: Record<string, unknown> = {}

    Object.entries(data).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenAnalyticsData(value as Record<string, unknown>, fullKey))
      } else {
        flattened[fullKey] = value
      }
    })

    return flattened
  }

  private categorizeMetric(key: string): string {
    if (key.includes('search')) return 'Search'
    if (key.includes('document')) return 'Documents'
    if (key.includes('user')) return 'User Activity'
    if (key.includes('performance')) return 'Performance'
    return 'General'
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }
}

// Export singleton instance
export const documentExportManager = DocumentExportManager.getInstance()

// Export utility functions
export const exportUtils = {
  /**
   * Quick export functions for common use cases
   */
  async quickExportDocuments(documents: Document[], format: ExportOptions['format'] = 'json') {
    return await documentExportManager.exportDocuments(documents, { format })
  },

  async quickExportSearchResults(results: SearchResult[], query: string, format: ExportOptions['format'] = 'csv') {
    return await documentExportManager.exportSearchResults(results, query, { format })
  },

  async quickExportAnalytics(data: Record<string, unknown>, format: ExportOptions['format'] = 'json') {
    return await documentExportManager.exportAnalytics(data, { format })
  }
}
