/**
 * Real-time Search Suggestions Engine
 * 
 * Provides intelligent search suggestions with semantic expansion,
 * query history, and auto-completion for enhanced user experience.
 * 
 * Features:
 * - Semantic query expansion using document keywords
 * - Historical query suggestions with frequency scoring
 * - Real-time document title/content matching
 * - Fuzzy string matching for typo tolerance
 */

import { Document } from '../types'
import { generateEmbedding } from './document-processing'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'query' | 'document' | 'keyword' | 'historical'
  score: number
  metadata?: {
    documentId?: string
    frequency?: number
    lastUsed?: Date
    resultCount?: number
  }
}

export interface SuggestionConfig {
  maxSuggestions: number
  minQueryLength: number
  semanticThreshold: number
  includeHistory: boolean
  includeFuzzyMatching: boolean
  debounceMs: number
}

export class SearchSuggestionsEngine {
  private documents: Document[] = []
  private queryHistory: Map<string, { count: number; lastUsed: Date; resultCount: number }> = new Map()
  private keywordIndex: Map<string, string[]> = new Map() // keyword -> document IDs
  private config: SuggestionConfig

  constructor(config: Partial<SuggestionConfig> = {}) {
    this.config = {
      maxSuggestions: 10,
      minQueryLength: 2,
      semanticThreshold: 0.7,
      includeHistory: true,
      includeFuzzyMatching: true,
      debounceMs: 200,
      ...config
    }

    // Load query history from localStorage
    this.loadQueryHistory()
  }

  /**
   * Update the document index for suggestions
   */
  updateDocuments(documents: Document[]): void {
    this.documents = documents
    this.rebuildKeywordIndex()
  }

  /**
   * Get search suggestions for a query
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < this.config.minQueryLength) {
      return this.getPopularQueries()
    }

    const suggestions: SearchSuggestion[] = []

    // 1. Historical query suggestions
    if (this.config.includeHistory) {
      suggestions.push(...this.getHistoricalSuggestions(query))
    }

    // 2. Document title matches
    suggestions.push(...this.getDocumentTitleSuggestions(query))

    // 3. Keyword-based suggestions
    suggestions.push(...this.getKeywordSuggestions(query))

    // 4. Semantic suggestions (for longer queries)
    if (query.length >= 4) {
      suggestions.push(...await this.getSemanticSuggestions(query))
    }

    // 5. Fuzzy matching for typos
    if (this.config.includeFuzzyMatching) {
      suggestions.push(...this.getFuzzyMatchSuggestions(query))
    }

    // Deduplicate, sort by score, and limit results
    return this.rankAndDeduplicate(suggestions)
  }

  /**
   * Record a search query for future suggestions
   */
  recordQuery(query: string, resultCount: number): void {
    const existing = this.queryHistory.get(query.toLowerCase()) || { count: 0, lastUsed: new Date(), resultCount: 0 }
    
    this.queryHistory.set(query.toLowerCase(), {
      count: existing.count + 1,
      lastUsed: new Date(),
      resultCount
    })

    // Persist to localStorage
    this.saveQueryHistory()
  }

  /**
   * Get query completion suggestions
   */
  getQueryCompletions(partialQuery: string): SearchSuggestion[] {
    const completions: SearchSuggestion[] = []
    const lowerQuery = partialQuery.toLowerCase()

    // Search through historical queries
    for (const [query, data] of this.queryHistory.entries()) {
      if (query.startsWith(lowerQuery) && query !== lowerQuery) {
        completions.push({
          id: `completion_${query}`,
          text: query,
          type: 'historical',
          score: this.calculateHistoricalScore(data),
          metadata: {
            frequency: data.count,
            lastUsed: data.lastUsed,
            resultCount: data.resultCount
          }
        })
      }
    }

    // Search through document titles
    this.documents.forEach(doc => {
      const title = doc.name.toLowerCase()
      if (title.includes(lowerQuery)) {
        completions.push({
          id: `doc_completion_${doc.id}`,
          text: `"${doc.name}"`,
          type: 'document',
          score: 0.8,
          metadata: {
            documentId: doc.id
          }
        })
      }
    })

    return completions.slice(0, this.config.maxSuggestions)
  }

  private getPopularQueries(): SearchSuggestion[] {
    const popular = Array.from(this.queryHistory.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([query, data]) => ({
        id: `popular_${query}`,
        text: query,
        type: 'historical' as const,
        score: this.calculateHistoricalScore(data),
        metadata: {
          frequency: data.count,
          lastUsed: data.lastUsed,
          resultCount: data.resultCount
        }
      }))

    return popular
  }

  private getHistoricalSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []
    const lowerQuery = query.toLowerCase()

    for (const [historicalQuery, data] of this.queryHistory.entries()) {
      if (historicalQuery.includes(lowerQuery) || lowerQuery.includes(historicalQuery)) {
        suggestions.push({
          id: `hist_${historicalQuery}`,
          text: historicalQuery,
          type: 'historical',
          score: this.calculateHistoricalScore(data) * this.calculateSimilarity(query, historicalQuery),
          metadata: {
            frequency: data.count,
            lastUsed: data.lastUsed,
            resultCount: data.resultCount
          }
        })
      }
    }

    return suggestions
  }

  private getDocumentTitleSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []
    const lowerQuery = query.toLowerCase()

    this.documents.forEach(doc => {
      const title = doc.name.toLowerCase()
      if (title.includes(lowerQuery)) {
        const relevance = this.calculateTitleRelevance(query, doc.name)
        suggestions.push({
          id: `doc_${doc.id}`,
          text: `Search in "${doc.name}"`,
          type: 'document',
          score: relevance,
          metadata: {
            documentId: doc.id
          }
        })
      }
    })

    return suggestions
  }

  private getKeywordSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []
    const lowerQuery = query.toLowerCase()

    for (const [keyword, documentIds] of this.keywordIndex.entries()) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        suggestions.push({
          id: `keyword_${keyword}`,
          text: keyword,
          type: 'keyword',
          score: 0.6 * (documentIds.length / this.documents.length), // Boost popular keywords
          metadata: {
            resultCount: documentIds.length
          }
        })
      }
    }

    return suggestions
  }

  private async getSemanticSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const queryEmbedding = await generateEmbedding(query)
      const suggestions: SearchSuggestion[] = []

      // Find semantically similar document titles
      for (const doc of this.documents) {
        if (doc.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding)
          if (similarity > this.config.semanticThreshold) {
            suggestions.push({
              id: `semantic_${doc.id}`,
              text: `Related: "${doc.name}"`,
              type: 'document',
              score: similarity,
              metadata: {
                documentId: doc.id
              }
            })
          }
        }
      }

      return suggestions
    } catch (error) {
      console.warn('Failed to generate semantic suggestions:', error)
      return []
    }
  }

  private getFuzzyMatchSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []
    const queryWords = query.toLowerCase().split(' ')

    // Check against document names
    this.documents.forEach(doc => {
      const titleWords = doc.name.toLowerCase().split(' ')
      let fuzzyScore = 0

      queryWords.forEach(queryWord => {
        titleWords.forEach(titleWord => {
          const similarity = this.levenshteinSimilarity(queryWord, titleWord)
          if (similarity > 0.7) {
            fuzzyScore += similarity
          }
        })
      })

      if (fuzzyScore > 0) {
        suggestions.push({
          id: `fuzzy_${doc.id}`,
          text: `Did you mean "${doc.name}"?`,
          type: 'document',
          score: fuzzyScore / queryWords.length,
          metadata: {
            documentId: doc.id
          }
        })
      }
    })

    return suggestions
  }

  private rankAndDeduplicate(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    // Remove duplicates based on text
    const seen = new Set<string>()
    const unique = suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by score descending
    unique.sort((a, b) => b.score - a.score)

    // Limit results
    return unique.slice(0, this.config.maxSuggestions)
  }

  private rebuildKeywordIndex(): void {
    this.keywordIndex.clear()

    this.documents.forEach(doc => {
      // Extract keywords from AI analysis
      const keywords = doc.aiAnalysis?.keywords || []
      
      // Add document name words
      const nameWords = doc.name.toLowerCase().split(/\s+/)
      keywords.push(...nameWords)

      // Add to index
      keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase().trim()
        if (normalizedKeyword.length >= this.config.minQueryLength) {
          if (!this.keywordIndex.has(normalizedKeyword)) {
            this.keywordIndex.set(normalizedKeyword, [])
          }
          this.keywordIndex.get(normalizedKeyword)!.push(doc.id)
        }
      })
    })
  }

  private calculateHistoricalScore(data: { count: number; lastUsed: Date; resultCount: number }): number {
    const daysSinceUsed = (Date.now() - data.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.exp(-daysSinceUsed / 30) // Decay over 30 days
    const frequencyScore = Math.min(data.count / 10, 1) // Cap at 10 uses
    const qualityScore = data.resultCount > 0 ? 1 : 0.5 // Boost queries that found results
    
    return (recencyScore * 0.4 + frequencyScore * 0.4 + qualityScore * 0.2)
  }

  private calculateTitleRelevance(query: string, title: string): number {
    const queryWords = query.toLowerCase().split(' ')
    const titleWords = title.toLowerCase().split(' ')
    
    let matches = 0
    queryWords.forEach(queryWord => {
      titleWords.forEach(titleWord => {
        if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
          matches++
        }
      })
    })

    return matches / Math.max(queryWords.length, titleWords.length)
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(' ')
    const words2 = str2.toLowerCase().split(' ')
    
    let commonWords = 0
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        commonWords++
      }
    })

    return commonWords / Math.max(words1.length, words2.length)
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : 1 - (distance / maxLength)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }

  private loadQueryHistory(): void {
    try {
      const stored = localStorage.getItem('rag_search_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        for (const [query, data] of Object.entries(parsed)) {
          const historyData = data as { count: number; lastUsed: string; resultCount: number }
          this.queryHistory.set(query, {
            count: historyData.count,
            resultCount: historyData.resultCount,
            lastUsed: new Date(historyData.lastUsed)
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load query history:', error)
    }
  }

  private saveQueryHistory(): void {
    try {
      const data = Object.fromEntries(this.queryHistory.entries())
      localStorage.setItem('rag_search_history', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save query history:', error)
    }
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory.clear()
    localStorage.removeItem('rag_search_history')
  }

  /**
   * Get analytics about search patterns
   */
  getSearchAnalytics(): {
    totalQueries: number
    uniqueQueries: number
    averageQueryLength: number
    topQueries: Array<{ query: string; count: number }>
    queryDistribution: Record<string, number>
  } {
    const queries = Array.from(this.queryHistory.entries())
    const totalQueries = queries.reduce((sum, [, data]) => sum + data.count, 0)
    const queryLengths = queries.map(([query]) => query.length)
    
    return {
      totalQueries,
      uniqueQueries: queries.length,
      averageQueryLength: queryLengths.reduce((sum, len) => sum + len, 0) / queryLengths.length || 0,
      topQueries: queries
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([query, data]) => ({ query, count: data.count })),
      queryDistribution: queries.reduce((dist, [query, data]) => {
        const length = query.length
        const bucket = length < 5 ? 'short' : length < 15 ? 'medium' : 'long'
        dist[bucket] = (dist[bucket] || 0) + data.count
        return dist
      }, {} as Record<string, number>)
    }
  }
}

// Export singleton instance
export const searchSuggestionsEngine = new SearchSuggestionsEngine()
