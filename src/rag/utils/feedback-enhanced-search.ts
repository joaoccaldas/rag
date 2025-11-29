import { SearchResult } from '../types'

interface FeedbackScore {
  documentId: string
  chunkId: string
  title: string
  totalFeedback: number
  avgScore: number
  relevanceBoost: number
  lastUpdated: string
}

interface FeedbackAnalytics {
  queryText: string
  rating: 'positive' | 'negative'
  score: number
  timestamp: string
  sources: Array<{
    documentId: string
    chunkId: string
    title: string
    score: number
  }>
  categories: string[]
  comment: string
}

export class FeedbackEnhancedSearch {
  private static readonly STORAGE_KEY_SCORES = 'rag_source_relevance_scores'
  private static readonly STORAGE_KEY_ANALYTICS = 'rag_feedback_analytics'
  private static readonly MAX_ANALYTICS_ENTRIES = 100

  /**
   * Apply feedback-based scoring adjustments to search results
   */
  static applyFeedbackScoring(searchResults: SearchResult[]): SearchResult[] {
    try {
      const sourceScores = this.getSourceRelevanceScores()
      
      console.log('🔄 Applying feedback-based scoring to search results...')
      console.log(`📊 Found ${Object.keys(sourceScores).length} sources with feedback scores`)
      
      const enhancedResults = searchResults.map(result => {
        const key = `${result.document.id}:${result.chunk.id}`
        const feedbackScore = sourceScores[key]
        
        if (feedbackScore && feedbackScore.totalFeedback > 0) {
          const originalSimilarity = result.similarity
          
          // Apply conservative feedback boost - max 10% adjustment
          const maxBoost = 0.1
          const conservativeBoost = Math.min(Math.abs(feedbackScore.relevanceBoost), maxBoost) * Math.sign(feedbackScore.relevanceBoost)
          
          // Only apply positive boost if original similarity is reasonable (> 0.3)
          let adjustedSimilarity = originalSimilarity
          if (conservativeBoost > 0 && originalSimilarity > 0.3) {
            adjustedSimilarity = originalSimilarity + conservativeBoost
          } else if (conservativeBoost < 0) {
            // Always apply negative feedback to reduce irrelevant results
            adjustedSimilarity = originalSimilarity + conservativeBoost
          }
          
          // Ensure realistic bounds - never exceed 0.95 or go below 0.05
          adjustedSimilarity = Math.max(0.05, Math.min(0.95, adjustedSimilarity))
          
          console.log(`📈 Feedback adjustment for "${result.document.name}":`, {
            chunkPreview: result.chunk.content.substring(0, 50) + '...',
            originalScore: originalSimilarity.toFixed(3),
            boost: feedbackScore.relevanceBoost.toFixed(3),
            adjustedScore: adjustedSimilarity.toFixed(3),
            feedbackCount: feedbackScore.totalFeedback,
            avgFeedback: feedbackScore.avgScore.toFixed(3)
          })
          
          return {
            ...result,
            similarity: adjustedSimilarity,
            feedbackMetadata: {
              feedbackBoost: feedbackScore.relevanceBoost,
              feedbackCount: feedbackScore.totalFeedback,
              originalScore: originalSimilarity
            }
          }
        }
        
        return result
      })
      
      // Re-sort by adjusted similarity scores
      const sortedResults = enhancedResults.sort((a, b) => b.similarity - a.similarity)
      
      console.log('✅ Feedback scoring applied successfully')
      return sortedResults
      
    } catch (error) {
      console.error('❌ Error applying feedback scoring:', error)
      return searchResults // Return original results if enhancement fails
    }
  }

  /**
   * Store user feedback for a query and its sources
   */
  static async storeFeedback(
    queryText: string,
    rating: 'positive' | 'negative',
    score: number,
    sources: SearchResult[],
    categories: string[] = [],
    comment: string = ''
  ): Promise<void> {
    try {
      console.log('💾 Storing feedback for query optimization...')
      
      // Create feedback entry
      const feedbackEntry: FeedbackAnalytics = {
        queryText,
        rating,
        score,
        timestamp: new Date().toISOString(),
        sources: sources.map(source => ({
          documentId: source.document.id,
          chunkId: source.chunk.id,
          title: source.document.name,
          score: source.similarity
        })),
        categories,
        comment
      }
      
      // Store in analytics
      const analytics = this.getFeedbackAnalytics()
      analytics.push(feedbackEntry)
      
      // Keep only recent entries
      if (analytics.length > this.MAX_ANALYTICS_ENTRIES) {
        analytics.splice(0, analytics.length - this.MAX_ANALYTICS_ENTRIES)
      }
      
      localStorage.setItem(this.STORAGE_KEY_ANALYTICS, JSON.stringify(analytics))
      
      // Update source relevance scores
      await this.updateSourceScores(sources, rating, score)
      
      console.log('✅ Feedback stored successfully')
      
    } catch (error) {
      console.error('❌ Error storing feedback:', error)
    }
  }

  /**
   * Get query suggestions based on successful past queries
   */
  static getQuerySuggestions(partialQuery: string, limit: number = 5): string[] {
    try {
      const analytics = this.getFeedbackAnalytics()
      const positiveQueries = analytics
        .filter(entry => entry.rating === 'positive' && entry.score >= 3)
        .map(entry => entry.queryText)
        .filter(query => query.toLowerCase().includes(partialQuery.toLowerCase()))
      
      // Remove duplicates and limit results
      return Array.from(new Set(positiveQueries)).slice(0, limit)
      
    } catch (error) {
      console.error('❌ Error getting query suggestions:', error)
      return []
    }
  }

  /**
   * Get analytics summary for admin dashboard
   */
  static getAnalyticsSummary() {
    try {
      const analytics = this.getFeedbackAnalytics()
      const sourceScores = this.getSourceRelevanceScores()
      
      const totalFeedback = analytics.length
      const positiveCount = analytics.filter(entry => entry.rating === 'positive').length
      const avgScore = totalFeedback > 0 
        ? analytics.reduce((sum, entry) => sum + entry.score, 0) / totalFeedback 
        : 0
      
      // Top categories with issues
      const categoryCount: Record<string, number> = {}
      analytics.forEach(entry => {
        if (entry.rating === 'negative') {
          entry.categories.forEach(category => {
            categoryCount[category] = (categoryCount[category] || 0) + 1
          })
        }
      })
      
      // Top performing sources
      const topSources = Object.values(sourceScores)
        .filter((score: FeedbackScore) => score.totalFeedback >= 2)
        .sort((a: FeedbackScore, b: FeedbackScore) => b.avgScore - a.avgScore)
        .slice(0, 10)
      
      return {
        totalFeedback,
        positiveRating: positiveCount,
        negativeRating: totalFeedback - positiveCount,
        satisfactionRate: totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0,
        avgScore: Math.round(avgScore * 100) / 100,
        topIssueCategories: Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count })),
        topPerformingSources: topSources.map((score: FeedbackScore) => ({
          title: score.title,
          avgScore: score.avgScore,
          feedbackCount: score.totalFeedback,
          relevanceBoost: score.relevanceBoost
        })),
        sourcesWithFeedback: Object.keys(sourceScores).length,
        recentQueries: analytics
          .slice(-10)
          .reverse()
          .map(entry => ({
            query: entry.queryText,
            rating: entry.rating,
            score: entry.score,
            timestamp: entry.timestamp
          }))
      }
      
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error)
      return {
        totalFeedback: 0,
        positiveRating: 0,
        negativeRating: 0,
        satisfactionRate: 0,
        avgScore: 0,
        topIssueCategories: [],
        topPerformingSources: [],
        sourcesWithFeedback: 0,
        recentQueries: []
      }
    }
  }

  /**
   * Update source relevance scores based on feedback
   */
  private static async updateSourceScores(
    sources: SearchResult[],
    rating: 'positive' | 'negative',
    score: number
  ): Promise<void> {
    try {
      const sourceScores = this.getSourceRelevanceScores()
      const scoreMultiplier = rating === 'positive' ? 1 : -0.5
      const adjustedScore = (score / 5) * scoreMultiplier // Normalize to -0.5 to 1
      
      sources.forEach(source => {
        const key = `${source.document.id}:${source.chunk.id}`
        
        if (!sourceScores[key]) {
          sourceScores[key] = {
            documentId: source.document.id,
            chunkId: source.chunk.id,
            title: source.document.name,
            totalFeedback: 0,
            avgScore: 0,
            relevanceBoost: 0,
            lastUpdated: new Date().toISOString()
          }
        }
        
        const current = sourceScores[key]
        current.totalFeedback += 1
        
        // Update running average
        current.avgScore = ((current.avgScore * (current.totalFeedback - 1)) + adjustedScore) / current.totalFeedback
        
        // Calculate relevance boost (-0.2 to +0.3 range)
        current.relevanceBoost = Math.max(-0.2, Math.min(0.3, current.avgScore * 0.3))
        current.lastUpdated = new Date().toISOString()
        
        console.log(`📊 Updated feedback scores for "${source.document.name}":`, {
          chunkPreview: source.chunk.content.substring(0, 50) + '...',
          avgScore: current.avgScore.toFixed(3),
          relevanceBoost: current.relevanceBoost.toFixed(3),
          totalFeedback: current.totalFeedback
        })
      })
      
      localStorage.setItem(this.STORAGE_KEY_SCORES, JSON.stringify(sourceScores))
      
    } catch (error) {
      console.error('❌ Error updating source scores:', error)
    }
  }

  /**
   * Get stored source relevance scores
   */
  private static getSourceRelevanceScores(): Record<string, FeedbackScore> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_SCORES)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  /**
   * Get stored feedback analytics
   */
  private static getFeedbackAnalytics(): FeedbackAnalytics[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_ANALYTICS)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Clear all feedback data (for admin use)
   */
  static clearFeedbackData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY_SCORES)
      localStorage.removeItem(this.STORAGE_KEY_ANALYTICS)
      console.log('✅ All feedback data cleared')
    } catch (error) {
      console.error('❌ Error clearing feedback data:', error)
    }
  }

  /**
   * Export feedback data for analysis
   */
  static exportFeedbackData(): { analytics: FeedbackAnalytics[], sourceScores: Record<string, FeedbackScore> } {
    return {
      analytics: this.getFeedbackAnalytics(),
      sourceScores: this.getSourceRelevanceScores()
    }
  }
}

export default FeedbackEnhancedSearch
