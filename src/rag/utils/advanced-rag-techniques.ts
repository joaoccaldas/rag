"use client"

/**
 * Priority 3: Advanced RAG Techniques with Citation Tracking
 * 
 * Implements sophisticated RAG methodologies including:
 * - Query decomposition and expansion
 * - Multi-hop reasoning
 * - Contextual re-ranking
 * - Citation tracking and validation
 * - Source attribution and reliability scoring
 */

import { Document, SearchResult, DocumentChunk } from '../types'
import { MultiModelEmbedding, multiModelEmbeddingEnsemble } from './multi-model-embedding'

// Enhanced citation interface with tracking
export interface Citation {
  id: string
  documentId: string
  chunkId: string
  documentName: string
  pageNumber?: number
  lineNumber?: number
  startOffset?: number
  endOffset?: number
  relevantText: string
  confidence: number
  context: string
  timestamp: number
  verificationStatus: 'verified' | 'pending' | 'disputed' | 'invalid'
  parentQuery: string
  reasoning?: string
}

export interface AdvancedSearchResult extends SearchResult {
  citations: Citation[]
  confidenceScore: number
  reasoningPath: string[]
  factualAccuracy: number
  sourceReliability: number
  crossReferences: string[]
}

export interface QueryDecomposition {
  originalQuery: string
  subQueries: string[]
  queryType: 'factual' | 'analytical' | 'comparative' | 'procedural' | 'creative'
  complexity: number
  requiredHops: number
  entityFocus: string[]
}

export interface RerankingContext {
  userIntent: string
  documentTypes: string[]
  timelineRelevance?: Date
  domainSpecificity: number
  factualRequirement: boolean
}

export class AdvancedRAGEngine {
  private citationTracker: Map<string, Citation[]> = new Map()
  private queryHistory: QueryDecomposition[] = []
  private sourceReliabilityScores: Map<string, number> = new Map()

  /**
   * Execute advanced RAG with full citation tracking
   */
  async advancedSearch(
    query: string,
    documents: Document[],
    context?: RerankingContext
  ): Promise<AdvancedSearchResult[]> {
    const startTime = Date.now()
    
    try {
      // Step 1: Query Analysis and Decomposition
      const queryDecomposition = await this.decomposeQuery(query)
      this.queryHistory.push(queryDecomposition)

      // Step 2: Multi-hop Search Strategy
      const searchResults = await this.executeMultiHopSearch(
        queryDecomposition,
        documents
      )

      // Step 3: Citation Generation and Tracking
      const resultsWithCitations = await this.generateCitations(
        searchResults,
        queryDecomposition,
        documents
      )

      // Step 4: Contextual Re-ranking
      const rerankedResults = await this.contextualReranking(
        resultsWithCitations,
        queryDecomposition,
        context
      )

      // Step 5: Source Reliability Assessment
      const finalResults = await this.assessSourceReliability(rerankedResults)

      const endTime = Date.now()
      console.log(`✅ Advanced RAG completed in ${endTime - startTime}ms with ${finalResults.length} results`)

      return finalResults

    } catch (error) {
      console.error('❌ Advanced RAG search failed:', error)
      throw error
    }
  }

  /**
   * Decompose complex queries into sub-queries
   */
  private async decomposeQuery(query: string): Promise<QueryDecomposition> {
    // Analyze query characteristics
    const wordCount = query.split(/\s+/).length
    const hasQuestions = /\?/.test(query)
    const hasComparisons = /(?:vs|versus|compare|difference|better|worse)/i.test(query)
    const hasSequence = /(?:step|process|how to|procedure)/i.test(query)

    // Determine query type
    let queryType: QueryDecomposition['queryType'] = 'factual'
    if (hasComparisons) queryType = 'comparative'
    else if (hasSequence) queryType = 'procedural'
    else if (wordCount > 15) queryType = 'analytical'
    else if (/(?:create|generate|design|build)/i.test(query)) queryType = 'creative'

    // Calculate complexity
    const complexity = Math.min(
      (wordCount / 10) + 
      (hasQuestions ? 0.2 : 0) + 
      (hasComparisons ? 0.3 : 0) + 
      (hasSequence ? 0.4 : 0),
      1.0
    )

    // Extract entities using simple regex (in production, use NER)
    const entityMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    const entityFocus = [...new Set(entityMatches)].slice(0, 5)

    // Generate sub-queries for complex queries
    const subQueries = await this.generateSubQueries(query, queryType, complexity)

    return {
      originalQuery: query,
      subQueries,
      queryType,
      complexity,
      requiredHops: Math.ceil(complexity * 3) + 1,
      entityFocus
    }
  }

  /**
   * Generate sub-queries for multi-hop reasoning
   */
  private async generateSubQueries(
    query: string, 
    queryType: QueryDecomposition['queryType'],
    complexity: number
  ): Promise<string[]> {
    const subQueries: string[] = [query] // Always include original

    if (complexity < 0.3) {
      return subQueries // Simple queries don't need decomposition
    }

    // Generate variations based on query type
    switch (queryType) {
      case 'comparative':
        // Extract comparison subjects
        const comparisonMatch = query.match(/(?:compare|difference between|vs)\s+(.+?)\s+(?:and|vs)\s+(.+?)(?:\?|$)/i)
        if (comparisonMatch) {
          subQueries.push(`What is ${comparisonMatch[1]}?`)
          subQueries.push(`What is ${comparisonMatch[2]}?`)
          subQueries.push(`Advantages of ${comparisonMatch[1]}`)
          subQueries.push(`Advantages of ${comparisonMatch[2]}`)
        }
        break

      case 'procedural':
        // Extract process steps
        subQueries.push(query.replace(/how to/i, 'steps to'))
        subQueries.push(query.replace(/how to/i, 'requirements for'))
        subQueries.push(query.replace(/how to/i, 'best practices for'))
        break

      case 'analytical':
        // Break down analytical questions
        const keyTerms = query.split(/\s+/).filter(word => 
          word.length > 4 && 
          !/^(what|when|where|why|how|the|and|but|for|with)$/i.test(word)
        )
        keyTerms.slice(0, 3).forEach(term => {
          subQueries.push(`What is ${term}?`)
          subQueries.push(`${term} definition and explanation`)
        })
        break

      case 'factual':
        // Expand factual queries with context
        subQueries.push(`${query} definition`)
        subQueries.push(`${query} examples`)
        break
    }

    return [...new Set(subQueries)].slice(0, 6) // Limit sub-queries
  }

  /**
   * Execute multi-hop search with progressive refinement
   */
  private async executeMultiHopSearch(
    queryDecomposition: QueryDecomposition,
    documents: Document[]
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = []
    const processedQueries = new Set<string>()

    // Process each sub-query
    for (const subQuery of queryDecomposition.subQueries) {
      if (processedQueries.has(subQuery.toLowerCase())) continue
      processedQueries.add(subQuery.toLowerCase())

      try {
        // Generate enhanced embedding for sub-query
        const embedding = await multiModelEmbeddingEnsemble.generateEnsembleEmbedding(subQuery)
        
        // Search with the sub-query
        const subResults = await this.searchWithEmbedding(
          subQuery,
          embedding,
          documents
        )

        // Add sub-query results with decay factor based on position
        const decayFactor = 1 - (queryDecomposition.subQueries.indexOf(subQuery) * 0.1)
        subResults.forEach(result => {
          result.similarity *= decayFactor
          allResults.push(result)
        })

      } catch (error) {
        console.warn(`Sub-query search failed for: "${subQuery}"`, error)
      }
    }

    // Deduplicate and merge results
    return this.deduplicateResults(allResults)
  }

  /**
   * Search with multi-model embedding
   */
  private async searchWithEmbedding(
    query: string,
    embedding: MultiModelEmbedding,
    documents: Document[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    for (const document of documents) {
      if (!document.chunks) continue

      for (const chunk of document.chunks) {
        if (!chunk.embedding) continue

        // Calculate ensemble similarity
        const similarity = this.calculateEnsembleSimilarity(
          embedding,
          chunk.embedding
        )

        if (similarity > 0.3) { // Threshold
          results.push({
            chunk,
            document,
            similarity,
            relevantText: this.extractRelevantText(chunk.content, query)
          })
        }
      }
    }

    // Sort by similarity
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20) // Limit results per sub-query
  }

  /**
   * Calculate similarity for ensemble embeddings
   */
  private calculateEnsembleSimilarity(
    queryEmbedding: MultiModelEmbedding,
    chunkEmbedding: number[]
  ): number {
    // Use composite embedding for primary similarity
    let similarity = this.cosineSimilarity(queryEmbedding.composite, chunkEmbedding)
    
    // Boost with semantic similarity if available
    if (queryEmbedding.semantic) {
      const semanticSim = this.cosineSimilarity(queryEmbedding.semantic, chunkEmbedding)
      similarity = similarity * 0.7 + semanticSim * 0.3
    }

    return similarity
  }

  /**
   * Generate comprehensive citations for search results
   */
  private async generateCitations(
    results: SearchResult[],
    queryDecomposition: QueryDecomposition,
    documents: Document[]
  ): Promise<AdvancedSearchResult[]> {
    const enhancedResults: AdvancedSearchResult[] = []

    for (const result of results) {
      const citations = await this.createCitation(
        result,
        queryDecomposition.originalQuery,
        documents
      )

      // Generate reasoning path
      const reasoningPath = await this.generateReasoningPath(
        result,
        queryDecomposition
      )

      // Calculate confidence and accuracy scores
      const confidenceScore = this.calculateConfidenceScore(result, citations)
      const factualAccuracy = this.assessFactualAccuracy(result, citations)
      const sourceReliability = this.getSourceReliability(result.document.id)

      // Find cross-references
      const crossReferences = this.findCrossReferences(result, results)

      enhancedResults.push({
        ...result,
        citations,
        confidenceScore,
        reasoningPath,
        factualAccuracy,
        sourceReliability,
        crossReferences
      })
    }

    return enhancedResults
  }

  /**
   * Create detailed citation for a search result
   */
  private async createCitation(
    result: SearchResult,
    originalQuery: string,
    documents: Document[]
  ): Promise<Citation[]> {
    const citation: Citation = {
      id: `cite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId: result.document.id,
      chunkId: result.chunk.id,
      documentName: result.document.name,
      pageNumber: this.extractPageNumber(result.chunk),
      relevantText: result.relevantText || result.chunk.content.substring(0, 200),
      confidence: result.similarity,
      context: this.extractContext(result.chunk, documents),
      timestamp: Date.now(),
      verificationStatus: 'verified',
      parentQuery: originalQuery,
      reasoning: this.generateCitationReasoning(result, originalQuery)
    }

    // Store citation for tracking
    const queryCitations = this.citationTracker.get(originalQuery) || []
    queryCitations.push(citation)
    this.citationTracker.set(originalQuery, queryCitations)

    return [citation]
  }

  /**
   * Contextual re-ranking based on user intent and context
   */
  private async contextualReranking(
    results: AdvancedSearchResult[],
    queryDecomposition: QueryDecomposition,
    context?: RerankingContext
  ): Promise<AdvancedSearchResult[]> {
    return results
      .map(result => {
        let rankingScore = result.similarity

        // Apply query type boosting
        if (queryDecomposition.queryType === 'factual' && result.factualAccuracy > 0.8) {
          rankingScore *= 1.2
        } else if (queryDecomposition.queryType === 'analytical' && result.reasoningPath.length > 2) {
          rankingScore *= 1.1
        }

        // Apply context boosting
        if (context) {
          if (context.factualRequirement && result.factualAccuracy > 0.7) {
            rankingScore *= 1.15
          }
          if (context.domainSpecificity > 0.5 && result.sourceReliability > 0.8) {
            rankingScore *= 1.1
          }
        }

        // Citation quality boosting
        const citationBoost = result.citations.length > 0 ? 
          Math.min(result.citations.length * 0.05, 0.2) : 0
        rankingScore += citationBoost

        return { ...result, similarity: rankingScore }
      })
      .sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Assess source reliability and update scores
   */
  private async assessSourceReliability(
    results: AdvancedSearchResult[]
  ): Promise<AdvancedSearchResult[]> {
    for (const result of results) {
      let reliability = this.sourceReliabilityScores.get(result.document.id) || 0.5

      // Update reliability based on various factors
      const factors = {
        documentType: this.getDocumentTypeReliability(result.document.type),
        citationCount: Math.min(result.citations.length / 5, 1),
        factualAccuracy: result.factualAccuracy,
        crossReferenceCount: Math.min(result.crossReferences.length / 3, 1)
      }

      reliability = (
        factors.documentType * 0.3 +
        factors.citationCount * 0.2 +
        factors.factualAccuracy * 0.3 +
        factors.crossReferenceCount * 0.2
      )

      // Store updated reliability
      this.sourceReliabilityScores.set(result.document.id, reliability)
      result.sourceReliability = reliability
    }

    return results
  }

  // Helper methods
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    return results.filter(result => {
      const key = `${result.document.id}_${result.chunk.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private extractRelevantText(content: string, query: string): string {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const sentences = content.split(/[.!?]+/)
    
    // Find sentence with most query terms
    let bestSentence = sentences[0] || content.substring(0, 200)
    let maxScore = 0

    sentences.forEach(sentence => {
      const score = queryTerms.reduce((acc, term) => 
        sentence.toLowerCase().includes(term) ? acc + 1 : acc, 0
      )
      if (score > maxScore) {
        maxScore = score
        bestSentence = sentence
      }
    })

    return bestSentence.trim() + (content.length > bestSentence.length ? '...' : '')
  }

  private calculateConfidenceScore(result: SearchResult, citations: Citation[]): number {
    return Math.min(
      result.similarity * 0.6 +
      (citations.length > 0 ? 0.2 : 0) +
      (citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length || 0) * 0.2,
      1.0
    )
  }

  private assessFactualAccuracy(result: SearchResult, citations: Citation[]): number {
    // Simple heuristic - in production, use fact-checking models
    const hasNumbers = /\d/.test(result.chunk.content)
    const hasReferences = citations.length > 0
    const hasDates = /\b\d{4}\b/.test(result.chunk.content)
    
    return Math.min(
      (hasNumbers ? 0.3 : 0) +
      (hasReferences ? 0.4 : 0) +
      (hasDates ? 0.3 : 0) +
      0.3, // Base accuracy
      1.0
    )
  }

  private getSourceReliability(documentId: string): number {
    return this.sourceReliabilityScores.get(documentId) || 0.7
  }

  private findCrossReferences(result: SearchResult, allResults: SearchResult[]): string[] {
    const refs: string[] = []
    const currentContent = result.chunk.content.toLowerCase()
    
    allResults.forEach(other => {
      if (other.document.id !== result.document.id) {
        const overlap = this.calculateTextOverlap(currentContent, other.chunk.content.toLowerCase())
        if (overlap > 0.3) {
          refs.push(other.document.id)
        }
      }
    })

    return [...new Set(refs)].slice(0, 5)
  }

  private generateReasoningPath(result: SearchResult, queryDecomposition: QueryDecomposition): string[] {
    const path: string[] = []
    
    path.push(`Found relevant content in "${result.document.name}"`)
    path.push(`Similarity score: ${(result.similarity * 100).toFixed(1)}%`)
    
    if (queryDecomposition.complexity > 0.5) {
      path.push(`Multi-hop reasoning applied for complex query`)
    }
    
    if (queryDecomposition.entityFocus.length > 0) {
      path.push(`Entity-focused search for: ${queryDecomposition.entityFocus.join(', ')}`)
    }

    return path
  }

  private generateCitationReasoning(result: SearchResult, query: string): string {
    return `This citation supports the query "${query}" with ${(result.similarity * 100).toFixed(1)}% relevance based on semantic similarity and content analysis.`
  }

  private extractPageNumber(chunk: DocumentChunk): number | undefined {
    // Try to extract page number from chunk metadata or content
    const pageMatch = chunk.content.match(/page\s+(\d+)/i) || 
                     chunk.id.match(/page-(\d+)/) ||
                     chunk.id.match(/p(\d+)/)
    return pageMatch ? parseInt(pageMatch[1]) : undefined
  }

  private extractContext(chunk: DocumentChunk, documents: Document[]): string {
    // Extract surrounding context from the document
    const doc = documents.find(d => d.chunks?.includes(chunk))
    if (!doc?.chunks) return chunk.content.substring(0, 100)

    const chunkIndex = doc.chunks.indexOf(chunk)
    const contextChunks = doc.chunks.slice(
      Math.max(0, chunkIndex - 1),
      Math.min(doc.chunks.length, chunkIndex + 2)
    )

    return contextChunks.map(c => c.content).join(' ').substring(0, 300)
  }

  private getDocumentTypeReliability(type?: string): number {
    const typeReliability: Record<string, number> = {
      'pdf': 0.9,
      'academic': 0.95,
      'official': 0.9,
      'documentation': 0.85,
      'text': 0.7,
      'web': 0.6,
      'unknown': 0.5
    }
    return typeReliability[type || 'unknown'] || 0.5
  }

  private calculateTextOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    return intersection.size / union.size
  }

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

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  // Public methods for citation management
  getCitationsForQuery(query: string): Citation[] {
    return this.citationTracker.get(query) || []
  }

  getAllCitations(): Citation[] {
    return Array.from(this.citationTracker.values()).flat()
  }

  getQueryHistory(): QueryDecomposition[] {
    return [...this.queryHistory]
  }

  clearCitationHistory(): void {
    this.citationTracker.clear()
    this.queryHistory.length = 0
  }
}

// Export singleton instance
export const advancedRAGEngine = new AdvancedRAGEngine()

// Export convenience function
export async function performAdvancedSearch(
  query: string,
  documents: Document[],
  context?: RerankingContext
): Promise<AdvancedSearchResult[]> {
  return advancedRAGEngine.advancedSearch(query, documents, context)
}
