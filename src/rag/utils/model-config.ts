/**
 * Enhanced Model Configuration with GPT-OSS Support
 * Centralizes model management and ensures compatibility
 */

export interface ModelInfo {
  name: string
  displayName: string
  type: 'chat' | 'embedding' | 'instruction'
  size: string
  capabilities: {
    chat: boolean
    analysis: boolean
    embedding: boolean
    reasoning: boolean
  }
  performance: {
    speed: 'fast' | 'medium' | 'slow'
    quality: 'high' | 'medium' | 'low'
    memory: string
  }
  compatibility: {
    embeddings: boolean
    vectorSearch: boolean
    aiAnalysis: boolean
    streaming: boolean
  }
}

export const MODEL_CONFIGS: Record<string, ModelInfo> = {
  'gpt-oss:20b': {
    name: 'gpt-oss:20b',
    displayName: 'GPT-OSS 20B',
    type: 'chat',
    size: '13 GB',
    capabilities: {
      chat: true,
      analysis: true,
      embedding: false,
      reasoning: true
    },
    performance: {
      speed: 'medium',
      quality: 'high',
      memory: '16GB+ recommended'
    },
    compatibility: {
      embeddings: true, // Can work with separate embedding model
      vectorSearch: true,
      aiAnalysis: true,
      streaming: true
    }
  },
  'llama3:latest': {
    name: 'llama3:latest',
    displayName: 'Llama 3 Latest',
    type: 'chat',
    size: '4.7 GB',
    capabilities: {
      chat: true,
      analysis: true,
      embedding: false,
      reasoning: true
    },
    performance: {
      speed: 'fast',
      quality: 'high',
      memory: '8GB+ recommended'
    },
    compatibility: {
      embeddings: true,
      vectorSearch: true,
      aiAnalysis: true,
      streaming: true
    }
  },
  'nomic-embed-text:latest': {
    name: 'nomic-embed-text:latest',
    displayName: 'Nomic Embed Text',
    type: 'embedding',
    size: '274 MB',
    capabilities: {
      chat: false,
      analysis: false,
      embedding: true,
      reasoning: false
    },
    performance: {
      speed: 'fast',
      quality: 'high',
      memory: '2GB'
    },
    compatibility: {
      embeddings: true,
      vectorSearch: true,
      aiAnalysis: false,
      streaming: false
    }
  },
  'mistral:latest': {
    name: 'mistral:latest',
    displayName: 'Mistral Latest',
    type: 'chat',
    size: '4.1 GB',
    capabilities: {
      chat: true,
      analysis: true,
      embedding: false,
      reasoning: true
    },
    performance: {
      speed: 'fast',
      quality: 'high',
      memory: '8GB+ recommended'
    },
    compatibility: {
      embeddings: true,
      vectorSearch: true,
      aiAnalysis: true,
      streaming: true
    }
  }
}

/**
 * Get recommended model configuration based on use case
 */
export function getRecommendedModel(useCase: 'chat' | 'analysis' | 'embedding'): string {
  switch (useCase) {
    case 'chat':
      return 'gpt-oss:20b' // Prefer GPT-OSS for chat if available
    case 'analysis':
      return 'gpt-oss:20b' // GPT-OSS excellent for analysis
    case 'embedding':
      return 'nomic-embed-text:latest'
    default:
      return 'gpt-oss:20b'
  }
}

/**
 * Check if model supports specific capability
 */
export function modelSupports(modelName: string, capability: keyof ModelInfo['capabilities']): boolean {
  const config = MODEL_CONFIGS[modelName]
  return config ? config.capabilities[capability] : false
}

/**
 * Get compatible embedding model for a chat model
 */
export function getCompatibleEmbeddingModel(chatModel: string): string {
  const config = MODEL_CONFIGS[chatModel]
  if (config?.compatibility.embeddings) {
    return 'nomic-embed-text:latest'
  }
  throw new Error(`No compatible embedding model found for ${chatModel}`)
}

/**
 * Validate model compatibility for RAG system
 */
export function validateRAGCompatibility(chatModel: string, embeddingModel: string): {
  compatible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  const chatConfig = MODEL_CONFIGS[chatModel]
  const embeddingConfig = MODEL_CONFIGS[embeddingModel]
  
  if (!chatConfig) {
    issues.push(`Unknown chat model: ${chatModel}`)
  } else if (!chatConfig.compatibility.aiAnalysis) {
    issues.push(`${chatModel} may not support AI analysis`)
  }
  
  if (!embeddingConfig) {
    issues.push(`Unknown embedding model: ${embeddingModel}`)
  } else if (!embeddingConfig.capabilities.embedding) {
    issues.push(`${embeddingModel} is not an embedding model`)
  }
  
  // GPT-OSS specific recommendations
  if (chatModel === 'gpt-oss:20b') {
    recommendations.push('GPT-OSS 20B detected - excellent for analysis and reasoning tasks')
    recommendations.push('Ensure sufficient RAM (16GB+) for optimal performance')
    recommendations.push('Consider using GPU acceleration if available')
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    recommendations
  }
}

/**
 * Default model settings for the application
 */
export const DEFAULT_MODEL_SETTINGS = {
  chat: 'gpt-oss:20b',
  embedding: 'nomic-embed-text:latest',
  analysis: 'gpt-oss:20b',
  fallback: {
    chat: 'llama3:latest',
    embedding: 'nomic-embed-text:latest',
    analysis: 'llama3:latest'
  }
}

/**
 * Model performance settings optimized for different models
 */
export const MODEL_PERFORMANCE_SETTINGS = {
  'gpt-oss:20b': {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1,
    contextWindow: 8192
  },
  'llama3:latest': {
    temperature: 0.8,
    maxTokens: 1024,
    topP: 0.9,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    contextWindow: 4096
  },
  'mistral:latest': {
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1,
    contextWindow: 4096
  }
}
