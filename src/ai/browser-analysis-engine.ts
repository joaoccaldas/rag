/**
 * Browser-Compatible AI Analysis Engine
 * Uses API calls instead of direct Node.js imports
 */

/**
 * Get AI model from settings with fallback options
 */
function getAIModel(): string {
  try {
    const settings = localStorage.getItem('miele-ai-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.summarizationModel || 'llama3:latest'
    }
  } catch (error) {
    console.warn('Failed to load AI model from settings:', error)
  }
  return 'llama3:latest' // Default fallback
}

/**
 * Get fallback models in order of preference
 * Only includes models that are actually installed
 */
function getFallbackModels(): string[] {
  return [
    'llama3:latest',
    'gpt-oss:20b',
    'mistral:latest',
    'openhermes:latest',
    'deepseek-coder:6.7b',
    'mistral:instruct'
  ]
}

export interface VisualAnalysis {
  mainNumbers: string[]
  keyFindings: string[]
  businessMessage: string
  businessDrivers: string[]
  context: string
  recommendations: string[]
  trends: string[]
  metadata: {
    analysisDate: string
    confidence: number
    keywords: string[]
  }
}

export interface DocumentAnalysis {
  executiveSummary: string
  mainMessages: string[]
  businessRecommendations: string[]
  businessDrivers: string[]
  contextualFactors: string[]
  followUpActions: string[]
  keyInsights: string[]
  metadata: {
    analysisDate: string
    confidence: number
    keywords: string[]
    documentType: string
    priority: 'high' | 'medium' | 'low'
  }
}

export interface VisualContent {
  id: string
  type: 'image' | 'chart' | 'graph' | 'table' | 'diagram' | 'infographic'
  description: string
  metadata?: {
    extractedText?: string
    documentTitle?: string
    [key: string]: string | number | boolean | undefined
  }
  [key: string]: string | number | boolean | object | undefined
}

class BrowserAnalysisEngine {
  private analysisCache = new Map<string, VisualAnalysis>()

  /**
   * Get cached visual analysis
   */
  async getVisualAnalysis(visualId: string): Promise<VisualAnalysis | null> {
    // First check cache
    if (this.analysisCache.has(visualId)) {
      return this.analysisCache.get(visualId) || null
    }

    // Try to get from localStorage as fallback
    try {
      const cached = localStorage.getItem(`visual_analysis_${visualId}`)
      if (cached) {
        const analysis = JSON.parse(cached) as VisualAnalysis
        this.analysisCache.set(visualId, analysis)
        return analysis
      }
    } catch (error) {
      console.warn('Failed to get cached analysis:', error)
    }

    return null
  }

  /**
   * Analyze visual content using API with fallback models
   */
  async analyzeVisualContent(visual: VisualContent): Promise<VisualAnalysis> {
    try {
      // Check cache first
      const cached = await this.getVisualAnalysis(visual.id)
      if (cached) {
        return cached
      }

      // Try primary model first, then fallback models
      const modelsToTry = [getAIModel(), ...getFallbackModels()]
      let lastError: Error | null = null

      for (const model of modelsToTry) {
        try {
          console.log(`🔍 Trying visual analysis with model: ${model}`)
          
          const response = await fetch('/api/ai-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'visual-analysis',
              prompt: this.getVisualAnalysisPrompt(visual),
              model,
              temperature: 0.3,
              max_tokens: 2000
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            const error = new Error(`Analysis API failed: ${response.status} - ${errorText}`)
            
            // If it's a model not found error, try next model
            if (response.status === 503 && errorText.includes('not found')) {
              console.warn(`Model ${model} not found, trying next fallback...`)
              lastError = error
              continue
            }
            
            throw error
          }

          const result = await response.json()
          
          // Parse the AI response - it should be JSON in the response field
          let analysisData
          try {
            let responseText = result.response || ''
            
            // Clean up the response - remove markdown code blocks if present
            responseText = responseText.trim()
            
            // Remove markdown code fences
            if (responseText.startsWith('```json')) {
              responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
            } else if (responseText.startsWith('```')) {
              responseText = responseText.replace(/^```\s*/i, '').replace(/```\s*$/, '')
            }
            
            // Try to find JSON object in the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              responseText = jsonMatch[0]
            }
            
            analysisData = JSON.parse(responseText)
            
            // Validate that we have at least some expected fields
            if (!analysisData || typeof analysisData !== 'object') {
              throw new Error('Invalid analysis data structure')
            }
            
            console.log(`✅ Successfully parsed analysis from ${model}`)
          } catch (parseError) {
            console.warn(`Failed to parse AI response as JSON from ${model}:`, parseError)
            console.warn('Raw response:', result.response?.substring(0, 200))
            lastError = new Error('Failed to parse response as JSON')
            continue
          }

          // If we get here, the analysis was successful
          const analysis: VisualAnalysis = {
            mainNumbers: analysisData.mainNumbers || [],
            keyFindings: analysisData.keyFindings || [],
            businessMessage: analysisData.businessMessage || 'Analysis completed',
            businessDrivers: analysisData.businessDrivers || [],
            context: analysisData.context || '',
            recommendations: analysisData.recommendations || [],
            trends: analysisData.trends || [],
            metadata: {
              analysisDate: new Date().toISOString(),
              confidence: analysisData.metadata?.confidence || 0.8,
              keywords: analysisData.metadata?.keywords || []
            }
          }

          // Cache the result
          this.analysisCache.set(visual.id, analysis)
          localStorage.setItem(`visual_analysis_${visual.id}`, JSON.stringify(analysis))

          return analysis

        } catch (modelError) {
          console.warn(`Model ${model} failed:`, modelError)
          lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
          continue
        }
      }

      // If we get here, all models failed
      console.error('All models failed for visual analysis:', lastError)
      throw lastError || new Error('All models failed')

    } catch (error) {
      console.error('Failed to analyze visual content:', error)
      
      // Return fallback analysis
      return this.createFallbackAnalysis(visual)
    }
  }

  /**
   * Analyze document content using API
   */
  async analyzeDocument(content: string, title?: string): Promise<DocumentAnalysis> {
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'document-analysis',
          prompt: this.getDocumentAnalysisPrompt(content, title),
          model: getAIModel(),
          temperature: 0.3,
          max_tokens: 3000
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Document analysis API failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      // Parse the AI response
      let analysisData
      try {
        analysisData = JSON.parse(result.response)
      } catch {
        console.warn('Failed to parse document analysis response as JSON')
        return this.createFallbackDocumentAnalysis(content, title)
      }
      
      const analysis: DocumentAnalysis = {
        executiveSummary: analysisData.executiveSummary || 'Document analysis completed',
        mainMessages: analysisData.mainMessages || [],
        businessRecommendations: analysisData.businessRecommendations || [],
        businessDrivers: analysisData.businessDrivers || [],
        contextualFactors: analysisData.contextualFactors || [],
        followUpActions: analysisData.followUpActions || [],
        keyInsights: analysisData.keyInsights || [],
        metadata: {
          analysisDate: new Date().toISOString(),
          confidence: analysisData.metadata?.confidence || 0.8,
          keywords: analysisData.metadata?.keywords || [],
          documentType: analysisData.metadata?.documentType || 'document',
          priority: analysisData.metadata?.priority || 'medium'
        }
      }

      return analysis
    } catch (error) {
      console.error('Failed to analyze document:', error)
      return this.createFallbackDocumentAnalysis(content, title)
    }
  }

  /**
   * Create document analysis prompt
   */
  private getDocumentAnalysisPrompt(content: string, title?: string): string {
    return `Analyze this business document and provide comprehensive strategic insights:

${title ? `Title: ${title}` : ''}

Content: ${content.slice(0, 4000)}${content.length > 4000 ? '...' : ''}

Provide analysis in JSON format with this structure:
{
  "executiveSummary": "Brief executive summary",
  "mainMessages": ["key message 1", "key message 2"],
  "businessRecommendations": ["recommendation 1", "recommendation 2"],
  "businessDrivers": ["driver 1", "driver 2"],
  "contextualFactors": ["factor 1", "factor 2"],
  "followUpActions": ["action 1", "action 2"],
  "keyInsights": ["insight 1", "insight 2"],
  "metadata": {
    "analysisDate": "${new Date().toISOString()}",
    "confidence": 0.85,
    "keywords": ["keyword1", "keyword2"],
    "documentType": "report|presentation|policy|manual|other",
    "priority": "high|medium|low"
  }
}`
  }

  /**
   * Create fallback document analysis
   */
  private createFallbackDocumentAnalysis(content: string, title?: string): DocumentAnalysis {
    return {
      executiveSummary: `Analysis of ${title || 'document'} (${content.length} characters)`,
      mainMessages: ['Document contains business-relevant information'],
      businessRecommendations: ['Review document for actionable insights'],
      businessDrivers: ['Information sharing', 'Documentation'],
      contextualFactors: ['Business context requires analysis'],
      followUpActions: ['Detailed review recommended'],
      keyInsights: ['Document analysis available for further processing'],
      metadata: {
        analysisDate: new Date().toISOString(),
        confidence: 0.5,
        keywords: ['document', 'analysis', 'business'],
        documentType: 'document',
        priority: 'medium'
      }
    }
  }
  private getVisualAnalysisPrompt(visual: VisualContent): string {
    return `Analyze this ${visual.type} and provide:
1. Main numbers/metrics shown
2. Key business insights
3. Main message of the visual
4. Business drivers and context
5. Trends identified
6. Recommendations based on the data

Visual: ${visual.description}
${visual.metadata?.extractedText ? `Text content: ${visual.metadata.extractedText}` : ''}

IMPORTANT: Respond with ONLY a valid JSON object, no markdown, no code blocks, no additional text.
The response must be a single JSON object with the following structure:
{
  "mainNumbers": ["number1", "number2"],
  "keyFindings": ["finding1", "finding2"],
  "businessMessage": "main message",
  "businessDrivers": ["driver1", "driver2"],
  "context": "business context",
  "recommendations": ["rec1", "rec2"],
  "trends": ["trend1", "trend2"],
  "metadata": {
    "analysisDate": "${new Date().toISOString()}",
    "confidence": 0.85,
    "keywords": ["keyword1", "keyword2"]
  }
}`
  }

  /**
   * Create fallback analysis when API fails
   */
  private createFallbackAnalysis(visual: VisualContent): VisualAnalysis {
    return {
      mainNumbers: [],
      keyFindings: [`Analysis of ${visual.type} from ${visual.metadata?.documentTitle || 'document'}`],
      businessMessage: `This ${visual.type} contains visual information that requires analysis.`,
      businessDrivers: ['Data visualization', 'Information presentation'],
      context: `${visual.type} extracted from business document`,
      recommendations: ['Review visual content for insights', 'Consider data analysis'],
      trends: [],
      metadata: {
        analysisDate: new Date().toISOString(),
        confidence: 0.5,
        keywords: [visual.type, 'visual', 'analysis']
      }
    }
  }

  /**
   * Batch analyze multiple visuals
   */
  async analyzeMultipleVisuals(visuals: VisualContent[]): Promise<Map<string, VisualAnalysis>> {
    const results = new Map<string, VisualAnalysis>()
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < visuals.length; i += batchSize) {
      const batch = visuals.slice(i, i + batchSize)
      const batchPromises = batch.map(visual => 
        this.analyzeVisualContent(visual).then(analysis => ({ visual, analysis }))
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.set(result.value.visual.id, result.value.analysis)
        }
      })
    }
    
    return results
  }
}

// Export singleton instance
export const browserAnalysisEngine = new BrowserAnalysisEngine()
