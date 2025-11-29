// Adaptive Feedback Learning System
// Addresses Issue 2: User feedback not effectively improving search results

import { SearchResult } from '../types'

interface FeedbackData {
  id: string
  query: string
  resultId: string
  documentId: string
  chunkId: string
  rating: 'positive' | 'negative' | 'neutral'
  explanation?: string
  timestamp: Date
  userId?: string
  searchContext: {
    originalScore: number
    position: number
    totalResults: number
  }
}

interface QueryPattern {
  pattern: string
  frequency: number
  avgRating: number
  positiveDocuments: string[]
  negativeDocuments: string[]
  lastUpdated: Date
}

interface LearningMetrics {
  totalFeedback: number
  positiveRate: number
  queryPatterns: QueryPattern[]
  documentRelevanceScores: Map<string, number>
  improvementTrend: number[]
}

export class AdaptiveFeedbackLearner {
  private feedbackHistory: FeedbackData[] = []
  private queryPatterns: Map<string, QueryPattern> = new Map()
  private documentRelevanceScores: Map<string, number> = new Map()
  private learningConfig = {
    feedbackWeight: 0.3,
    patternMatchThreshold: 0.7,
    minFeedbackForPattern: 3,
    decayFactor: 0.95, // How much old feedback decays over time
    maxFeedbackAge: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
  }

  constructor() {
    this.loadPersistedData()
  }

  /**
   * Record user feedback and immediately update learning models
   */
  async recordFeedback(feedback: Omit<FeedbackData, 'id' | 'timestamp'>): Promise<void> {
    const feedbackEntry: FeedbackData = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    this.feedbackHistory.push(feedbackEntry)
    
    // Immediate learning updates
    await this.updateQueryPatterns(feedbackEntry)
    await this.updateDocumentRelevanceScores(feedbackEntry)
    
    // Persist learning data
    this.persistLearningData()
    
    console.log('📚 Feedback recorded and learning models updated:', {
      rating: feedback.rating,
      query: feedback.query,
      documentId: feedback.documentId
    })
  }

  /**
   * Apply learned feedback to enhance search results
   */
  applyLearningToResults(
    query: string,
    results: SearchResult[]
  ): SearchResult[] {
    const enhancedResults = results.map(result => {
      let adjustedScore = result.similarity
      let adjustmentReason = ''

      // 1. Apply document-level relevance learning
      const docRelevance = this.documentRelevanceScores.get(result.document.id) || 0
      if (Math.abs(docRelevance) > 0.1) {
        const docAdjustment = docRelevance * this.learningConfig.feedbackWeight
        adjustedScore += docAdjustment
        adjustmentReason += `Doc relevance: ${docRelevance.toFixed(3)}; `
      }

      // 2. Apply query pattern learning
      const patternAdjustment = this.getQueryPatternAdjustment(query, result)
      if (Math.abs(patternAdjustment) > 0.05) {
        adjustedScore += patternAdjustment
        adjustmentReason += `Pattern match: ${patternAdjustment.toFixed(3)}; `
      }

      // 3. Apply temporal decay to old negative feedback
      const temporalAdjustment = this.getTemporalAdjustment(result)
      if (Math.abs(temporalAdjustment) > 0.02) {
        adjustedScore += temporalAdjustment
        adjustmentReason += `Temporal: ${temporalAdjustment.toFixed(3)}; `
      }

      // Ensure score stays in valid range
      adjustedScore = Math.max(0, Math.min(1, adjustedScore))

      return {
        ...result,
        similarity: adjustedScore,
        learningAdjustment: {
          originalScore: result.similarity,
          adjustment: adjustedScore - result.similarity,
          reason: adjustmentReason.trim()
        }
      }
    })

    // Re-sort by adjusted scores
    return enhancedResults.sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Update query patterns based on new feedback
   */
  private async updateQueryPatterns(feedback: FeedbackData): Promise<void> {
    const queryNormalized = this.normalizeQuery(feedback.query)
    
    // Find similar existing patterns
    const similarPatterns = Array.from(this.queryPatterns.entries())
      .filter(([pattern]) => this.calculateQuerySimilarity(queryNormalized, pattern) > this.learningConfig.patternMatchThreshold)

    if (similarPatterns.length > 0) {
      // Update existing pattern
      const [, pattern] = similarPatterns[0]
      pattern.frequency += 1
      
      // Update rating with exponential moving average
      const alpha = 0.3 // Learning rate
      const newRating = feedback.rating === 'positive' ? 1 : feedback.rating === 'negative' ? -1 : 0
      pattern.avgRating = pattern.avgRating * (1 - alpha) + newRating * alpha
      
      // Update document lists
      if (feedback.rating === 'positive') {
        if (!pattern.positiveDocuments.includes(feedback.documentId)) {
          pattern.positiveDocuments.push(feedback.documentId)
        }
      } else if (feedback.rating === 'negative') {
        if (!pattern.negativeDocuments.includes(feedback.documentId)) {
          pattern.negativeDocuments.push(feedback.documentId)
        }
      }
      
      pattern.lastUpdated = new Date()
    } else {
      // Create new pattern
      const newPattern: QueryPattern = {
        pattern: queryNormalized,
        frequency: 1,
        avgRating: feedback.rating === 'positive' ? 1 : feedback.rating === 'negative' ? -1 : 0,
        positiveDocuments: feedback.rating === 'positive' ? [feedback.documentId] : [],
        negativeDocuments: feedback.rating === 'negative' ? [feedback.documentId] : [],
        lastUpdated: new Date()
      }
      
      this.queryPatterns.set(queryNormalized, newPattern)
    }
  }

  /**
   * Update document relevance scores based on feedback
   */
  private async updateDocumentRelevanceScores(feedback: FeedbackData): Promise<void> {
    const currentScore = this.documentRelevanceScores.get(feedback.documentId) || 0
    
    // Calculate feedback weight based on context
    let weight = this.learningConfig.feedbackWeight
    
    // Increase weight for feedback on highly-ranked results (more important)
    if (feedback.searchContext.position <= 3) {
      weight *= 1.5
    }
    
    // Increase weight for queries with few results (more decisive)
    if (feedback.searchContext.totalResults <= 5) {
      weight *= 1.3
    }

    // Apply feedback
    const feedbackValue = feedback.rating === 'positive' ? weight : 
                         feedback.rating === 'negative' ? -weight : 0

    const newScore = currentScore + feedbackValue
    
    // Apply bounds and decay
    const boundedScore = Math.max(-1, Math.min(1, newScore))
    this.documentRelevanceScores.set(feedback.documentId, boundedScore)
  }

  /**
   * Get query pattern adjustment for a result
   */
  private getQueryPatternAdjustment(query: string, result: SearchResult): number {
    const queryNormalized = this.normalizeQuery(query)
    let maxAdjustment = 0

    for (const [pattern, patternData] of this.queryPatterns.entries()) {
      const similarity = this.calculateQuerySimilarity(queryNormalized, pattern)
      
      if (similarity > this.learningConfig.patternMatchThreshold && 
          patternData.frequency >= this.learningConfig.minFeedbackForPattern) {
        
        let adjustment = 0
        
        // Positive adjustment for documents in positive list
        if (patternData.positiveDocuments.includes(result.document.id)) {
          adjustment = patternData.avgRating * similarity * 0.2
        }
        
        // Negative adjustment for documents in negative list
        if (patternData.negativeDocuments.includes(result.document.id)) {
          adjustment = Math.min(adjustment, patternData.avgRating * similarity * 0.2)
        }
        
        maxAdjustment = Math.max(Math.abs(maxAdjustment), Math.abs(adjustment)) === Math.abs(adjustment) 
          ? adjustment : maxAdjustment
      }
    }

    return maxAdjustment
  }

  /**
   * Apply temporal decay to old feedback
   */
  private getTemporalAdjustment(result: SearchResult): number {
    const relevantFeedback = this.feedbackHistory.filter(f => 
      f.documentId === result.document.id &&
      Date.now() - f.timestamp.getTime() < this.learningConfig.maxFeedbackAge
    )

    if (relevantFeedback.length === 0) return 0

    let weightedAdjustment = 0
    let totalWeight = 0

    for (const feedback of relevantFeedback) {
      const age = Date.now() - feedback.timestamp.getTime()
      const ageInDays = age / (24 * 60 * 60 * 1000)
      const temporalWeight = Math.pow(this.learningConfig.decayFactor, ageInDays)
      
      const feedbackValue = feedback.rating === 'positive' ? 0.1 : 
                           feedback.rating === 'negative' ? -0.1 : 0
      
      weightedAdjustment += feedbackValue * temporalWeight
      totalWeight += temporalWeight
    }

    return totalWeight > 0 ? weightedAdjustment / totalWeight : 0
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate similarity between queries
   */
  private calculateQuerySimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.split(' '))
    const words2 = new Set(query2.split(' '))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  /**
   * Get learning metrics for analytics
   */
  getLearningMetrics(): LearningMetrics {
    const totalFeedback = this.feedbackHistory.length
    const positiveFeedback = this.feedbackHistory.filter(f => f.rating === 'positive').length
    const positiveRate = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0

    return {
      totalFeedback,
      positiveRate,
      queryPatterns: Array.from(this.queryPatterns.values()),
      documentRelevanceScores: this.documentRelevanceScores,
      improvementTrend: this.calculateImprovementTrend()
    }
  }

  /**
   * Calculate improvement trend over time
   */
  private calculateImprovementTrend(): number[] {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentFeedback = this.feedbackHistory.filter(f => 
      f.timestamp.getTime() > thirtyDaysAgo
    )

    const dailyPositiveRates: number[] = []
    for (let i = 0; i < 30; i++) {
      const dayStart = thirtyDaysAgo + (i * 24 * 60 * 60 * 1000)
      const dayEnd = dayStart + (24 * 60 * 60 * 1000)
      
      const dayFeedback = recentFeedback.filter(f => 
        f.timestamp.getTime() >= dayStart && f.timestamp.getTime() < dayEnd
      )
      
      if (dayFeedback.length > 0) {
        const positive = dayFeedback.filter(f => f.rating === 'positive').length
        dailyPositiveRates.push(positive / dayFeedback.length)
      } else {
        dailyPositiveRates.push(0)
      }
    }

    return dailyPositiveRates
  }

  /**
   * Load persisted learning data
   */
  private loadPersistedData(): void {
    // Only run on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const stored = localStorage.getItem('adaptive_feedback_learning')
      if (stored) {
        const data = JSON.parse(stored)
        this.feedbackHistory = data.feedbackHistory || []
        this.queryPatterns = new Map(data.queryPatterns || [])
        this.documentRelevanceScores = new Map(data.documentRelevanceScores || [])
      }
    } catch (error) {
      console.warn('Failed to load persisted feedback learning data:', error)
    }
  }

  /**
   * Persist learning data
   */
  private persistLearningData(): void {
    try {
      const data = {
        feedbackHistory: this.feedbackHistory,
        queryPatterns: Array.from(this.queryPatterns.entries()),
        documentRelevanceScores: Array.from(this.documentRelevanceScores.entries())
      }
      localStorage.setItem('adaptive_feedback_learning', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist feedback learning data:', error)
    }
  }
}

// Singleton instance
export const feedbackLearner = new AdaptiveFeedbackLearner()
