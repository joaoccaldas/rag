/**
 * Intelligent Cache Manager for RAG System
 * Provides multi-level caching for embeddings, search results, and computed data
 */

import type { 
  Document, 
  SearchResult, 
  EmbeddingResult
} from '../types'

// Define types for computation cache and filters
type ComputationValue = string | number | boolean | Record<string, unknown> | null
type SearchFilters = Record<string, unknown>

// Cache configuration types
interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo'
  persistToDisk?: boolean
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  accessCount: number
  size: number
  key: string
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  entryCount: number
  hitRate: number
}

/**
 * Generic Cache Implementation with Multiple Eviction Strategies
 */
class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0
  }

  constructor(config: CacheConfig) {
    this.config = config
    
    // Periodic cleanup for expired entries
    setInterval(() => this.cleanupExpired(), 60000) // Every minute
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      this.updateHitRate()
      return null
    }

    // Update access count for LFU strategy
    entry.accessCount++
    entry.timestamp = Date.now()
    
    this.stats.hits++
    this.updateHitRate()
    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    const size = this.calculateSize(value)
    
    // Check if we need to evict entries
    while (this.shouldEvict(size)) {
      this.evictEntry()
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      size,
      key
    }

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!
      this.stats.totalSize -= existing.size
      this.stats.entryCount--
    }

    this.cache.set(key, entry)
    this.stats.totalSize += size
    this.stats.entryCount++

    // Persist to disk if configured
    if (this.config.persistToDisk) {
      this.persistEntry(key, entry)
    }
  }

  /**
   * Check if entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry !== undefined && !this.isExpired(entry)
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.stats.totalSize -= entry.size
      this.stats.entryCount--
      return this.cache.delete(key)
    }
    return false
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl
  }

  /**
   * Calculate approximate size of value
   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length
    } catch {
      return 1000 // Default size for non-serializable objects
    }
  }

  /**
   * Check if we should evict entries before adding new one
   */
  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.stats.totalSize + newEntrySize > this.config.maxSize ||
      this.stats.entryCount >= 1000 // Reasonable entry limit
    )
  }

  /**
   * Evict entry based on strategy
   */
  private evictEntry(): void {
    let keyToEvict: string | null = null

    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.findLRUKey()
        break
      case 'lfu': // Least Frequently Used
        keyToEvict = this.findLFUKey()
        break
      case 'fifo': // First In, First Out
        const firstKey = this.cache.keys().next().value
        keyToEvict = firstKey || null
        break
    }

    if (keyToEvict) {
      this.delete(keyToEvict)
      this.stats.evictions++
    }
  }

  /**
   * Find least recently used key
   */
  private findLRUKey(): string | null {
    let oldestTime = Date.now()
    let oldestKey: string | null = null

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * Find least frequently used key
   */
  private findLFUKey(): string | null {
    let lowestCount = Infinity
    let leastUsedKey: string | null = null

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < lowestCount) {
        lowestCount = entry.accessCount
        leastUsedKey = key
      }
    }

    return leastUsedKey
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.delete(key))
  }

  /**
   * Persist entry to disk (placeholder for IndexedDB implementation)
   */
  private async persistEntry(key: string, _entry: CacheEntry<T>): Promise<void> {
    try {
      // This would implement IndexedDB storage for persistence
      // For now, just log that we would persist
      console.log(`[Cache] Would persist ${key} to disk`)
    } catch (error) {
      console.warn('[Cache] Failed to persist entry:', error)
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }
}

/**
 * Specialized Cache Manager for RAG System
 */
export class RAGCacheManager {
  private embeddingCache: IntelligentCache<EmbeddingResult>
  private searchCache: IntelligentCache<SearchResult[]>
  private documentCache: IntelligentCache<Document>
  private computationCache: IntelligentCache<ComputationValue>

  constructor() {
    // Configure different cache types with appropriate settings
    this.embeddingCache = new IntelligentCache<EmbeddingResult>({
      maxSize: 50 * 1024 * 1024, // 50MB for embeddings
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      strategy: 'lru',
      persistToDisk: true
    })

    this.searchCache = new IntelligentCache<SearchResult[]>({
      maxSize: 20 * 1024 * 1024, // 20MB for search results
      ttl: 60 * 60 * 1000, // 1 hour
      strategy: 'lfu',
      persistToDisk: false
    })

    this.documentCache = new IntelligentCache<Document>({
      maxSize: 100 * 1024 * 1024, // 100MB for documents
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      strategy: 'lru',
      persistToDisk: true
    })

    this.computationCache = new IntelligentCache<ComputationValue>({
      maxSize: 10 * 1024 * 1024, // 10MB for general computations
      ttl: 30 * 60 * 1000, // 30 minutes
      strategy: 'lfu',
      persistToDisk: false
    })
  }

  /**
   * Embedding cache operations
   */
  getEmbedding(text: string): EmbeddingResult | null {
    const key = this.hashText(text)
    return this.embeddingCache.get(key)
  }

  setEmbedding(text: string, embedding: EmbeddingResult): void {
    const key = this.hashText(text)
    this.embeddingCache.set(key, embedding)
  }

  /**
   * Search cache operations
   */
  getSearchResults(query: string, filters?: SearchFilters): SearchResult[] | null {
    const key = this.createSearchKey(query, filters)
    return this.searchCache.get(key)
  }

  setSearchResults(query: string, results: SearchResult[], filters?: SearchFilters): void {
    const key = this.createSearchKey(query, filters)
    this.searchCache.set(key, results)
  }

  /**
   * Document cache operations
   */
  getDocument(id: string): Document | null {
    return this.documentCache.get(id)
  }

  setDocument(id: string, document: Document): void {
    this.documentCache.set(id, document)
  }

  /**
   * General computation cache
   */
  getComputation(key: string): ComputationValue {
    return this.computationCache.get(key)
  }

  setComputation(key: string, value: ComputationValue): void {
    this.computationCache.set(key, value)
  }

  /**
   * Get comprehensive cache statistics
   */
  getOverallStats(): {
    embeddings: CacheStats
    search: CacheStats
    documents: CacheStats
    computations: CacheStats
    totalMemoryUsage: number
  } {
    const embeddingStats = this.embeddingCache.getStats()
    const searchStats = this.searchCache.getStats()
    const documentStats = this.documentCache.getStats()
    const computationStats = this.computationCache.getStats()

    return {
      embeddings: embeddingStats,
      search: searchStats,
      documents: documentStats,
      computations: computationStats,
      totalMemoryUsage: 
        embeddingStats.totalSize + 
        searchStats.totalSize + 
        documentStats.totalSize + 
        computationStats.totalSize
    }
  }

  /**
   * Clear specific cache type
   */
  clearCache(type: 'embeddings' | 'search' | 'documents' | 'computations' | 'all'): void {
    switch (type) {
      case 'embeddings':
        this.embeddingCache.clear()
        break
      case 'search':
        this.searchCache.clear()
        break
      case 'documents':
        this.documentCache.clear()
        break
      case 'computations':
        this.computationCache.clear()
        break
      case 'all':
        this.embeddingCache.clear()
        this.searchCache.clear()
        this.documentCache.clear()
        this.computationCache.clear()
        break
    }
  }

  /**
   * Preload frequently accessed data
   */
  async preloadFrequentData(): Promise<void> {
    try {
      // This would implement preloading logic based on usage patterns
      console.log('[Cache] Preloading frequent data...')
      
      // Example: Load most accessed documents
      // const frequentDocs = await getFrequentlyAccessedDocuments()
      // frequentDocs.forEach(doc => this.setDocument(doc.id, doc))
      
    } catch (error) {
      console.warn('[Cache] Failed to preload data:', error)
    }
  }

  /**
   * Hash text for consistent cache keys
   */
  private hashText(text: string): string {
    // Simple hash function (in production, consider using crypto.subtle.digest)
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Create search cache key including filters
   */
  private createSearchKey(query: string, filters?: SearchFilters): string {
    const baseKey = this.hashText(query)
    const filterKey = filters ? this.hashText(JSON.stringify(filters)) : ''
    return `${baseKey}:${filterKey}`
  }
}

// Export singleton instance
export const ragCacheManager = new RAGCacheManager()

// Export types for use in other modules
export type { CacheConfig, CacheEntry, CacheStats }
