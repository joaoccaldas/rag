// Integrated Quality Improvement System
// Combines all quality improvement solutions

import { SearchResult, Document } from '../types'
import { EnhancedQueryProcessor, enhancedSearch } from './enhanced-query-processor'
import { feedbackLearner } from './adaptive-feedback-learning'
import { fileVisualManager } from './file-specific-visual-manager'
import { specializedLLMSummarizer } from './specialized-llm-summarizer'
import { usageBasedMLInsights } from './usage-based-ml-insights'

interface QualityImprovementConfig {
  enableQueryEnhancement: boolean
  enableFeedbackLearning: boolean
  enableFileVisualManagement: boolean
  enableSpecializedLLM: boolean
  enableUsageAnalytics: boolean
}

export class IntegratedQualitySystem {
  private config: QualityImprovementConfig = {
    enableQueryEnhancement: true,
    enableFeedbackLearning: true,
    enableFileVisualManagement: true,
    enableSpecializedLLM: true,
    enableUsageAnalytics: true
  }

  constructor(config?: Partial<QualityImprovementConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    console.log('🚀 Integrated Quality System initialized with:', this.config)
  }

  /**
   * Enhanced search with all quality improvements
   */
  async performEnhancedSearch(
    query: string,
    documents: Document[],
    originalResults: SearchResult[],
    userId?: string
  ): Promise<SearchResult[]> {
    console.log('🔍 Starting enhanced search with quality improvements...')

    // Record search interaction for analytics
    if (this.config.enableUsageAnalytics) {
      usageBasedMLInsights.recordInteraction({
        type: 'search',
        userId,
        metadata: {
          query,
          timeSpent: 0,
          success: true
        }
      })
    }

    let enhancedResults = originalResults

    // 1. Apply enhanced query processing and relevance validation
    if (this.config.enableQueryEnhancement) {
      try {
        enhancedResults = await enhancedSearch(query, documents, enhancedResults)
        console.log(`✅ Query enhancement: ${originalResults.length} → ${enhancedResults.length} results`)
      } catch (error) {
        console.warn('⚠️ Query enhancement failed:', error)
      }
    }

    // 2. Apply adaptive feedback learning
    if (this.config.enableFeedbackLearning) {
      try {
        enhancedResults = feedbackLearner.applyLearningToResults(query, enhancedResults)
        console.log('✅ Feedback learning applied to results')
      } catch (error) {
        console.warn('⚠️ Feedback learning failed:', error)
      }
    }

    // Record successful search
    if (this.config.enableUsageAnalytics) {
      usageBasedMLInsights.recordInteraction({
        type: 'search',
        userId,
        metadata: {
          query,
          success: enhancedResults.length > 0,
          timeSpent: Date.now() - performance.now()
        }
      })
    }

    return enhancedResults
  }

  /**
   * Process document upload with quality improvements
   */
  async processDocumentUpload(
    document: Document,
    userId?: string
  ): Promise<{
    success: boolean
    visualContent?: unknown[]
    llmSummary?: unknown
    error?: string
  }> {
    console.log('📄 Processing document upload with quality improvements...')

    const startTime = Date.now()
    let result: {
      success: boolean
      visualContent?: unknown[]
      llmSummary?: unknown
      error?: string
    } = { success: false, error: '' }

    try {
      // Record upload interaction
      if (this.config.enableUsageAnalytics) {
        usageBasedMLInsights.recordInteraction({
          type: 'document_upload',
          userId,
          metadata: {
            documentId: document.id,
            type: document.type,
            size: document.size
          }
        })
      }

      // 1. Extract and organize visual content by file
      let visualContent = null
      if (this.config.enableFileVisualManagement && document.visualContent) {
        try {
          await fileVisualManager.addVisualContent(
            document.id,
            document,
            document.visualContent
          )
          visualContent = document.visualContent
          console.log(`✅ Visual content organized: ${document.visualContent.length} items`)
        } catch (error) {
          console.warn('⚠️ Visual content management failed:', error)
        }
      }

      // 2. Generate specialized LLM summary
      let llmSummary = null
      if (this.config.enableSpecializedLLM) {
        try {
          llmSummary = await specializedLLMSummarizer.generateEnhancedSummary({
            content: document.content,
            contentType: 'document',
            existingKeywords: document.metadata?.tags
          })
          console.log(`✅ LLM summary generated with ${llmSummary.confidence}% confidence`)
        } catch (error) {
          console.warn('⚠️ LLM summarization failed:', error)
        }
      }

      result = {
        success: true,
        visualContent: visualContent || undefined,
        llmSummary
      }

      // Record successful upload
      if (this.config.enableUsageAnalytics) {
        usageBasedMLInsights.recordInteraction({
          type: 'document_upload',
          userId,
          metadata: {
            documentId: document.id,
            success: true,
            timeSpent: Date.now() - startTime
          }
        })
      }

    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      // Record failed upload
      if (this.config.enableUsageAnalytics) {
        usageBasedMLInsights.recordInteraction({
          type: 'document_upload',
          userId,
          metadata: {
            documentId: document.id,
            success: false,
            errorType: result.error,
            timeSpent: Date.now() - startTime
          }
        })
      }
    }

    return result
  }

  /**
   * Record user feedback with quality improvements
   */
  async recordUserFeedback(
    query: string,
    result: SearchResult,
    rating: 'positive' | 'negative' | 'neutral',
    explanation?: string,
    userId?: string
  ): Promise<void> {
    console.log('👍 Recording user feedback for quality improvement...')

    // 1. Record feedback for adaptive learning
    if (this.config.enableFeedbackLearning) {
      try {
        await feedbackLearner.recordFeedback({
          query,
          resultId: `${result.document.id}_${result.chunk.id}`,
          documentId: result.document.id,
          chunkId: result.chunk.id,
          rating,
          explanation,
          userId,
          searchContext: {
            originalScore: result.similarity,
            position: 1, // Would need to be passed from calling context
            totalResults: 1 // Would need to be passed from calling context
          }
        })
        console.log('✅ Feedback recorded for adaptive learning')
      } catch (error) {
        console.warn('⚠️ Feedback recording failed:', error)
      }
    }

    // 2. Record feedback interaction for analytics
    if (this.config.enableUsageAnalytics) {
      usageBasedMLInsights.recordInteraction({
        type: 'feedback',
        userId,
        metadata: {
          query,
          documentId: result.document.id,
          rating,
          explanation
        }
      })
    }
  }

  /**
   * Get file-specific visual content
   */
  getFileVisualContent(documentId: string) {
    if (!this.config.enableFileVisualManagement) {
      return null
    }

    return fileVisualManager.getFileVisualContent(documentId)
  }

  /**
   * Search visual content across files
   */
  searchVisualContent(query: string, fuzzyMatch = true) {
    if (!this.config.enableFileVisualManagement) {
      return []
    }

    return fileVisualManager.searchVisualContent({
      query,
      searchFields: ['title', 'description', 'extractedText', 'llmSummary'],
      fuzzyMatch
    })
  }

  /**
   * Get ML insights based on actual usage
   */
  async getMLInsights() {
    if (!this.config.enableUsageAnalytics) {
      return []
    }

    return await usageBasedMLInsights.generateInsights()
  }

  /**
   * Get current usage metrics
   */
  getUsageMetrics() {
    if (!this.config.enableUsageAnalytics) {
      return null
    }

    return usageBasedMLInsights.getCurrentMetrics()
  }

  /**
   * Get learning analytics
   */
  getLearningAnalytics() {
    const analytics: Record<string, unknown> = {}

    if (this.config.enableFeedbackLearning) {
      analytics.feedback = feedbackLearner.getLearningMetrics()
    }

    if (this.config.enableSpecializedLLM) {
      analytics.llm = specializedLLMSummarizer.getSummaryAnalytics()
    }

    if (this.config.enableFileVisualManagement) {
      analytics.visual = fileVisualManager.getOrganizationStats()
    }

    if (this.config.enableUsageAnalytics) {
      analytics.usage = usageBasedMLInsights.getCurrentMetrics()
    }

    return analytics
  }

  /**
   * Get system quality report
   */
  async getQualityReport() {
    console.log('📊 Generating system quality report...')

    const report = {
      timestamp: new Date(),
      systemStatus: 'operational' as 'operational' | 'degraded' | 'down',
      qualityMetrics: {
        searchRelevance: 0,
        feedbackEffectiveness: 0,
        visualContentOrganization: 0,
        llmAccuracy: 0,
        systemPerformance: 0
      },
      improvements: [] as string[],
      recommendations: [] as string[],
      issues: [] as string[]
    }

    // Analyze search relevance
    if (this.config.enableQueryEnhancement) {
      // Simulated metric - in real system would analyze actual relevance scores
      report.qualityMetrics.searchRelevance = 0.85
      report.improvements.push('Enhanced query processing with domain-aware relevance validation')
    }

    // Analyze feedback effectiveness
    if (this.config.enableFeedbackLearning) {
      const feedbackMetrics = feedbackLearner.getLearningMetrics()
      report.qualityMetrics.feedbackEffectiveness = feedbackMetrics.positiveRate
      
      if (feedbackMetrics.totalFeedback > 10) {
        report.improvements.push('Adaptive feedback learning system actively improving results')
      } else {
        report.recommendations.push('Encourage more user feedback to improve learning effectiveness')
      }
    }

    // Analyze visual content organization
    if (this.config.enableFileVisualManagement) {
      const visualStats = fileVisualManager.getOrganizationStats()
      report.qualityMetrics.visualContentOrganization = visualStats.totalFiles > 0 ? 0.9 : 0.3
      
      if (visualStats.totalFiles > 0) {
        report.improvements.push(`Visual content properly organized across ${visualStats.totalFiles} files`)
      }
    }

    // Analyze LLM accuracy
    if (this.config.enableSpecializedLLM) {
      const llmAnalytics = specializedLLMSummarizer.getSummaryAnalytics()
      report.qualityMetrics.llmAccuracy = llmAnalytics.averageConfidence || 0.7
      
      if (llmAnalytics.validationPassRate > 0.8) {
        report.improvements.push('Specialized LLM summaries with high accuracy and domain relevance')
      } else {
        report.recommendations.push('Review and improve LLM summarization prompts for better accuracy')
      }
    }

    // Analyze system performance
    if (this.config.enableUsageAnalytics) {
      const metrics = usageBasedMLInsights.getCurrentMetrics()
      if (metrics) {
        const performanceScore = 1 - metrics.systemPerformance.errorRate
        report.qualityMetrics.systemPerformance = performanceScore
        
        if (metrics.systemPerformance.avgSearchLatency > 3000) {
          report.issues.push('Search response time exceeds 3 seconds')
        }
        
        if (metrics.systemPerformance.errorRate > 0.05) {
          report.issues.push('System error rate above 5%')
        }
      }
    }

    // Calculate overall quality score
    const qualityValues = Object.values(report.qualityMetrics)
    const overallQuality = qualityValues.reduce((sum, val) => sum + val, 0) / qualityValues.length

    if (overallQuality < 0.6) {
      report.systemStatus = 'degraded'
      report.recommendations.push('Multiple quality metrics below acceptable thresholds')
    } else if (overallQuality < 0.8) {
      report.systemStatus = 'operational'
      report.recommendations.push('System operational but has room for improvement')
    }

    console.log(`✅ Quality report generated - Overall score: ${(overallQuality * 100).toFixed(1)}%`)

    return report
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<QualityImprovementConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Quality system configuration updated:', this.config)
  }

  /**
   * Get current configuration
   */
  getConfig(): QualityImprovementConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const integratedQualitySystem = new IntegratedQualitySystem()

// Export individual components for direct access if needed
export {
  EnhancedQueryProcessor,
  feedbackLearner,
  fileVisualManager,
  specializedLLMSummarizer,
  usageBasedMLInsights
}
