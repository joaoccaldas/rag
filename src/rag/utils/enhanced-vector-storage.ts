/**
 * Enhanced vector storage with better similarity search and caching
 */

import { Document, SearchResult } from '../types'

export interface VectorSearchOptions {
  limit?: number
  threshold?: number
  includeMetadata?: boolean
  boost?: {
    titleMatch?: number
    recentDocuments?: number
    highImportance?: number
  }
}

export interface CachedEmbedding {
  id: string
  embedding: number[]
  timestamp: number
  tokenCount: number
}

export class EnhancedVectorStorage {
  private embeddingCache = new Map<string, CachedEmbedding>()
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000

  /**
   * Store document embeddings with caching
   */
  async storeEmbeddings(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      if (doc.embedding) {
        this.cacheEmbedding(`doc_${doc.id}`, doc.embedding, doc.content.length)
      }
      
      if (doc.chunks) {
        for (const chunk of doc.chunks) {
          if (chunk.embedding) {
            this.cacheEmbedding(`chunk_${chunk.id}`, chunk.embedding, chunk.content.length)
          }
        }
      }
    }
    
    this.cleanupCache()
  }

  /**
   * Enhanced similarity search with multiple ranking factors
   */
  async searchSimilar(
    queryEmbedding: number[],
    documents: Document[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 5,
      threshold = 0.1, // Lower base threshold to catch more results
      boost = {
        titleMatch: 0.15, // Reduced boost values to prevent over-inflation
        recentDocuments: 0.05,
        highImportance: 0.1
      }
    } = options

    // Check search cache first
    const cacheKey = this.getSearchCacheKey(queryEmbedding, options)
    const cached = this.searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results.slice(0, limit)
    }

    const results: SearchResult[] = []

    for (const document of documents) {
      if (document.status !== 'ready' || !document.chunks) continue

      for (const chunk of document.chunks) {
        if (!chunk.embedding) continue

        // Calculate base similarity - this is the core relevance metric
        const baseSimilarity = this.calculateCosineSimilarity(queryEmbedding, chunk.embedding)
        
        // Apply stricter threshold to filter out irrelevant content
        if (baseSimilarity < threshold) continue

        // Apply conservative boosting factors (multiplicative, not additive)
        let finalSimilarity = baseSimilarity

        // Only apply boosts if base similarity is reasonable (> 0.4)
        if (baseSimilarity > 0.4) {
          // Boost for title/name matches (placeholder - would need actual query text)
          // if (boost.titleMatch && queryContainsDocumentName) {
          //   finalSimilarity *= (1 + boost.titleMatch)
          // }

          // Boost recent documents (multiplicative)
          if (boost.recentDocuments) {
            const daysSinceUpload = (Date.now() - document.uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
            if (daysSinceUpload < 7) {
              finalSimilarity *= (1 + boost.recentDocuments * (1 - daysSinceUpload / 7))
            }
          }

          // Boost high-importance chunks (multiplicative)
          if (boost.highImportance && chunk.metadata.importance && chunk.metadata.importance > 0.7) {
            finalSimilarity *= (1 + boost.highImportance * chunk.metadata.importance)
          }
        }

        // Ensure similarity doesn't exceed 0.95 to prevent false 100% scores
        finalSimilarity = Math.min(finalSimilarity, 0.95)

        results.push({
          chunk,
          document,
          similarity: finalSimilarity,
          relevantText: this.extractRelevantText(chunk.content, 200)
        })
      }
    }

    // Sort by similarity and apply additional ranking
    const rankedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit * 2) // Get more results for re-ranking
      .map(result => ({
        ...result,
        similarity: this.applyDiversityBoost(result, results)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    // Cache results
    this.searchCache.set(cacheKey, {
      results: rankedResults,
      timestamp: Date.now()
    })

    return rankedResults
  }

  /**
   * Improved cosine similarity calculation
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Cache embedding with metadata
   */
  private cacheEmbedding(id: string, embedding: number[], tokenCount: number): void {
    this.embeddingCache.set(id, {
      id,
      embedding: [...embedding], // Clone to prevent mutation
      timestamp: Date.now(),
      tokenCount
    })
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    
    // Clean embedding cache
    for (const [key, cached] of this.embeddingCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.embeddingCache.delete(key)
      }
    }

    // Clean search cache
    for (const [key, cached] of this.searchCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.searchCache.delete(key)
      }
    }

    // Limit cache size
    if (this.embeddingCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.embeddingCache.entries())
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE)
      toDelete.forEach(([key]) => this.embeddingCache.delete(key))
    }
  }

  /**
   * Generate cache key for search
   */
  private getSearchCacheKey(embedding: number[], options: VectorSearchOptions): string {
    const embeddingHash = this.hashEmbedding(embedding)
    const optionsHash = JSON.stringify(options)
    return `${embeddingHash}_${btoa(optionsHash).slice(0, 10)}`
  }

  /**
   * Simple embedding hash for caching
   */
  private hashEmbedding(embedding: number[]): string {
    let hash = 0
    for (let i = 0; i < Math.min(embedding.length, 100); i += 10) {
      hash += embedding[i] * (i + 1)
    }
    return Math.abs(hash).toString(36).slice(0, 8)
  }

  /**
   * Extract relevant text snippet
   */
  private extractRelevantText(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    
    // Try to find a good breaking point
    const truncated = content.slice(0, maxLength)
    const lastSentence = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    
    const breakPoint = lastSentence > maxLength * 0.7 ? lastSentence + 1 :
                      lastSpace > maxLength * 0.8 ? lastSpace : maxLength
    
    return content.slice(0, breakPoint) + (breakPoint < content.length ? '...' : '')
  }

  /**
   * Apply diversity boost to prevent redundant results
   */
  private applyDiversityBoost(result: SearchResult, allResults: SearchResult[]): number {
    let similarity = result.similarity
    
    // Check for content similarity with higher-ranked results
    const higherRanked = allResults.filter(r => r.similarity > result.similarity)
    
    for (const other of higherRanked) {
      const contentSimilarity = this.calculateTextSimilarity(
        result.chunk.content,
        other.chunk.content
      )
      
      // Penalize very similar content
      if (contentSimilarity > 0.8) {
        similarity *= 0.7
      } else if (contentSimilarity > 0.6) {
        similarity *= 0.9
      }
    }
    
    return similarity
  }

  /**
   * Simple text similarity calculation
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  /**
   * Placeholder for embedding to text conversion
   * In a real implementation, this would require the actual query text
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private embeddingToText(_embedding: number[]): string {
    // This is a placeholder - in practice, you'd need to store the original text
    // or use a different approach to match embeddings with query text
    return ''
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    embeddingCacheSize: number
    searchCacheSize: number
    cacheHitRate: number
  } {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      searchCacheSize: this.searchCache.size,
      cacheHitRate: 0 // Would need to track hits/misses to calculate this
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.embeddingCache.clear()
    this.searchCache.clear()
  }
}

// Export singleton instance
export const enhancedVectorStorage = new EnhancedVectorStorage()
