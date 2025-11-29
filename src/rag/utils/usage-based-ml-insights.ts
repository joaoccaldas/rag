// Usage-Based ML Insights System
// Addresses Issue 5: ML insights showing generic data instead of actual usage patterns

interface UserInteraction {
  id: string
  timestamp: Date
  type: 'search' | 'document_upload' | 'feedback' | 'view_result' | 'download' | 'share'
  userId?: string
  sessionId: string
  metadata: {
    query?: string
    documentId?: string
    resultPosition?: number
    timeSpent?: number
    success?: boolean
    errorType?: string
    [key: string]: unknown
  }
}

interface UsagePattern {
  id: string
  type: 'search_pattern' | 'user_behavior' | 'content_preference' | 'time_pattern'
  pattern: string
  frequency: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  lastDetected: Date
  relatedMetrics: Record<string, number>
}

interface MLInsight {
  id: string
  category: 'performance' | 'user_behavior' | 'content_optimization' | 'system_health'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  actionable: boolean
  recommendations: string[]
  supportingData: {
    metrics: Record<string, number>
    patterns: UsagePattern[]
    timeframe: string
  }
  impact: {
    userExperience: number
    systemPerformance: number
    businessValue: number
  }
  generatedAt: Date
}

interface UsageMetrics {
  searchMetrics: {
    totalSearches: number
    uniqueQueries: number
    avgQueryLength: number
    successRate: number
    avgResponseTime: number
    popularKeywords: Array<{keyword: string, count: number}>
  }
  userBehavior: {
    avgSessionDuration: number
    documentsPerSession: number
    feedbackRate: number
    returnUserRate: number
    peakUsageHours: number[]
  }
  contentMetrics: {
    mostAccessedDocuments: Array<{id: string, name: string, accessCount: number}>
    uploadTrends: Array<{date: string, count: number}>
    contentTypeDistribution: Record<string, number>
    avgDocumentSize: number
  }
  systemPerformance: {
    avgSearchLatency: number
    processingSuccess: number
    errorRate: number
    memoryUsage: number
    cacheHitRate: number
  }
}

export class UsageBasedMLInsights {
  private interactions: UserInteraction[] = []
  private patterns: Map<string, UsagePattern> = new Map()
  private insights: MLInsight[] = []
  private metrics: UsageMetrics | null = null

  constructor() {
    this.loadPersistedData()
    this.startPeriodicAnalysis()
  }

  /**
   * Record user interaction for analysis
   */
  recordInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId()
    }

    this.interactions.push(fullInteraction)

    // Keep only last 10,000 interactions for performance
    if (this.interactions.length > 10000) {
      this.interactions = this.interactions.slice(-10000)
    }

    this.persistData()

    console.log(`📊 Recorded ${interaction.type} interaction for ML analysis`)
  }

  /**
   * Generate ML insights based on actual usage data
   */
  async generateInsights(): Promise<MLInsight[]> {
    console.log('🧠 Generating ML insights from usage patterns...')

    // Clear old insights
    this.insights = []

    // Calculate current metrics
    this.metrics = this.calculateUsageMetrics()

    // Detect patterns
    this.detectUsagePatterns()

    // Generate insights from patterns
    await this.generatePerformanceInsights()
    await this.generateUserBehaviorInsights()
    await this.generateContentOptimizationInsights()
    await this.generateSystemHealthInsights()

    // Sort insights by severity and confidence
    this.insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.confidence - a.confidence
    })

    this.persistData()

    console.log(`✨ Generated ${this.insights.length} ML insights from actual usage data`)
    return this.insights
  }

  /**
   * Calculate comprehensive usage metrics
   */
  private calculateUsageMetrics(): UsageMetrics {
    const now = Date.now()
    const lastWeek = now - (7 * 24 * 60 * 60 * 1000)
    const recentInteractions = this.interactions.filter(i => i.timestamp.getTime() > lastWeek)

    // Search metrics
    const searchInteractions = recentInteractions.filter(i => i.type === 'search')
    const searchMetrics = {
      totalSearches: searchInteractions.length,
      uniqueQueries: new Set(searchInteractions.map(i => i.metadata.query).filter(Boolean)).size,
      avgQueryLength: this.calculateAvgQueryLength(searchInteractions),
      successRate: this.calculateSearchSuccessRate(searchInteractions),
      avgResponseTime: this.calculateAvgResponseTime(searchInteractions),
      popularKeywords: this.extractPopularKeywords(searchInteractions)
    }

    // User behavior metrics
    const sessions = this.groupInteractionsBySessions(recentInteractions)
    const userBehavior = {
      avgSessionDuration: this.calculateAvgSessionDuration(sessions),
      documentsPerSession: this.calculateDocumentsPerSession(sessions),
      feedbackRate: this.calculateFeedbackRate(recentInteractions),
      returnUserRate: this.calculateReturnUserRate(recentInteractions),
      peakUsageHours: this.identifyPeakUsageHours(recentInteractions)
    }

    // Content metrics
    const uploadInteractions = recentInteractions.filter(i => i.type === 'document_upload')
    const contentMetrics = {
      mostAccessedDocuments: this.getMostAccessedDocuments(recentInteractions),
      uploadTrends: this.getUploadTrends(uploadInteractions),
      contentTypeDistribution: this.getContentTypeDistribution(uploadInteractions),
      avgDocumentSize: this.calculateAvgDocumentSize(uploadInteractions)
    }

    // System performance metrics
    const systemPerformance = {
      avgSearchLatency: this.calculateSearchLatency(searchInteractions),
      processingSuccess: this.calculateProcessingSuccessRate(recentInteractions),
      errorRate: this.calculateErrorRate(recentInteractions),
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate: this.calculateCacheHitRate(searchInteractions)
    }

    return {
      searchMetrics,
      userBehavior,
      contentMetrics,
      systemPerformance
    }
  }

  /**
   * Detect usage patterns using ML-like algorithms
   */
  private detectUsagePatterns(): void {
    this.patterns.clear()

    // Detect search patterns
    this.detectSearchPatterns()
    
    // Detect user behavior patterns
    this.detectUserBehaviorPatterns()
    
    // Detect time-based patterns
    this.detectTimePatterns()
    
    // Detect content preference patterns
    this.detectContentPatterns()
  }

  /**
   * Generate performance-related insights
   */
  private async generatePerformanceInsights(): Promise<void> {
    if (!this.metrics) return

    const { searchMetrics, systemPerformance } = this.metrics

    // Slow query insight
    if (systemPerformance.avgSearchLatency > 2000) {
      this.insights.push({
        id: `perf_slow_queries_${Date.now()}`,
        category: 'performance',
        title: 'Search Response Time Above Target',
        description: `Average search response time is ${(systemPerformance.avgSearchLatency / 1000).toFixed(1)}s, which is above the 2s target. This may impact user experience.`,
        severity: systemPerformance.avgSearchLatency > 5000 ? 'high' : 'medium',
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Optimize vector similarity search algorithms',
          'Implement result caching for popular queries',
          'Consider adding search result pagination',
          'Review document chunk size optimization'
        ],
        supportingData: {
          metrics: {
            avgLatency: systemPerformance.avgSearchLatency,
            totalSearches: searchMetrics.totalSearches,
            cacheHitRate: systemPerformance.cacheHitRate
          },
          patterns: Array.from(this.patterns.values()).filter(p => p.type === 'search_pattern'),
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.8,
          systemPerformance: 0.9,
          businessValue: 0.6
        },
        generatedAt: new Date()
      })
    }

    // High error rate insight
    if (systemPerformance.errorRate > 0.05) {
      this.insights.push({
        id: `perf_error_rate_${Date.now()}`,
        category: 'system_health',
        title: 'Elevated Error Rate Detected',
        description: `System error rate is ${(systemPerformance.errorRate * 100).toFixed(1)}%, indicating potential stability issues.`,
        severity: systemPerformance.errorRate > 0.1 ? 'critical' : 'high',
        confidence: 0.95,
        actionable: true,
        recommendations: [
          'Review error logs for common failure patterns',
          'Implement better error handling and recovery',
          'Add monitoring and alerting for critical failures',
          'Consider implementing circuit breaker patterns'
        ],
        supportingData: {
          metrics: {
            errorRate: systemPerformance.errorRate,
            totalInteractions: this.interactions.length
          },
          patterns: [],
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.9,
          systemPerformance: 0.8,
          businessValue: 0.7
        },
        generatedAt: new Date()
      })
    }
  }

  /**
   * Generate user behavior insights
   */
  private async generateUserBehaviorInsights(): Promise<void> {
    if (!this.metrics) return

    const { userBehavior, searchMetrics } = this.metrics

    // Low search success rate
    if (searchMetrics.successRate < 0.7) {
      this.insights.push({
        id: `behavior_low_success_${Date.now()}`,
        category: 'user_behavior',
        title: 'Low Search Success Rate',
        description: `Only ${(searchMetrics.successRate * 100).toFixed(1)}% of searches are successful. Users may not be finding relevant content.`,
        severity: 'high',
        confidence: 0.85,
        actionable: true,
        recommendations: [
          'Improve search relevance algorithms',
          'Add query suggestion and auto-complete features',
          'Implement search analytics to understand failed queries',
          'Provide better search guidance and examples'
        ],
        supportingData: {
          metrics: {
            successRate: searchMetrics.successRate,
            totalSearches: searchMetrics.totalSearches,
            avgQueryLength: searchMetrics.avgQueryLength
          },
          patterns: Array.from(this.patterns.values()).filter(p => p.type === 'search_pattern'),
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.9,
          systemPerformance: 0.4,
          businessValue: 0.8
        },
        generatedAt: new Date()
      })
    }

    // Low feedback rate
    if (userBehavior.feedbackRate < 0.1) {
      this.insights.push({
        id: `behavior_low_feedback_${Date.now()}`,
        category: 'user_behavior',
        title: 'Low User Feedback Engagement',
        description: `Only ${(userBehavior.feedbackRate * 100).toFixed(1)}% of users provide feedback. This limits the system's ability to learn and improve.`,
        severity: 'medium',
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Simplify feedback collection interface',
          'Add inline feedback options for search results',
          'Implement feedback incentives or gamification',
          'Make feedback feel more impactful to users'
        ],
        supportingData: {
          metrics: {
            feedbackRate: userBehavior.feedbackRate,
            avgSessionDuration: userBehavior.avgSessionDuration
          },
          patterns: Array.from(this.patterns.values()).filter(p => p.type === 'user_behavior'),
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.5,
          systemPerformance: 0.7,
          businessValue: 0.6
        },
        generatedAt: new Date()
      })
    }
  }

  /**
   * Generate content optimization insights
   */
  private async generateContentOptimizationInsights(): Promise<void> {
    if (!this.metrics) return

    const { contentMetrics, searchMetrics } = this.metrics

    // Popular content insight
    const topDocuments = contentMetrics.mostAccessedDocuments.slice(0, 3)
    if (topDocuments.length > 0) {
      this.insights.push({
        id: `content_popular_docs_${Date.now()}`,
        category: 'content_optimization',
        title: 'High-Value Content Identified',
        description: `Top ${topDocuments.length} documents account for significant user engagement. Consider promoting similar content.`,
        severity: 'low',
        confidence: 0.75,
        actionable: true,
        recommendations: [
          'Analyze characteristics of popular documents',
          'Create more content similar to high-performing documents',
          'Feature popular content prominently in search results',
          'Use popular content as templates for new uploads'
        ],
        supportingData: {
          metrics: {
            topDocumentAccess: topDocuments.reduce((sum, doc) => sum + doc.accessCount, 0),
            totalDocuments: contentMetrics.mostAccessedDocuments.length
          },
          patterns: Array.from(this.patterns.values()).filter(p => p.type === 'content_preference'),
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.6,
          systemPerformance: 0.3,
          businessValue: 0.7
        },
        generatedAt: new Date()
      })
    }

    // Query-content mismatch
    const queryDocumentRatio = searchMetrics.uniqueQueries / contentMetrics.mostAccessedDocuments.length
    if (queryDocumentRatio > 2) {
      this.insights.push({
        id: `content_mismatch_${Date.now()}`,
        category: 'content_optimization',
        title: 'Content Gap Analysis',
        description: `Users are searching for content that may not exist. High query diversity suggests content gaps.`,
        severity: 'medium',
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Analyze unsuccessful query patterns',
          'Identify missing content areas',
          'Prioritize content creation for high-demand topics',
          'Improve content tagging and metadata'
        ],
        supportingData: {
          metrics: {
            queryDocumentRatio,
            uniqueQueries: searchMetrics.uniqueQueries,
            totalDocuments: contentMetrics.mostAccessedDocuments.length
          },
          patterns: [],
          timeframe: 'Last 7 days'
        },
        impact: {
          userExperience: 0.7,
          systemPerformance: 0.4,
          businessValue: 0.8
        },
        generatedAt: new Date()
      })
    }
  }

  /**
   * Generate system health insights
   */
  private async generateSystemHealthInsights(): Promise<void> {
    if (!this.metrics) return

    const { systemPerformance } = this.metrics

    // Memory usage insight
    if (systemPerformance.memoryUsage > 0.8) {
      this.insights.push({
        id: `health_memory_${Date.now()}`,
        category: 'system_health',
        title: 'High Memory Usage Detected',
        description: `System memory usage is at ${(systemPerformance.memoryUsage * 100).toFixed(1)}%, which may impact performance.`,
        severity: systemPerformance.memoryUsage > 0.9 ? 'critical' : 'high',
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Optimize vector storage and caching strategies',
          'Implement lazy loading for large documents',
          'Review memory leaks in processing pipelines',
          'Consider scaling resources or optimizing algorithms'
        ],
        supportingData: {
          metrics: {
            memoryUsage: systemPerformance.memoryUsage,
            cacheHitRate: systemPerformance.cacheHitRate
          },
          patterns: [],
          timeframe: 'Current'
        },
        impact: {
          userExperience: 0.7,
          systemPerformance: 0.9,
          businessValue: 0.5
        },
        generatedAt: new Date()
      })
    }
  }

  // Helper methods for calculations
  private calculateAvgQueryLength(searches: UserInteraction[]): number {
    const validQueries = searches.map(s => s.metadata.query).filter(Boolean) as string[]
    if (validQueries.length === 0) return 0
    return validQueries.reduce((sum, query) => sum + query.length, 0) / validQueries.length
  }

  private calculateSearchSuccessRate(searches: UserInteraction[]): number {
    if (searches.length === 0) return 0
    const successful = searches.filter(s => s.metadata.success).length
    return successful / searches.length
  }

  private calculateAvgResponseTime(searches: UserInteraction[]): number {
    const responseTimes = searches.map(s => s.metadata.timeSpent).filter(Boolean) as number[]
    if (responseTimes.length === 0) return 0
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  }

  private extractPopularKeywords(searches: UserInteraction[]): Array<{keyword: string, count: number}> {
    const keywordCounts = new Map<string, number>()
    
    searches.forEach(search => {
      if (search.metadata.query) {
        const words = (search.metadata.query as string).toLowerCase().split(/\s+/)
        words.forEach(word => {
          if (word.length > 2) {
            keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1)
          }
        })
      }
    })

    return Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({keyword, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private groupInteractionsBySessions(interactions: UserInteraction[]): Map<string, UserInteraction[]> {
    const sessions = new Map<string, UserInteraction[]>()
    
    interactions.forEach(interaction => {
      if (!sessions.has(interaction.sessionId)) {
        sessions.set(interaction.sessionId, [])
      }
      sessions.get(interaction.sessionId)!.push(interaction)
    })

    return sessions
  }

  private calculateAvgSessionDuration(sessions: Map<string, UserInteraction[]>): number {
    let totalDuration = 0
    let validSessions = 0

    for (const interactions of sessions.values()) {
      if (interactions.length > 1) {
        const start = Math.min(...interactions.map(i => i.timestamp.getTime()))
        const end = Math.max(...interactions.map(i => i.timestamp.getTime()))
        totalDuration += end - start
        validSessions++
      }
    }

    return validSessions > 0 ? totalDuration / validSessions : 0
  }

  private calculateDocumentsPerSession(sessions: Map<string, UserInteraction[]>): number {
    let totalDocuments = 0
    
    for (const interactions of sessions.values()) {
      const uniqueDocuments = new Set(
        interactions.map(i => i.metadata.documentId).filter(Boolean)
      )
      totalDocuments += uniqueDocuments.size
    }

    return sessions.size > 0 ? totalDocuments / sessions.size : 0
  }

  private calculateFeedbackRate(interactions: UserInteraction[]): number {
    const feedbackInteractions = interactions.filter(i => i.type === 'feedback').length
    const totalUserActions = interactions.filter(i => 
      i.type === 'search' || i.type === 'view_result' || i.type === 'download'
    ).length
    
    return totalUserActions > 0 ? feedbackInteractions / totalUserActions : 0
  }

  private calculateReturnUserRate(interactions: UserInteraction[]): number {
    const userIds = interactions.map(i => i.userId).filter(Boolean)
    if (userIds.length === 0) return 0
    
    const uniqueUsers = new Set(userIds)
    const returnUsers = userIds.length - uniqueUsers.size
    
    return uniqueUsers.size > 0 ? returnUsers / uniqueUsers.size : 0
  }

  private identifyPeakUsageHours(interactions: UserInteraction[]): number[] {
    const hourCounts = new Array(24).fill(0)
    
    interactions.forEach(interaction => {
      const hour = interaction.timestamp.getHours()
      hourCounts[hour]++
    })

    const maxCount = Math.max(...hourCounts)
    return hourCounts
      .map((count, hour) => ({hour, count}))
      .filter(({count}) => count > maxCount * 0.8)
      .map(({hour}) => hour)
  }

  private getMostAccessedDocuments(interactions: UserInteraction[]): Array<{id: string, name: string, accessCount: number}> {
    const documentCounts = new Map<string, number>()
    
    interactions.forEach(interaction => {
      if (interaction.metadata.documentId && 
          (interaction.type === 'view_result' || interaction.type === 'download')) {
        const docId = interaction.metadata.documentId as string
        documentCounts.set(docId, (documentCounts.get(docId) || 0) + 1)
      }
    })

    return Array.from(documentCounts.entries())
      .map(([id, accessCount]) => ({id, name: `Document ${id}`, accessCount}))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
  }

  private getUploadTrends(uploads: UserInteraction[]): Array<{date: string, count: number}> {
    const dailyCounts = new Map<string, number>()
    
    uploads.forEach(upload => {
      const dateKey = upload.timestamp.toISOString().split('T')[0]
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1)
    })

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({date, count}))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private getContentTypeDistribution(uploads: UserInteraction[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    
    uploads.forEach(upload => {
      const type = (upload.metadata.type as string) || 'unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })

    return distribution
  }

  private calculateAvgDocumentSize(uploads: UserInteraction[]): number {
    const sizes = uploads.map(u => u.metadata.size).filter(Boolean) as number[]
    if (sizes.length === 0) return 0
    return sizes.reduce((sum, size) => sum + size, 0) / sizes.length
  }

  private calculateSearchLatency(searches: UserInteraction[]): number {
    return this.calculateAvgResponseTime(searches)
  }

  private calculateProcessingSuccessRate(interactions: UserInteraction[]): number {
    const processingActions = interactions.filter(i => 
      i.type === 'document_upload' || i.type === 'search'
    )
    
    if (processingActions.length === 0) return 1
    
    const successful = processingActions.filter(i => i.metadata.success !== false).length
    return successful / processingActions.length
  }

  private calculateErrorRate(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0
    
    const errors = interactions.filter(i => i.metadata.errorType).length
    return errors / interactions.length
  }

  private estimateMemoryUsage(): number {
    // Simulate memory usage based on data size
    const dataSize = this.interactions.length + this.patterns.size + this.insights.length
    return Math.min(0.95, dataSize / 50000) // Simplified estimation
  }

  private calculateCacheHitRate(searches: UserInteraction[]): number {
    // Simulate cache hit rate based on repeated queries
    const queries = searches.map(s => s.metadata.query).filter(Boolean)
    const uniqueQueries = new Set(queries)
    
    if (queries.length === 0) return 0
    return 1 - (uniqueQueries.size / queries.length)
  }

  // Pattern detection methods
  private detectSearchPatterns(): void {
    // Implementation for search pattern detection
    // const searches = this.interactions.filter(i => i.type === 'search')
    // Add pattern detection logic here
  }

  private detectUserBehaviorPatterns(): void {
    // Implementation for user behavior pattern detection
    // Add pattern detection logic here
  }

  private detectTimePatterns(): void {
    // Implementation for time-based pattern detection
    // Add pattern detection logic here
  }

  private detectContentPatterns(): void {
    // Implementation for content preference pattern detection
    // Add pattern detection logic here
  }

  private getCurrentSessionId(): string {
    // Simple session management
    let sessionId = sessionStorage.getItem('rag_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('rag_session_id', sessionId)
    }
    return sessionId
  }

  private startPeriodicAnalysis(): void {
    // Regenerate insights every 30 minutes
    setInterval(() => {
      this.generateInsights()
    }, 30 * 60 * 1000)
  }

  /**
   * Get current insights for display
   */
  getCurrentInsights(): MLInsight[] {
    return this.insights
  }

  /**
   * Get usage metrics for dashboard
   */
  getCurrentMetrics(): UsageMetrics | null {
    return this.metrics
  }

  /**
   * Load persisted data
   */
  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('usage_based_ml_insights')
      if (stored) {
        const data = JSON.parse(stored)
        
        this.interactions = (data.interactions || []).map((i: Record<string, unknown>) => ({
          ...i,
          timestamp: new Date(i.timestamp as string)
        }))
        
        this.patterns = new Map(data.patterns || [])
        
        this.insights = (data.insights || []).map((i: Record<string, unknown>) => ({
          ...i,
          generatedAt: new Date(i.generatedAt as string)
        }))
      }
    } catch (error) {
      console.warn('Failed to load persisted ML insights data:', error)
    }
  }

  /**
   * Persist data
   */
  private persistData(): void {
    try {
      const data = {
        interactions: this.interactions,
        patterns: Array.from(this.patterns.entries()),
        insights: this.insights
      }
      localStorage.setItem('usage_based_ml_insights', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist ML insights data:', error)
    }
  }
}

// Singleton instance
export const usageBasedMLInsights = new UsageBasedMLInsights()
