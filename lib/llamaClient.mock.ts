// Mock implementation for development/testing
export interface LlamaSettings {
  temperature?: number
  maxTokens?: number
  model?: string
}

export async function initLlama(modelPath?: string): Promise<boolean> {
  console.log('Mock: Initializing Llama model:', modelPath)
  return true
}

export async function llamaPrompt(
  prompt: string, 
  settings: LlamaSettings = {}
): Promise<string> {
  console.log('Mock: Processing prompt:', prompt.substring(0, 100) + '...')
  console.log('Mock: Using settings:', settings)
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return `Mock response for: "${prompt.substring(0, 50)}..." with temperature ${settings.temperature || 0.7}`
}

export function isLlamaInitialized(): boolean {
  return true
}

export async function cleanupLlama(): Promise<void> {
  console.log('Mock: Cleaning up Llama resources')
}

export function getLlamaInfo() {
  return {
    initialized: true,
    modelPath: 'mock-model-path',
    model: 'Mock Llama Model'
  }
}
