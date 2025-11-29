/**
 * Model Synchronization Utility
 * Ensures model consistency across settings, profiles, and API calls
 */

import { ollamaService } from '@/services/ollama-service'

export interface ModelValidationResult {
  isValid: boolean
  availableModels: string[]
  recommendedFallback?: string
  reason?: string
}

/**
 * Validates if a model exists and is available
 */
export async function validateModel(modelName: string): Promise<ModelValidationResult> {
  try {
    const response = await ollamaService.fetchModels()
    
    if (response.success && response.data) {
      const availableModels = response.data.map(model => model.name)
      const isValid = availableModels.includes(modelName)
      
      if (isValid) {
        return {
          isValid: true,
          availableModels
        }
      }
      
      // Find best fallback
      const fallbackPriority = ['mistral:latest', 'llama3.2:3b', 'llama3:latest', 'codellama:7b']
      const recommendedFallback = fallbackPriority.find(model => availableModels.includes(model))
      
      return {
        isValid: false,
        availableModels,
        ...(recommendedFallback && { recommendedFallback }),
        reason: `Model "${modelName}" not found. Available models: ${availableModels.join(', ')}`
      }
    }
    
    return {
      isValid: false,
      availableModels: [],
      reason: 'Unable to fetch available models from Ollama service'
    }
  } catch (error) {
    console.error('Model validation error:', error)
    return {
      isValid: false,
      availableModels: [],
      reason: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Synchronizes model selection across all contexts
 */
export function syncModelSelection(selectedModel: string) {
  // Update localStorage settings to match user selection
  try {
    const savedSettings = localStorage.getItem('miele-chat-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      settings.model = selectedModel
      localStorage.setItem('miele-chat-settings', JSON.stringify(settings))
    }
  } catch (error) {
    console.error('Failed to sync model selection:', error)
  }
}

/**
 * Gets the effective model for API calls
 * Priority: User UI selection > Profile setting > Default
 */
export function getEffectiveModel(
  userSelectedModel: string,
  profileModel?: string,
  defaultModel: string = 'mistral:latest'
): string {
  // Always prioritize user's current selection
  return userSelectedModel || profileModel || defaultModel
}

/**
 * Legacy model migration utility
 */
export function migrateLegacyModels(currentModel: string): string {
  const migrations: Record<string, string> = {
    'gpt-oss:20b': 'mistral:latest',
    'llama3.2': 'llama3.2:3b',
    'llama3:latest': 'mistral:latest',
    'llama3': 'mistral:latest'
  }
  
  return migrations[currentModel] || currentModel
}

/**
 * Checks if model selection is consistent across the application
 */
export async function performModelConsistencyCheck(): Promise<{
  isConsistent: boolean
  issues: string[]
  recommendations: string[]
}> {
  const issues: string[] = []
  const recommendations: string[] = []
  
  try {
    // Check SettingsContext
    const savedSettings = localStorage.getItem('miele-chat-settings')
    let settingsModel = 'unknown'
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      settingsModel = settings.model
    }
    
    // Check profile storage
    const profileStorage = localStorage.getItem('rag_user_profiles')
    const profileModels: string[] = []
    if (profileStorage) {
      const profiles = JSON.parse(profileStorage) as Array<{ model?: string }>
      profiles.forEach((profile) => {
        if (profile.model) {
          profileModels.push(profile.model)
        }
      })
    }
    
    // Validate current models
    const validation = await validateModel(settingsModel)
    if (!validation.isValid) {
      issues.push(`Settings model "${settingsModel}" is not available`)
      if (validation.recommendedFallback) {
        recommendations.push(`Update settings to use "${validation.recommendedFallback}"`)
      }
    }
    
    // Check profile models
    for (const profileModel of profileModels) {
      const profileValidation = await validateModel(profileModel)
      if (!profileValidation.isValid) {
        issues.push(`Profile model "${profileModel}" is not available`)
        if (profileValidation.recommendedFallback) {
          recommendations.push(`Update profile models to use "${profileValidation.recommendedFallback}"`)
        }
      }
    }
    
    return {
      isConsistent: issues.length === 0,
      issues,
      recommendations
    }
  } catch (error) {
    return {
      isConsistent: false,
      issues: [`Consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Try refreshing the page and checking your Ollama connection']
    }
  }
}
