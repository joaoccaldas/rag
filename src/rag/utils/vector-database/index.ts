/**
 * Vector Database Abstraction Layer
 * 
 * This module provides a unified interface for different vector database implementations.
 * Currently supports IndexedDB (browser) and can be extended for Chroma, Pinecone, etc.
 * 
 * Why: Current IndexedDB implementation has performance limitations for large-scale operations.
 * This abstraction allows easy migration to enterprise vector databases.
 */

export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata: {
    documentId: string
    chunkId: string
    title: string
    type: string
    keywords: string[]
    timestamp: Date
    sourceFile?: string
    pageNumber?: number
  }
}

export interface SearchQuery {
  vector: number[]
  limit?: number
  threshold?: number
  filters?: Record<string, string | number | boolean>
  includeMetadata?: boolean
}

export interface SearchResult {
  document: VectorDocument
  similarity: number
  relevantText?: string
}

export interface VectorDatabaseConfig {
  type: 'indexeddb' | 'chroma' | 'pinecone' | 'weaviate'
  connectionString?: string
  apiKey?: string
  collectionName?: string
  dimensions?: number
}

export abstract class BaseVectorDatabase {
  protected config: VectorDatabaseConfig

  constructor(config: VectorDatabaseConfig) {
    this.config = config
  }

  abstract initialize(): Promise<void>
  abstract addDocuments(documents: VectorDocument[]): Promise<void>
  abstract search(query: SearchQuery): Promise<SearchResult[]>
  abstract deleteDocument(id: string): Promise<void>
  abstract updateDocument(document: VectorDocument): Promise<void>
  abstract getStats(): Promise<{ count: number; collections: string[] }>
  abstract close(): Promise<void>
}

// Factory pattern for database creation
export class VectorDatabaseFactory {
  static async create(config: VectorDatabaseConfig): Promise<BaseVectorDatabase> {
    switch (config.type) {
      case 'indexeddb':
        const { IndexedDBVectorDatabase } = await import('./indexeddb-adapter')
        return new IndexedDBVectorDatabase(config)
      case 'chroma':
        const { ChromaVectorDatabase } = await import('./chroma-adapter')
        return new ChromaVectorDatabase(config)
      default:
        throw new Error(`Unsupported vector database type: ${config.type}`)
    }
  }
}

// Singleton pattern for global database instance
export class VectorDatabaseManager {
  private static instance: BaseVectorDatabase | null = null
  private static config: VectorDatabaseConfig | null = null

  static async getInstance(config?: VectorDatabaseConfig): Promise<BaseVectorDatabase> {
    if (!this.instance || (config && JSON.stringify(config) !== JSON.stringify(this.config))) {
      if (this.instance) {
        await this.instance.close()
      }
      
      this.config = config || {
        type: 'indexeddb',
        collectionName: 'miele_rag_vectors',
        dimensions: 384 // nomic-embed-text dimensions
      }
      
      this.instance = await VectorDatabaseFactory.create(this.config)
      await this.instance.initialize()
    }
    
    return this.instance
  }

  static async closeConnection(): Promise<void> {
    if (this.instance) {
      await this.instance.close()
      this.instance = null
      this.config = null
    }
  }
}
