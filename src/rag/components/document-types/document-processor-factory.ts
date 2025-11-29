// Document Processing Factory
// Factory pattern for creating document processors based on file type

import { DOCUMENT_TYPE_CONFIGS, DocumentTypeConfig, ChunkingStrategy } from './document-types-config'

export interface ChunkMetadata {
  source: string
  page?: number
  section?: string
  type: string
  index: number
  tokens: number
  method?: string
  overlap?: number
  parentChunk?: string
  [key: string]: string | number | boolean | undefined
}

export interface VisualContentItem {
  id: string
  type: 'image' | 'chart' | 'table' | 'diagram'
  content: string
  metadata: Record<string, string | number | boolean>
}

export interface ProcessedChunk {
  id: string
  content: string
  metadata: ChunkMetadata
  embedding?: number[]
  visualContent?: {
    images: VisualContentItem[]
    tables: VisualContentItem[]
    charts: VisualContentItem[]
    diagrams: VisualContentItem[]
  }
}

export interface ProcessingResult {
  chunks: ProcessedChunk[]
  metadata: {
    filename: string
    type: string
    size: number
    totalChunks: number
    totalTokens: number
    processingTime: number
    extractedVisuals: number
    errors: string[]
  }
  visualContent: {
    images: VisualContentItem[]
    tables: VisualContentItem[]
    charts: VisualContentItem[]
    diagrams: VisualContentItem[]
  }
}

export abstract class BaseDocumentProcessor {
  protected config: DocumentTypeConfig

  constructor(config: DocumentTypeConfig) {
    this.config = config
  }

  abstract extractText(file: File | Buffer): Promise<string>
  abstract extractVisualContent(file: File | Buffer): Promise<VisualContentItem[]>
  
  async process(file: File): Promise<ProcessingResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Validate file size
      if (file.size > this.config.maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds maximum allowed size of ${this.config.maxSize}MB`)
      }

      // Extract text content
      const textContent = await this.extractText(file)
      
      // Extract visual content if enabled
      let visualContent: { images: VisualContentItem[]; tables: VisualContentItem[]; charts: VisualContentItem[]; diagrams: VisualContentItem[] } = { 
        images: [], 
        tables: [], 
        charts: [], 
        diagrams: [] 
      }
      if (this.config.processingPipeline.visualExtraction.enabled) {
        try {
          const extracted = await this.extractVisualContent(file)
          visualContent = this.organizeVisualContent(extracted)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Visual extraction failed: ${errorMessage}`)
        }
      }

      // Apply preprocessing
      const preprocessedText = await this.preprocess(textContent)

      // Chunk the content
      const chunks = await this.chunkContent(preprocessedText, file.name)

      // Calculate metadata
      const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.metadata.tokens, 0)
      const processingTime = Date.now() - startTime

      return {
        chunks,
        metadata: {
          filename: file.name,
          type: this.config.type,
          size: file.size,
          totalChunks: chunks.length,
          totalTokens,
          processingTime,
          extractedVisuals: Object.values(visualContent).reduce((sum, arr) => sum + arr.length, 0),
          errors
        },
        visualContent
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Processing failed: ${errorMessage}`)
      
      return {
        chunks: [],
        metadata: {
          filename: file.name,
          type: this.config.type,
          size: file.size,
          totalChunks: 0,
          totalTokens: 0,
          processingTime: Date.now() - startTime,
          extractedVisuals: 0,
          errors
        },
        visualContent: { images: [], tables: [], charts: [], diagrams: [] }
      }
    }
  }

  protected async preprocess(text: string): Promise<string> {
    let processed = text
    
    for (const step of this.config.processingPipeline.preprocessing) {
      switch (step) {
        case 'normalize-whitespace':
          processed = processed.replace(/\s+/g, ' ').trim()
          break
        case 'remove-headers-footers':
          // Implementation for header/footer removal
          break
        case 'detect-language':
          // Language detection logic
          break
        default:
          console.warn(`Unknown preprocessing step: ${step}`)
      }
    }

    return processed
  }

  protected chunkContent(text: string, filename: string): Promise<ProcessedChunk[]> {
    const strategy = this.config.processingPipeline.chunking

    switch (strategy.method) {
      case 'fixed':
        return Promise.resolve(this.fixedChunking(text, filename, strategy))
      case 'semantic':
        return Promise.resolve(this.semanticChunking(text, filename, strategy))
      case 'paragraph':
        return Promise.resolve(this.paragraphChunking(text, filename, strategy))
      case 'sentence':
        return Promise.resolve(this.sentenceChunking(text, filename, strategy))
      case 'sliding':
        return Promise.resolve(this.slidingWindowChunking(text, filename, strategy))
      case 'hybrid':
        return Promise.resolve(this.hybridChunking(text, filename, strategy))
      default:
        return Promise.resolve(this.fixedChunking(text, filename, strategy))
    }
  }

  protected fixedChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = []
    const words = text.split(/\s+/)
    const wordsPerChunk = Math.floor(strategy.maxTokens * 0.75) // Rough token estimation
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunkWords = words.slice(i, i + wordsPerChunk)
      const content = chunkWords.join(' ')
      
      chunks.push({
        id: `${filename}-chunk-${chunks.length}`,
        content,
        metadata: {
          source: filename,
          type: this.config.type,
          index: chunks.length,
          tokens: chunkWords.length,
          method: 'fixed'
        }
      })
    }

    return chunks
  }

  protected semanticChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    // Enhanced semantic chunking that respects boundaries
    const chunks: ProcessedChunk[] = []
    
    if (strategy.respectBoundaries.includes('paragraph')) {
      const paragraphs = text.split(/\n\s*\n/)
      let currentChunk = ''
      let currentTokens = 0

      for (const paragraph of paragraphs) {
        const paragraphTokens = this.estimateTokens(paragraph)
        
        if (currentTokens + paragraphTokens > strategy.maxTokens && currentChunk) {
          chunks.push(this.createChunk(currentChunk, filename, chunks.length, currentTokens))
          currentChunk = paragraph
          currentTokens = paragraphTokens
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph
          currentTokens += paragraphTokens
        }
      }

      if (currentChunk) {
        chunks.push(this.createChunk(currentChunk, filename, chunks.length, currentTokens))
      }
    } else {
      // Fallback to fixed chunking
      return this.fixedChunking(text, filename, strategy)
    }

    return chunks
  }

  protected paragraphChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
    return paragraphs.map((paragraph, index) => ({
      id: `${filename}-para-${index}`,
      content: paragraph.trim(),
      metadata: {
        source: filename,
        type: this.config.type,
        index,
        tokens: this.estimateTokens(paragraph),
        method: strategy.method
      }
    }))
  }

  protected sentenceChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    const chunks: ProcessedChunk[] = []
    let currentChunk = ''
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence)
      
      if (currentTokens + sentenceTokens > strategy.maxTokens && currentChunk) {
        chunks.push(this.createChunk(currentChunk, filename, chunks.length, currentTokens))
        currentChunk = sentence.trim()
        currentTokens = sentenceTokens
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim()
        currentTokens += sentenceTokens
      }
    }

    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, filename, chunks.length, currentTokens))
    }

    return chunks
  }

  protected slidingWindowChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    const words = text.split(/\s+/)
    const chunks: ProcessedChunk[] = []
    const wordsPerChunk = Math.floor(strategy.maxTokens * 0.75)
    const overlapWords = Math.floor(strategy.overlapTokens * 0.75)
    
    for (let i = 0; i < words.length; i += (wordsPerChunk - overlapWords)) {
      const chunkWords = words.slice(i, i + wordsPerChunk)
      const content = chunkWords.join(' ')
      
      chunks.push({
        id: `${filename}-slide-${chunks.length}`,
        content,
        metadata: {
          source: filename,
          type: this.config.type,
          index: chunks.length,
          tokens: chunkWords.length,
          method: 'sliding-window',
          overlap: i > 0 ? overlapWords : 0
        }
      })

      if (i + wordsPerChunk >= words.length) break
    }

    return chunks
  }

  protected hybridChunking(text: string, filename: string, strategy: ChunkingStrategy): ProcessedChunk[] {
    // Combine semantic and sliding window approaches
    const semanticChunks = this.semanticChunking(text, filename, strategy)
    
    // If chunks are too large, apply sliding window
    const refinedChunks: ProcessedChunk[] = []
    
    for (const chunk of semanticChunks) {
      if (chunk.metadata.tokens > strategy.maxTokens) {
        const subChunks = this.slidingWindowChunking(chunk.content, filename, strategy)
        refinedChunks.push(...subChunks.map((subChunk, index) => ({
          ...subChunk,
          id: `${chunk.id}-sub-${index}`,
          metadata: {
            ...subChunk.metadata,
            parentChunk: chunk.id,
            method: 'hybrid'
          }
        })))
      } else {
        refinedChunks.push({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            method: 'hybrid'
          }
        })
      }
    }

    return refinedChunks
  }

  protected createChunk(content: string, filename: string, index: number, tokens: number): ProcessedChunk {
    return {
      id: `${filename}-chunk-${index}`,
      content: content.trim(),
      metadata: {
        source: filename,
        type: this.config.type,
        index,
        tokens,
        method: 'semantic'
      }
    }
  }

  protected estimateTokens(text: string): number {
    // Rough token estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  protected organizeVisualContent(extracted: VisualContentItem[]): {
    images: VisualContentItem[]
    tables: VisualContentItem[]
    charts: VisualContentItem[]
    diagrams: VisualContentItem[]
  } {
    return {
      images: extracted.filter(item => item.type === 'image'),
      tables: extracted.filter(item => item.type === 'table'),
      charts: extracted.filter(item => item.type === 'chart'),
      diagrams: extracted.filter(item => item.type === 'diagram')
    }
  }
}

// Specific processor implementations
export class PDFProcessor extends BaseDocumentProcessor {
  async extractText(file: File | Buffer): Promise<string> {
    // Implementation would use pdfjs-dist
    console.log('Processing PDF file:', file instanceof File ? file.name : 'Buffer')
    throw new Error('PDF processing not yet implemented')
  }

  async extractVisualContent(file: File | Buffer): Promise<VisualContentItem[]> {
    // Implementation for PDF visual extraction
    console.log('Extracting visual content from PDF:', file instanceof File ? file.name : 'Buffer')
    return []
  }
}

export class DOCXProcessor extends BaseDocumentProcessor {
  async extractText(file: File | Buffer): Promise<string> {
    // Implementation would use mammoth
    console.log('Processing DOCX file:', file instanceof File ? file.name : 'Buffer')
    throw new Error('DOCX processing not yet implemented')
  }

  async extractVisualContent(file: File | Buffer): Promise<VisualContentItem[]> {
    console.log('Extracting visual content from DOCX:', file instanceof File ? file.name : 'Buffer')
    return []
  }
}

export class TextProcessor extends BaseDocumentProcessor {
  async extractText(file: File | Buffer): Promise<string> {
    if (file instanceof File) {
      return await file.text()
    }
    return file.toString('utf-8')
  }

  async extractVisualContent(file: File | Buffer): Promise<VisualContentItem[]> {
    console.log('Processing text file for visual content:', file instanceof File ? file.name : 'Buffer')
    return [] // Plain text has no visual content
  }
}

export class MarkdownProcessor extends BaseDocumentProcessor {
  async extractText(file: File | Buffer): Promise<string> {
    const rawText = file instanceof File ? await file.text() : file.toString('utf-8')
    // Basic markdown parsing - remove markdown syntax for plain text
    return rawText
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italics
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
  }

  async extractVisualContent(file: File | Buffer): Promise<VisualContentItem[]> {
    const rawText = file instanceof File ? await file.text() : file.toString('utf-8')
    const tables: VisualContentItem[] = []
    
    // Extract markdown tables
    const tableRegex = /^\|(.+)\|$/gm
    let match
    let index = 0
    while ((match = tableRegex.exec(rawText)) !== null) {
      tables.push({
        id: `table-${index}`,
        type: 'table',
        content: match[0],
        metadata: { format: 'markdown', type: 'table' }
      })
      index++
    }

    return tables
  }
}

// Factory function
export function createDocumentProcessor(fileExtension: string): BaseDocumentProcessor | null {
  const config = Object.values(DOCUMENT_TYPE_CONFIGS).find(c => 
    c.extensions.includes(fileExtension.toLowerCase())
  )

  if (!config) return null

  switch (config.type) {
    case 'pdf':
      return new PDFProcessor(config)
    case 'docx':
      return new DOCXProcessor(config)
    case 'txt':
      return new TextProcessor(config)
    case 'markdown':
      return new MarkdownProcessor(config)
    default:
      return new TextProcessor(config) // Fallback to text processor
  }
}

export function getSupportedTypes(): string[] {
  return Object.keys(DOCUMENT_TYPE_CONFIGS)
}

export function getProcessorCapabilities(type: string): DocumentTypeConfig | null {
  return DOCUMENT_TYPE_CONFIGS[type] || null
}
