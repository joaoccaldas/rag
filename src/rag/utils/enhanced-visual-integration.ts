/**
 * Enhanced Visual Analysis Integration
 * 
 * This module integrates the enhanced visual analysis system with the existing
 * document processing pipeline, providing seamless visual element detection,
 * individual LLM analysis, and storage integration.
 */

import type { Document } from '../types'
import { EnhancedVisualAnalyzer, VisualAnalysisStorage, VisualAnalysisIntegration, type VisualElementAnalysis } from './enhanced-visual-analysis'

/**
 * Enhanced Document Processor with Visual Analysis
 * 
 * Extends the existing document processing to include comprehensive
 * visual element analysis with AI-powered insights.
 */
export class EnhancedDocumentProcessor {
  private visualAnalyzer: EnhancedVisualAnalyzer
  
  constructor(options: { aiModel?: string; confidenceThreshold?: number } = {}) {
    this.visualAnalyzer = new EnhancedVisualAnalyzer({
      aiModel: options.aiModel || 'llama3:latest',
      confidenceThreshold: options.confidenceThreshold || 0.7
    })
  }
  
  /**
   * Process document with enhanced visual analysis
   */
  async processDocument(document: Document): Promise<Document> {
    console.log(`🔬 Processing document with enhanced visual analysis: ${document.name}`)
    
    try {
      // Step 1: Run enhanced visual analysis
      const analysisReport = await this.visualAnalyzer.analyzeDocument(document)
      
      // Step 2: Store analysis results
      await VisualAnalysisStorage.store(analysisReport)
      
      // Step 3: Integrate results with document
      const enhancedDocument = await VisualAnalysisIntegration.processDocumentWithEnhancedAnalysis(document)
      
      // Step 4: Update document metadata with analysis summary
      const updatedDocument = {
        ...enhancedDocument,
        metadata: {
          ...enhancedDocument.metadata,
          enhancedVisualAnalysis: {
            totalElements: analysisReport.totalElements,
            primaryVisualTypes: analysisReport.overallInsights.primaryVisualTypes,
            visualContentDensity: analysisReport.overallInsights.visualContentDensity,
            processedAt: analysisReport.analysisMetadata.processedAt,
            confidence: analysisReport.analysisMetadata.confidence
          }
        }
      }
      
      console.log(`✅ Enhanced visual analysis complete: ${analysisReport.totalElements} elements detected`)
      return updatedDocument
      
    } catch (error) {
      console.error('Enhanced visual analysis failed:', error)
      // Return original document if analysis fails
      return document
    }
  }
  
  /**
   * Batch process multiple documents
   */
  async batchProcessDocuments(documents: Document[]): Promise<Document[]> {
    console.log(`🔄 Batch processing ${documents.length} documents with enhanced visual analysis`)
    
    const results = await Promise.allSettled(
      documents.map(doc => this.processDocument(doc))
    )
    
    const processedDocuments = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Failed to process document ${documents[index].name}:`, result.reason)
        return documents[index] // Return original on failure
      }
    })
    
    console.log(`✅ Batch processing complete: ${processedDocuments.length} documents processed`)
    return processedDocuments
  }
  
  /**
   * Get visual analysis statistics across all processed documents
   */
  async getGlobalVisualStats() {
    return VisualAnalysisStorage.getGlobalStatistics()
  }
  
  /**
   * Get detailed analysis for specific document
   */
  async getDocumentAnalysis(documentId: string) {
    return VisualAnalysisStorage.get(documentId)
  }
}

/**
 * Visual Content Enhancement Service
 * 
 * Provides utilities for enhancing visual content with AI analysis
 */
export class VisualContentEnhancementService {
  
  /**
   * Enhance existing visual content with detailed analysis
   */
  static async enhanceVisualContent(document: Document): Promise<Document> {
    if (!document.visualContent || document.visualContent.length === 0) {
      return document
    }
    
    console.log(`🎨 Enhancing visual content for: ${document.name}`)
    
    try {
      const enhancedVisualContent = await Promise.all(
        document.visualContent.map(async (visual) => {
          // Get detailed analysis if available
          const analysis = VisualAnalysisStorage.get(document.id)
          const elementAnalysis = analysis?.elements.find(el => el.id === visual.id)
          
          if (elementAnalysis) {
            // Enhance with detailed analysis - ensure challenges is always an array
            return {
              ...visual,
              llmSummary: {
                keyInsights: elementAnalysis.llmAnalysis.keyInsights,
                challenges: visual.llmSummary?.challenges || [],
                mainContent: elementAnalysis.llmAnalysis.purpose,
                significance: elementAnalysis.llmAnalysis.significance
              },
              metadata: {
                ...visual.metadata,
                enhancedAnalysis: true,
                analysisConfidence: elementAnalysis.confidence,
                lastEnhanced: new Date().toISOString()
              }
            }
          }
          
          return visual
        })
      )
      
      return {
        ...document,
        visualContent: enhancedVisualContent
      }
      
    } catch (error) {
      console.error('Visual content enhancement failed:', error)
      return document
    }
  }
  
  /**
   * Generate visual content summary for search indexing
   */
  static generateVisualSearchIndex(document: Document): string[] {
    const searchTerms: string[] = []
    
    if (!document.visualContent) return searchTerms
    
    document.visualContent.forEach(visual => {
      // Add basic visual metadata
      searchTerms.push(visual.type, visual.title || '')
      
      // Add LLM analysis terms if available
      if (visual.llmSummary) {
        searchTerms.push(
          ...(visual.llmSummary.keyInsights || []),
          ...(visual.llmSummary.challenges || []),
          visual.llmSummary.mainContent || ''
        )
      }
      
      // Add enhanced analysis terms if available
      if (visual.llmSummary && 'significance' in visual.llmSummary) {
        const extendedSummary = visual.llmSummary as Record<string, unknown>
        if (Array.isArray(extendedSummary.businessImplications)) {
          searchTerms.push(...extendedSummary.businessImplications as string[])
        }
        if (Array.isArray(extendedSummary.technicalDetails)) {
          searchTerms.push(...extendedSummary.technicalDetails as string[])
        }
        if (Array.isArray(extendedSummary.recommendations)) {
          searchTerms.push(...extendedSummary.recommendations as string[])
        }
      }
    })
    
    // Clean and return unique terms
    return [...new Set(searchTerms)]
      .filter(term => term && term.length > 2)
      .map(term => term.toLowerCase())
  }
}

/**
 * Visual Analytics Service
 * 
 * Provides analytics and insights about visual content across documents
 */
export class VisualAnalyticsService {
  
  /**
   * Generate comprehensive visual analytics report
   */
  static async generateAnalyticsReport() {
    const globalStats = VisualAnalysisStorage.getGlobalStatistics()
    const allReports = VisualAnalysisStorage.getAll()
    
    // Calculate advanced metrics
    const documentIds = Object.keys(allReports)
    const allElements = documentIds.flatMap(id => allReports[id].elements)
    
    // Complexity analysis
    const complexityMetrics = this.calculateComplexityMetrics(allElements)
    
    // Significance analysis
    const significanceMetrics = this.calculateSignificanceMetrics(allElements)
    
    // Trend analysis
    const trendMetrics = this.calculateTrendMetrics(allElements)
    
    // Business insights
    const businessInsights = this.extractBusinessInsights(allElements)
    
    return {
      overview: {
        totalDocuments: globalStats.totalDocuments,
        totalElements: globalStats.totalElements,
        avgElementsPerDocument: globalStats.avgElementsPerDocument,
        mostCommonTypes: globalStats.mostCommonTypes
      },
      complexity: complexityMetrics,
      significance: significanceMetrics,
      trends: trendMetrics,
      insights: businessInsights,
      generatedAt: new Date().toISOString()
    }
  }
  
  private static calculateComplexityMetrics(elements: VisualElementAnalysis[]) {
    const complexity = elements.reduce((acc, el) => {
      acc[el.complexity] = (acc[el.complexity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const total = elements.length
    return {
      distribution: complexity,
      percentages: {
        simple: total > 0 ? ((complexity.simple || 0) / total * 100).toFixed(1) : '0',
        moderate: total > 0 ? ((complexity.moderate || 0) / total * 100).toFixed(1) : '0',
        complex: total > 0 ? ((complexity.complex || 0) / total * 100).toFixed(1) : '0'
      },
      averageComplexity: this.calculateAverageComplexity(elements)
    }
  }
  
  private static calculateSignificanceMetrics(elements: VisualElementAnalysis[]) {
    const significance = elements.reduce((acc, el) => {
      const sig = el.llmAnalysis?.significance || 'medium'
      acc[sig] = (acc[sig] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const total = elements.length
    return {
      distribution: significance,
      percentages: {
        low: total > 0 ? ((significance.low || 0) / total * 100).toFixed(1) : '0',
        medium: total > 0 ? ((significance.medium || 0) / total * 100).toFixed(1) : '0',
        high: total > 0 ? ((significance.high || 0) / total * 100).toFixed(1) : '0',
        critical: total > 0 ? ((significance.critical || 0) / total * 100).toFixed(1) : '0'
      },
      criticalElements: elements.filter(el => el.llmAnalysis?.significance === 'critical').length
    }
  }
  
  private static calculateTrendMetrics(elements: VisualElementAnalysis[]) {
    const trends = elements.reduce((acc, el) => {
      if (el.contentAnalysis?.trends) {
        el.contentAnalysis.trends.forEach((trend: string) => {
          acc[trend] = (acc[trend] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)
    
    return {
      detectedTrends: Object.entries(trends)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([trend, count]) => ({ trend, count })),
      totalTrendElements: elements.filter(el => 
        el.contentAnalysis?.trends && el.contentAnalysis.trends.length > 0
      ).length
    }
  }
  
  private static extractBusinessInsights(elements: VisualElementAnalysis[]) {
    const allInsights = elements.flatMap(el => 
      el.llmAnalysis?.businessImplications || []
    )
    
    const allRecommendations = elements.flatMap(el => 
      el.llmAnalysis?.recommendations || []
    )
    
    return {
      topBusinessImplications: this.getTopItems(allInsights, 5),
      topRecommendations: this.getTopItems(allRecommendations, 5),
      elementsWithBusinessValue: elements.filter(el => 
        el.llmAnalysis?.businessImplications?.length > 0
      ).length
    }
  }
  
  private static getTopItems(items: string[], limit: number) {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }))
  }
  
  private static calculateAverageComplexity(elements: VisualElementAnalysis[]): number {
    const complexityScores = elements.map(el => {
      switch (el.complexity) {
        case 'simple': return 1
        case 'moderate': return 2
        case 'complex': return 3
        default: return 2
      }
    })
    
    return complexityScores.length > 0 
      ? complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length 
      : 0
  }
}

/**
 * Export utilities for easy integration
 */
export {
  EnhancedVisualAnalyzer,
  VisualAnalysisStorage,
  VisualAnalysisIntegration
} from './enhanced-visual-analysis'
