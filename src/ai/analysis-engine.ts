/**
 * AI ANALYSIS ENGINE
 * 
 * Provides intelligent analysis for:
 * - Visual content (charts, graphs, tables, diagrams)
 * - Documents (PDFs, Word docs, presentations)
 * - Business-focused summaries and insights
 * - Contextual metadata extraction
 */

import { VisualContent, Document, AIAnalysisData } from '../rag/types'
import { unifiedStorage } from '../storage/unified-storage-manager'

// Define response type for AI API
interface AIResponse {
  response?: string
  content?: string
  [key: string]: unknown
}

// Enhanced analysis types
export interface VisualAnalysis {
  id: string
  visualContentId: string
  documentId: string
  type: 'chart' | 'graph' | 'table' | 'diagram' | 'infographic' | 'other'
  
  // Main insights
  mainNumbers: {
    key: string
    value: string | number
    unit?: string
    context: string
  }[]
  
  mainMessage: string
  businessDrivers: string[]
  context: string
  
  // Data insights
  dataPoints: {
    category: string
    value: string | number
    trend?: 'increasing' | 'decreasing' | 'stable'
    significance: 'high' | 'medium' | 'low'
  }[]
  
  // Business intelligence
  businessInsights: {
    insight: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: 'performance' | 'risk' | 'opportunity' | 'trend'
    actionable: boolean
  }[]
  
  // Metadata
  keywords: string[]
  topics: string[]
  entities: string[]
  timestamp: Date
}

export interface DocumentAnalysis {
  id: string
  documentId: string
  
  // Core summary
  summary: string
  mainMessages: string[]
  
  // Business recommendations
  businessRecommendations: {
    recommendation: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: 'strategic' | 'operational' | 'financial' | 'risk'
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term'
    impact: 'high' | 'medium' | 'low'
  }[]
  
  // Context and drivers
  businessDrivers: string[]
  context: string
  
  // Follow-up actions
  followUpActions: {
    action: string
    owner?: string
    deadline?: string
    dependencies?: string[]
  }[]
  
  // Key insights
  keyInsights: {
    insight: string
    supporting_evidence: string[]
    confidence: number // 0-1
  }[]
  
  // Metadata
  keywords: string[]
  topics: string[]
  entities: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  complexity: 'low' | 'medium' | 'high'
  timestamp: Date
}

export interface CombinedAnalysis {
  documentId: string
  documentAnalysis: DocumentAnalysis
  visualAnalyses: VisualAnalysis[]
  
  // Cross-reference insights
  correlations: {
    visual_id: string
    document_section: string
    correlation_type: 'supports' | 'contradicts' | 'extends' | 'clarifies'
    description: string
  }[]
  
  // Unified insights
  unifiedInsights: {
    insight: string
    sources: ('document' | string)[] // 'document' or visual IDs
    confidence: number
    business_impact: 'high' | 'medium' | 'low'
  }[]
  
  // Executive summary
  executiveSummary: string
  keyTakeaways: string[]
  
  timestamp: Date
}

// AI Analysis Engine
export class AIAnalysisEngine {
  private apiEndpoint: string
  private model: string
  
  constructor(apiEndpoint = '/api/ai-analysis', model = 'llama-3.1-70b') {
    this.apiEndpoint = apiEndpoint
    this.model = model
  }
  
  // Analyze visual content
  async analyzeVisualContent(visual: VisualContent, document?: Document): Promise<VisualAnalysis> {
    console.log(`🔍 Analyzing visual content: ${visual.id}`)
    
    const prompt = this.buildVisualAnalysisPrompt(visual, document)
    
    try {
      const response = await this.callAI(prompt, 'visual-analysis')
      const analysis = this.parseVisualAnalysisResponse(response, visual)
      
      // Store analysis
      await this.storeVisualAnalysis(analysis)
      
      console.log(`✅ Visual analysis completed for: ${visual.id}`)
      return analysis
      
    } catch (error) {
      console.error(`❌ Visual analysis failed for ${visual.id}:`, error)
      throw error
    }
  }
  
  // Analyze document
  async analyzeDocument(document: Document): Promise<DocumentAnalysis> {
    console.log(`📄 Analyzing document: ${document.name}`)
    
    const prompt = this.buildDocumentAnalysisPrompt(document)
    
    try {
      const response = await this.callAI(prompt, 'document-analysis')
      const analysis = this.parseDocumentAnalysisResponse(response, document)
      
      // Store analysis
      await this.storeDocumentAnalysis(analysis)
      
      console.log(`✅ Document analysis completed for: ${document.name}`)
      return analysis
      
    } catch (error) {
      console.error(`❌ Document analysis failed for ${document.name}:`, error)
      throw error
    }
  }
  
  // Create combined analysis
  async createCombinedAnalysis(
    documentAnalysis: DocumentAnalysis, 
    visualAnalyses: VisualAnalysis[]
  ): Promise<CombinedAnalysis> {
    console.log(`🔄 Creating combined analysis for document: ${documentAnalysis.documentId}`)
    
    const prompt = this.buildCombinedAnalysisPrompt(documentAnalysis, visualAnalyses)
    
    try {
      const response = await this.callAI(prompt, 'combined-analysis')
      const combined = this.parseCombinedAnalysisResponse(response, documentAnalysis, visualAnalyses)
      
      // Store combined analysis
      await this.storeCombinedAnalysis(combined)
      
      console.log(`✅ Combined analysis completed for: ${documentAnalysis.documentId}`)
      return combined
      
    } catch (error) {
      console.error(`❌ Combined analysis failed:`, error)
      throw error
    }
  }
  
  // Build prompts
  private buildVisualAnalysisPrompt(visual: VisualContent, document?: Document): string {
    const contextInfo = document ? `
Document Context:
- Name: ${document.name}
- Type: ${document.type}
- Content Preview: ${document.content.substring(0, 500)}...
` : ''
    
    return `
Analyze this visual content and provide business-focused insights:

Visual Content Details:
- Type: ${visual.type}
- Description: ${visual.description || 'No description provided'}
- Data: ${visual.data ? JSON.stringify(visual.data, null, 2) : 'No data available'}
- Metadata: ${visual.metadata ? JSON.stringify(visual.metadata, null, 2) : 'No metadata available'}

${contextInfo}

Please provide a comprehensive analysis with:

1. MAIN NUMBERS: Extract and list the 3-5 most important numerical values with context
2. MAIN MESSAGE: What is the core message this visual conveys?
3. BUSINESS DRIVERS: What business factors or drivers are represented?
4. CONTEXT: What business context or situation does this visual address?
5. DATA INSIGHTS: Key data points with trends and significance
6. BUSINESS INSIGHTS: Actionable business insights with priorities
7. KEYWORDS: Relevant business keywords and terms
8. TOPICS: Main business topics covered
9. ENTITIES: Business entities, products, markets mentioned

Focus on business value, actionable insights, and strategic implications.
Be specific with numbers and provide clear business context.

Return response in JSON format with the structure matching VisualAnalysis interface.
`
  }
  
  private buildDocumentAnalysisPrompt(document: Document): string {
    return `
Analyze this business document and provide comprehensive insights:

Document Details:
- Name: ${document.name}
- Type: ${document.type}
- Content: ${document.content}

Please provide a thorough business analysis with:

1. SUMMARY: Clear, concise summary of the document
2. MAIN MESSAGES: 3-5 key messages the document conveys
3. BUSINESS RECOMMENDATIONS: Specific, actionable recommendations with priorities
4. BUSINESS DRIVERS: Key business drivers and factors mentioned
5. CONTEXT: Business context and situation
6. FOLLOW-UP ACTIONS: Specific actions that should be taken
7. KEY INSIGHTS: Important insights with supporting evidence
8. KEYWORDS: Business-relevant keywords
9. TOPICS: Main business topics
10. ENTITIES: Organizations, people, products, markets mentioned
11. SENTIMENT: Overall tone and sentiment
12. COMPLEXITY: Assessment of document complexity

Focus on:
- Strategic implications
- Operational impacts
- Financial considerations
- Risk factors
- Opportunities
- Clear actionable next steps

Return response in JSON format matching DocumentAnalysis interface.
`
  }
  
  private buildCombinedAnalysisPrompt(
    documentAnalysis: DocumentAnalysis, 
    visualAnalyses: VisualAnalysis[]
  ): string {
    const visualSummary = visualAnalyses.map(v => `
Visual ${v.id}:
- Type: ${v.type}
- Main Message: ${v.mainMessage}
- Key Numbers: ${v.mainNumbers.map(n => `${n.key}: ${n.value} ${n.unit || ''}`).join(', ')}
- Business Insights: ${v.businessInsights.map(i => i.insight).join('; ')}
`).join('\n')

    return `
Create a unified analysis combining document insights with visual content insights:

DOCUMENT ANALYSIS:
- Summary: ${documentAnalysis.summary}
- Main Messages: ${documentAnalysis.mainMessages.join('; ')}
- Key Recommendations: ${documentAnalysis.businessRecommendations.map(r => r.recommendation).join('; ')}

VISUAL ANALYSES:
${visualSummary}

Please provide:

1. CORRELATIONS: How do the visuals support, contradict, or extend the document insights?
2. UNIFIED INSIGHTS: What combined insights emerge from both document and visuals?
3. EXECUTIVE SUMMARY: High-level summary for executives
4. KEY TAKEAWAYS: Most important points for business decision-making

Focus on:
- Strategic alignment between text and visuals
- Contradictions or gaps that need attention
- Reinforced messages across multiple sources
- Overall business narrative

Return response in JSON format matching CombinedAnalysis interface.
`
  }
  
  // AI API call
  private async callAI(prompt: string, type: string): Promise<AIResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          type,
          temperature: 0.3, // Lower for more consistent analysis
          max_tokens: 4000
        })
      })
      
      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.response || data.content || data
      
    } catch (error) {
      console.error('AI API call failed:', error)
      throw error
    }
  }
  
  // Response parsers
  private parseVisualAnalysisResponse(response: unknown, visual: VisualContent): VisualAnalysis {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response
      
      return {
        id: `visual_analysis_${visual.id}_${Date.now()}`,
        visualContentId: visual.id,
        documentId: visual.documentId,
        type: this.detectVisualType(visual),
        mainNumbers: parsed.mainNumbers || [],
        mainMessage: parsed.mainMessage || 'No main message identified',
        businessDrivers: parsed.businessDrivers || [],
        context: parsed.context || '',
        dataPoints: parsed.dataPoints || [],
        businessInsights: parsed.businessInsights || [],
        keywords: parsed.keywords || [],
        topics: parsed.topics || [],
        entities: parsed.entities || [],
        timestamp: new Date()
      }
    } catch {
      console.warn('Failed to parse visual analysis response, using fallback')
      return this.createFallbackVisualAnalysis(visual)
    }
  }
  
  private parseDocumentAnalysisResponse(response: unknown, document: Document): DocumentAnalysis {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response
      
      return {
        id: `doc_analysis_${document.id}_${Date.now()}`,
        documentId: document.id,
        summary: parsed.summary || 'Document analysis summary not available',
        mainMessages: parsed.mainMessages || [],
        businessRecommendations: parsed.businessRecommendations || [],
        businessDrivers: parsed.businessDrivers || [],
        context: parsed.context || '',
        followUpActions: parsed.followUpActions || [],
        keyInsights: parsed.keyInsights || [],
        keywords: parsed.keywords || [],
        topics: parsed.topics || [],
        entities: parsed.entities || [],
        sentiment: parsed.sentiment || 'neutral',
        complexity: parsed.complexity || 'medium',
        timestamp: new Date()
      }
    } catch {
      console.warn('Failed to parse document analysis response, using fallback')
      return this.createFallbackDocumentAnalysis(document)
    }
  }
  
  private parseCombinedAnalysisResponse(
    response: unknown, 
    documentAnalysis: DocumentAnalysis, 
    visualAnalyses: VisualAnalysis[]
  ): CombinedAnalysis {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response
      
      return {
        documentId: documentAnalysis.documentId,
        documentAnalysis,
        visualAnalyses,
        correlations: parsed.correlations || [],
        unifiedInsights: parsed.unifiedInsights || [],
        executiveSummary: parsed.executiveSummary || 'Executive summary not available',
        keyTakeaways: parsed.keyTakeaways || [],
        timestamp: new Date()
      }
    } catch {
      console.warn('Failed to parse combined analysis response, using fallback')
      return this.createFallbackCombinedAnalysis(documentAnalysis, visualAnalyses)
    }
  }
  
  // Utility methods
  private detectVisualType(visual: VisualContent): VisualAnalysis['type'] {
    const type = visual.type.toLowerCase()
    if (type.includes('chart') || type.includes('graph')) return 'chart'
    if (type.includes('table')) return 'table'
    if (type.includes('diagram')) return 'diagram'
    if (type.includes('infographic')) return 'infographic'
    return 'other'
  }
  
  // Fallback methods for when AI parsing fails
  private createFallbackVisualAnalysis(visual: VisualContent): VisualAnalysis {
    return {
      id: `visual_analysis_${visual.id}_${Date.now()}`,
      visualContentId: visual.id,
      documentId: visual.documentId,
      type: this.detectVisualType(visual),
      mainNumbers: [],
      mainMessage: 'Analysis could not be completed - manual review recommended',
      businessDrivers: [],
      context: '',
      dataPoints: [],
      businessInsights: [],
      keywords: [],
      topics: [],
      entities: [],
      timestamp: new Date()
    }
  }
  
  private createFallbackDocumentAnalysis(document: Document): DocumentAnalysis {
    return {
      id: `doc_analysis_${document.id}_${Date.now()}`,
      documentId: document.id,
      summary: 'Document analysis could not be completed - manual review recommended',
      mainMessages: [],
      businessRecommendations: [],
      businessDrivers: [],
      context: '',
      followUpActions: [],
      keyInsights: [],
      keywords: [],
      topics: [],
      entities: [],
      sentiment: 'neutral',
      complexity: 'medium',
      timestamp: new Date()
    }
  }
  
  private createFallbackCombinedAnalysis(
    documentAnalysis: DocumentAnalysis, 
    visualAnalyses: VisualAnalysis[]
  ): CombinedAnalysis {
    return {
      documentId: documentAnalysis.documentId,
      documentAnalysis,
      visualAnalyses,
      correlations: [],
      unifiedInsights: [],
      executiveSummary: 'Combined analysis could not be completed - manual review recommended',
      keyTakeaways: [],
      timestamp: new Date()
    }
  }
  
  // Storage methods
  private async storeVisualAnalysis(analysis: VisualAnalysis): Promise<void> {
    try {
      await unifiedStorage.storeAIAnalysis(
        `visual_${analysis.visualContentId}`, 
        analysis as unknown as AIAnalysisData
      )
    } catch (error) {
      console.error('Failed to store visual analysis:', error)
    }
  }
  
  private async storeDocumentAnalysis(analysis: DocumentAnalysis): Promise<void> {
    try {
      await unifiedStorage.storeAIAnalysis(
        analysis.documentId, 
        analysis as unknown as AIAnalysisData
      )
    } catch (error) {
      console.error('Failed to store document analysis:', error)
    }
  }
  
  private async storeCombinedAnalysis(analysis: CombinedAnalysis): Promise<void> {
    try {
      await unifiedStorage.storeAIAnalysis(
        `combined_${analysis.documentId}`, 
        analysis as unknown as AIAnalysisData
      )
    } catch (error) {
      console.error('Failed to store combined analysis:', error)
    }
  }
  
  // Retrieval methods
  async getVisualAnalysis(visualId: string): Promise<VisualAnalysis | null> {
    try {
      return await unifiedStorage.retrieveAIAnalysis(`visual_${visualId}`) as VisualAnalysis | null
    } catch (error) {
      console.error('Failed to retrieve visual analysis:', error)
      return null
    }
  }
  
  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      return await unifiedStorage.retrieveAIAnalysis(documentId) as DocumentAnalysis | null
    } catch (error) {
      console.error('Failed to retrieve document analysis:', error)
      return null
    }
  }
  
  async getCombinedAnalysis(documentId: string): Promise<CombinedAnalysis | null> {
    try {
      return await unifiedStorage.retrieveAIAnalysis(`combined_${documentId}`) as CombinedAnalysis | null
    } catch (error) {
      console.error('Failed to retrieve combined analysis:', error)
      return null
    }
  }
}

// Export singleton
export const aiAnalysisEngine = new AIAnalysisEngine()
export default aiAnalysisEngine
