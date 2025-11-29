/**
 * Ollama Service Detector and Auto-Start
 * Detects available models and starts service automatically
 */

import { useState, useEffect } from 'react'

interface OllamaStatus {
  isRunning: boolean
  models: string[]
  error?: string
  endpoint: string
  recommendedModel?: string
}

export function useOllamaService() {
  const [status, setStatus] = useState<OllamaStatus>({
    isRunning: false,
    models: [],
    endpoint: 'http://localhost:11434'
  })

  const checkService = async (): Promise<OllamaStatus> => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })

      if (response.ok) {
        const data = await response.json()
        const models = data.models?.map((m: any) => m.name) || []
        
        // Find the best available model
        const preferredModels = [
          'llama3.1:8b', 'llama3.1:7b', 'llama3:8b', 'llama3:7b', 
          'llama2:7b', 'mistral:7b', 'codellama:7b'
        ]
        
        const recommendedModel = preferredModels.find(model => 
          models.some((available: string) => available.includes(model.split(':')[0]))
        ) || models[0]

        return {
          isRunning: true,
          models,
          endpoint: 'http://localhost:11434',
          recommendedModel
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      return {
        isRunning: false,
        models: [],
        endpoint: 'http://localhost:11434',
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  const startService = async (): Promise<boolean> => {
    try {
      // Try to start Ollama service using different methods
      const startCommands = [
        'ollama serve',
        'Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden',
        'cmd /c "ollama serve"'
      ]

      // Note: In browser context, we can't actually start the service
      // This would need to be done from a Node.js backend or desktop app
      console.warn('Cannot start Ollama service from browser. Please run: ollama serve')
      
      return false
    } catch (error) {
      console.error('Failed to start Ollama service:', error)
      return false
    }
  }

  useEffect(() => {
    const checkAndUpdate = async () => {
      const newStatus = await checkService()
      setStatus(newStatus)
    }

    // Initial check
    checkAndUpdate()

    // Check every 30 seconds
    const interval = setInterval(checkAndUpdate, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    status,
    checkService,
    startService,
    refresh: () => checkService().then(setStatus)
  }
}

// Helper function to get the best available model
export function getBestAvailableModel(models: string[]): string {
  const preferredModels = [
    'llama3.1:8b', 'llama3.1:7b', 'llama3:8b', 'llama3:7b', 
    'llama2:7b', 'mistral:7b', 'codellama:7b'
  ]
  
  for (const preferred of preferredModels) {
    const found = models.find(model => 
      model.includes(preferred.split(':')[0])
    )
    if (found) return found
  }
  
  return models[0] || 'llama3.1:8b' // fallback
}
