// Base interfaces for modular file processors

export interface FileProcessor {
  readonly supportedTypes: string[]
  process(file: File): Promise<string>
  validate?(file: File): boolean
  extractMetadata?(file: File): Promise<Record<string, any>>
}

export interface ProcessorConfig {
  maxFileSize?: number
  timeout?: number
  enableOCR?: boolean
  preserveFormatting?: boolean
  extractImages?: boolean
  includeMetadata?: boolean
}

export interface ProcessingResult {
  content: string
  metadata?: Record<string, any>
  images?: Array<{
    id: string
    base64: string
    type: string
    description?: string
  }>
  warnings?: string[]
  processingTime?: number
}

export abstract class BaseProcessor implements FileProcessor {
  abstract readonly supportedTypes: string[]
  protected config: ProcessorConfig

  constructor(config: ProcessorConfig = {}) {
    this.config = {
      maxFileSize: 100 * 1024 * 1024, // 100MB default
      timeout: 30000, // 30 seconds
      enableOCR: false,
      preserveFormatting: true,
      extractImages: false,
      includeMetadata: true,
      ...config
    }
  }

  abstract process(file: File): Promise<string>

  validate(file: File): boolean {
    // Check file size
    if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${this.config.maxFileSize}`)
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !this.supportedTypes.includes(extension)) {
      return false
    }

    return true
  }

  async extractMetadata(file: File): Promise<Record<string, any>> {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      extension: file.name.split('.').pop()?.toLowerCase()
    }
  }

  protected async withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs || this.config.timeout || 30000
    
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Processing timeout after ${timeout}ms`)), timeout)
      )
    ])
  }
}

export class ProcessorRegistry {
  private processors = new Map<string, FileProcessor>()

  register(processor: FileProcessor): void {
    for (const type of processor.supportedTypes) {
      this.processors.set(type.toLowerCase(), processor)
    }
  }

  getProcessor(fileExtension: string): FileProcessor | undefined {
    return this.processors.get(fileExtension.toLowerCase())
  }

  getSupportedTypes(): string[] {
    return Array.from(this.processors.keys())
  }

  async processFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension) {
      throw new Error('File has no extension')
    }

    const processor = this.getProcessor(extension)
    if (!processor) {
      throw new Error(`No processor found for file type: ${extension}`)
    }

    if (processor.validate && !processor.validate(file)) {
      throw new Error(`File validation failed for: ${file.name}`)
    }

    return await processor.process(file)
  }
}

// Global registry instance
export const processorRegistry = new ProcessorRegistry()
