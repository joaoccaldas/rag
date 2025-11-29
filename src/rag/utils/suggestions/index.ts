/**
 * Real-time Suggestions System
 * 
 * Provides intelligent query suggestions, auto-completion, and related
 * topics based on document content and user behavior patterns.
 * 
 * Why: Enhances user experience by providing contextual assistance
 * and helping users discover relevant content they might not have known to search for.
 */

export interface Suggestion {
  id: string
  text: string
  type: 'completion' | 'related' | 'topic' | 'correction'
  score: number
  context?: string
  metadata?: {
    source?: string
    category?: string
    popularity?: number
    recency?: number
  }
}

export interface SuggestionConfig {
  enabled: boolean
  maxSuggestions: number
  minQueryLength: number
  enableAutoComplete: boolean
  enableRelatedTopics: boolean
  enableSpellCheck: boolean
  enablePopularQueries: boolean
  debounceMs: number
  useSemanticSimilarity: boolean
}

export interface QueryAnalytics {
  query: string
  timestamp: Date
  resultCount: number
  clickThrough: boolean
  selectedSuggestion?: string
}

export interface TopicCluster {
  topic: string
  keywords: string[]
  documents: string[]
  popularity: number
  related: string[]
}

export class SuggestionEngine {
  private config: SuggestionConfig
  private queryHistory: QueryAnalytics[] = []
  private topicClusters: TopicCluster[] = []
  private documentIndex: Map<string, string[]> = new Map()
  private popularQueries: Map<string, number> = new Map()
  private relatedQueries: Map<string, string[]> = new Map()

  constructor(config: Partial<SuggestionConfig> = {}) {
    this.config = {
      enabled: true,
      maxSuggestions: 8,
      minQueryLength: 2,
      enableAutoComplete: true,
      enableRelatedTopics: true,
      enableSpellCheck: true,
      enablePopularQueries: true,
      debounceMs: 300,
      useSemanticSimilarity: true,
      ...config
    }

    this.initializeEngine()
  }

  private async initializeEngine() {
    // Load popular queries and topic clusters
    await this.loadPopularQueries()
    await this.buildTopicClusters()
    await this.loadQueryHistory()
  }

  async getSuggestions(
    query: string,
    context?: { documentId?: string; category?: string }
  ): Promise<Suggestion[]> {
    if (!this.config.enabled || query.length < this.config.minQueryLength) {
      return []
    }

    const suggestions: Suggestion[] = []

    try {
      // 1. Auto-completion suggestions
      if (this.config.enableAutoComplete) {
        const completions = await this.getAutoCompletions(query)
        suggestions.push(...completions)
      }

      // 2. Spell check suggestions
      if (this.config.enableSpellCheck) {
        const corrections = await this.getSpellCorrections(query)
        suggestions.push(...corrections)
      }

      // 3. Popular query suggestions
      if (this.config.enablePopularQueries) {
        const popular = await this.getPopularQuerySuggestions(query)
        suggestions.push(...popular)
      }

      // 4. Related topic suggestions
      if (this.config.enableRelatedTopics) {
        const related = await this.getRelatedTopicSuggestions(query, context)
        suggestions.push(...related)
      }

      // 5. Semantic similarity suggestions
      if (this.config.useSemanticSimilarity) {
        const semantic = await this.getSemanticSuggestions(query)
        suggestions.push(...semantic)
      }

      // 6. Context-based suggestions
      if (context) {
        const contextual = await this.getContextualSuggestions(query, context)
        suggestions.push(...contextual)
      }

      // Deduplicate, score, and limit results
      return this.rankAndFilterSuggestions(suggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  private async getAutoCompletions(query: string): Promise<Suggestion[]> {
    const completions: Suggestion[] = []
    const queryLower = query.toLowerCase()

    // Search through popular queries for auto-completions
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (popularQuery.toLowerCase().startsWith(queryLower) && popularQuery !== query) {
        completions.push({
          id: `completion_${Date.now()}_${Math.random()}`,
          text: popularQuery,
          type: 'completion',
          score: this.calculatePopularityScore(count),
          metadata: {
            popularity: count,
            category: 'auto-complete'
          }
        })
      }
    }

    // Search through document keywords
    for (const [docId, keywords] of this.documentIndex.entries()) {
      for (const keyword of keywords) {
        if (keyword.toLowerCase().startsWith(queryLower) && keyword !== query) {
          completions.push({
            id: `completion_${docId}_${keyword}`,
            text: keyword,
            type: 'completion',
            score: 0.6,
            metadata: {
              source: docId,
              category: 'keyword'
            }
          })
        }
      }
    }

    return completions.slice(0, 4) // Limit auto-completions
  }

  private async getSpellCorrections(query: string): Promise<Suggestion[]> {
    const corrections: Suggestion[] = []
    const words = query.toLowerCase().split(/\s+/)

    // Simple spell checking against known words
    const knownWords = new Set<string>()
    
    // Build dictionary from popular queries and document keywords
    for (const popularQuery of this.popularQueries.keys()) {
      popularQuery.toLowerCase().split(/\s+/).forEach(word => knownWords.add(word))
    }
    
    for (const keywords of this.documentIndex.values()) {
      keywords.forEach(keyword => 
        keyword.toLowerCase().split(/\s+/).forEach(word => knownWords.add(word))
      )
    }

    for (const word of words) {
      if (!knownWords.has(word) && word.length > 2) {
        // Find closest matches using Levenshtein distance
        const suggestions = this.findClosestWords(word, Array.from(knownWords))
        
        for (const suggestion of suggestions.slice(0, 2)) {
          const correctedQuery = query.replace(word, suggestion)
          corrections.push({
            id: `correction_${word}_${suggestion}`,
            text: correctedQuery,
            type: 'correction',
            score: 0.8,
            context: `Did you mean "${correctedQuery}"?`,
            metadata: {
              category: 'spell-check'
            }
          })
        }
      }
    }

    return corrections
  }

  private async getPopularQuerySuggestions(query: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []
    const queryLower = query.toLowerCase()

    // Find popular queries that contain the search terms
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (this.containsQueryTerms(popularQuery.toLowerCase(), queryLower)) {
        suggestions.push({
          id: `popular_${popularQuery}`,
          text: popularQuery,
          type: 'related',
          score: this.calculatePopularityScore(count) * 0.9,
          metadata: {
            popularity: count,
            category: 'popular'
          }
        })
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 3)
  }

  private async getRelatedTopicSuggestions(
    query: string,
    context?: { documentId?: string; category?: string }
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []
    const queryTerms = query.toLowerCase().split(/\s+/)

    // Find related topics based on keyword similarity
    for (const cluster of this.topicClusters) {
      const relevanceScore = this.calculateTopicRelevance(queryTerms, cluster.keywords)
      
      if (relevanceScore > 0.3) {
        // Suggest the main topic
        suggestions.push({
          id: `topic_${cluster.topic}`,
          text: cluster.topic,
          type: 'topic',
          score: relevanceScore * 0.8,
          context: `Related topic with ${cluster.documents.length} documents`,
          metadata: {
            category: 'topic',
            popularity: cluster.popularity
          }
        })

        // Suggest related topics
        for (const relatedTopic of cluster.related.slice(0, 2)) {
          suggestions.push({
            id: `related_${relatedTopic}`,
            text: relatedTopic,
            type: 'related',
            score: relevanceScore * 0.6,
            metadata: {
              category: 'related-topic'
            }
          })
        }
      }
    }

    return suggestions
  }

  private async getSemanticSuggestions(query: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []
    
    // Use semantic similarity to find related queries
    // This would typically use embeddings, but we'll simulate with keyword matching
    const queryTerms = query.toLowerCase().split(/\s+/)
    
    for (const [relatedQuery, related] of this.relatedQueries.entries()) {
      const similarity = this.calculateSemanticSimilarity(queryTerms, relatedQuery.split(/\s+/))
      
      if (similarity > 0.4) {
        for (const suggestion of related.slice(0, 2)) {
          suggestions.push({
            id: `semantic_${suggestion}`,
            text: suggestion,
            type: 'related',
            score: similarity * 0.7,
            metadata: {
              category: 'semantic'
            }
          })
        }
      }
    }

    return suggestions
  }

  private async getContextualSuggestions(
    query: string,
    context: { documentId?: string; category?: string }
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []

    // If we have document context, suggest related content from the same document
    if (context.documentId && this.documentIndex.has(context.documentId)) {
      const keywords = this.documentIndex.get(context.documentId)!
      const queryTerms = query.toLowerCase().split(/\s+/)

      for (const keyword of keywords) {
        if (!queryTerms.includes(keyword.toLowerCase()) && keyword.length > 2) {
          suggestions.push({
            id: `contextual_${context.documentId}_${keyword}`,
            text: `${query} ${keyword}`,
            type: 'related',
            score: 0.5,
            context: 'From current document',
            metadata: {
              source: context.documentId,
              category: 'contextual'
            }
          })
        }
      }
    }

    return suggestions.slice(0, 2)
  }

  private rankAndFilterSuggestions(suggestions: Suggestion[]): Suggestion[] {
    // Remove duplicates
    const uniqueSuggestions = new Map<string, Suggestion>()
    
    for (const suggestion of suggestions) {
      const key = suggestion.text.toLowerCase()
      if (!uniqueSuggestions.has(key) || uniqueSuggestions.get(key)!.score < suggestion.score) {
        uniqueSuggestions.set(key, suggestion)
      }
    }

    // Sort by score and apply diversity
    const ranked = Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxSuggestions)

    // Apply diversity to avoid too many suggestions of the same type
    const diversified = this.applyDiversity(ranked)

    return diversified
  }

  private applyDiversity(suggestions: Suggestion[]): Suggestion[] {
    const typeCount = new Map<string, number>()
    const maxPerType = Math.ceil(this.config.maxSuggestions / 4) // Distribute across types
    
    return suggestions.filter(suggestion => {
      const count = typeCount.get(suggestion.type) || 0
      if (count < maxPerType) {
        typeCount.set(suggestion.type, count + 1)
        return true
      }
      return false
    })
  }

  // Analytics and learning methods
  async recordQuery(analytics: QueryAnalytics): Promise<void> {
    this.queryHistory.push(analytics)
    
    // Update popular queries
    const count = this.popularQueries.get(analytics.query) || 0
    this.popularQueries.set(analytics.query, count + 1)
    
    // Learn from successful queries
    if (analytics.clickThrough) {
      await this.updateLearningModel()
    }
  }

  async recordSuggestionSelection(suggestion: Suggestion, originalQuery: string): Promise<void> {
    // Track which suggestions are most useful
    // This helps improve future suggestion ranking
    console.log(`Suggestion selected: ${suggestion.text} for query: ${originalQuery}`)
  }

  // Utility methods
  private calculatePopularityScore(count: number): number {
    // Logarithmic scoring for popularity
    return Math.min(1.0, Math.log(count + 1) / Math.log(100))
  }

  private calculateTopicRelevance(queryTerms: string[], topicKeywords: string[]): number {
    const intersection = queryTerms.filter(term => 
      topicKeywords.some(keyword => keyword.toLowerCase().includes(term))
    )
    return intersection.length / Math.max(queryTerms.length, topicKeywords.length)
  }

  private calculateSemanticSimilarity(terms1: string[], terms2: string[]): number {
    // Simple Jaccard similarity
    const set1 = new Set(terms1)
    const set2 = new Set(terms2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  private containsQueryTerms(text: string, query: string): boolean {
    const queryTerms = query.split(/\s+/).filter(term => term.length > 2)
    return queryTerms.some(term => text.includes(term))
  }

  private findClosestWords(word: string, dictionary: string[]): string[] {
    const distances = dictionary
      .map(dictWord => ({
        word: dictWord,
        distance: this.levenshteinDistance(word, dictWord)
      }))
      .filter(item => item.distance <= 2 && item.distance > 0)
      .sort((a, b) => a.distance - b.distance)
    
    return distances.slice(0, 3).map(item => item.word)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Initialization methods
  private async loadPopularQueries(): Promise<void> {
    // Simulate loading popular queries
    const sampleQueries = [
      'machine learning algorithms',
      'neural networks',
      'data preprocessing',
      'feature engineering',
      'model evaluation',
      'deep learning frameworks',
      'natural language processing',
      'computer vision',
      'reinforcement learning',
      'artificial intelligence'
    ]

    sampleQueries.forEach((query) => {
      this.popularQueries.set(query, Math.floor(Math.random() * 100) + 10)
    })
  }

  private async buildTopicClusters(): Promise<void> {
    // Simulate building topic clusters
    this.topicClusters = [
      {
        topic: 'Machine Learning',
        keywords: ['algorithm', 'model', 'training', 'prediction', 'classification'],
        documents: ['doc1', 'doc2', 'doc3'],
        popularity: 95,
        related: ['Deep Learning', 'Data Science', 'AI']
      },
      {
        topic: 'Data Science',
        keywords: ['data', 'analysis', 'statistics', 'visualization', 'insights'],
        documents: ['doc4', 'doc5'],
        popularity: 87,
        related: ['Machine Learning', 'Analytics', 'Big Data']
      },
      {
        topic: 'Web Development',
        keywords: ['javascript', 'react', 'frontend', 'backend', 'api'],
        documents: ['doc6', 'doc7'],
        popularity: 78,
        related: ['Software Engineering', 'UI/UX', 'DevOps']
      }
    ]
  }

  private async loadQueryHistory(): Promise<void> {
    // Load recent query history for learning
    // This would typically come from a database
  }

  private async updateLearningModel(): Promise<void> {
    // Update the learning model based on successful queries
    // This could involve updating topic clusters, popular queries, etc.
  }

  // Public methods for managing the engine
  async addDocument(documentId: string, content: string, keywords: string[]): Promise<void> {
    this.documentIndex.set(documentId, keywords)
    // Could also update topic clusters here
  }

  async removeDocument(documentId: string): Promise<void> {
    this.documentIndex.delete(documentId)
  }

  getConfig(): SuggestionConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<SuggestionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}
