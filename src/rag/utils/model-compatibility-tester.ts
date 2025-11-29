/**
 * GPT-OSS Model Compatibility Test
 * Validates that gpt-oss:20b model works correctly with the system
 */

export interface ModelTestResult {
  model: string
  available: boolean
  compatible: boolean
  performance: {
    responseTime: number
    quality: 'excellent' | 'good' | 'fair' | 'poor'
  }
  issues: string[]
  recommendations: string[]
}

export class ModelCompatibilityTester {
  /**
   * Test GPT-OSS model availability and compatibility
   */
  async testGPTOSSCompatibility(): Promise<ModelTestResult> {
    const result: ModelTestResult = {
      model: 'gpt-oss:20b',
      available: false,
      compatible: false,
      performance: {
        responseTime: 0,
        quality: 'poor'
      },
      issues: [],
      recommendations: []
    }

    try {
      // 1. Test model availability
      console.log('🔍 Testing GPT-OSS model availability...')
      const availabilityTest = await this.testModelAvailability('gpt-oss:20b')
      result.available = availabilityTest.available
      
      if (!result.available) {
        result.issues.push('GPT-OSS model not found in Ollama')
        result.recommendations.push('Install GPT-OSS model: ollama pull gpt-oss:20b')
        return result
      }

      // 2. Test basic chat functionality
      console.log('💬 Testing chat functionality...')
      const chatTest = await this.testChatFunctionality('gpt-oss:20b')
      if (!chatTest.success) {
        result.issues.push(`Chat test failed: ${chatTest.error}`)
        return result
      }

      // 3. Test AI analysis capability
      console.log('🧠 Testing AI analysis capability...')
      const analysisTest = await this.testAIAnalysisCapability('gpt-oss:20b')
      if (!analysisTest.success) {
        result.issues.push(`Analysis test failed: ${analysisTest.error}`)
      }

      // 4. Test embedding compatibility
      console.log('🔗 Testing embedding compatibility...')
      const embeddingTest = await this.testEmbeddingCompatibility()
      if (!embeddingTest.success) {
        result.issues.push(`Embedding compatibility issue: ${embeddingTest.error}`)
        result.recommendations.push('Use nomic-embed-text:latest for embeddings')
      }

      // 5. Performance evaluation
      console.log('⚡ Evaluating performance...')
      const performanceTest = await this.evaluatePerformance('gpt-oss:20b')
      result.performance = performanceTest

      // Overall compatibility assessment
      result.compatible = result.issues.length === 0 || result.issues.every(issue => 
        issue.includes('embedding') // Embedding issues are non-critical
      )

      if (result.compatible) {
        console.log('✅ GPT-OSS model is fully compatible!')
        result.recommendations.push('GPT-OSS 20B is excellent for analysis and reasoning tasks')
        result.recommendations.push('Consider using GPU acceleration for better performance')
      }

    } catch (error) {
      result.issues.push(`Compatibility test failed: ${error}`)
      console.error('❌ GPT-OSS compatibility test failed:', error)
    }

    return result
  }

  /**
   * Test if model is available in Ollama
   */
  private async testModelAvailability(modelName: string): Promise<{ available: boolean, error?: string }> {
    try {
      const response = await fetch('http://localhost:11434/api/tags')
      if (!response.ok) {
        return { available: false, error: 'Ollama not running' }
      }

      const data = await response.json()
      const models = data.models || []
      const isAvailable = models.some((model: any) => model.name === modelName || model.name.startsWith(modelName))

      return { available: isAvailable }
    } catch (error) {
      return { available: false, error: `Connection failed: ${error}` }
    }
  }

  /**
   * Test basic chat functionality
   */
  private async testChatFunctionality(modelName: string): Promise<{ success: boolean, error?: string, responseTime?: number }> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Hello! Can you briefly introduce yourself and confirm you are working correctly?',
          stream: false,
          options: {
            temperature: 0.7,
            max_tokens: 100
          }
        })
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      const data = await response.json()
      
      if (!data.response || data.response.length < 10) {
        return { success: false, error: 'Invalid or empty response' }
      }

      return { success: true, responseTime }
    } catch (error) {
      return { success: false, error: `Request failed: ${error}` }
    }
  }

  /**
   * Test AI analysis capability with sample document
   */
  private async testAIAnalysisCapability(modelName: string): Promise<{ success: boolean, error?: string }> {
    try {
      const sampleDocument = {
        title: 'Miele Financial Performance Q3 2024',
        content: 'Miele reported strong financial results for Q3 2024, with revenue growth of 15% year-over-year. The premium appliance market continues to show resilience, with particular strength in washing machines and dishwashers. Market share increased to 12% in the European premium segment.'
      }

      const prompt = `Analyze this business document and provide:
1. A brief summary (2-3 sentences)
2. Key topics (3-5 keywords)
3. Document sentiment (positive/neutral/negative)

Document: ${sampleDocument.title}
Content: ${sampleDocument.content}

Please respond in JSON format with fields: summary, keywords, sentiment.`

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            max_tokens: 300
          }
        })
      })

      if (!response.ok) {
        return { success: false, error: `Analysis request failed: ${response.status}` }
      }

      const data = await response.json()
      
      // Check if response contains analysis-like content
      if (!data.response || data.response.length < 50) {
        return { success: false, error: 'Analysis response too short or empty' }
      }

      // Basic validation that it looks like analysis
      const analysisContent = data.response.toLowerCase()
      const hasAnalysisTerms = ['summary', 'keywords', 'sentiment', 'analysis', 'financial', 'miele'].some(term => 
        analysisContent.includes(term)
      )

      if (!hasAnalysisTerms) {
        return { success: false, error: 'Response does not appear to be valid analysis' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Analysis test failed: ${error}` }
    }
  }

  /**
   * Test embedding model compatibility
   */
  private async testEmbeddingCompatibility(): Promise<{ success: boolean, error?: string }> {
    try {
      // Test that embedding model is available
      const embeddingModel = 'nomic-embed-text:latest'
      const availabilityTest = await this.testModelAvailability(embeddingModel)
      
      if (!availabilityTest.available) {
        return { success: false, error: 'Embedding model not available' }
      }

      // Test embedding generation
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: 'Test document for embedding generation'
        })
      })

      if (!response.ok) {
        return { success: false, error: `Embedding request failed: ${response.status}` }
      }

      const data = await response.json()
      
      if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
        return { success: false, error: 'Invalid embedding response' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Embedding test failed: ${error}` }
    }
  }

  /**
   * Evaluate model performance
   */
  private async evaluatePerformance(modelName: string): Promise<{ responseTime: number, quality: 'excellent' | 'good' | 'fair' | 'poor' }> {
    const performanceTests = []
    
    // Run multiple quick tests to measure average performance
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now()
      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt: `Test ${i + 1}: Briefly explain what makes Miele appliances premium quality.`,
            stream: false,
            options: {
              temperature: 0.5,
              max_tokens: 50
            }
          })
        })
        
        const responseTime = Date.now() - startTime
        const data = await response.json()
        
        performanceTests.push({
          responseTime,
          quality: this.assessResponseQuality(data.response || '')
        })
      } catch (error) {
        console.warn(`Performance test ${i + 1} failed:`, error)
      }
    }

    // Calculate averages
    const avgResponseTime = performanceTests.length > 0 
      ? performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length
      : 0

    const qualityScores = performanceTests.map(test => this.qualityToScore(test.quality))
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0

    return {
      responseTime: Math.round(avgResponseTime),
      quality: this.scoreToQuality(avgQualityScore)
    }
  }

  /**
   * Assess response quality based on content
   */
  private assessResponseQuality(response: string): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!response || response.length < 10) return 'poor'
    if (response.length < 30) return 'fair'
    
    const lowerResponse = response.toLowerCase()
    const qualityIndicators = ['miele', 'premium', 'quality', 'appliance', 'engineering', 'durability', 'design']
    const indicatorCount = qualityIndicators.filter(indicator => lowerResponse.includes(indicator)).length
    
    if (indicatorCount >= 4) return 'excellent'
    if (indicatorCount >= 2) return 'good'
    return 'fair'
  }

  private qualityToScore(quality: 'excellent' | 'good' | 'fair' | 'poor'): number {
    switch (quality) {
      case 'excellent': return 4
      case 'good': return 3
      case 'fair': return 2
      case 'poor': return 1
      default: return 1
    }
  }

  private scoreToQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 3.5) return 'excellent'
    if (score >= 2.5) return 'good'
    if (score >= 1.5) return 'fair'
    return 'poor'
  }

  /**
   * Run comprehensive compatibility test
   */
  async runFullCompatibilityTest(): Promise<ModelTestResult> {
    console.log('🚀 Running comprehensive GPT-OSS compatibility test...')
    
    const result = await this.testGPTOSSCompatibility()
    
    console.log('\n📊 Compatibility Test Results:')
    console.log(`Model: ${result.model}`)
    console.log(`Available: ${result.available ? '✅' : '❌'}`)
    console.log(`Compatible: ${result.compatible ? '✅' : '❌'}`)
    console.log(`Performance: ${result.performance.quality} (${result.performance.responseTime}ms avg)`)
    
    if (result.issues.length > 0) {
      console.log('\n⚠️ Issues found:')
      result.issues.forEach(issue => console.log(`  - ${issue}`))
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      result.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }
    
    return result
  }
}
