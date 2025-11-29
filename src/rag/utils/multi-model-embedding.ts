"use client"

/**
 * Priority 2: Multi-Model Embedding Ensemble
 * 
 * Advanced embedding system that combines multiple embedding models
 * for superior semantic understanding and search accuracy.
 */

// Simple debug logger
const debugLogger = {
  log: (message: string, ...args: unknown[]) => console.log(`[MultiModel] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[MultiModel] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[MultiModel] ${message}`, ...args)
}

// Mock llama client for embedding generation
const llamaClient = {
  async generateEmbedding(text: string, options?: { model?: string }): Promise<{ embedding: number[] }> {
    // Simulate embedding generation with random vectors (for development)
    const dimension = 1536 // Common embedding dimension
    const embedding = Array.from({ length: dimension }, () => Math.random() - 0.5)
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    debugLogger.log(`Generated mock embedding for text: "${text.substring(0, 50)}..." using model: ${options?.model || 'default'}`)
    
    return { embedding }
  }
}

// Enhanced embedding interface that supports multiple models
export interface MultiModelEmbedding {
  primary: number[]      // Primary model embedding (e.g., nomic-embed-text)
  semantic: number[]     // Semantic model embedding (e.g., all-MiniLM-L6-v2)
  domain?: number[]      // Domain-specific model embedding (optional)
  composite: number[]    // Weighted composite embedding
  metadata: {
    models: string[]
    weights: number[]
    timestamp: number
    quality: number
  }
}

export interface EmbeddingModelConfig {
  name: string
  model: string
  weight: number
  enabled: boolean
  specialization?: 'general' | 'semantic' | 'domain' | 'code' | 'scientific'
}

export interface EnsembleConfig {
  models: EmbeddingModelConfig[]
  compositeStrategy: 'weighted_average' | 'max_pooling' | 'attention_fusion'
  qualityThreshold: number
  fallbackModel: string
}

export class MultiModelEmbeddingEnsemble {
  private config: EnsembleConfig
  private modelCache: Map<string, boolean> = new Map()
  
  constructor(config?: Partial<EnsembleConfig>) {
    this.config = {
      models: [
        {
          name: 'nomic-embed-text',
          model: 'nomic-embed-text',
          weight: 0.5,
          enabled: true,
          specialization: 'general'
        },
        {
          name: 'all-MiniLM-L6-v2', 
          model: 'all-MiniLM-L6-v2',
          weight: 0.3,
          enabled: true,
          specialization: 'semantic'
        },
        {
          name: 'text-embedding-ada-002',
          model: 'text-embedding-ada-002', 
          weight: 0.2,
          enabled: false, // Enable when OpenAI API is available
          specialization: 'domain'
        }
      ],
      compositeStrategy: 'weighted_average',
      qualityThreshold: 0.7,
      fallbackModel: 'nomic-embed-text',
      ...config
    }
  }

  /**
   * Generate multi-model ensemble embeddings
   */
  async generateEnsembleEmbedding(text: string): Promise<MultiModelEmbedding> {
    const startTime = Date.now()
    
    try {
      const enabledModels = this.config.models.filter(m => m.enabled)
      
      if (enabledModels.length === 0) {
        throw new Error('No embedding models enabled')
      }

      // Generate embeddings from multiple models in parallel
      const embeddingResults = await Promise.allSettled(
        enabledModels.map(async (modelConfig) => {
          try {
            const embedding = await this.generateSingleEmbedding(text, modelConfig.model)
            return {
              modelName: modelConfig.name,
              embedding,
              weight: modelConfig.weight,
              specialization: modelConfig.specialization
            }
          } catch (error) {
            debugLogger.error(`Failed to generate embedding with ${modelConfig.name}:`, error)
            throw error
          }
        })
      )

      // Filter successful embeddings
      const successfulEmbeddings = embeddingResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<{
          modelName: string
          embedding: number[]
          weight: number
          specialization?: 'general' | 'semantic' | 'domain' | 'code' | 'scientific'
        }>).value)

      if (successfulEmbeddings.length === 0) {
        // Fallback to single model
        const fallbackEmbedding = await this.generateSingleEmbedding(text, this.config.fallbackModel)
        return this.createFallbackMultiModelEmbedding(fallbackEmbedding)
      }

      // Create ensemble embedding
      const multiModelEmbedding = this.createEnsembleEmbedding(successfulEmbeddings, text)
      
      const endTime = Date.now()
      debugLogger.log(`✅ Multi-model embedding generated in ${endTime - startTime}ms using ${successfulEmbeddings.length} models`)
      
      return multiModelEmbedding

    } catch (error) {
      debugLogger.error('❌ Multi-model embedding generation failed:', error)
      
      // Ultimate fallback
      try {
        const fallbackEmbedding = await this.generateSingleEmbedding(text, this.config.fallbackModel)
        return this.createFallbackMultiModelEmbedding(fallbackEmbedding)
      } catch {
        throw new Error(`All embedding models failed: ${error}`)
      }
    }
  }

  /**
   * Generate embedding from a single model
   */
  private async generateSingleEmbedding(text: string, model: string): Promise<number[]> {
    try {
      // Check if model is available (with caching)
      if (!this.modelCache.has(model)) {
        // TODO: Add model availability check
        this.modelCache.set(model, true)
      }

      if (!this.modelCache.get(model)) {
        throw new Error(`Model ${model} is not available`)
      }

      // Generate embedding using the appropriate client
      if (model.includes('nomic') || model.includes('llama') || model.includes('all-MiniLM')) {
        const response = await llamaClient.generateEmbedding(text, { model })
        return response.embedding
      } else {
        // Handle other embedding providers (OpenAI, Cohere, etc.)
        throw new Error(`Unsupported model: ${model}`)
      }

    } catch (error) {
      debugLogger.error(`Failed to generate embedding with model ${model}:`, error)
      throw error
    }
  }

  /**
   * Create ensemble embedding from multiple model results
   */
  private createEnsembleEmbedding(
    embeddingResults: Array<{
      modelName: string
      embedding: number[]
      weight: number
      specialization?: string
    }>,
    originalText: string
  ): MultiModelEmbedding {
    // Normalize weights
    const totalWeight = embeddingResults.reduce((sum, result) => sum + result.weight, 0)
    const normalizedResults = embeddingResults.map(result => ({
      ...result,
      normalizedWeight: result.weight / totalWeight
    }))

    // Get embedding dimension (assume all models have same dimension)
    const dimension = embeddingResults[0].embedding.length
    
    // Create composite embedding using the specified strategy
    let composite: number[]
    
    switch (this.config.compositeStrategy) {
      case 'weighted_average':
        composite = this.createWeightedAverage(normalizedResults, dimension)
        break
      case 'max_pooling':
        composite = this.createMaxPooling(normalizedResults, dimension)
        break
      case 'attention_fusion':
        composite = this.createAttentionFusion(normalizedResults, dimension, originalText)
        break
      default:
        composite = this.createWeightedAverage(normalizedResults, dimension)
    }

    // Normalize the composite embedding
    composite = this.normalizeVector(composite)

    // Extract individual embeddings for the interface
    const primaryModel = normalizedResults.find(r => r.specialization === 'general') || normalizedResults[0]
    const semanticModel = normalizedResults.find(r => r.specialization === 'semantic')
    const domainModel = normalizedResults.find(r => r.specialization === 'domain')

    // Calculate quality score based on model diversity and performance
    const quality = this.calculateEmbeddingQuality(normalizedResults, composite)

    return {
      primary: primaryModel.embedding,
      semantic: semanticModel?.embedding || primaryModel.embedding,
      domain: domainModel?.embedding,
      composite,
      metadata: {
        models: normalizedResults.map(r => r.modelName),
        weights: normalizedResults.map(r => r.normalizedWeight),
        timestamp: Date.now(),
        quality
      }
    }
  }

  /**
   * Create weighted average composite embedding
   */
  private createWeightedAverage(
    results: Array<{ embedding: number[]; normalizedWeight: number }>,
    dimension: number
  ): number[] {
    const composite = new Array(dimension).fill(0)
    
    for (const result of results) {
      for (let i = 0; i < dimension; i++) {
        composite[i] += result.embedding[i] * result.normalizedWeight
      }
    }
    
    return composite
  }

  /**
   * Create max pooling composite embedding
   */
  private createMaxPooling(
    results: Array<{ embedding: number[]; normalizedWeight: number }>,
    dimension: number
  ): number[] {
    const composite = new Array(dimension).fill(-Infinity)
    
    for (const result of results) {
      for (let i = 0; i < dimension; i++) {
        composite[i] = Math.max(composite[i], result.embedding[i])
      }
    }
    
    return composite
  }

  /**
   * Create attention-based fusion composite embedding
   */
  private createAttentionFusion(
    results: Array<{ embedding: number[]; normalizedWeight: number; specialization?: string }>,
    dimension: number,
    originalText: string
  ): number[] {
    // Simple attention mechanism based on text characteristics
    const wordCount = originalText.split(/\s+/).length
    const hasCode = /[{}();]/.test(originalText)
    const hasNumbers = /\d/.test(originalText)
    
    // Adjust weights based on text characteristics
    const adjustedResults = results.map(result => {
      let attentionWeight = result.normalizedWeight
      
      // Boost certain models based on content type
      if (result.specialization === 'code' && hasCode) {
        attentionWeight *= 1.3
      } else if (result.specialization === 'semantic' && wordCount > 50) {
        attentionWeight *= 1.2
      } else if (result.specialization === 'domain' && hasNumbers) {
        attentionWeight *= 1.1
      }
      
      return { ...result, attentionWeight }
    })
    
    // Renormalize attention weights
    const totalAttention = adjustedResults.reduce((sum, r) => sum + r.attentionWeight, 0)
    
    // Create attention-weighted composite
    const composite = new Array(dimension).fill(0)
    for (const result of adjustedResults) {
      const normalizedAttention = result.attentionWeight / totalAttention
      for (let i = 0; i < dimension; i++) {
        composite[i] += result.embedding[i] * normalizedAttention
      }
    }
    
    return composite
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }

  /**
   * Calculate embedding quality score
   */
  private calculateEmbeddingQuality(
    results: Array<{ modelName: string; embedding: number[]; normalizedWeight: number }>,
    composite: number[]
  ): number {
    // Factor 1: Model diversity (more models = higher quality)
    const diversityScore = Math.min(results.length / 3, 1) * 0.3
    
    // Factor 2: Weight distribution (more balanced = higher quality)
    const entropy = -results.reduce((sum, r) => {
      const p = r.normalizedWeight
      return sum + (p > 0 ? p * Math.log2(p) : 0)
    }, 0)
    const maxEntropy = Math.log2(results.length)
    const balanceScore = (entropy / maxEntropy) * 0.3
    
    // Factor 3: Composite vector magnitude (should be close to 1 after normalization)
    const magnitude = Math.sqrt(composite.reduce((sum, val) => sum + val * val, 0))
    const magnitudeScore = Math.max(0, 1 - Math.abs(1 - magnitude)) * 0.2
    
    // Factor 4: Base quality (successful generation)
    const baseScore = 0.2
    
    return Math.min(diversityScore + balanceScore + magnitudeScore + baseScore, 1)
  }

  /**
   * Create fallback multi-model embedding from single embedding
   */
  private createFallbackMultiModelEmbedding(
    embedding: number[]
  ): MultiModelEmbedding {
    return {
      primary: embedding,
      semantic: embedding,
      composite: embedding,
      metadata: {
        models: [this.config.fallbackModel],
        weights: [1.0],
        timestamp: Date.now(),
        quality: 0.5 // Lower quality for fallback
      }
    }
  }

  /**
   * Calculate similarity between two multi-model embeddings
   */
  static calculateEnsembleSimilarity(
    embedding1: MultiModelEmbedding,
    embedding2: MultiModelEmbedding,
    strategy: 'composite' | 'weighted_combination' | 'best_match' = 'composite'
  ): number {
    switch (strategy) {
      case 'composite':
        return this.cosineSimilarity(embedding1.composite, embedding2.composite)
        
      case 'weighted_combination':
        const primarySim = this.cosineSimilarity(embedding1.primary, embedding2.primary) * 0.5
        const semanticSim = this.cosineSimilarity(embedding1.semantic, embedding2.semantic) * 0.3
        const domainSim = embedding1.domain && embedding2.domain 
          ? this.cosineSimilarity(embedding1.domain, embedding2.domain) * 0.2 
          : 0
        return primarySim + semanticSim + domainSim
        
      case 'best_match':
        const similarities = [
          this.cosineSimilarity(embedding1.primary, embedding2.primary),
          this.cosineSimilarity(embedding1.semantic, embedding2.semantic)
        ]
        if (embedding1.domain && embedding2.domain) {
          similarities.push(this.cosineSimilarity(embedding1.domain, embedding2.domain))
        }
        return Math.max(...similarities)
        
      default:
        return this.cosineSimilarity(embedding1.composite, embedding2.composite)
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<EnsembleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.modelCache.clear() // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  getConfig(): EnsembleConfig {
    return { ...this.config }
  }

  /**
   * Test model availability
   */
  async testModelAvailability(): Promise<Record<string, boolean>> {
    const availability: Record<string, boolean> = {}
    
    for (const model of this.config.models) {
      try {
        await this.generateSingleEmbedding('test', model.model)
        availability[model.name] = true
        this.modelCache.set(model.model, true)
      } catch {
        availability[model.name] = false
        this.modelCache.set(model.model, false)
      }
    }
    
    return availability
  }
}

// Export singleton instance
export const multiModelEmbeddingEnsemble = new MultiModelEmbeddingEnsemble()

// Export convenience function
export async function generateEnsembleEmbedding(text: string): Promise<MultiModelEmbedding> {
  return multiModelEmbeddingEnsemble.generateEnsembleEmbedding(text)
}
