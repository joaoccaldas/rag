/**
 * Example: Integrating Semantic Cache into RAG Pipeline
 * 
 * This example shows how to add semantic caching to your RAG pipeline
 * WITHOUT breaking any existing functionality.
 */

import { createSemanticCacheWrapper } from './semantic-cache-wrapper'
import type { CacheResult } from './semantic-cache'

// ============= Example 1: Basic Integration =============

export async function searchWithSemanticCache(query: string) {
  // Initialize cache (do this once, store in component state or context)
  const cache = await createSemanticCacheWrapper({
    enableSemanticCache: true,
    useLegacyCache: true,  // Keep legacy cache as backup
    preferSemanticCache: true
  })

  // Step 1: Generate query embedding
  const embedding = await generateQueryEmbedding(query)

  // Step 2: Check cache BEFORE expensive search
  const cached = await cache.get(query, embedding)
  
  if (cached) {
    return cached
  }

  // Step 3: Cache miss - perform actual search
  const results = await performExpensiveSearch(query)

  // Step 4: Store in cache for next time
  const documentIds = results.map(r => r.id)
  await cache.set(query, embedding, results, documentIds)

  return results
}

// ============= Example 2: SearchContext Integration =============

export async function createSearchContext() {
  // Initialize cache once
  const cache = await createSemanticCacheWrapper()

  const searchDocuments = async (query: string) => {
    
    try {
      // Generate embedding
      const embedding = await generateQueryEmbedding(query)
      
      // Check cache first
      const cached = await cache.get(query, embedding)
      if (cached) {
        return cached
      }
      
      // Perform search
      const results = await performExpensiveSearch(query)
      
      // Cache results
      const documentIds = results.map(r => r.id)
      await cache.set(query, embedding, results, documentIds)
      
      return results
      
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  return { searchDocuments, cache }
}

// ============= Example 3: RAG Pipeline Integration =============

export class SemanticRAGPipeline {
  private cache: Awaited<ReturnType<typeof createSemanticCacheWrapper>> | null = null

  async initialize() {
    
    // Initialize semantic cache
    this.cache = await createSemanticCacheWrapper({
      enableSemanticCache: true,
      useLegacyCache: true,
      preferSemanticCache: true
    })

  }

  async query(userQuery: string) {
    if (!this.cache) {
      throw new Error('Pipeline not initialized. Call initialize() first.')
    }

    const startTime = performance.now()

    try {
      // Step 1: Generate embedding
      const embedding = await generateQueryEmbedding(userQuery)

      // Step 2: Check cache
      const cached = await this.cache.get(userQuery, embedding)
      
      if (cached) {
        const duration = performance.now() - startTime
        return this.formatResults(cached)
      }

      // Step 3: Execute full RAG pipeline
      const results = await this.executeFullPipeline(userQuery)

      // Step 4: Cache results
      const documentIds = results.map(r => r.id)
      await this.cache.set(userQuery, embedding, results, documentIds)

      const duration = performance.now() - startTime

      return this.formatResults(results)

    } catch (error) {
      console.error('❌ Pipeline error:', error)
      throw error
    }
  }

  async invalidateDocuments(documentIds: string[]) {
    if (!this.cache) return

    await this.cache.invalidateByDocuments(documentIds)
  }

  getStats() {
    if (!this.cache) return null
    return this.cache.getStats()
  }

  private async executeFullPipeline(query: string) {
    // Your existing RAG pipeline logic here
    // This is where the expensive operations happen:
    // - Document retrieval
    // - Reranking
    // - LLM generation
    // - etc.
    
    
    // Placeholder - replace with actual pipeline
    return await performExpensiveSearch(query)
  }

  private formatResults(results: CacheResult[]) {
    return results.map(r => ({
      id: r.id,
      content: r.content,
      score: r.score,
      metadata: r.metadata
    }))
  }
}

// ============= Example 4: Document Update Handler =============

export async function handleDocumentUpdate(documentIds: string[]) {
  
  // Get cache instance
  const cache = await createSemanticCacheWrapper()
  
  // Invalidate affected cache entries
  await cache.invalidateByDocuments(documentIds)
  
}

// ============= Example 5: Analytics Dashboard =============

export async function getCacheAnalytics() {
  const cache = await createSemanticCacheWrapper()
  const stats = cache.getStats()

  const analytics = {
    semantic: {
      l1Hits: stats.semantic?.l1Hits ?? 0,
      l2Hits: stats.semantic?.l2Hits ?? 0,
      misses: stats.semantic?.misses ?? 0,
      totalQueries: stats.semantic?.totalQueries ?? 0,
      hitRate: stats.semantic?.hitRate ?? 0,
      avgLatency: stats.semantic?.avgLatency ?? 0,
      cacheSize: stats.semantic?.cacheSize ?? { l1: 0, l2: 0 }
    },
    legacy: {
      hits: stats.legacy?.cacheHits ?? 0,
      misses: stats.legacy?.cacheMisses ?? 0,
      hitRate: stats.legacy?.hitRate ?? 0
    },
    combined: {
      totalHits: stats.combined.totalHits,
      totalMisses: stats.combined.totalMisses,
      hitRate: stats.combined.hitRate
    }
  }


  return analytics
}

// ============= Example 6: Configuration Toggle =============

export async function toggleSemanticCache(enabled: boolean) {
  const cache = await createSemanticCacheWrapper()
  
  cache.updateConfig({
    enableSemanticCache: enabled,
    useLegacyCache: !enabled  // Use legacy when semantic disabled
  })

}

// ============= Helper Functions =============

async function generateQueryEmbedding(query: string): Promise<number[]> {
  // Replace with your actual embedding generation
  // Example using Ollama:
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: query
    })
  })
  
  const data = await response.json()
  return data.embedding
}

async function performExpensiveSearch(
  query: string
): Promise<CacheResult[]> {
  // Simulate expensive search operation
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Replace with your actual search logic
  return [
    {
      id: 'doc-1',
      score: 0.95,
      content: `Result for query: ${query}`,
      metadata: {
        title: 'Document 1',
        type: 'article',
        keywords: ['test', 'example']
      }
    }
  ]
}

// ============= Example Usage =============

export async function exampleUsage() {

  // Example 1: Simple search with caching
  const results1 = await searchWithSemanticCache('How do I reset my password?')

  // Example 2: Similar query should hit cache
  const results2 = await searchWithSemanticCache('password reset instructions')

  // Example 3: RAG Pipeline
  const pipeline = new SemanticRAGPipeline()
  await pipeline.initialize()
  const answer = await pipeline.query('What is the refund policy?')

  // Example 4: Analytics
  await getCacheAnalytics()

  // Example 5: Document update
  await handleDocumentUpdate(['doc-1', 'doc-2'])

}

// Uncomment to run examples:
// exampleUsage().catch(console.error)
