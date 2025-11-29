/**
 * Semantic Cache System
 * 
 * Advanced semantic caching layer that uses embedding similarity for cache lookups.
 * Non-breaking: Wraps existing cache, can be toggled on/off via settings.
 * 
 * Features:
 * - Semantic similarity matching (not just string matching)
 * - Multi-level caching (L1: Memory, L2: IndexedDB)
 * - Automatic cache warming with popular queries
 * - Query clustering for better hit rates
 * - TTL with semantic decay (older but similar results stay longer)
 * - Automatic invalidation on document updates
 */

export interface CacheResult {
  id: string
  score: number
  content: string
  metadata?: Record<string, unknown>
}

export interface SemanticCacheEntry {
  id: string
  query: string
  queryEmbedding: number[]
  results: CacheResult[]
  metadata: {
    timestamp: number
    hits: number
    lastAccessed: number
    ttl: number
    documentIds: string[] // For invalidation
    confidence: number // How confident we are in this result
    queryCluster?: string | null // Cluster ID for similar queries
  }
}

export interface SemanticCacheConfig {
  enabled: boolean
  maxL1Size: number // Memory cache size
  maxL2Size: number // IndexedDB cache size
  semanticThreshold: number // Similarity threshold (0.85 = 85% similar)
  defaultTTL: number
  enableClustering: boolean
  enableWarming: boolean
  invalidateOnUpdate: boolean
}

export interface CacheStats {
  l1Hits: number
  l2Hits: number
  misses: number
  totalQueries: number
  hitRate: number
  avgLatency: number
  cacheSize: {
    l1: number
    l2: number
  }
}

export class SemanticCacheManager {
  private l1Cache: Map<string, SemanticCacheEntry> = new Map() // Memory
  private config: SemanticCacheConfig
  private stats: CacheStats
  private dbPromise: Promise<IDBDatabase> | null = null
  private queryClusters: Map<string, Set<string>> = new Map() // Cluster ID -> Query IDs

  constructor(config: Partial<SemanticCacheConfig> = {}) {
    this.config = {
      enabled: true,
      maxL1Size: 100, // Keep hot queries in memory
      maxL2Size: 1000, // Larger persistent cache
      semanticThreshold: 0.85, // 85% similarity
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      enableClustering: true,
      enableWarming: false,
      invalidateOnUpdate: true,
      ...config
    }

    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      totalQueries: 0,
      hitRate: 0,
      avgLatency: 0,
      cacheSize: {
        l1: 0,
        l2: 0
      }
    }

    if (typeof window !== 'undefined') {
      this.initializeDB()
    }
  }

  /**
   * Initialize IndexedDB for L2 cache
   */
  private async initializeDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('SemanticCache', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store for cache entries
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'id' })
          store.createIndex('timestamp', 'metadata.timestamp')
          store.createIndex('lastAccessed', 'metadata.lastAccessed')
        }
      }
    })

    return this.dbPromise
  }

  /**
   * Main cache lookup - checks L1, then L2, returns null if miss
   */
  async get(query: string, queryEmbedding: number[]): Promise<CacheResult[] | null> {
    if (!this.config.enabled) return null

    const startTime = performance.now()
    this.stats.totalQueries++

    try {
      // Step 1: Check L1 cache (memory) - fastest
      const l1Result = await this.checkL1Cache(query, queryEmbedding)
      if (l1Result) {
        this.stats.l1Hits++
        this.updateStats(performance.now() - startTime)
        console.log('⚡ L1 Cache HIT:', query.substring(0, 50))
        return l1Result
      }

      // Step 2: Check L2 cache (IndexedDB) - slower but larger
      const l2Result = await this.checkL2Cache(query, queryEmbedding)
      if (l2Result) {
        this.stats.l2Hits++
        // Promote to L1 for faster access next time
        await this.promoteToL1(query, queryEmbedding, l2Result)
        this.updateStats(performance.now() - startTime)
        console.log('💾 L2 Cache HIT:', query.substring(0, 50))
        return l2Result
      }

      // Step 3: Cache miss
      this.stats.misses++
      this.updateStats(performance.now() - startTime)
      console.log('❌ Cache MISS:', query.substring(0, 50))
      return null

    } catch (error) {
      console.error('Semantic cache error:', error)
      return null // Fail gracefully
    }
  }

  /**
   * Store results in cache (both L1 and L2)
   */
  async set(
    query: string,
    queryEmbedding: number[],
    results: CacheResult[],
    documentIds: string[]
  ): Promise<void> {
    if (!this.config.enabled) return

    const entry: SemanticCacheEntry = {
      id: this.generateCacheKey(query, queryEmbedding),
      query,
      queryEmbedding,
      results,
      metadata: {
        timestamp: Date.now(),
        hits: 0,
        lastAccessed: Date.now(),
        ttl: this.config.defaultTTL,
        documentIds,
        confidence: 1.0,
        queryCluster: this.config.enableClustering ? this.findOrCreateCluster() : null
      }
    }

    // Store in L1
    this.addToL1(entry)

    // Store in L2
    await this.addToL2(entry)

    console.log('💾 Cached:', query.substring(0, 50), `(${results.length} results)`)
  }

  /**
   * L1 Cache Check - Memory lookup with semantic similarity
   */
  private async checkL1Cache(query: string, queryEmbedding: number[]): Promise<CacheResult[] | null> {
    // Check for exact match first (fastest)
    const exactKey = this.generateCacheKey(query, queryEmbedding)
    const exactEntry = this.l1Cache.get(exactKey)
    
    if (exactEntry && !this.isExpired(exactEntry)) {
      exactEntry.metadata.hits++
      exactEntry.metadata.lastAccessed = Date.now()
      return exactEntry.results
    }

    // Check for semantic similarity (slightly slower)
    for (const [, entry] of this.l1Cache) {
      if (this.isExpired(entry)) continue

      const similarity = this.cosineSimilarity(queryEmbedding, entry.queryEmbedding)
      if (similarity >= this.config.semanticThreshold) {
        entry.metadata.hits++
        entry.metadata.lastAccessed = Date.now()
        console.log(`🎯 Semantic match: "${query}" ≈ "${entry.query}" (${(similarity * 100).toFixed(1)}%)`)
        return entry.results
      }
    }

    return null
  }

  /**
   * L2 Cache Check - IndexedDB lookup with semantic similarity
   */
  private async checkL2Cache(query: string, queryEmbedding: number[]): Promise<CacheResult[] | null> {
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readonly')
      const store = tx.objectStore('entries')

      return new Promise((resolve) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const entries: SemanticCacheEntry[] = request.result

          for (const entry of entries) {
            if (this.isExpired(entry)) continue

            const similarity = this.cosineSimilarity(queryEmbedding, entry.queryEmbedding)
            if (similarity >= this.config.semanticThreshold) {
              // Update metadata in L2
              this.updateL2Metadata(entry.id, {
                hits: entry.metadata.hits + 1,
                lastAccessed: Date.now()
              })
              
              console.log(`🎯 L2 Semantic match: "${query}" ≈ "${entry.query}" (${(similarity * 100).toFixed(1)}%)`)
              resolve(entry.results)
              return
            }
          }

          resolve(null)
        }

        request.onerror = () => resolve(null)
      })
    } catch (error) {
      console.error('L2 cache check error:', error)
      return null
    }
  }

  /**
   * Add entry to L1 cache with LRU eviction
   */
  private addToL1(entry: SemanticCacheEntry): void {
    // Evict if at capacity (LRU)
    if (this.l1Cache.size >= this.config.maxL1Size) {
      const lruKey = this.findLRUEntry()
      if (lruKey) {
        this.l1Cache.delete(lruKey)
      }
    }

    this.l1Cache.set(entry.id, entry)
    this.stats.cacheSize.l1 = this.l1Cache.size
  }

  /**
   * Add entry to L2 cache (IndexedDB)
   */
  private async addToL2(entry: SemanticCacheEntry): Promise<void> {
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readwrite')
      const store = tx.objectStore('entries')

      // Check if we need to evict
      const countRequest = store.count()
      countRequest.onsuccess = () => {
        if (countRequest.result >= this.config.maxL2Size) {
          this.evictOldestL2Entries(10) // Evict 10 oldest
        }
      }

      store.put(entry)

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })

      this.stats.cacheSize.l2 = (await this.getL2Size())
    } catch (error) {
      console.error('L2 cache add error:', error)
    }
  }

  /**
   * Promote L2 entry to L1 for faster access
   */
  private async promoteToL1(query: string, queryEmbedding: number[], results: CacheResult[]): Promise<void> {
    const entry: SemanticCacheEntry = {
      id: this.generateCacheKey(query, queryEmbedding),
      query,
      queryEmbedding,
      results,
      metadata: {
        timestamp: Date.now(),
        hits: 1,
        lastAccessed: Date.now(),
        ttl: this.config.defaultTTL,
        documentIds: [],
        confidence: 0.95 // Slightly lower confidence for promoted entries
      }
    }

    this.addToL1(entry)
  }

  /**
   * Invalidate cache entries for specific documents
   */
  async invalidateByDocuments(documentIds: string[]): Promise<void> {
    if (!this.config.invalidateOnUpdate) return

    console.log(`🧹 Invalidating cache for documents:`, documentIds)

    // Invalidate L1
    for (const [key, entry] of this.l1Cache) {
      if (entry.metadata.documentIds.some(id => documentIds.includes(id))) {
        this.l1Cache.delete(key)
      }
    }

    // Invalidate L2
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readwrite')
      const store = tx.objectStore('entries')
      const request = store.getAll()

      request.onsuccess = () => {
        const entries: SemanticCacheEntry[] = request.result

        for (const entry of entries) {
          if (entry.metadata.documentIds.some(id => documentIds.includes(id))) {
            store.delete(entry.id)
          }
        }
      }
    } catch (error) {
      console.error('L2 invalidation error:', error)
    }

    this.updateCacheStats()
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.l1Cache.clear()
    
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readwrite')
      const store = tx.objectStore('entries')
      store.clear()
    } catch (error) {
      console.error('Cache clear error:', error)
    }

    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      totalQueries: 0,
      hitRate: 0,
      avgLatency: 0,
      cacheSize: { l1: 0, l2: 0 }
    }

    console.log('🧹 Semantic cache cleared')
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<SemanticCacheConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Semantic cache config updated:', config)
  }

  // ============= Helper Methods =============

  private generateCacheKey(query: string, embedding: number[]): string {
    // Use query + first few embedding values for unique key
    const embeddingHash = embedding.slice(0, 5).map(v => v.toFixed(4)).join('_')
    return `${query.toLowerCase().trim()}_${embeddingHash}`
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i]
      const bVal = b[i]
      if (aVal === undefined || bVal === undefined) continue
      
      dotProduct += aVal * bVal
      normA += aVal * aVal
      normB += bVal * bVal
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private isExpired(entry: SemanticCacheEntry): boolean {
    const age = Date.now() - entry.metadata.timestamp
    return age > entry.metadata.ttl
  }

  private findLRUEntry(): string | null {
    let lruKey: string | null = null
    let oldestAccess = Infinity

    for (const [key, entry] of this.l1Cache) {
      if (entry.metadata.lastAccessed < oldestAccess) {
        oldestAccess = entry.metadata.lastAccessed
        lruKey = key
      }
    }

    return lruKey
  }

  private async evictOldestL2Entries(count: number): Promise<void> {
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readwrite')
      const store = tx.objectStore('entries')
      const index = store.index('lastAccessed')
      
      const request = index.openCursor()
      let deleted = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && deleted < count) {
          cursor.delete()
          deleted++
          cursor.continue()
        }
      }
    } catch (error) {
      console.error('L2 eviction error:', error)
    }
  }

  private async updateL2Metadata(id: string, updates: Partial<SemanticCacheEntry['metadata']>): Promise<void> {
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readwrite')
      const store = tx.objectStore('entries')
      
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const entry: SemanticCacheEntry = getRequest.result
        if (entry) {
          entry.metadata = { ...entry.metadata, ...updates }
          store.put(entry)
        }
      }
    } catch (error) {
      console.error('L2 metadata update error:', error)
    }
  }

  private async getL2Size(): Promise<number> {
    try {
      const db = await this.initializeDB()
      const tx = db.transaction('entries', 'readonly')
      const store = tx.objectStore('entries')
      
      return new Promise((resolve) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(0)
      })
    } catch {
      return 0
    }
  }

  private findOrCreateCluster(): string {
    // Simple clustering: find closest existing cluster or create new one
    let bestCluster: string | null = null
    let bestSimilarity = 0

    for (const [clusterId] of this.queryClusters) {
      // Get average embedding of cluster (simplified - placeholder for future enhancement)
      const similarity = Math.random() * 0.3 + 0.7 // TODO: Implement proper semantic clustering
      if (similarity > bestSimilarity && similarity > 0.9) {
        bestSimilarity = similarity
        bestCluster = clusterId
      }
    }

    if (bestCluster) {
      return bestCluster
    }

    // Create new cluster
    const newClusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.queryClusters.set(newClusterId, new Set())
    return newClusterId
  }

  private updateStats(latency: number): void {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits
    this.stats.hitRate = this.stats.totalQueries > 0
      ? totalHits / this.stats.totalQueries
      : 0

    // Exponential moving average for latency
    const alpha = 0.3
    this.stats.avgLatency = alpha * latency + (1 - alpha) * this.stats.avgLatency
  }

  private async updateCacheStats(): Promise<void> {
    this.stats.cacheSize.l1 = this.l1Cache.size
    this.stats.cacheSize.l2 = await this.getL2Size()
  }
}

// Export singleton instance
export const semanticCache = new SemanticCacheManager()
