/**
 * Hybrid Search Engine
 * 
 * Combines BM25 (keyword-based) and vector (semantic) search for optimal results.
 * Uses weighted fusion to balance exact keyword matches with semantic similarity.
 * 
 * Why: Pure vector search misses exact keyword matches. Pure keyword search misses
 * semantic relationships. Hybrid approach provides the best of both worlds.
 */

export interface SearchDocument {
  id: string
  content: string
  title: string
  metadata: {
    type: string
    keywords: string[]
    documentId: string
    chunkId: string
  }
}

export interface HybridSearchConfig {
  bm25Weight: number // 0-1, weight for BM25 scores
  vectorWeight: number // 0-1, weight for vector scores
  k1: number // BM25 parameter for term frequency saturation
  b: number // BM25 parameter for length normalization
  minimumScore: number // Minimum combined score threshold
  maxResults: number // Maximum results to return
  enableReranking: boolean // Enable ML-based reranking
}

export interface BM25Explanation {
  matchedTerms: string[]
  documentLength: number
  averageLength: number
  lengthNormalization: number
  idfSum: number
}

export interface BM25Result {
  docId: string
  score: number
  explanation: BM25Explanation
}

export interface SearchResult {
  document: SearchDocument
  scores: {
    bm25: number
    vector: number
    combined: number
  }
  explanation: {
    matchedTerms: string[]
    semanticSimilarity: number
    lengthNormalization: number
  }
}

export interface IndexedDocument extends SearchDocument {
  tokens: string[]
  termFrequency: Map<string, number>
  length: number
  embedding?: number[]
}

export class BM25Index {
  private documents: Map<string, IndexedDocument> = new Map()
  private documentFrequency: Map<string, number> = new Map()
  private averageDocumentLength = 0
  private totalDocuments = 0

  addDocument(doc: SearchDocument, embedding?: number[]): void {
    const tokens = this.tokenize(doc.content)
    const termFreq = this.calculateTermFrequency(tokens)
    
    const indexedDoc: IndexedDocument = {
      ...doc,
      tokens,
      termFrequency: termFreq,
      length: tokens.length,
      embedding
    }

    this.documents.set(doc.id, indexedDoc)
    this.updateDocumentFrequencies(termFreq)
    this.updateAverageLength()
    this.totalDocuments = this.documents.size
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2) // Remove very short tokens
  }

  private calculateTermFrequency(tokens: string[]): Map<string, number> {
    const termFreq = new Map<string, number>()
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1)
    }
    return termFreq
  }

  private updateDocumentFrequencies(termFreq: Map<string, number>): void {
    for (const term of termFreq.keys()) {
      this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1)
    }
  }

  private updateAverageLength(): void {
    const totalLength = Array.from(this.documents.values())
      .reduce((sum, doc) => sum + doc.length, 0)
    this.averageDocumentLength = totalLength / this.documents.size
  }

  search(query: string, config: HybridSearchConfig): BM25Result[] {
    const queryTokens = this.tokenize(query)
    const results: BM25Result[] = []

    for (const [docId, doc] of this.documents.entries()) {
      const score = this.calculateBM25Score(queryTokens, doc, config)
      const explanation = this.explainScore(queryTokens, doc, config)
      
      if (score > 0) {
        results.push({ docId, score, explanation })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private calculateBM25Score(queryTokens: string[], doc: IndexedDocument, config: HybridSearchConfig): number {
    let score = 0

    for (const token of queryTokens) {
      const tf = doc.termFrequency.get(token) || 0
      if (tf === 0) continue

      const df = this.documentFrequency.get(token) || 0
      const idf = Math.log((this.totalDocuments - df + 0.5) / (df + 0.5))
      
      const numerator = tf * (config.k1 + 1)
      const denominator = tf + config.k1 * (1 - config.b + config.b * (doc.length / this.averageDocumentLength))
      
      score += idf * (numerator / denominator)
    }

    return score
  }

  private explainScore(queryTokens: string[], doc: IndexedDocument, config: HybridSearchConfig): BM25Explanation {
    const matchedTerms: string[] = []
    let totalIdf = 0

    for (const token of queryTokens) {
      if (doc.termFrequency.has(token)) {
        matchedTerms.push(token)
        const df = this.documentFrequency.get(token) || 0
        const idf = Math.log((this.totalDocuments - df + 0.5) / (df + 0.5))
        totalIdf += idf
      }
    }

    return {
      matchedTerms,
      documentLength: doc.length,
      averageLength: this.averageDocumentLength,
      lengthNormalization: config.b * (doc.length / this.averageDocumentLength),
      idfSum: totalIdf
    }
  }

  getDocument(docId: string): IndexedDocument | undefined {
    return this.documents.get(docId)
  }

  getAllDocuments(): IndexedDocument[] {
    return Array.from(this.documents.values())
  }

  removeDocument(docId: string): void {
    const doc = this.documents.get(docId)
    if (!doc) return

    this.documents.delete(docId)
    
    // Update document frequencies
    for (const term of doc.termFrequency.keys()) {
      const currentDf = this.documentFrequency.get(term) || 0
      if (currentDf <= 1) {
        this.documentFrequency.delete(term)
      } else {
        this.documentFrequency.set(term, currentDf - 1)
      }
    }

    this.updateAverageLength()
    this.totalDocuments = this.documents.size
  }
}

export class HybridSearchEngine {
  private bm25Index: BM25Index
  private config: HybridSearchConfig

  constructor(config: Partial<HybridSearchConfig> = {}) {
    this.bm25Index = new BM25Index()
    this.config = {
      bm25Weight: 0.7,
      vectorWeight: 0.3,
      k1: 1.2,
      b: 0.75,
      minimumScore: 0.1,
      maxResults: 10,
      enableReranking: true,
      ...config
    }
  }

  addDocument(doc: SearchDocument, embedding?: number[]): void {
    this.bm25Index.addDocument(doc, embedding)
  }

  async search(query: string, queryEmbedding?: number[]): Promise<SearchResult[]> {
    console.log(`🔍 Hybrid search for: "${query}"`)

    // Get BM25 results
    const bm25Results = this.bm25Index.search(query, this.config)
    
    // Get vector search results if embedding is provided
    const vectorResults = queryEmbedding 
      ? this.performVectorSearch(queryEmbedding)
      : new Map<string, number>()

    // Combine and rank results
    const combinedResults = this.combineResults(bm25Results, vectorResults)
    
    // Apply reranking if enabled
    const finalResults = this.config.enableReranking 
      ? this.rerankResults(combinedResults, query)
      : combinedResults

    console.log(`✅ Found ${finalResults.length} hybrid search results`)
    return finalResults.slice(0, this.config.maxResults)
  }

  private performVectorSearch(queryEmbedding: number[]): Map<string, number> {
    const vectorResults = new Map<string, number>()
    
    for (const doc of this.bm25Index.getAllDocuments()) {
      if (doc.embedding) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding)
        if (similarity > 0) {
          vectorResults.set(doc.id, similarity)
        }
      }
    }

    return vectorResults
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  private combineResults(
    bm25Results: BM25Result[],
    vectorResults: Map<string, number>
  ): SearchResult[] {
    const combinedMap = new Map<string, SearchResult>()

    // Normalize BM25 scores
    const maxBM25Score = Math.max(...bm25Results.map(r => r.score), 1)
    const maxVectorScore = Math.max(...Array.from(vectorResults.values()), 1)

    // Process BM25 results
    for (const result of bm25Results) {
      const doc = this.bm25Index.getDocument(result.docId)
      if (!doc) continue

      const normalizedBM25 = result.score / maxBM25Score
      const vectorScore = vectorResults.get(result.docId) || 0
      const normalizedVector = vectorScore / maxVectorScore

      const combinedScore = (normalizedBM25 * this.config.bm25Weight) + 
                           (normalizedVector * this.config.vectorWeight)

      if (combinedScore >= this.config.minimumScore) {
        combinedMap.set(result.docId, {
          document: doc,
          scores: {
            bm25: normalizedBM25,
            vector: normalizedVector,
            combined: combinedScore
          },
          explanation: {
            matchedTerms: result.explanation.matchedTerms,
            semanticSimilarity: normalizedVector,
            lengthNormalization: result.explanation.lengthNormalization
          }
        })
      }
    }

    // Process vector-only results (not in BM25 results)
    for (const [docId, vectorScore] of vectorResults.entries()) {
      if (!combinedMap.has(docId)) {
        const doc = this.bm25Index.getDocument(docId)
        if (!doc) continue

        const normalizedVector = vectorScore / maxVectorScore
        const combinedScore = normalizedVector * this.config.vectorWeight

        if (combinedScore >= this.config.minimumScore) {
          combinedMap.set(docId, {
            document: doc,
            scores: {
              bm25: 0,
              vector: normalizedVector,
              combined: combinedScore
            },
            explanation: {
              matchedTerms: [],
              semanticSimilarity: normalizedVector,
              lengthNormalization: 0
            }
          })
        }
      }
    }

    return Array.from(combinedMap.values())
      .sort((a, b) => b.scores.combined - a.scores.combined)
  }

  private rerankResults(results: SearchResult[], query: string): SearchResult[] {
    // Simple reranking based on query term density and position
    return results.map(result => {
      const boost = this.calculateRerankBoost(result, query)
      return {
        ...result,
        scores: {
          ...result.scores,
          combined: result.scores.combined * boost
        }
      }
    }).sort((a, b) => b.scores.combined - a.scores.combined)
  }

  private calculateRerankBoost(result: SearchResult, query: string): number {
    let boost = 1.0
    const content = result.document.content.toLowerCase()
    const title = result.document.title.toLowerCase()
    const queryLower = query.toLowerCase()

    // Boost for query terms in title
    if (title.includes(queryLower)) {
      boost += 0.3
    }

    // Boost for early appearance of query terms
    const firstOccurrence = content.indexOf(queryLower)
    if (firstOccurrence !== -1) {
      const positionBoost = 1 - (firstOccurrence / content.length)
      boost += positionBoost * 0.2
    }

    // Boost for document type relevance
    const docType = result.document.metadata.type
    if (docType === 'pdf' || docType === 'document') {
      boost += 0.1
    }

    return Math.min(2.0, boost) // Cap boost at 2x
  }

  updateConfig(newConfig: Partial<HybridSearchConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getStats(): { documents: number; terms: number; avgLength: number } {
    const documents = this.bm25Index.getAllDocuments()
    const totalTerms = new Set<string>()
    
    documents.forEach(doc => {
      doc.tokens.forEach(token => totalTerms.add(token))
    })

    const avgLength = documents.reduce((sum, doc) => sum + doc.length, 0) / documents.length

    return {
      documents: documents.length,
      terms: totalTerms.size,
      avgLength: Math.round(avgLength)
    }
  }

  removeDocument(docId: string): void {
    this.bm25Index.removeDocument(docId)
  }

  clear(): void {
    this.bm25Index = new BM25Index()
  }
}
