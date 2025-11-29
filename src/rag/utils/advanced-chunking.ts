/**
 * Advanced Semantic Chunking Strategy
 * 
 * Enhanced chunking that preserves semantic boundaries and context.
 * Combines token-aware splitting with semantic analysis for better content preservation.
 * 
 * Why: Current chunking is basic token-aware. This improvement ensures better context
 * preservation and more meaningful chunks for RAG retrieval.
 */

export interface ChunkingConfig {
  maxTokens: number
  minTokens: number
  overlapTokens: number
  preserveSemanticBoundaries: boolean
  enableSentenceSplitting: boolean
  enableParagraphSplitting: boolean
  chunkingStrategy: 'token' | 'semantic' | 'hybrid'
}

export interface SemanticChunk {
  id: string
  content: string
  tokenCount: number
  startIndex: number
  endIndex: number
  semanticScore: number
  boundaries: {
    startsWithSentence: boolean
    endsWithSentence: boolean
    startsWithParagraph: boolean
    endsWithParagraph: boolean
  }
  metadata: {
    documentId: string
    chunkIndex: number
    totalChunks: number
    keywords: string[]
    topics: string[]
  }
}

export class AdvancedChunker {
  private config: ChunkingConfig
  private sentencePattern = /[.!?]+[\s\r\n]+/g
  private paragraphPattern = /\n\s*\n/g
  private headingPattern = /^#{1,6}\s+/gm

  constructor(config: Partial<ChunkingConfig> = {}) {
    this.config = {
      maxTokens: 500,
      minTokens: 100,
      overlapTokens: 50,
      preserveSemanticBoundaries: true,
      enableSentenceSplitting: true,
      enableParagraphSplitting: true,
      chunkingStrategy: 'hybrid',
      ...config
    }
  }

  async chunkDocument(
    content: string, 
    documentId: string,
    metadata: { title?: string; type?: string } = {}
  ): Promise<SemanticChunk[]> {
    console.log(`🔄 Starting advanced chunking for document ${documentId}`)
    
    switch (this.config.chunkingStrategy) {
      case 'semantic':
        return this.semanticChunking(content, documentId, metadata)
      case 'token':
        return this.tokenBasedChunking(content, documentId, metadata)
      case 'hybrid':
      default:
        return this.hybridChunking(content, documentId, metadata)
    }
  }

  private async hybridChunking(
    content: string, 
    documentId: string,
    metadata: { title?: string; type?: string }
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = []
    
    // First, split by major semantic boundaries (headings, paragraphs)
    const sections = this.splitBySemanticBoundaries(content)
    
    let globalIndex = 0
    
    for (const section of sections) {
      const sectionChunks = await this.processSection(section, documentId, globalIndex, metadata)
      chunks.push(...sectionChunks)
      globalIndex += sectionChunks.length
    }
    
    // Apply overlap between chunks for better context
    const chunksWithOverlap = this.applyIntelligentOverlap(chunks)
    
    console.log(`✅ Created ${chunksWithOverlap.length} semantic chunks with overlap`)
    return chunksWithOverlap
  }

  private async semanticChunking(
    content: string, 
    documentId: string,
    metadata: { title?: string; type?: string }
  ): Promise<SemanticChunk[]> {
    // Split by sentences first
    const sentences = this.splitIntoSentences(content)
    const chunks: SemanticChunk[] = []
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkStartIndex = 0
    let chunkIndex = 0
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceTokens = this.estimateTokenCount(sentence)
      
      // Check if adding this sentence would exceed token limit
      if (currentTokens + sentenceTokens > this.config.maxTokens && currentChunk.length > 0) {
        // Create chunk with current content
        const chunk = await this.createSemanticChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          chunkStartIndex,
          chunkStartIndex + currentChunk.length,
          metadata
        )
        chunks.push(chunk)
        
        // Start new chunk with overlap
        const overlapContent = this.getOverlapContent(chunks, chunkIndex)
        currentChunk = overlapContent + sentence
        currentTokens = this.estimateTokenCount(currentChunk)
        chunkStartIndex = chunkStartIndex + currentChunk.length - overlapContent.length
        chunkIndex++
      } else {
        currentChunk += sentence
        currentTokens += sentenceTokens
      }
    }
    
    // Add final chunk if there's remaining content
    if (currentChunk.trim().length > 0) {
      const chunk = await this.createSemanticChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        chunkStartIndex,
        chunkStartIndex + currentChunk.length,
        metadata
      )
      chunks.push(chunk)
    }
    
    return chunks
  }

  private async tokenBasedChunking(
    content: string, 
    documentId: string,
    metadata: { title?: string; type?: string }
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = []
    const words = content.split(/\s+/)
    const tokensPerWord = 1.3 // Rough estimate
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkStartIndex = 0
    let chunkIndex = 0
    
    for (const word of words) {
      const wordTokens = word.length / tokensPerWord
      
      if (currentTokens + wordTokens > this.config.maxTokens && currentChunk.length > 0) {
        const chunk = await this.createSemanticChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          chunkStartIndex,
          chunkStartIndex + currentChunk.length,
          metadata
        )
        chunks.push(chunk)
        
        // Start new chunk with some overlap
        const overlapWords = currentChunk.trim().split(/\s+/).slice(-this.config.overlapTokens)
        currentChunk = overlapWords.join(' ') + ' ' + word
        currentTokens = this.estimateTokenCount(currentChunk)
        chunkStartIndex += currentChunk.length - overlapWords.join(' ').length
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word
        currentTokens += wordTokens
      }
    }
    
    if (currentChunk.trim().length > 0) {
      const chunk = await this.createSemanticChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        chunkStartIndex,
        chunkStartIndex + currentChunk.length,
        metadata
      )
      chunks.push(chunk)
    }
    
    return chunks
  }

  private splitBySemanticBoundaries(content: string): string[] {
    // Split by headings first
    const headingSections = content.split(this.headingPattern)
    const sections: string[] = []
    
    for (const section of headingSections) {
      if (section.trim().length === 0) continue
      
      // Further split by paragraphs if section is too large
      const paragraphs = section.split(this.paragraphPattern)
      sections.push(...paragraphs.filter(p => p.trim().length > 0))
    }
    
    return sections
  }

  private async processSection(
    section: string, 
    documentId: string, 
    startIndex: number,
    metadata: { title?: string; type?: string }
  ): Promise<SemanticChunk[]> {
    // Use metadata for future enhancements like type-specific processing
    const documentType = metadata.type || 'unknown'
    console.log(`Processing section for document type: ${documentType}`)
    
    const sectionTokens = this.estimateTokenCount(section)
    
    if (sectionTokens <= this.config.maxTokens) {
      // Section fits in one chunk
      return [await this.createSemanticChunk(
        section,
        documentId,
        startIndex,
        0,
        section.length,
        metadata
      )]
    }
    
    // Section needs to be split further
    return this.semanticChunking(section, documentId, metadata)
  }

  private splitIntoSentences(content: string): string[] {
    return content.split(this.sentencePattern).filter(s => s.trim().length > 0)
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  private async createSemanticChunk(
    content: string,
    documentId: string,
    chunkIndex: number,
    startIndex: number,
    endIndex: number,
    metadata: { title?: string; type?: string }
  ): Promise<SemanticChunk> {
    const keywords = await this.extractKeywords(content)
    const topics = await this.extractTopics(content)
    
    // Use metadata for enhanced chunk context
    const enhancedKeywords = metadata.title 
      ? [...keywords, ...metadata.title.toLowerCase().split(/\s+/)]
      : keywords
    
    return {
      id: `${documentId}_chunk_${chunkIndex}`,
      content,
      tokenCount: this.estimateTokenCount(content),
      startIndex,
      endIndex,
      semanticScore: this.calculateSemanticScore(content),
      boundaries: {
        startsWithSentence: /^[A-Z]/.test(content.trim()),
        endsWithSentence: /[.!?]$/.test(content.trim()),
        startsWithParagraph: content.startsWith('\n') || chunkIndex === 0,
        endsWithParagraph: content.endsWith('\n\n')
      },
      metadata: {
        documentId,
        chunkIndex,
        totalChunks: 0, // Will be updated after all chunks are created
        keywords: enhancedKeywords,
        topics
      }
    }
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction - in production, use NLP libraries
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private async extractTopics(content: string): Promise<string[]> {
    // Simple topic extraction - could be enhanced with ML models
    const commonTopics = [
      'technology', 'business', 'science', 'health', 'education',
      'finance', 'marketing', 'development', 'management', 'research'
    ]
    
    const contentLower = content.toLowerCase()
    return commonTopics.filter(topic => contentLower.includes(topic))
  }

  private calculateSemanticScore(content: string): number {
    // Calculate a semantic coherence score based on various factors
    let score = 0.5 // Base score
    
    // Sentence structure score
    const sentences = this.splitIntoSentences(content)
    if (sentences.length > 1) score += 0.2
    
    // Paragraph structure score
    if (content.includes('\n\n')) score += 0.1
    
    // Length appropriateness score
    const tokenCount = this.estimateTokenCount(content)
    if (tokenCount >= this.config.minTokens && tokenCount <= this.config.maxTokens) {
      score += 0.2
    }
    
    return Math.min(1.0, score)
  }

  private applyIntelligentOverlap(chunks: SemanticChunk[]): SemanticChunk[] {
    if (chunks.length <= 1) return chunks
    
    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1]
      const currentChunk = chunks[i]
      
      // Calculate optimal overlap based on sentence boundaries
      const overlapContent = this.calculateOptimalOverlap(prevChunk.content)
      
      if (overlapContent) {
        chunks[i] = {
          ...currentChunk,
          content: overlapContent + ' ' + currentChunk.content,
          tokenCount: this.estimateTokenCount(overlapContent + ' ' + currentChunk.content)
        }
      }
    }
    
    return chunks
  }

  private calculateOptimalOverlap(prevContent: string): string {
    const prevSentences = this.splitIntoSentences(prevContent)
    const overlapSentenceCount = Math.min(
      Math.floor(this.config.overlapTokens / 20), // Rough sentences per overlap
      prevSentences.length
    )
    
    return prevSentences.slice(-overlapSentenceCount).join(' ')
  }

  private getOverlapContent(chunks: SemanticChunk[], currentIndex: number): string {
    if (currentIndex === 0 || chunks.length === 0) return ''
    
    const prevChunk = chunks[currentIndex - 1]
    const sentences = this.splitIntoSentences(prevChunk.content)
    const overlapSentences = sentences.slice(-Math.floor(this.config.overlapTokens / 20))
    
    return overlapSentences.join(' ') + ' '
  }
}
