// Lazy Loading Utilities for RAG System

import { Document } from '../types'
import { ragStorage } from './storage'

interface LoadDocumentsOptions {
  offset?: number
  limit?: number
  sortBy?: 'name' | 'uploadedAt' | 'size'
  sortOrder?: 'asc' | 'desc'
  filter?: {
    type?: string[]
    status?: string[]
    search?: string
  }
}

interface PaginatedDocuments {
  documents: Document[]
  total: number
  hasMore: boolean
  nextOffset: number
}

/**
 * Load documents in batches with pagination
 */
export async function loadDocumentsBatch(options: LoadDocumentsOptions = {}): Promise<PaginatedDocuments> {
  const {
    offset = 0,
    limit = 20,
    sortBy = 'uploadedAt',
    sortOrder = 'desc',
    filter = {}
  } = options

  try {
    // Load all documents first (in a real app, this would be server-side)
    const allDocuments = await ragStorage.loadDocuments()
    
    // Apply filters
    let filteredDocuments = allDocuments
    
    if (filter.type && filter.type.length > 0) {
      filteredDocuments = filteredDocuments.filter(doc => 
        filter.type!.includes(doc.type)
      )
    }
    
    if (filter.status && filter.status.length > 0) {
      filteredDocuments = filteredDocuments.filter(doc => 
        filter.status!.includes(doc.status)
      )
    }
    
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.content.toLowerCase().includes(searchTerm) ||
        doc.metadata?.title?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Apply sorting
    filteredDocuments.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'uploadedAt':
          aValue = a.uploadedAt
          bValue = b.uploadedAt
          break
        case 'size':
          aValue = a.size
          bValue = b.size
          break
        default:
          aValue = a.uploadedAt
          bValue = b.uploadedAt
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    // Paginate
    const total = filteredDocuments.length
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit)
    const hasMore = offset + limit < total
    const nextOffset = hasMore ? offset + limit : total
    
    console.log(`Loaded batch: ${paginatedDocuments.length} documents (${offset}-${nextOffset} of ${total})`)
    
    return {
      documents: paginatedDocuments,
      total,
      hasMore,
      nextOffset
    }
    
  } catch (error) {
    console.error('Error loading documents batch:', error)
    return {
      documents: [],
      total: 0,
      hasMore: false,
      nextOffset: 0
    }
  }
}

/**
 * Stream process large documents in chunks
 */
export async function* processDocumentStream(
  file: File,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): AsyncGenerator<{ chunk: ArrayBuffer, progress: number }, void, unknown> {
  const fileSize = file.size
  let offset = 0
  
  while (offset < fileSize) {
    const slice = file.slice(offset, offset + chunkSize)
    const chunk = await slice.arrayBuffer()
    
    offset += chunkSize
    const progress = Math.min(offset / fileSize, 1)
    
    yield { chunk, progress }
  }
}

/**
 * Memory-efficient document chunk processing
 */
export class ChunkProcessor {
  private maxConcurrentChunks = 5
  private processingQueue: Array<() => Promise<unknown>> = []
  
  /**
   * Process chunks with memory management
   */
  async processChunks<T, U>(
    chunks: U[],
    processor: (chunk: U, index: number) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = []
    const semaphore = new Semaphore(this.maxConcurrentChunks)
    
    const promises = chunks.map(async (chunk, index) => {
      await semaphore.acquire()
      try {
        const result = await processor(chunk, index)
        results[index] = result
        return result
      } finally {
        semaphore.release()
      }
    })
    
    await Promise.all(promises)
    return results
  }
}

/**
 * Simple semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []
  
  constructor(permits: number) {
    this.permits = permits
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve)
    })
  }
  
  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!
      next()
    } else {
      this.permits++
    }
  }
}

/**
 * Document cache for frequently accessed items
 */
export class DocumentCache {
  private cache = new Map<string, Document>()
  private maxSize = 100
  private accessOrder = new Map<string, number>()
  private accessCounter = 0
  
  get(id: string): Document | undefined {
    const doc = this.cache.get(id)
    if (doc) {
      this.accessOrder.set(id, ++this.accessCounter)
    }
    return doc
  }
  
  set(id: string, document: Document): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(id)) {
      this.evictOldest()
    }
    
    this.cache.set(id, document)
    this.accessOrder.set(id, ++this.accessCounter)
  }
  
  has(id: string): boolean {
    return this.cache.has(id)
  }
  
  delete(id: string): boolean {
    this.accessOrder.delete(id)
    return this.cache.delete(id)
  }
  
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
  }
  
  private evictOldest(): void {
    let oldestId = ''
    let oldestAccess = Infinity
    
    for (const [id, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access
        oldestId = id
      }
    }
    
    if (oldestId) {
      this.delete(oldestId)
    }
  }
  
  getStats(): { size: number, maxSize: number, hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.accessCounter > 0 ? this.cache.size / this.accessCounter : 0
    }
  }
}

// Singleton cache instance
export const documentCache = new DocumentCache()
