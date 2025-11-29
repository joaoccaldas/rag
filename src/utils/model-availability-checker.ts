/**
 * Model Availability Checker
 * Helps diagnose and fix model ava    const priorityOrder = [
      'llama3:latest',
      'llama3:8b',
      'llama3.2:3b',
      'gpt-oss',
      'mistral:latest',
      'mistral:7b',
      'phi3:latest'
    ]y issues
 */

export interface ModelInfo {
  name: string
  available: boolean
  size?: string
  description?: string
  error?: string
}

export class ModelAvailabilityChecker {
  private static async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/ollama/models', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      return response.ok
    } catch (error) {
      console.warn('Ollama health check failed:', error)
      return false
    }
  }

  static async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('/api/ollama/models')
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => ({
          name: model.name,
          available: true,
          size: this.formatBytes(model.size || 0),
          description: this.getModelDescription(model.name)
        }))
      }
      
      return []
    } catch (error) {
      console.error('Failed to get available models:', error)
      return []
    }
  }

  static async checkModelAvailability(modelName: string): Promise<ModelInfo> {
    const availableModels = await this.getAvailableModels()
    const model = availableModels.find(m => m.name === modelName)
    
    if (model) {
      return model
    }
    
    return {
      name: modelName,
      available: false,
      error: 'Model not found in Ollama'
    }
  }

  static async getRecommendedModel(): Promise<string> {
    const availableModels = await this.getAvailableModels()
    
    // Priority order for recommendations
    const preferredModels = [
      'llama3:latest',
      'llama3:8b',
      'llama3.2:3b',
      'mistral:latest',
      'mistral:7b',
      'phi3:latest'
    ]
    
    for (const preferred of preferredModels) {
      if (availableModels.some(m => m.name === preferred)) {
        return preferred
      }
    }
    
    // Return first available model if none of the preferred ones are available
    if (availableModels.length > 0) {
      return availableModels[0]?.name || 'llama3:latest'
    }
    
    return 'llama3:latest' // Default fallback
  }

  static async diagnoseAndFix(): Promise<{
    diagnosis: string[]
    recommendations: string[]
    fixedModel: string | undefined
  }> {
    const diagnosis: string[] = []
    const recommendations: string[] = []
    let fixedModel: string | undefined

    // Check Ollama health
    const isHealthy = await this.checkOllamaHealth()
    if (!isHealthy) {
      diagnosis.push('❌ Ollama service is not responding')
      recommendations.push('1. Make sure Ollama is running: ollama serve')
      recommendations.push('2. Check if Ollama is installed: ollama --version')
      recommendations.push('3. Verify Ollama is accessible at http://localhost:11434')
      return { diagnosis, recommendations }
    }

    diagnosis.push('✅ Ollama service is healthy')

    // Check available models
    const availableModels = await this.getAvailableModels()
    if (availableModels.length === 0) {
      diagnosis.push('❌ No models found in Ollama')
      recommendations.push('1. Pull a model: ollama pull llama3')
      recommendations.push('2. List available models: ollama list')
      recommendations.push('3. Check Ollama documentation for model installation')
      return { diagnosis, recommendations }
    }

    diagnosis.push(`✅ Found ${availableModels.length} available models:`)
    availableModels.forEach(model => {
      diagnosis.push(`   • ${model.name} (${model.size || 'unknown size'})`)
    })

    // Check current AI settings
    try {
      const settings = localStorage.getItem('miele-ai-settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        const currentModel = parsed.summarizationModel || 'llama3:latest'
        
        const modelCheck = await this.checkModelAvailability(currentModel)
        if (!modelCheck.available) {
          diagnosis.push(`❌ Current model '${currentModel}' is not available`)
          const recommendedModel = await this.getRecommendedModel()
          fixedModel = recommendedModel
          recommendations.push(`1. Switch to available model: ${recommendedModel}`)
          recommendations.push('2. Update AI settings to use an available model')
        } else {
          diagnosis.push(`✅ Current model '${currentModel}' is available`)
        }
      }
    } catch (error) {
      diagnosis.push('⚠️  Could not check current AI settings')
    }

    return { diagnosis, recommendations, fixedModel }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  private static getModelDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'llama3:latest': 'Meta Llama 3 - Excellent general-purpose model',
      'llama3:8b': 'Meta Llama 3 8B - Balanced performance and speed',
      'llama3:70b': 'Meta Llama 3 70B - High-quality but requires significant resources',
      'llama3.2:3b': 'Meta Llama 3.2 3B - Fast and efficient for most tasks',
      'mistral:latest': 'Mistral AI - Fast and efficient language model',
      'mistral:7b': 'Mistral 7B - Lightweight and fast processing',
      'phi3:latest': 'Microsoft Phi-3 - Compact but capable model'
    }
    
    return descriptions[name] || 'AI language model'
  }
}

export default ModelAvailabilityChecker
