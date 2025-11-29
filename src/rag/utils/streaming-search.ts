"use client"

/**
 * Real-Time Streaming Search Implementation
 * 
 * Provides progressive, streaming search results that appear as they're found,
 * dramatically improving perceived performance and user experience.
 */

import { Document, SearchResult, DocumentChunk } from '../types'
import { calculateSimilarity } from './document-processing'

export interface StreamingSearchOptions {
  query: string
  documents: Document[]
  maxResults?: number
  threshold?: number
  batchSize?: number
  streamDelay?: number
}

export interface StreamingSearchResult {
  result: SearchResult
  progress: number
  totalProcessed: number
  isComplete: boolean
}

export type StreamingCallback = (result: StreamingSearchResult) => void

export class StreamingSearchEngine {
  private abortController: AbortController | null = null
  private isSearching = false

  /**
   * Execute streaming search with progressive results
   */
  async streamSearch(
    options: StreamingSearchOptions,
    onResult: StreamingCallback
  ): Promise<void> {
    const {
      query,
      documents,
      maxResults = 20,
      threshold = 0.3,
      batchSize = 3,
      streamDelay = 50
    } = options

    if (this.isSearching) {
      this.abort()
    }

    this.isSearching = true
    this.abortController = new AbortController()

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query)
      if (this.abortController.signal.aborted) return

      const allResults: SearchResult[] = []
      let processedCount = 0
      const totalDocuments = documents.length

      // Process documents in batches for streaming effect
      for (let i = 0; i < documents.length; i += batchSize) {
        if (this.abortController.signal.aborted) break

        const batch = documents.slice(i, i + batchSize)
        const batchResults = await this.processBatch(
          batch,
          queryEmbedding,
          query,
          threshold
        )

        // Add new results and sort by relevance
        allResults.push(...batchResults)
        allResults.sort((a, b) => b.similarity - a.similarity)

        processedCount += batch.length

        // Stream the best result from this batch if we found any
        if (batchResults.length > 0) {
          const bestResult = batchResults.reduce((best, current) => 
            current.similarity > best.similarity ? current : best
          )

          onResult({
            result: bestResult,
            progress: (processedCount / totalDocuments) * 100,
            totalProcessed: processedCount,
            isComplete: false
          })
        }

        // Small delay to create streaming effect and prevent UI blocking
        await this.delay(streamDelay)
      }

      // Send final consolidated results
      const finalResults = allResults.slice(0, maxResults)
      for (const result of finalResults) {
        if (this.abortController.signal.aborted) break
        
        onResult({
          result,
          progress: 100,
          totalProcessed: totalDocuments,
          isComplete: processedCount >= totalDocuments
        })
        
        await this.delay(20) // Quick final streaming
      }

    } catch (error) {
      if (!this.abortController?.signal.aborted) {
        console.error('Streaming search error:', error)
        throw error
      }
    } finally {
      this.isSearching = false
      this.abortController = null
    }
  }

  /**
   * Process a batch of documents for search
   */
  private async processBatch(
    documents: Document[],
    queryEmbedding: number[],
    query: string,
    threshold: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    for (const doc of documents) {
      if (this.abortController?.signal.aborted) break

      // Search in document chunks
      if (doc.chunks) {
        for (const chunk of doc.chunks) {
          if (chunk.embedding) {
            const similarity = calculateSimilarity(queryEmbedding, chunk.embedding)
            
            if (similarity >= threshold) {
              results.push({
                id: chunk.id,
                content: chunk.content,
                score: similarity,
                metadata: chunk.metadata as Record<string, unknown>,
                chunk: chunk,
                document: doc,
                similarity,
                relevantText: this.highlightMatches(chunk.content, query)
              })
            }
          }
        }
      }

      // Search in document-level content
      if (doc.embedding) {
        const similarity = calculateSimilarity(queryEmbedding, doc.embedding)
        
        if (similarity >= threshold) {
          // Create a dummy chunk for document-level results
          const docChunk: DocumentChunk = {
            id: `doc_${doc.id}`,
            documentId: doc.id,
            content: doc.content.substring(0, 500),
            startIndex: 0,
            endIndex: 500,
            metadata: {}
          }

          results.push({
            id: docChunk.id,
            content: docChunk.content,
            score: similarity,
            metadata: docChunk.metadata as Record<string, unknown>,
            chunk: docChunk,
            document: doc,
            similarity,
            relevantText: this.highlightMatches(doc.content.substring(0, 500), query)
          })
        }
      }
    }

    return results
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text:latest',
          prompt: query
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.embedding || []
      }
    } catch {
      console.warn('Failed to generate query embedding, using fallback')
    }

    // Fallback to simple hash-based embedding
    return this.generateFallbackEmbedding(query)
  }

  /**
   * Generate fallback embedding for query
   */
  private generateFallbackEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      const pos = Math.abs(hash) % embedding.length
      embedding[pos] += 1 / (index + 1)
    })

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding
  }

  /**
   * Simple hash function for fallback embedding
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  /**
   * Highlight query matches in content
   */
  private highlightMatches(content: string, query: string): string {
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    let highlighted = content

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })

    return highlighted
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Abort current search
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.isSearching = false
    }
  }

  /**
   * Check if currently searching
   */
  get searching(): boolean {
    return this.isSearching
  }
}

// Export singleton instance
export const streamingSearchEngine = new StreamingSearchEngine()
