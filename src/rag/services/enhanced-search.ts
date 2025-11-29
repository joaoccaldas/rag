/**
 * Enhanced Search Service with Reranking
 * 
 * Improvements over basic search:
 * - Semantic search using embeddings
 * - Query expansion for better coverage
 * - Reranking for improved relevance
 * - Hybrid search (semantic + keyword)
 * - Metadata filtering
 */

import { Document, SearchResult } from '../types'
import { SemanticChunkingService } from './semantic-chunking'

export interface EnhancedSearchOptions {
  topK?: number              // Number of results to return
  rerankTopN?: number        // Number of results to rerank
  similarityThreshold?: number
  useQueryExpansion?: boolean
  useHybridSearch?: boolean
  metadataFilters?: {
    dateRange?: { start: Date; end: Date }
    documentTypes?: string[]
    keywords?: string[]
    minImportance?: number
  }
}

export interface RankedResult extends SearchResult {
  initialScore: number
  rerankedScore: number
  scoringBreakdown: {
    semantic: number
    keyword: number
    metadata: number
    recency: number
  }
}

export class EnhancedSearchService {
  private semanticChunker: SemanticChunkingService

  constructor() {
    this.semanticChunker = new SemanticChunkingService()
  }

  /**
   * Enhanced search with reranking
   */
  async search(
    query: string,
    documents: Document[],
    options: EnhancedSearchOptions = {}
  ): Promise<RankedResult[]> {
    const {
      topK = 8,
      rerankTopN = 20,
      similarityThreshold = 0.3,
      useQueryExpansion = true,
      useHybridSearch = true,
      metadataFilters
    } = options

    console.log(`🔍 Enhanced search for: "${query}"`)
    console.log(`📊 Settings: topK=${topK}, rerankTopN=${rerankTopN}, hybrid=${useHybridSearch}`)

    // Step 1: Query expansion
    const expandedQueries = useQueryExpansion 
      ? this.expandQuery(query)
      : [query]

    console.log(`📝 Expanded queries:`, expandedQueries)

    // Step 2: Generate query embedding
    const queryEmbedding = await this.semanticChunker['generateEmbedding'](query)

    // Step 3: Initial retrieval (get more results than needed for reranking)
    const initialResults = await this.initialRetrieval(
      query,
      expandedQueries,
      queryEmbedding,
      documents,
      {
        topN: rerankTopN,
        similarityThreshold,
        useHybridSearch,
        metadataFilters
      }
    )

    console.log(`✅ Initial retrieval: ${initialResults.length} results`)

    // Step 4: Rerank results
    const rerankedResults = await this.rerankResults(
      query,
      queryEmbedding,
      initialResults,
      documents
    )

    // Step 5: Return top K results
    const finalResults = rerankedResults.slice(0, topK)

    console.log(`🎯 Final results: ${finalResults.length} after reranking`)

    return finalResults
  }

  /**
   * Expand query with synonyms and related terms
   */
  private expandQuery(query: string): string[] {
    const expansions = [query]

    // Business domain expansions
    const expansionMap: { [key: string]: string[] } = {
      'sales': ['revenue', 'orders', 'transactions'],
      'revenue': ['sales', 'income', 'earnings'],
      'growth': ['increase', 'expansion', 'development'],
      'plan': ['strategy', 'roadmap', 'initiative'],
      'nordic': ['scandinavia', 'northern europe'],
      'nordics': ['scandinavia', 'northern european', 'denmark', 'sweden', 'norway', 'finland'],
      'fight': ['strategy', 'action plan', 'initiative'],
      'performance': ['results', 'metrics', 'kpi'],
      'analysis': ['review', 'assessment', 'evaluation'],
      'market': ['sector', 'industry', 'segment']
    }

    const queryWords = query.toLowerCase().split(/\s+/)

    for (const word of queryWords) {
      if (expansionMap[word]) {
        for (const synonym of expansionMap[word]) {
          const expandedQuery = query.toLowerCase().replace(word, synonym)
          if (!expansions.includes(expandedQuery)) {
            expansions.push(expandedQuery)
          }
        }
      }
    }

    return expansions.slice(0, 5) // Limit to 5 variations
  }

  /**
   * Initial retrieval with hybrid search
   */
  private async initialRetrieval(
    originalQuery: string,
    expandedQueries: string[],
    queryEmbedding: number[],
    documents: Document[],
    options: {
      topN: number
      similarityThreshold: number
      useHybridSearch: boolean
      metadataFilters?: EnhancedSearchOptions['metadataFilters']
    }
  ): Promise<RankedResult[]> {
    const results: Map<string, RankedResult> = new Map()

    for (const document of documents) {
      // Apply metadata filters
      if (options.metadataFilters) {
        if (!this.passesMetadataFilters(document, options.metadataFilters)) {
          continue
        }
      }

      // Search through document chunks
      for (const chunk of document.chunks || []) {
        const chunkEmbedding = chunk.embedding || []

        // Semantic similarity
        const semanticScore = this.cosineSimilarity(queryEmbedding, chunkEmbedding)

        // Keyword matching score
        const keywordScore = options.useHybridSearch
          ? this.calculateKeywordScore(originalQuery, expandedQueries, chunk.content)
          : 0

        // Metadata boost
        const metadataScore = this.calculateMetadataScore(chunk, document)

        // Combined initial score
        const combinedScore = options.useHybridSearch
          ? semanticScore * 0.6 + keywordScore * 0.3 + metadataScore * 0.1
          : semanticScore

        if (combinedScore >= options.similarityThreshold) {
          const resultId = `${document.id}_${chunk.id}`

          // Keep best score if duplicate
          if (!results.has(resultId) || (results.get(resultId)?.initialScore || 0) < combinedScore) {
            results.set(resultId, {
              id: resultId,
              content: chunk.content,
              score: combinedScore,
              chunk,
              document: document as Document, // Use full document object
              similarity: combinedScore,
              relevantText: chunk.content.substring(0, 200),
              initialScore: combinedScore,
              rerankedScore: combinedScore,
              scoringBreakdown: {
                semantic: semanticScore,
                keyword: keywordScore,
                metadata: metadataScore,
                recency: 0
              }
            })
          }
        }
      }
    }

    // Sort by initial score and return top N
    return Array.from(results.values())
      .sort((a, b) => b.initialScore - a.initialScore)
      .slice(0, options.topN)
  }

  /**
   * Rerank results using advanced scoring
   */
  private async rerankResults(
    query: string,
    queryEmbedding: number[],
    results: RankedResult[],
    documents: Document[]
  ): Promise<RankedResult[]> {
    console.log(`🔄 Reranking ${results.length} results...`)

    const rerankedResults = results.map(result => {
      // Recency score (newer documents scored higher)
      const recencyScore = this.calculateRecencyScore(result, documents)

      // Context quality score
      const contextQualityScore = this.calculateContextQuality(result, query)

      // Position score (earlier chunks might be more important)
      const positionScore = this.calculatePositionScore(result)

      // Recalculate with reranking weights
      const rerankedScore =
        result.scoringBreakdown.semantic * 0.4 +
        result.scoringBreakdown.keyword * 0.25 +
        result.scoringBreakdown.metadata * 0.1 +
        recencyScore * 0.1 +
        contextQualityScore * 0.1 +
        positionScore * 0.05

      return {
        ...result,
        rerankedScore,
        scoringBreakdown: {
          ...result.scoringBreakdown,
          recency: recencyScore
        }
      }
    })

    // Sort by reranked score
    return rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore)
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] || 0) * (b[i] || 0)
      magnitudeA += (a[i] || 0) * (a[i] || 0)
      magnitudeB += (b[i] || 0) * (b[i] || 0)
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) return 0

    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(
    originalQuery: string,
    expandedQueries: string[],
    content: string
  ): number {
    const contentLower = content.toLowerCase()
    let score = 0

    // Check original query
    const originalWords = originalQuery.toLowerCase().split(/\s+/)
    const originalMatches = originalWords.filter(word => 
      word.length > 2 && contentLower.includes(word)
    ).length
    score += (originalMatches / originalWords.length) * 0.6

    // Check expanded queries
    for (const expandedQuery of expandedQueries.slice(1)) { // Skip original
      const expandedWords = expandedQuery.split(/\s+/)
      const expandedMatches = expandedWords.filter(word =>
        word.length > 2 && contentLower.includes(word)
      ).length
      score += (expandedMatches / expandedWords.length) * 0.4 / expandedQueries.length
    }

    return Math.min(1, score)
  }

  /**
   * Calculate metadata score
   */
  private calculateMetadataScore(
    chunk: { 
      metadata?: { 
        importance?: number
        semanticDensity?: number
        coherence?: number
      } 
    }, 
    document: Document
  ): number {
    let score = 0

    // Chunk metadata boost
    if (chunk.metadata) {
      if (chunk.metadata.importance) {
        score += chunk.metadata.importance * 0.3
      }
      if (chunk.metadata.semanticDensity) {
        score += chunk.metadata.semanticDensity * 0.2
      }
      if (chunk.metadata.coherence) {
        score += chunk.metadata.coherence * 0.2
      }
    }

    // Document metadata boost
    if (document.aiAnalysis) {
      if (document.aiAnalysis.confidence) {
        score += document.aiAnalysis.confidence * 0.3
      }
    }

    return Math.min(1, score)
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(result: RankedResult, documents: Document[]): number {
    if (!result.document?.id) return 0.5
    
    const document = documents.find(d => d.id === result.document?.id)
    if (!document || !document.uploadedAt) return 0.5

    const now = new Date()
    const uploadDate = new Date(document.uploadedAt)
    const daysSinceUpload = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)

    // Exponential decay: newer documents get higher scores
    return Math.exp(-daysSinceUpload / 30) // 30-day half-life
  }

  /**
   * Calculate context quality score
   */
  private calculateContextQuality(result: RankedResult, query: string): number {
    if (!result.chunk) return 0.5
    
    const content = result.chunk.content
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)

    // Check if query words appear close together
    let proximityScore = 0
    for (let i = 0; i < queryWords.length - 1; i++) {
      const word1Pos = content.toLowerCase().indexOf(queryWords[i] || '')
      const word2Pos = content.toLowerCase().indexOf(queryWords[i + 1] || '')

      if (word1Pos !== -1 && word2Pos !== -1) {
        const distance = Math.abs(word2Pos - word1Pos)
        proximityScore += Math.max(0, 1 - distance / 100)
      }
    }

    // Normalize
    return queryWords.length > 1 ? proximityScore / (queryWords.length - 1) : 0.5
  }

  /**
   * Calculate position score (earlier chunks might be more important)
   */
  private calculatePositionScore(result: RankedResult): number {
    if (!result.chunk) return 0.5
    
    const chunkId = result.chunk.id
    const chunkIndex = parseInt(chunkId.split('_chunk_')[1] || '0')

    // First 3 chunks get higher scores
    if (chunkIndex < 3) return 1.0
    if (chunkIndex < 5) return 0.8
    if (chunkIndex < 10) return 0.6
    return 0.4
  }

  /**
   * Check if document passes metadata filters
   */
  private passesMetadataFilters(
    document: Document,
    filters: NonNullable<EnhancedSearchOptions['metadataFilters']>
  ): boolean {
    // Date range filter
    if (filters.dateRange && document.uploadedAt) {
      const uploadDate = new Date(document.uploadedAt)
      if (uploadDate < filters.dateRange.start || uploadDate > filters.dateRange.end) {
        return false
      }
    }

    // Document type filter
    if (filters.documentTypes && filters.documentTypes.length > 0) {
      if (!filters.documentTypes.includes(document.type)) {
        return false
      }
    }

    // Keyword filter
    if (filters.keywords && filters.keywords.length > 0) {
      const docKeywords = document.aiAnalysis?.keywords || []
      const hasKeyword = filters.keywords.some(kw =>
        docKeywords.some(dk => dk.toLowerCase().includes(kw.toLowerCase()))
      )
      if (!hasKeyword) {
        return false
      }
    }

    // Minimum importance filter
    if (filters.minImportance !== undefined && document.aiAnalysis?.confidence) {
      if (document.aiAnalysis.confidence < filters.minImportance) {
        return false
      }
    }

    return true
  }
}

export const enhancedSearchService = new EnhancedSearchService()
