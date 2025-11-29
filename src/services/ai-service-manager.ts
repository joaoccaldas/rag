/**
 * AI Service Manager with Automatic Fallbacks
 * Handles Ollama service detection and provides mock responses when unavailable
 */

interface ServiceStatus {
  available: boolean
  models: string[]
  endpoint: string
  lastCheck: number
}

class AIServiceManager {
  private static instance: AIServiceManager
  private serviceStatus: ServiceStatus = {
    available: false,
    models: [],
    endpoint: 'http://localhost:11434',
    lastCheck: 0
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager()
    }
    return AIServiceManager.instance
  }

  async checkService(): Promise<ServiceStatus> {
    const now = Date.now()
    // Cache check results for 30 seconds
    if (now - this.serviceStatus.lastCheck < 30000) {
      return this.serviceStatus
    }

    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })

      if (response.ok) {
        const data = await response.json()
        this.serviceStatus = {
          available: true,
          models: data.models?.map((m: any) => m.name) || [],
          endpoint: 'http://localhost:11434',
          lastCheck: now
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      this.serviceStatus = {
        available: false,
        models: [],
        endpoint: 'http://localhost:11434',
        lastCheck: now
      }
    }

    return this.serviceStatus
  }

  async makeRequest(prompt: string, type: string = 'analysis'): Promise<any> {
    const status = await this.checkService()
    
    if (!status.available) {
      console.warn('AI service unavailable, using fallback analysis')
      return this.generateFallbackResponse(prompt, type)
    }

    // Try to use first available model or fallback to common ones
    const model = status.models[0] || 'llama3.1:8b' || 'llama3.1:7b' || 'llama3:8b' || 'llama2:7b'
    
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          type: type,
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new Error(`API returned ${response.status}`)
      }
    } catch (error) {
      console.warn('AI API request failed, using fallback:', error)
      return this.generateFallbackResponse(prompt, type)
    }
  }

  private generateFallbackResponse(prompt: string, type: string): any {
    const baseAnalysis = {
      timestamp: new Date().toISOString(),
      model: 'fallback-analysis',
      type: type
    }

    if (type === 'visual-analysis') {
      return {
        ...baseAnalysis,
        response: JSON.stringify({
          mainNumbers: ["Data analysis pending", "Service connecting"],
          keyFindings: ["Visual content detected", "Analysis will update when AI service is available"],
          businessMessage: "Content ready for analysis - AI service reconnecting",
          businessDrivers: ["Content processing", "Service connectivity"],
          context: "Fallback analysis while AI service initializes",
          recommendations: ["Check AI service status", "Retry analysis when service is available"],
          trends: ["Content uploaded successfully"],
          metadata: {
            confidence: 0.1,
            keywords: ["pending", "analysis", "content"]
          }
        })
      }
    } else {
      return {
        ...baseAnalysis,
        response: JSON.stringify({
          summary: "Document processed - AI analysis pending",
          keyPoints: ["Content extracted successfully", "Awaiting AI service connection"],
          recommendations: ["Verify AI service status", "Retry analysis when available"],
          businessDrivers: ["Content processing", "System connectivity"],
          context: "Fallback processing while AI service initializes",
          insights: ["Document ready for analysis"],
          metadata: {
            confidence: 0.1,
            keywords: ["document", "pending", "analysis"]
          }
        })
      }
    }
  }

  getAvailableModels(): string[] {
    return this.serviceStatus.models
  }

  isServiceAvailable(): boolean {
    return this.serviceStatus.available
  }
}

export default AIServiceManager
