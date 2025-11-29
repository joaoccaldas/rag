/**
 * Semantic Chunking Service
 * 
 * Implements advanced semantic chunking that:
 * - Uses embeddings to group semantically similar content
 * - Respects sentence boundaries
 * - Maintains optimal token counts
 * - Preserves document structure
 * - Generates rich metadata for better retrieval
 */

import { DocumentChunk } from '../types'
import { estimateTokenCount } from '../utils/enhanced-chunking'

export interface SemanticChunk {
  id: string
  content: string
  embedding: number[]
  tokenCount: number
  startIndex: number
  endIndex: number
  sentenceCount: number
  metadata: {
    semanticDensity: number  // How much meaning per token
    keyPhrases: string[]     // Important phrases
    entities: string[]       // Named entities (companies, people, places)
    topics: string[]         // Main topics
    importance: number       // Relative importance (0-1)
    coherence: number        // How well sentences relate (0-1)
  }
}

export interface SemanticChunkingOptions {
  maxTokens?: number
  minTokens?: number
  targetTokens?: number
  overlapSentences?: number
  similarityThreshold?: number
  useEmbeddings?: boolean
  preserveStructure?: boolean
}

/**
 * Main Semantic Chunking Service
 */
export class SemanticChunkingService {
  private ollamaHost: string
  private embeddingModel: string

  constructor(
    ollamaHost: string = 'http://localhost:11434',
    embeddingModel: string = 'nomic-embed-text'
  ) {
    this.ollamaHost = ollamaHost
    this.embeddingModel = embeddingModel
  }

  /**
   * Generate semantic chunks from text
   */
  async generateSemanticChunks(
    text: string,
    documentId: string,
    options: SemanticChunkingOptions = {}
  ): Promise<SemanticChunk[]> {
    const {
      maxTokens = 512,
      minTokens = 100,
      targetTokens = 400,
      overlapSentences = 2,
      similarityThreshold = 0.7,
      useEmbeddings = true,
      preserveStructure = true
    } = options

    console.log(`🧩 Starting semantic chunking for document ${documentId}`)
    console.log(`📊 Target: ${targetTokens} tokens/chunk, max: ${maxTokens}, min: ${minTokens}`)

    // Step 1: Extract sentences with structure preservation
    const sentences = this.extractSentencesWithStructure(text, preserveStructure)
    console.log(`✂️ Extracted ${sentences.length} sentences`)

    // Step 2: Generate embeddings for sentences if enabled
    let sentenceEmbeddings: number[][] = []
    if (useEmbeddings) {
      console.log(`🔢 Generating embeddings for ${sentences.length} sentences...`)
      sentenceEmbeddings = await this.generateSentenceEmbeddings(sentences)
      console.log(`✅ Embeddings generated`)
    }

    // Step 3: Create semantic chunks based on similarity and token count
    const chunks = await this.createSemanticChunks(
      sentences,
      sentenceEmbeddings,
      documentId,
      {
        maxTokens,
        minTokens,
        targetTokens,
        overlapSentences,
        similarityThreshold,
        useEmbeddings
      }
    )

    console.log(`✅ Created ${chunks.length} semantic chunks`)

    // Step 4: Enhance chunks with metadata
    const enhancedChunks = await this.enhanceChunksWithMetadata(chunks)

    return enhancedChunks
  }

  /**
   * Extract sentences while preserving document structure
   */
  private extractSentencesWithStructure(
    text: string,
    preserveStructure: boolean
  ): Array<{ text: string; structureLevel: number; isHeading: boolean }> {
    const sentences: Array<{ text: string; structureLevel: number; isHeading: boolean }> = []
    
    // Split by paragraphs first if preserving structure
    const paragraphs = preserveStructure ? text.split(/\n\n+/) : [text]
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue

      // Check if it's a heading
      const isHeading = /^#{1,6}\s/.test(paragraph) || 
                       /^[A-Z][^.!?]*$/.test(paragraph.trim()) ||
                       paragraph.length < 100 && /^[A-Z]/.test(paragraph)

      // Determine structure level (0 = normal, 1 = section, 2 = heading)
      let structureLevel = 0
      if (isHeading) {
        structureLevel = 2
      } else if (paragraph.startsWith('  ') || paragraph.startsWith('\t')) {
        structureLevel = 1
      }

      // Split paragraph into sentences
      const paragraphSentences = this.splitIntoSentences(paragraph)
      
      for (const sentence of paragraphSentences) {
        if (sentence.trim().length > 10) { // Minimum sentence length
          sentences.push({
            text: sentence.trim(),
            structureLevel,
            isHeading: isHeading && paragraphSentences.indexOf(sentence) === 0
          })
        }
      }
    }

    return sentences
  }

  /**
   * Split text into sentences using multiple heuristics
   */
  private splitIntoSentences(text: string): string[] {
    // Handle common abbreviations
    const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'etc', 'vs', 'e.g', 'i.e']
    let processed = text

    // Protect abbreviations
    for (const abbr of abbreviations) {
      const regex = new RegExp(`\\b${abbr}\\.`, 'g')
      processed = processed.replace(regex, `${abbr}<PERIOD>`)
    }

    // Split on sentence boundaries
    const sentences = processed.split(/([.!?]+)\s+(?=[A-Z])/)
    
    // Reconstruct sentences
    const result: string[] = []
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '')
      if (sentence.trim()) {
        // Restore abbreviations
        result.push(sentence.replace(/<PERIOD>/g, '.'))
      }
    }

    return result.length > 0 ? result : [text]
  }

  /**
   * Generate embeddings for sentences using Ollama
   */
  private async generateSentenceEmbeddings(
    sentences: Array<{ text: string; structureLevel: number; isHeading: boolean }>
  ): Promise<number[][]> {
    const embeddings: number[][] = []
    const batchSize = 10 // Process in batches to avoid overwhelming the API

    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize)
      const batchEmbeddings = await Promise.all(
        batch.map(sentence => this.generateEmbedding(sentence.text))
      )
      embeddings.push(...batchEmbeddings)

      if (i % 50 === 0) {
        console.log(`  📊 Progress: ${i}/${sentences.length} sentences embedded`)
      }
    }

    return embeddings
  }

  /**
   * Generate embedding for a single text using Ollama
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text
        })
      })

      if (!response.ok) {
        console.warn(`Failed to generate embedding, using fallback`)
        return this.generateFallbackEmbedding(text)
      }

      const data = await response.json()
      return data.embedding || this.generateFallbackEmbedding(text)
    } catch (error) {
      console.warn(`Error generating embedding:`, error)
      return this.generateFallbackEmbedding(text)
    }
  }

  /**
   * Fallback embedding generation (simple hash-based)
   */
  private generateFallbackEmbedding(text: string): number[] {
    const dimensions = 768 // Match nomic-embed-text dimensions
    const embedding = new Array(dimensions).fill(0)
    
    // Simple hash-based embedding
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const index = (charCode * i) % dimensions
      embedding[index] += Math.sin(charCode) * 0.1
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / (magnitude || 1))
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) return 0

    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Create semantic chunks based on similarity and token constraints
   */
  private async createSemanticChunks(
    sentences: Array<{ text: string; structureLevel: number; isHeading: boolean }>,
    embeddings: number[][],
    documentId: string,
    options: {
      maxTokens: number
      minTokens: number
      targetTokens: number
      overlapSentences: number
      similarityThreshold: number
      useEmbeddings: boolean
    }
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = []
    let currentChunk: string[] = []
    let currentTokens = 0
    let currentStartIndex = 0
    let chunkStartSentenceIndex = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceTokens = estimateTokenCount(sentence.text)

      // Check if adding this sentence would exceed maxTokens
      const wouldExceedMax = currentTokens + sentenceTokens > options.maxTokens

      // Check semantic similarity if we have embeddings
      let isSemanticallyDifferent = false
      if (options.useEmbeddings && embeddings.length > 0 && currentChunk.length > 0) {
        const avgChunkEmbedding = this.averageEmbeddings(
          embeddings.slice(chunkStartSentenceIndex, i)
        )
        const similarity = this.cosineSimilarity(avgChunkEmbedding, embeddings[i])
        isSemanticallyDifferent = similarity < options.similarityThreshold
      }

      // Check if we should start a new chunk
      const shouldStartNewChunk =
        wouldExceedMax ||
        (currentTokens >= options.targetTokens && 
         (isSemanticallyDifferent || sentence.isHeading)) ||
        (sentence.isHeading && currentChunk.length > 0)

      if (shouldStartNewChunk && currentChunk.length > 0) {
        // Create chunk from accumulated sentences
        const chunkText = currentChunk.join(' ')
        const chunkEmbedding = options.useEmbeddings && embeddings.length > 0
          ? this.averageEmbeddings(embeddings.slice(chunkStartSentenceIndex, i))
          : this.generateFallbackEmbedding(chunkText)

        chunks.push({
          id: `${documentId}_chunk_${chunks.length}`,
          content: chunkText,
          embedding: chunkEmbedding,
          tokenCount: currentTokens,
          startIndex: currentStartIndex,
          endIndex: currentStartIndex + chunkText.length,
          sentenceCount: currentChunk.length,
          metadata: {
            semanticDensity: 0.5, // Will be enhanced later
            keyPhrases: [],
            entities: [],
            topics: [],
            importance: 0.5,
            coherence: 0.5
          }
        })

        // Start new chunk with overlap
        const overlapStart = Math.max(0, i - options.overlapSentences)
        currentChunk = sentences.slice(overlapStart, i).map(s => s.text)
        currentTokens = currentChunk.reduce((sum, s) => sum + estimateTokenCount(s), 0)
        chunkStartSentenceIndex = overlapStart
        currentStartIndex = chunks[chunks.length - 1].endIndex - 
                          currentChunk.slice(0, options.overlapSentences).join(' ').length
      }

      // Add current sentence to chunk
      currentChunk.push(sentence.text)
      currentTokens += sentenceTokens
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ')
      const chunkEmbedding = options.useEmbeddings && embeddings.length > 0
        ? this.averageEmbeddings(embeddings.slice(chunkStartSentenceIndex))
        : this.generateFallbackEmbedding(chunkText)

      chunks.push({
        id: `${documentId}_chunk_${chunks.length}`,
        content: chunkText,
        embedding: chunkEmbedding,
        tokenCount: currentTokens,
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + chunkText.length,
        sentenceCount: currentChunk.length,
        metadata: {
          semanticDensity: 0.5,
          keyPhrases: [],
          entities: [],
          topics: [],
          importance: 0.5,
          coherence: 0.5
        }
      })
    }

    return chunks
  }

  /**
   * Average multiple embeddings
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []
    
    const dimensions = embeddings[0].length
    const avgEmbedding = new Array(dimensions).fill(0)

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        avgEmbedding[i] += embedding[i]
      }
    }

    return avgEmbedding.map(val => val / embeddings.length)
  }

  /**
   * Enhance chunks with rich metadata
   */
  private async enhanceChunksWithMetadata(chunks: SemanticChunk[]): Promise<SemanticChunk[]> {
    console.log(`🎨 Enhancing ${chunks.length} chunks with metadata...`)

    return chunks.map((chunk, index) => {
      // Extract key phrases (simple frequency-based)
      const keyPhrases = this.extractKeyPhrases(chunk.content)

      // Extract entities (simple pattern matching)
      const entities = this.extractEntities(chunk.content)

      // Extract topics (keyword-based)
      const topics = this.extractTopics(chunk.content)

      // Calculate semantic density
      const semanticDensity = this.calculateSemanticDensity(chunk.content, chunk.tokenCount)

      // Calculate importance (based on position and content)
      const importance = this.calculateImportance(chunk, index, chunks.length)

      // Calculate coherence (how well sentences relate)
      const coherence = this.calculateCoherence(chunk.content)

      return {
        ...chunk,
        metadata: {
          semanticDensity,
          keyPhrases,
          entities,
          topics,
          importance,
          coherence
        }
      }
    })
  }

  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)

    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
    ])

    const wordFreq: { [key: string]: number } = {}
    for (const word of words) {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  /**
   * Extract named entities (simple pattern matching)
   */
  private extractEntities(text: string): string[] {
    // Capitalized words (potential proper nouns)
    const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
    const matches = text.match(capitalizedPattern) || []
    
    const uniqueEntities = new Set(matches.filter(m => m.length > 2))
    return Array.from(uniqueEntities).slice(0, 5)
  }

  /**
   * Extract topics from text
   */
  private extractTopics(text: string): string[] {
    const topicKeywords = {
      'finance': ['revenue', 'profit', 'sales', 'growth', 'financial', 'cost', 'budget', 'investment'],
      'marketing': ['campaign', 'brand', 'customer', 'market', 'advertising', 'promotion'],
      'operations': ['process', 'efficiency', 'production', 'manufacturing', 'supply'],
      'strategy': ['plan', 'strategy', 'goal', 'objective', 'vision', 'mission'],
      'technology': ['digital', 'software', 'system', 'platform', 'innovation', 'tech'],
      'hr': ['employee', 'talent', 'recruitment', 'training', 'workforce']
    }

    const lowerText = text.toLowerCase()
    const topics: string[] = []

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matchCount = keywords.filter(kw => lowerText.includes(kw)).length
      if (matchCount > 0) {
        topics.push(topic)
      }
    }

    return topics.slice(0, 3)
  }

  /**
   * Calculate semantic density (information per token)
   */
  private calculateSemanticDensity(text: string, tokenCount: number): number {
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/))
    const density = uniqueWords.size / tokenCount
    return Math.min(1, density * 2) // Normalize to 0-1
  }

  /**
   * Calculate chunk importance
   */
  private calculateImportance(chunk: SemanticChunk, index: number, _total: number): number {
    let importance = 0.5 // Base importance

    // Beginning chunks are more important
    if (index < 3) importance += 0.2

    // Chunks with more entities are more important
    const entityBoost = Math.min(0.2, chunk.metadata.entities.length * 0.05)
    importance += entityBoost

    // Longer chunks might be more important
    if (chunk.tokenCount > 400) importance += 0.1

    return Math.min(1, importance)
  }

  /**
   * Calculate coherence (how well sentences relate)
   */
  private calculateCoherence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    if (sentences.length < 2) return 1

    // Simple coherence based on shared words between sentences
    let totalCoherence = 0
    for (let i = 0; i < sentences.length - 1; i++) {
      const sent1 = sentences[i]
      const sent2 = sentences[i + 1]
      if (!sent1 || !sent2) continue
      
      const words1 = new Set(sent1.toLowerCase().split(/\s+/))
      const words2 = new Set(sent2.toLowerCase().split(/\s+/))
      
      const intersection = new Set([...words1].filter(w => words2.has(w)))
      const union = new Set([...words1, ...words2])
      
      const similarity = intersection.size / union.size
      totalCoherence += similarity
    }

    return totalCoherence / (sentences.length - 1)
  }

  /**
   * Convert SemanticChunk to DocumentChunk for compatibility
   */
  convertToDocumentChunk(semanticChunk: SemanticChunk, documentId: string): DocumentChunk {
    return {
      id: semanticChunk.id,
      documentId,
      content: semanticChunk.content,
      embedding: semanticChunk.embedding,
      startIndex: semanticChunk.startIndex,
      endIndex: semanticChunk.endIndex,
      metadata: {
        tokenCount: semanticChunk.tokenCount,
        ...semanticChunk.metadata
      }
    }
  }
}

export const semanticChunkingService = new SemanticChunkingService()
