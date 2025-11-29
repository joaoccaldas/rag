/**
 * Document Processing Integration Script
 * 
 * Integrates enhanced visual analysis into the document processing workflow
 */

import type { Document } from '../rag/types'
import { EnhancedDocumentProcessor } from '../rag/utils/enhanced-visual-integration'

/**
 * Enhanced Document Processing Worker Integration
 * 
 * This function integrates enhanced visual analysis into the existing
 * document processing pipeline seamlessly.
 */
export async function processDocumentWithEnhancedAnalysis(document: Document): Promise<Document> {
  console.log(`🚀 Starting enhanced document processing for: ${document.name}`)
  
  try {
    // Initialize enhanced processor
    const processor = new EnhancedDocumentProcessor({
      aiModel: 'llama3:latest',
      confidenceThreshold: 0.7
    })
    
    // Process with enhanced visual analysis
    const enhancedDocument = await processor.processDocument(document)
    
    console.log(`✅ Enhanced processing complete for: ${document.name}`)
    console.log(`📊 Analysis results:`, {
      totalElements: enhancedDocument.metadata?.enhancedVisualAnalysis?.totalElements || 0,
      primaryTypes: enhancedDocument.metadata?.enhancedVisualAnalysis?.primaryVisualTypes || [],
      density: enhancedDocument.metadata?.enhancedVisualAnalysis?.visualContentDensity || 'unknown',
      confidence: enhancedDocument.metadata?.enhancedVisualAnalysis?.confidence || 0
    })
    
    return enhancedDocument
    
  } catch (error) {
    console.error(`❌ Enhanced processing failed for ${document.name}:`, error)
    return document // Return original document on failure
  }
}

/**
 * Batch process multiple documents with enhanced analysis
 */
export async function batchProcessDocumentsWithEnhancedAnalysis(documents: Document[]): Promise<Document[]> {
  console.log(`🔄 Starting batch enhanced processing for ${documents.length} documents`)
  
  const processor = new EnhancedDocumentProcessor({
    aiModel: 'llama3:latest',
    confidenceThreshold: 0.7
  })
  
  const results = await processor.batchProcessDocuments(documents)
  
  console.log(`✅ Batch processing complete: ${results.length} documents processed`)
  return results
}

/**
 * Test function to validate enhanced visual analysis
 */
export async function testEnhancedVisualAnalysis() {
  console.log('🧪 Testing Enhanced Visual Analysis System')
  
  // Create test document with visual content patterns
  const testDocument: Document = {
    id: 'test-doc-001',
    name: 'Test Document - Enhanced Visual Analysis',
    type: 'txt',
    content: `
      This document contains various visual elements for testing:
      
      # Sales Performance Report
      
      The following bar chart shows quarterly sales performance:
      [Bar Chart: Q1-Q4 Sales Data]
      
      | Quarter | Sales ($M) | Growth (%) |
      |---------|------------|------------|
      | Q1      | 12.5       | 8.2        |
      | Q2      | 13.8       | 10.4       |
      | Q3      | 15.2       | 10.1       |
      | Q4      | 16.9       | 11.2       |
      
      The line chart below illustrates the trend over time:
      [Line Chart: Sales Trend Analysis]
      
      Process Flow Diagram:
      [Flowchart: Customer Acquisition Process]
      
      Technical specifications infographic:
      [Infographic: Product Features Overview]
    `,
    status: 'ready',
    uploadedAt: new Date(),
    lastModified: new Date(),
    size: 2048,
    metadata: {
      keywords: ['sales', 'performance', 'report', 'quarterly'],
      domain: 'business',
      processingStats: {
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        duration: 1000,
        chunks: 1,
        totalTokens: 500
      }
    }
  }
  
  try {
    // Process with enhanced analysis
    const enhancedDoc = await processDocumentWithEnhancedAnalysis(testDocument)
    
    console.log('✅ Test completed successfully!')
    console.log('📊 Test results:', {
      originalContent: testDocument.content.length,
      enhancedMetadata: enhancedDoc.metadata?.enhancedVisualAnalysis,
      visualContentCount: enhancedDoc.visualContent?.length || 0
    })
    
    return enhancedDoc
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

/**
 * Utility function to check if enhanced analysis is available for a document
 */
export function hasEnhancedVisualAnalysis(document: Document): boolean {
  return !!(document.metadata?.enhancedVisualAnalysis)
}

/**
 * Get enhanced visual analysis summary for a document
 */
export function getEnhancedAnalysisSummary(document: Document) {
  const analysis = document.metadata?.enhancedVisualAnalysis
  
  if (!analysis) {
    return {
      available: false,
      message: 'Enhanced visual analysis not available for this document'
    }
  }
  
  return {
    available: true,
    totalElements: analysis.totalElements,
    primaryTypes: analysis.primaryVisualTypes,
    density: analysis.visualContentDensity,
    confidence: analysis.confidence,
    processedAt: analysis.processedAt
  }
}

// Export types for use in other components
export type { Document } from '../rag/types'
export { 
  EnhancedDocumentProcessor,
  VisualAnalysisStorage,
  VisualAnalyticsService
} from '../rag/utils/enhanced-visual-integration'
