/**
 * Centralized Ollama Service
 * Single source of truth for all Ollama API interactions
 */

export interface OllamaModel {
  name: string
  size?: number
  modified_at?: string
  family?: string
  parameter_size?: string
  quantization_level?: string
}

export interface OllamaResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  connectionMethod?: 'direct' | 'proxy' | 'mock'
}

export interface ModelAvailability {
  name: string
  available: boolean
  size?: string
  description?: string
  capabilities?: string[]
  recommended?: boolean
  lastChecked: Date
  error?: string
}

export interface OllamaServiceConfig {
  hosts: string[]
  ports: string[]
  protocols: string[]
  timeout: number
  maxRetries: number
  retryDelay: number
}

const DEFAULT_CONFIG: OllamaServiceConfig = {
  hosts: ['localhost', '127.0.0.1', '192.168.86.27'],
  ports: ['11434', '11435'],
  protocols: ['http'],
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 2000
}

const MOCK_MODELS: OllamaModel[] = [
  { name: 'llama3.2:3b', size: 2048000000, family: 'llama' },
  { name: 'llama3.2:1b', size: 1024000000, family: 'llama' },
  { name: 'codellama:7b', size: 7168000000, family: 'codellama' },
  { name: 'mistral:7b', size: 7168000000, family: 'mistral' },
  { name: 'qwen2:7b', size: 7168000000, family: 'qwen' }
]

class OllamaService {
  private config: OllamaServiceConfig
  private lastSuccessfulConnection: { host: string; port: string; protocol: string; method: 'direct' | 'proxy' } | null = null
  private modelCache: OllamaModel[] = []
  private lastModelFetch: Date | null = null
  private readonly CACHE_DURATION = 30000 // 30 seconds

  constructor(config: Partial<OllamaServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Test connection to a specific Ollama endpoint
   */
  private async testConnection(
    host: string,
    port: string,
    protocol: string,
    method: 'direct' | 'proxy'
  ): Promise<{ success: boolean; models?: OllamaModel[]; error?: string }> {
    try {
      const baseUrl = method === 'direct' 
        ? `${protocol}://${host}:${port}`
        : `${protocol}://${window.location.hostname}:${window.location.port || '3000'}`
      
      const endpoint = method === 'direct' 
        ? '/api/tags'
        : `/api/ollama-proxy?endpoint=${encodeURIComponent('/api/tags')}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const models = data.models || []
      
      // Cache successful connection
      this.lastSuccessfulConnection = { host, port, protocol, method }
      
      return { success: true, models }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Find available Ollama connection
   */
  async findConnection(): Promise<{
    success: boolean
    connectionMethod: 'direct' | 'proxy' | 'mock'
    host?: string
    port?: string
    protocol?: string
    error?: string
  }> {
    // Try last successful connection first
    if (this.lastSuccessfulConnection) {
      const { host, port, protocol, method } = this.lastSuccessfulConnection
      const result = await this.testConnection(host, port, protocol, method)
      if (result.success) {
        return { 
          success: true, 
          connectionMethod: method, 
          host, 
          port, 
          protocol 
        }
      }
    }

    // Try all direct connections
    for (const protocol of this.config.protocols) {
      for (const host of this.config.hosts) {
        for (const port of this.config.ports) {
          const result = await this.testConnection(host, port, protocol, 'direct')
          if (result.success) {
            return { 
              success: true, 
              connectionMethod: 'direct', 
              host, 
              port, 
              protocol 
            }
          }
        }
      }
    }

    // Try proxy connection
    const proxyResult = await this.testConnection('localhost', '3000', 'http', 'proxy')
    if (proxyResult.success) {
      return { 
        success: true, 
        connectionMethod: 'proxy', 
        host: 'localhost', 
        port: '3000', 
        protocol: 'http' 
      }
    }

    // Fallback to mock
    return { 
      success: true, 
      connectionMethod: 'mock',
      error: 'Using mock mode - Ollama service not available' 
    }
  }

  /**
   * Fetch available models with caching
   */
  async fetchModels(forceRefresh = false): Promise<OllamaResponse<OllamaModel[]>> {
    // Check cache
    if (!forceRefresh && this.modelCache.length > 0 && this.lastModelFetch) {
      const cacheAge = Date.now() - this.lastModelFetch.getTime()
      if (cacheAge < this.CACHE_DURATION) {
        return {
          success: true,
          data: this.modelCache,
          connectionMethod: this.lastSuccessfulConnection?.method || 'direct'
        }
      }
    }

    try {
      const connection = await this.findConnection()
      
      if (!connection.success || connection.connectionMethod === 'mock') {
        this.modelCache = MOCK_MODELS
        this.lastModelFetch = new Date()
        
        return {
          success: true,
          data: MOCK_MODELS,
          connectionMethod: 'mock',
          ...(connection.error && { error: connection.error })
        }
      }

      // Fetch from real Ollama service
      const { host, port, protocol } = connection
      const result = await this.testConnection(
        host!, 
        port!, 
        protocol!, 
        connection.connectionMethod
      )

      if (result.success && result.models) {
        this.modelCache = result.models
        this.lastModelFetch = new Date()
        
        return {
          success: true,
          data: result.models,
          connectionMethod: connection.connectionMethod
        }
      }

      throw new Error(result.error || 'Failed to fetch models')
    } catch (error) {
      // Fallback to mock models
      this.modelCache = MOCK_MODELS
      this.lastModelFetch = new Date()
      
      return {
        success: false,
        data: MOCK_MODELS,
        connectionMethod: 'mock',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate completion using best available connection
   */
  async generateCompletion(
    model: string,
    prompt: string,
    options: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      systemPrompt?: string
    } = {}
  ): Promise<OllamaResponse<{ response: string }>> {
    try {
      const connection = await this.findConnection()
      
      if (connection.connectionMethod === 'mock') {
        // Mock response for development
        return {
          success: true,
          data: { response: `Mock response for: ${prompt.substring(0, 50)}...` },
          connectionMethod: 'mock'
        }
      }

      const { host, port, protocol } = connection
      const baseUrl = connection.connectionMethod === 'direct' 
        ? `${protocol}://${host}:${port}`
        : `http://${window.location.hostname}:${window.location.port || '3000'}`
      
      const endpoint = connection.connectionMethod === 'direct' 
        ? '/api/generate'
        : `/api/ollama-proxy?endpoint=${encodeURIComponent('/api/generate')}`

      const requestBody = {
        model,
        prompt: options.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2048
        }
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: { response: data.response || data.content || '' },
        connectionMethod: connection.connectionMethod
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionMethod: 'mock'
      }
    }
  }

  /**
   * Get health status of Ollama service
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    connectionMethod: 'direct' | 'proxy' | 'mock'
    modelCount: number
    lastChecked: Date
    details: {
      directConnection: boolean
      proxyConnection: boolean
      modelsAvailable: boolean
      responseTime?: number
    }
    errors?: string[]
  }> {
    const startTime = Date.now()
    const errors: string[] = []
    
    try {
      const connection = await this.findConnection()
      const models = await this.fetchModels()
      const responseTime = Date.now() - startTime

      const details = {
        directConnection: connection.connectionMethod === 'direct',
        proxyConnection: connection.connectionMethod === 'proxy',
        modelsAvailable: models.success && (models.data?.length || 0) > 0,
        responseTime
      }

      if (connection.error) errors.push(connection.error)
      if (models.error) errors.push(models.error)

      const status = connection.connectionMethod === 'mock' 
        ? 'unhealthy' 
        : errors.length > 0 
          ? 'degraded' 
          : 'healthy'

      return {
        status,
        connectionMethod: connection.connectionMethod,
        modelCount: models.data?.length || 0,
        lastChecked: new Date(),
        details,
        ...(errors.length > 0 && { errors })
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connectionMethod: 'mock',
        modelCount: 0,
        lastChecked: new Date(),
        details: {
          directConnection: false,
          proxyConnection: false,
          modelsAvailable: false
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Clear cache and reset connections
   */
  reset(): void {
    this.modelCache = []
    this.lastModelFetch = null
    this.lastSuccessfulConnection = null
  }
}

// Export singleton instance
export const ollamaService = new OllamaService()

// Export utilities
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getModelDescription(modelName: string): string {
  const descriptions: Record<string, string> = {
    'llama3.2:3b': 'Small, fast model for general conversations',
    'llama3.2:1b': 'Ultra-fast model for simple tasks', 
    'codellama:7b': 'Specialized for code generation and programming',
    'mistral:7b': 'Balanced model for various tasks',
    'qwen2:7b': 'Advanced reasoning and problem-solving'
  }
  
  for (const [key, desc] of Object.entries(descriptions)) {
    const modelKey = key.split(':')[0]
    if (modelKey && modelName.includes(modelKey)) {
      return desc
    }
  }
  
  return 'AI language model'
}

export function getModelCapabilities(modelName: string): string[] {
  const capabilities: Record<string, string[]> = {
    'llama3.2': ['General conversation', 'Text analysis', 'Basic reasoning'],
    'codellama': ['Code generation', 'Code review', 'Programming help', 'Debugging'],
    'mistral': ['General conversation', 'Analysis', 'Creative writing', 'Problem solving'],
    'qwen2': ['Advanced reasoning', 'Complex analysis', 'Mathematical problem solving']
  }
  
  for (const [key, caps] of Object.entries(capabilities)) {
    if (modelName.includes(key)) {
      return caps
    }
  }
  
  return ['General conversation']
}

export function isRecommendedModel(modelName: string): boolean {
  const recommended = ['llama3.2:3b', 'mistral:7b', 'qwen2:7b']
  return recommended.some(rec => modelName.includes(rec))
}
