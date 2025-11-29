/**
 * Semantic Cache Wrapper
 * 
 * NON-BREAKING wrapper around existing QueryCacheManager.
 * Adds semantic caching layer on top of existing cache system.
 * 
 * Usage:
 *   const cache = new SemanticCacheWrapper()
 *   
 *   // Check cache before search
 *   const cached = await cache.get(query, embedding)
 *   if (cached) return cached
 *   
 *   // After search, store results
 *   await cache.set(query, embedding, results, documentIds)
 */

import { semanticCache, type CacheResult } from './semantic-cache'
import type { QueryCacheManager } from './query-cache'

export interface SemanticCacheWrapperConfig {
  enableSemanticCache: boolean
  useLegacyCache: boolean // Keep using QueryCacheManager alongside new cache
  preferSemanticCache: boolean // Try semantic cache first
}

export class SemanticCacheWrapper {
  private config: SemanticCacheWrapperConfig
  private legacyCache: QueryCacheManager | undefined

  constructor(
    legacyCache?: QueryCacheManager,
    config: Partial<SemanticCacheWrapperConfig> = {}
  ) {
    this.legacyCache = legacyCache
    this.config = {
      enableSemanticCache: true,
      useLegacyCache: true,
      preferSemanticCache: true,
      ...config
    }

    console.log('🚀 Semantic Cache Wrapper initialized:', {
      semanticEnabled: this.config.enableSemanticCache,
      legacyEnabled: this.config.useLegacyCache,
      preference: this.config.preferSemanticCache ? 'semantic' : 'legacy'
    })
  }

  /**
   * Get cached results - tries semantic cache, falls back to legacy
   */
  async get(
    query: string,
    queryEmbedding: number[]
  ): Promise<CacheResult[] | null> {
    const startTime = performance.now()

    try {
      // Try semantic cache first if preferred and enabled
      if (this.config.enableSemanticCache && this.config.preferSemanticCache) {
        const semanticResults = await semanticCache.get(query, queryEmbedding)
        if (semanticResults && semanticResults.length > 0) {
          console.log(`✨ Semantic cache hit (${(performance.now() - startTime).toFixed(2)}ms)`)
          return semanticResults
        }
      }

      // Try legacy cache if enabled
      if (this.config.useLegacyCache && this.legacyCache) {
        const legacyResults = await this.legacyCache.getCachedResults(
          query,
          queryEmbedding
        )
        if (legacyResults && legacyResults.length > 0) {
          console.log(`🔄 Legacy cache hit (${(performance.now() - startTime).toFixed(2)}ms)`)
          
          // Convert legacy results to CacheResult format
          const converted = this.convertLegacyResults(legacyResults)
          
          // Store in semantic cache for next time
          if (this.config.enableSemanticCache) {
            await semanticCache.set(query, queryEmbedding, converted, [])
          }
          
          return converted
        }
      }

      // Try semantic cache if not preferred but still enabled
      if (this.config.enableSemanticCache && !this.config.preferSemanticCache) {
        const semanticResults = await semanticCache.get(query, queryEmbedding)
        if (semanticResults && semanticResults.length > 0) {
          console.log(`✨ Semantic cache hit (${(performance.now() - startTime).toFixed(2)}ms)`)
          return semanticResults
        }
      }

      console.log(`❌ Cache miss (${(performance.now() - startTime).toFixed(2)}ms)`)
      return null

    } catch (error) {
      console.error('Cache get error:', error)
      return null // Fail gracefully
    }
  }

  /**
   * Store results in cache (both semantic and legacy if enabled)
   */
  async set(
    query: string,
    queryEmbedding: number[],
    results: CacheResult[],
    documentIds: string[]
  ): Promise<void> {
    try {
      // Store in semantic cache
      if (this.config.enableSemanticCache) {
        await semanticCache.set(query, queryEmbedding, results, documentIds)
      }

      // Store in legacy cache
      if (this.config.useLegacyCache && this.legacyCache) {
        // Legacy cache needs specific format with all required fields
        const legacyFormat = results.map(r => ({
          documentId: r.id,
          chunkId: r.id,
          content: r.content,
          similarity: r.score,
          title: (r.metadata?.['title'] as string) ?? '',
          type: (r.metadata?.['type'] as string) ?? 'document',
          keywords: (r.metadata?.['keywords'] as string[]) ?? []
        }))
        
        // Legacy cache signature: cacheResults(query, queryVector, results, responseTime, params?)
        await this.legacyCache.cacheResults(query, queryEmbedding, legacyFormat, 0)
      }

      console.log(`💾 Cached: "${query.substring(0, 50)}..." (${results.length} results)`)

    } catch (error) {
      console.error('Cache set error:', error)
      // Continue without cache
    }
  }

  /**
   * Invalidate cache entries for specific documents
   */
  async invalidateByDocuments(documentIds: string[]): Promise<void> {
    try {
      if (this.config.enableSemanticCache) {
        await semanticCache.invalidateByDocuments(documentIds)
      }

      if (this.config.useLegacyCache && this.legacyCache) {
        // Legacy cache doesn't have document-based invalidation,
        // so we clear all to be safe
        await this.legacyCache.clearCache()
      }

      console.log('🧹 Invalidated cache for documents:', documentIds)
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      if (this.config.enableSemanticCache) {
        await semanticCache.clear()
      }

      if (this.config.useLegacyCache && this.legacyCache) {
        await this.legacyCache.clearCache()
      }

      console.log('🧹 All caches cleared')
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get combined statistics from both caches
   */
  getStats() {
    const semanticStats = this.config.enableSemanticCache
      ? semanticCache.getStats()
      : null

    const legacyStats = this.legacyCache?.getAnalytics()

    return {
      semantic: semanticStats,
      legacy: legacyStats,
      combined: {
        totalHits: (semanticStats?.l1Hits ?? 0) + (semanticStats?.l2Hits ?? 0) + (legacyStats?.cacheHits ?? 0),
        totalMisses: (semanticStats?.misses ?? 0) + (legacyStats?.cacheMisses ?? 0),
        hitRate: semanticStats?.hitRate ?? 0
      }
    }
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<SemanticCacheWrapperConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Cache wrapper config updated:', config)
  }

  // ============= Helper Methods =============

  /**
   * Convert legacy cache results to new CacheResult format
   */
  private convertLegacyResults(legacyResults: unknown[]): CacheResult[] {
    return legacyResults.map((result, index) => {
      // Legacy results might have different structure
      const resultObj = result as Record<string, unknown>
      
      return {
        id: (resultObj['id'] as string) ?? `legacy_${index}`,
        score: (resultObj['score'] as number) ?? 0,
        content: (resultObj['content'] as string) ?? JSON.stringify(result),
        metadata: (resultObj['metadata'] as Record<string, unknown>) ?? {}
      }
    })
  }

  /**
   * Convert CacheResult to legacy format
   */
  private convertToLegacyFormat(results: CacheResult[]): unknown[] {
    // Legacy cache expects array of any
    return results.map(result => ({
      id: result.id,
      score: result.score,
      content: result.content,
      metadata: result.metadata
    }))
  }
}

/**
 * Create wrapper with automatic legacy cache detection
 */
export async function createSemanticCacheWrapper(
  config?: Partial<SemanticCacheWrapperConfig>
): Promise<SemanticCacheWrapper> {
  let legacyCache: QueryCacheManager | undefined

  // Try to import and create legacy cache if enabled
  if (config?.useLegacyCache !== false) {
    try {
      const { QueryCacheManager } = await import('./query-cache')
      legacyCache = new QueryCacheManager()
      console.log('✅ Legacy cache imported successfully')
    } catch (error) {
      console.warn('⚠️ Could not import legacy cache:', error)
    }
  }

  return new SemanticCacheWrapper(legacyCache, config)
}
