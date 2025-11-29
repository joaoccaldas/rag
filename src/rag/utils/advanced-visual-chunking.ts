/**
 * Advanced Document Chunking with Visual Context Preservation
 * 
 * Enhanced chunking strategy that maintains visual-text relationships,
 * implements page-aware chunking for PDFs, and preserves semantic boundaries.
 * 
 * Key Features:
 * - Visual context preservation (charts, tables, images near text)
 * - Page-aware chunking for structured documents
 * - Semantic boundary detection to avoid breaking sentences/paragraphs
 * - Multi-modal chunk creation with text + visual references
 * - Adaptive chunk sizing based on content complexity
 */

import { DocumentChunk, VisualContent, Document } from '../types'

export interface VisualContextChunk extends DocumentChunk {
  visualReferences: string[] // IDs of associated visual content
  pageNumber?: number
  sectionType: 'text' | 'mixed' | 'visual-heavy'
  contextualMetadata: {
    nearbyVisuals: VisualContent[]
    semanticBoundaries: string[]
    importance: number
    readabilityScore: number
    visualDensity: number // 0-1, how much visual content is nearby
  }
}

export interface ChunkingConfig {
  maxChunkSize: number
  minChunkSize: number
  overlapSize: number
  preservePageBoundaries: boolean
  includeVisualContext: boolean
  semanticBoundaryDetection: boolean
  adaptiveChunkSizing: boolean
  visualProximityThreshold: number // pixels for determining "nearby" visuals
}

export interface ChunkingResult {
  chunks: VisualContextChunk[]
  metadata: {
    totalChunks: number
    averageChunkSize: number
    visualContextChunks: number
    pageDistribution: Record<number, number>
    processingTime: number
  }
}

export class AdvancedDocumentChunker {
  private config: ChunkingConfig

  constructor(config: Partial<ChunkingConfig> = {}) {
    this.config = {
      maxChunkSize: 1000,
      minChunkSize: 200,
      overlapSize: 150,
      preservePageBoundaries: true,
      includeVisualContext: true,
      semanticBoundaryDetection: true,
      adaptiveChunkSizing: true,
      visualProximityThreshold: 100,
      ...config
    }
  }

  /**
   * Main chunking method with visual context preservation
   */
  async chunkDocument(
    document: Document,
    visualContent?: VisualContent[]
  ): Promise<ChunkingResult> {
    const startTime = Date.now()
    console.log(`🔧 Starting advanced chunking for ${document.name}`)

    try {
      // Parse document structure
      const documentStructure = this.parseDocumentStructure(document.content, document.type)
      
      // Extract visual context if available
      const visuals = visualContent || document.visualContent || []
      
      // Create page-aware chunks
      const rawChunks = this.createPageAwareChunks(documentStructure)
      
      // Enhance chunks with visual context
      const enhancedChunks = await this.enhanceChunksWithVisualContext(rawChunks, visuals)
      
      // Apply semantic boundary detection
      const semanticChunks = this.applySemanticBoundaries(enhancedChunks)
      
      // Optimize chunk sizes adaptively
      const optimizedChunks = this.optimizeChunkSizes(semanticChunks)
      
      // Generate final metadata
      const metadata = this.generateChunkingMetadata(optimizedChunks, Date.now() - startTime)
      
      console.log(`✅ Chunking complete: ${optimizedChunks.length} chunks created in ${Date.now() - startTime}ms`)
      
      return {
        chunks: optimizedChunks,
        metadata
      }
    } catch (error) {
      console.error('❌ Error in advanced chunking:', error)
      throw error
    }
  }

  /**
   * Parse document structure to identify pages, sections, and content types
   */
  private parseDocumentStructure(content: string, documentType: string): DocumentStructure {
    const structure: DocumentStructure = {
      pages: [],
      sections: [],
      contentBlocks: []
    }

    switch (documentType) {
      case 'pdf':
        structure.pages = this.parsePDFStructure(content)
        break
      case 'html':
        structure.sections = this.parseHTMLStructure(content)
        break
      case 'docx':
      case 'odt':
        structure.sections = this.parseDocumentSections(content)
        break
      default:
        structure.contentBlocks = this.parseTextStructure(content)
    }

    return structure
  }

  /**
   * Create page-aware chunks that respect document structure
   */
  private createPageAwareChunks(structure: DocumentStructure): RawChunk[] {
    const chunks: RawChunk[] = []
    let chunkIndex = 0

    if (structure.pages.length > 0) {
      // PDF-style page-based chunking
      structure.pages.forEach((page, pageIndex) => {
        const pageChunks = this.chunkPageContent(page, pageIndex + 1, chunkIndex)
        chunks.push(...pageChunks)
        chunkIndex += pageChunks.length
      })
    } else if (structure.sections.length > 0) {
      // Section-based chunking for structured documents
      structure.sections.forEach((section, sectionIndex) => {
        const sectionChunks = this.chunkSectionContent(section, sectionIndex, chunkIndex)
        chunks.push(...sectionChunks)
        chunkIndex += sectionChunks.length
      })
    } else {
      // Basic text chunking for simple documents
      const textChunks = this.chunkTextContent(structure.contentBlocks.join('\\n'), chunkIndex)
      chunks.push(...textChunks)
    }

    return chunks
  }

  /**
   * Enhance chunks with visual context information
   */
  private async enhanceChunksWithVisualContext(
    rawChunks: RawChunk[],
    visuals: VisualContent[]
  ): Promise<VisualContextChunk[]> {
    if (!this.config.includeVisualContext || visuals.length === 0) {
      return rawChunks.map(chunk => this.convertToVisualContextChunk(chunk, []))
    }

    const enhancedChunks: VisualContextChunk[] = []

    for (const chunk of rawChunks) {
      const nearbyVisuals = this.findNearbyVisuals(chunk, visuals)
      const visualDensity = this.calculateVisualDensity(chunk, nearbyVisuals)
      const sectionType = this.determineSectionType(chunk, nearbyVisuals)

      const enhancedChunk: VisualContextChunk = {
        ...chunk,
        documentId: '', // Will be set by the caller
        visualReferences: nearbyVisuals.map(v => v.id),
        sectionType,
        contextualMetadata: {
          nearbyVisuals,
          semanticBoundaries: this.identifySemanticBoundaries(chunk.content),
          importance: this.calculateChunkImportance(chunk, nearbyVisuals),
          readabilityScore: this.calculateReadabilityScore(chunk.content),
          visualDensity
        }
      }

      enhancedChunks.push(enhancedChunk)
    }

    return enhancedChunks
  }

  /**
   * Apply semantic boundary detection to improve chunk quality
   */
  private applySemanticBoundaries(chunks: VisualContextChunk[]): VisualContextChunk[] {
    if (!this.config.semanticBoundaryDetection) {
      return chunks
    }

    const optimizedChunks: VisualContextChunk[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // Check if chunk ends in middle of sentence or important concept
      if (this.isAtPoorBoundary(chunk.content)) {
        // Try to extend chunk to next natural boundary
        const nextChunk = chunks[i + 1]
        if (nextChunk && this.canMergeChunks(chunk, nextChunk)) {
          const mergedChunk = this.mergeChunks(chunk, nextChunk)
          optimizedChunks.push(mergedChunk)
          i++ // Skip next chunk as it's been merged
          continue
        }
      }

      optimizedChunks.push(chunk)
    }

    return optimizedChunks
  }

  /**
   * Optimize chunk sizes based on content complexity and visual density
   */
  private optimizeChunkSizes(chunks: VisualContextChunk[]): VisualContextChunk[] {
    if (!this.config.adaptiveChunkSizing) {
      return chunks
    }

    return chunks.map(chunk => {
      const optimalSize = this.calculateOptimalChunkSize(chunk)
      
      if (chunk.content.length > optimalSize * 1.5) {
        // Split large chunk
        return this.splitChunk(chunk, optimalSize)
      } else if (chunk.content.length < optimalSize * 0.5) {
        // Mark small chunk for potential merging
        chunk.metadata = {
          ...chunk.metadata,
          importance: chunk.metadata.importance || 0.5 // Lower importance for small chunks
        }
      }

      return chunk
    }).flat()
  }

  /**
   * Find visual content near a text chunk
   */
  private findNearbyVisuals(chunk: RawChunk, visuals: VisualContent[]): VisualContent[] {
    return visuals.filter(visual => {
      // Check page proximity
      if (chunk.pageNumber && visual.metadata?.pageNumber) {
        const pageDistance = Math.abs(chunk.pageNumber - visual.metadata.pageNumber)
        if (pageDistance > 1) return false // Only consider visuals on same or adjacent pages
      }

      // Check positional proximity (if available)
      if (visual.metadata?.boundingBox && chunk.position) {
        const distance = this.calculatePositionalDistance(chunk.position, visual.metadata.boundingBox)
        return distance <= this.config.visualProximityThreshold
      }

      // Check content relevance
      return this.isVisualContentRelevant(chunk.content, visual)
    })
  }

  /**
   * Calculate visual density around a text chunk
   */
  private calculateVisualDensity(chunk: RawChunk, nearbyVisuals: VisualContent[]): number {
    if (nearbyVisuals.length === 0) return 0

    const visualArea = nearbyVisuals.reduce((total, visual) => {
      if (visual.metadata?.boundingBox) {
        return total + (visual.metadata.boundingBox.width * visual.metadata.boundingBox.height)
      }
      return total + 1000 // Default area if no bounding box
    }, 0)

    const chunkArea = chunk.content.length * 10 // Approximate text area
    return Math.min(visualArea / (visualArea + chunkArea), 1)
  }

  /**
   * Determine section type based on content and visual context
   */
  private determineSectionType(chunk: RawChunk, visuals: VisualContent[]): 'text' | 'mixed' | 'visual-heavy' {
    const visualDensity = this.calculateVisualDensity(chunk, visuals)
    
    if (visualDensity > 0.6) return 'visual-heavy'
    if (visualDensity > 0.2) return 'mixed'
    return 'text'
  }

  // Helper methods for document structure parsing
  private parsePDFStructure(content: string): PageContent[] {
    // Split content by page markers or use heuristics
    const pages: PageContent[] = []
    const pageMarkers = content.split(/\\f|\\page\\b|Page \\d+/i)
    
    pageMarkers.forEach((pageContent, index) => {
      if (pageContent.trim()) {
        pages.push({
          number: index + 1,
          content: pageContent.trim(),
          position: { x: 0, y: index * 800, width: 595, height: 842 } // A4 size
        })
      }
    })

    return pages.length > 0 ? pages : [{
      number: 1,
      content: content,
      position: { x: 0, y: 0, width: 595, height: 842 }
    }]
  }

  private parseHTMLStructure(content: string): SectionContent[] {
    const sections: SectionContent[] = []
    
    // Extract sections based on headings
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
    let lastIndex = 0
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const [fullMatch, level, title] = match
      const sectionContent = content.substring(lastIndex, match.index || 0)
      
      if (sectionContent.trim()) {
        sections.push({
          title: title.replace(/<[^>]*>/g, ''),
          level: parseInt(level),
          content: sectionContent.trim(),
          startIndex: lastIndex,
          endIndex: match.index || 0
        })
      }
      
      lastIndex = (match.index || 0) + fullMatch.length
    }

    // Add final section
    const finalContent = content.substring(lastIndex)
    if (finalContent.trim()) {
      sections.push({
        title: 'Final Section',
        level: 1,
        content: finalContent.trim(),
        startIndex: lastIndex,
        endIndex: content.length
      })
    }

    return sections
  }

  private parseDocumentSections(content: string): SectionContent[] {
    // Parse structured documents by paragraphs and headings
    const sections: SectionContent[] = []
    const paragraphs = content.split(/\\n\\s*\\n/)
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        sections.push({
          title: `Section ${index + 1}`,
          level: 1,
          content: paragraph.trim(),
          startIndex: index * 500, // Approximate
          endIndex: (index + 1) * 500
        })
      }
    })

    return sections
  }

  private parseTextStructure(content: string): string[] {
    // Split plain text into logical blocks
    return content.split(/\\n\\s*\\n/).filter(block => block.trim().length > 0)
  }

  // Additional helper methods...
  private chunkPageContent(page: PageContent, pageNumber: number, startIndex: number): RawChunk[] {
    const chunks: RawChunk[] = []
    const words = page.content.split(/\\s+/)
    let currentChunk = ''
    let chunkIndex = startIndex

    for (const word of words) {
      if (currentChunk.length + word.length + 1 > this.config.maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk_${chunkIndex}`,
            content: currentChunk.trim(),
            startIndex: 0, // Will be calculated properly
            endIndex: currentChunk.length,
            pageNumber,
            position: page.position,
            metadata: { chunkIndex, tokenCount: this.estimateTokenCount(currentChunk) }
          })
          chunkIndex++
        }
        currentChunk = word
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        startIndex: 0,
        endIndex: currentChunk.length,
        pageNumber,
        position: page.position,
        metadata: { chunkIndex, tokenCount: this.estimateTokenCount(currentChunk) }
      })
    }

    return chunks
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.split(/\\s+/).length * 1.3) // Rough token estimation
  }

  private chunkSectionContent(section: SectionContent, sectionIndex: number, startIndex: number): RawChunk[] {
    // Similar to chunkPageContent but for sections
    return this.chunkTextContent(section.content, startIndex, sectionIndex)
  }

  private chunkTextContent(content: string, startIndex: number, sectionIndex?: number): RawChunk[] {
    const chunks: RawChunk[] = []
    let currentIndex = 0
    let chunkIndex = startIndex

    while (currentIndex < content.length) {
      const chunkEnd = Math.min(currentIndex + this.config.maxChunkSize, content.length)
      let actualEnd = chunkEnd

      // Try to end at sentence boundary
      if (chunkEnd < content.length) {
        const sentenceEnd = content.lastIndexOf('.', chunkEnd)
        if (sentenceEnd > currentIndex + this.config.minChunkSize) {
          actualEnd = sentenceEnd + 1
        }
      }

      const chunkContent = content.substring(currentIndex, actualEnd).trim()
      if (chunkContent) {
        chunks.push({
          id: `chunk_${chunkIndex}`,
          content: chunkContent,
          startIndex: currentIndex,
          endIndex: actualEnd,
          sectionIndex,
          metadata: { chunkIndex, tokenCount: this.estimateTokenCount(chunkContent) }
        })
        chunkIndex++
      }

      currentIndex = actualEnd - this.config.overlapSize
      if (currentIndex >= actualEnd) break
    }

    return chunks
  }

  private convertToVisualContextChunk(rawChunk: RawChunk, visuals: VisualContent[]): VisualContextChunk {
    return {
      id: rawChunk.id,
      documentId: '', // Will be set by caller
      content: rawChunk.content,
      startIndex: rawChunk.startIndex,
      endIndex: rawChunk.endIndex,
      metadata: rawChunk.metadata,
      visualReferences: visuals.map(v => v.id),
      pageNumber: rawChunk.pageNumber,
      sectionType: 'text',
      contextualMetadata: {
        nearbyVisuals: visuals,
        semanticBoundaries: [],
        importance: 0.5,
        readabilityScore: 0.5,
        visualDensity: 0
      }
    }
  }

  // Placeholder implementations for complex methods
  private identifySemanticBoundaries(content: string): string[] {
    // Identify natural breaks in content
    const boundaries: string[] = []
    const sentences = content.split(/[.!?]+/)
    
    sentences.forEach((sentence, index) => {
      if (sentence.trim().length > 0) {
        boundaries.push(`sentence_${index}`)
      }
    })

    return boundaries
  }

  private calculateChunkImportance(chunk: RawChunk, visuals: VisualContent[]): number {
    let importance = 0.5 // Base importance
    
    // Boost importance based on visual content
    importance += visuals.length * 0.1
    
    // Boost importance based on content features
    if (chunk.content.includes('important') || chunk.content.includes('key')) {
      importance += 0.2
    }
    
    return Math.min(importance, 1)
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability score based on sentence length and word complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim())
    const words = content.split(/\\s+/)
    
    const avgSentenceLength = words.length / sentences.length
    const readabilityScore = Math.max(0, 1 - (avgSentenceLength - 15) / 30)
    
    return Math.min(Math.max(readabilityScore, 0), 1)
  }

  private isAtPoorBoundary(content: string): boolean {
    // Check if content ends abruptly
    const lastChar = content.trim().slice(-1)
    return !['.', '!', '?', ':', ';'].includes(lastChar)
  }

  private canMergeChunks(chunk1: VisualContextChunk, chunk2: VisualContextChunk): boolean {
    const combinedLength = chunk1.content.length + chunk2.content.length
    return combinedLength <= this.config.maxChunkSize * 1.2
  }

  private mergeChunks(chunk1: VisualContextChunk, chunk2: VisualContextChunk): VisualContextChunk {
    return {
      ...chunk1,
      content: chunk1.content + ' ' + chunk2.content,
      endIndex: chunk2.endIndex,
      visualReferences: [...chunk1.visualReferences, ...chunk2.visualReferences],
      contextualMetadata: {
        ...chunk1.contextualMetadata,
        nearbyVisuals: [...chunk1.contextualMetadata.nearbyVisuals, ...chunk2.contextualMetadata.nearbyVisuals],
        importance: Math.max(chunk1.contextualMetadata.importance, chunk2.contextualMetadata.importance)
      }
    }
  }

  private calculateOptimalChunkSize(chunk: VisualContextChunk): number {
    let optimalSize = this.config.maxChunkSize
    
    // Adjust based on visual density
    if (chunk.contextualMetadata.visualDensity > 0.5) {
      optimalSize *= 0.8 // Smaller chunks for visual-heavy content
    }
    
    // Adjust based on complexity
    if (chunk.contextualMetadata.readabilityScore < 0.3) {
      optimalSize *= 0.7 // Smaller chunks for complex content
    }
    
    return Math.max(optimalSize, this.config.minChunkSize)
  }

  private splitChunk(chunk: VisualContextChunk, targetSize: number): VisualContextChunk[] {
    // Implementation for splitting large chunks
    const chunks: VisualContextChunk[] = []
    const content = chunk.content
    let currentIndex = 0
    let subChunkIndex = 0

    while (currentIndex < content.length) {
      const endIndex = Math.min(currentIndex + targetSize, content.length)
      const subContent = content.substring(currentIndex, endIndex)

      chunks.push({
        ...chunk,
        id: `${chunk.id}_${subChunkIndex}`,
        content: subContent,
        startIndex: chunk.startIndex + currentIndex,
        endIndex: chunk.startIndex + endIndex
      })

      currentIndex = endIndex - this.config.overlapSize
      subChunkIndex++
    }

    return chunks
  }

  private calculatePositionalDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private isVisualContentRelevant(textContent: string, visual: VisualContent): boolean {
    // Check if visual content is mentioned in text
    const lowerText = textContent.toLowerCase()
    const visualTerms = [visual.title, visual.description].filter(Boolean)
    
    return visualTerms.some(term => 
      term && lowerText.includes(term.toLowerCase())
    )
  }

  private generateChunkingMetadata(chunks: VisualContextChunk[], processingTime: number) {
    const pageDistribution: Record<number, number> = {}
    let visualContextChunks = 0

    chunks.forEach(chunk => {
      if (chunk.pageNumber) {
        pageDistribution[chunk.pageNumber] = (pageDistribution[chunk.pageNumber] || 0) + 1
      }
      if (chunk.visualReferences.length > 0) {
        visualContextChunks++
      }
    })

    const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)

    return {
      totalChunks: chunks.length,
      averageChunkSize: Math.round(totalChunkSize / chunks.length),
      visualContextChunks,
      pageDistribution,
      processingTime
    }
  }
}

// Supporting interfaces
interface DocumentStructure {
  pages: PageContent[]
  sections: SectionContent[]
  contentBlocks: string[]
}

interface PageContent {
  number: number
  content: string
  position: Position
}

interface SectionContent {
  title: string
  level: number
  content: string
  startIndex: number
  endIndex: number
}

interface Position {
  x: number
  y: number
  width: number
  height: number
}

interface RawChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  pageNumber?: number
  sectionIndex?: number
  position?: Position
  metadata: {
    chunkIndex: number
    tokenCount: number
  }
}

// Export singleton instance
export const advancedDocumentChunker = new AdvancedDocumentChunker()
