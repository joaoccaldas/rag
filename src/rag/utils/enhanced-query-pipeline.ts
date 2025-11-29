/**
 * Enhanced RAG Query Pipeline
 * Addresses core issues in context building, querying, ranking, and chunking
 */

import { SearchResult, DocumentChunk } from '../types'

// Interfaces for improved query processing
export interface QueryAnalysis {
  intent: 'factual' | 'conceptual' | 'procedural' | 'analytical'
  domain: string[]
  entities: string[]
  complexity: 'simple' | 'medium' | 'complex'
  expectedAnswerType: 'short' | 'detailed' | 'list' | 'summary'
}

export interface EnhancedSearchOptions {
  contextSize: number // Number of chunks to return
  diversityThreshold: number // Minimum diversity between results
  reRankThreshold: number // Minimum score for reranking
  useSemanticChunking: boolean
  includeMetadata: boolean
}

export interface ChunkRelevanceScore {
  semanticSimilarity: number
  keywordOverlap: number
  contextRelevance: number
  recencyScore: number
  authorityScore: number
  finalScore: number
  explanation: string
}

/**
 * Enhanced Query Processor with proper intent analysis
 */
export class EnhancedQueryProcessor {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ])

  /**
   * Analyze query to understand intent and extract key information
   */
  analyzeQuery(query: string): QueryAnalysis {
    const cleanQuery = query.toLowerCase().trim()
    const words = cleanQuery.split(/\s+/).filter(w => !this.stopWords.has(w))
    
    // Intent detection based on question patterns
    let intent: QueryAnalysis['intent'] = 'factual'
    if (/^(how|why|what|where|when|who)/i.test(query)) {
      if (/how\s+(to|do|can)/i.test(query)) intent = 'procedural'
      else if (/why|explain|because/i.test(query)) intent = 'conceptual'
      else intent = 'factual'
    } else if (/analyze|compare|evaluate|assess|review/i.test(query)) {
      intent = 'analytical'
    }

    // Domain detection (business terms, technical terms, etc.)
    const businessTerms = ['revenue', 'market', 'sales', 'profit', 'strategy', 'business', 'company', 'customer']
    const technicalTerms = ['algorithm', 'system', 'process', 'method', 'technology', 'software', 'data']
    const domain = []
    
    if (words.some(w => businessTerms.includes(w))) domain.push('business')
    if (words.some(w => technicalTerms.includes(w))) domain.push('technical')

    // Entity extraction (simplified)
    const entities = words.filter(w => w.length > 3 && /^[A-Z]/.test(w))

    // Complexity assessment
    const complexity = query.length > 100 || words.length > 15 ? 'complex' : 
                      words.length > 8 ? 'medium' : 'simple'

    // Expected answer type
    let expectedAnswerType: QueryAnalysis['expectedAnswerType'] = 'short'
    if (/explain|describe|analyze|detail/i.test(query)) expectedAnswerType = 'detailed'
    else if (/list|enumerate|items|steps/i.test(query)) expectedAnswerType = 'list'
    else if (/summary|overview|brief/i.test(query)) expectedAnswerType = 'summary'

    return {
      intent,
      domain,
      entities,
      complexity,
      expectedAnswerType
    }
  }

  /**
   * Expand query with synonyms and related terms
   */
  expandQuery(query: string, analysis: QueryAnalysis): string[] {
    const variations = [query] // Start with original
    
    // Add domain-specific expansions
    if (analysis.domain.includes('business')) {
      const businessSynonyms = {
        'revenue': ['income', 'earnings', 'sales'],
        'profit': ['earnings', 'income', 'margin'],
        'customer': ['client', 'user', 'consumer']
      }
      
      const expanded = query
      for (const [term, synonyms] of Object.entries(businessSynonyms)) {
        if (query.toLowerCase().includes(term)) {
          synonyms.forEach(syn => {
            variations.push(expanded.replace(new RegExp(term, 'gi'), syn))
          })
        }
      }
    }

    return variations
  }

  /**
   * Calculate comprehensive relevance score for a chunk
   */
  calculateRelevanceScore(
    chunk: DocumentChunk,
    query: string,
    queryEmbedding: number[],
    analysis: QueryAnalysis
  ): ChunkRelevanceScore {
    const scores = {
      semanticSimilarity: 0,
      keywordOverlap: 0,
      contextRelevance: 0,
      recencyScore: 0,
      authorityScore: 0,
      finalScore: 0,
      explanation: ''
    }

    // 1. Semantic Similarity (40% weight)
    if (chunk.embedding && queryEmbedding) {
      scores.semanticSimilarity = this.cosineSimilarity(chunk.embedding, queryEmbedding)
    }

    // 2. Keyword Overlap (25% weight)
    const queryWords = query.toLowerCase().split(/\s+/)
    const chunkWords = chunk.content.toLowerCase().split(/\s+/)
    const overlap = queryWords.filter(w => chunkWords.includes(w)).length
    scores.keywordOverlap = overlap / queryWords.length

    // 3. Context Relevance (20% weight)
    // Check if chunk is in a section relevant to the query
    if (chunk.metadata?.section) {
      const sectionRelevance = this.calculateSectionRelevance(chunk.metadata.section, analysis)
      scores.contextRelevance = sectionRelevance
    }

    // 4. Recency Score (10% weight) 
    // More recent documents might be more relevant
    const documentAge = Date.now() - new Date().getTime() // Placeholder for actual document date
    const maxAge = 365 * 24 * 60 * 60 * 1000 // 1 year in ms
    scores.recencyScore = Math.max(0, 1 - (documentAge / maxAge))

    // 5. Authority Score (5% weight)
    // Based on chunk importance, document type, etc.
    scores.authorityScore = chunk.metadata?.importance || 0.5

    // Calculate final weighted score
    scores.finalScore = (
      scores.semanticSimilarity * 0.40 +
      scores.keywordOverlap * 0.25 +
      scores.contextRelevance * 0.20 +
      scores.recencyScore * 0.10 +
      scores.authorityScore * 0.05
    )

    // Generate explanation
    const topScores = [
      { name: 'semantic', value: scores.semanticSimilarity },
      { name: 'keyword', value: scores.keywordOverlap },
      { name: 'context', value: scores.contextRelevance }
    ].sort((a, b) => b.value - a.value)

    scores.explanation = `Strong in: ${topScores[0].name} (${(topScores[0].value * 100).toFixed(0)}%)`

    return scores
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Calculate section relevance based on query analysis
   */
  private calculateSectionRelevance(section: string, analysis: QueryAnalysis): number {
    const sectionLower = section.toLowerCase()
    
    // Map query domains to section types
    const sectionMappings = {
      business: ['summary', 'overview', 'analysis', 'strategy', 'market'],
      technical: ['implementation', 'method', 'process', 'system', 'algorithm'],
      factual: ['introduction', 'background', 'definition', 'fact']
    }

    let relevance = 0.5 // Base relevance

    for (const domain of analysis.domain) {
      const relevantSections = sectionMappings[domain as keyof typeof sectionMappings] || []
      if (relevantSections.some(s => sectionLower.includes(s))) {
        relevance += 0.3
      }
    }

    return Math.min(relevance, 1.0)
  }

  /**
   * Re-rank results using advanced algorithms
   */
  reRankResults(
    results: SearchResult[],
    query: string,
    queryAnalysis: QueryAnalysis,
    options: EnhancedSearchOptions
  ): SearchResult[] {
    // Remove duplicates and low-quality results
    const filtered = this.removeDuplicates(results)
      .filter(r => r.similarity > options.reRankThreshold)

    // Apply diversity filtering
    const diverse = this.applyDiversityFilter(filtered)

    // Final ranking based on multiple factors
    return diverse
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.contextSize)
  }

  /**
   * Remove duplicate or very similar chunks
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    const unique: SearchResult[] = []

    for (const result of results) {
      const key = `${result.document.id}-${result.chunk.id}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(result)
      }
    }

    return unique
  }

  /**
   * Apply diversity filtering to avoid too many results from same document
   */
  private applyDiversityFilter(results: SearchResult[]): SearchResult[] {
    const documentCounts = new Map<string, number>()
    const diverse: SearchResult[] = []
    const maxPerDocument = 3

    for (const result of results) {
      const docId = result.document.id
      const currentCount = documentCounts.get(docId) || 0
      
      if (currentCount < maxPerDocument) {
        diverse.push(result)
        documentCounts.set(docId, currentCount + 1)
      }
    }

    return diverse
  }
}

/**
 * Enhanced Context Builder with better chunk assembly
 */
export class EnhancedContextBuilder {
  /**
   * Build optimized context from search results
   */
  buildContext(
    results: SearchResult[],
    queryAnalysis: QueryAnalysis,
    maxTokens: number = 4000
  ): {
    context: string
    sources: SearchResult[]
    tokenCount: number
  } {
    let context = ''
    let tokenCount = 0
    const usedSources: SearchResult[] = []

    // Sort by relevance and add context incrementally
    const sortedResults = results.sort((a, b) => b.similarity - a.similarity)

    for (const result of sortedResults) {
      const chunkText = this.formatChunkForContext(result)
      const chunkTokens = this.estimateTokens(chunkText)

      // Check if adding this chunk would exceed token limit
      if (tokenCount + chunkTokens > maxTokens && usedSources.length > 0) {
        break
      }

      context += chunkText + '\n\n'
      tokenCount += chunkTokens
      usedSources.push(result)
    }

    return {
      context: context.trim(),
      sources: usedSources,
      tokenCount
    }
  }

  /**
   * Format chunk for optimal context presentation
   */
  private formatChunkForContext(result: SearchResult): string {
    const chunk = result.chunk
    const doc = result.document
    
    // Add document context
    let formatted = `[Source: ${doc.name}]`
    
    // Add section context if available
    if (chunk.metadata?.section) {
      formatted += ` [Section: ${chunk.metadata.section}]`
    }
    
    formatted += `\n${chunk.content}`
    
    // Add confidence indicator
    if (result.similarity > 0.8) {
      formatted += ` [High Relevance: ${Math.round(result.similarity * 100)}%]`
    }

    return formatted
  }

  /**
   * Better token estimation
   */
  private estimateTokens(text: string): number {
    // More accurate estimation using word-based calculation
    const words = text.split(/\s+/)
    let tokens = 0
    
    for (const word of words) {
      if (word.length <= 4) tokens += 1
      else if (word.length <= 8) tokens += Math.ceil(word.length / 4)
      else tokens += Math.ceil(word.length / 3.5)
    }
    
    return Math.ceil(tokens * 1.3) // Add buffer for special tokens
  }
}

// Export enhanced processor instance
export const enhancedQueryProcessor = new EnhancedQueryProcessor()
export const enhancedContextBuilder = new EnhancedContextBuilder()
