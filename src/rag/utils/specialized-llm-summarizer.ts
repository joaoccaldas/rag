// Specialized LLM Summarization System
// Addresses Issue 4: Inaccurate LLM summaries for specific domains

interface RawSummaryResponse {
  keyInsights: string[]
  challenges: string[]
  mainContent: string
  significance: string
  [key: string]: unknown // Allow indexing
}

interface DomainContext {
  domain: string
  keywords: string[]
  entityTypes: string[]
  validationRules: ValidationRule[]
  promptTemplate: string
  expectedOutputStructure: Record<string, string>
}

interface ValidationRule {
  type: 'required_keywords' | 'factual_consistency' | 'domain_relevance' | 'completeness'
  criteria: string[]
  weight: number
}

interface LLMSummaryRequest {
  content: string
  contentType: 'document' | 'visual' | 'data'
  domain?: string
  existingKeywords?: string[]
  validationContext?: Record<string, unknown>
}

interface EnhancedLLMSummary {
  keyInsights: string[]
  challenges: string[]
  mainContent: string
  significance: string
  confidence: number
  domain: string
  factualAccuracy: number
  completeness: number
  validationPassed: boolean
  validationErrors: string[]
  suggestedKeywords: string[]
  relatedConcepts: string[]
}

export class SpecializedLLMSummarizer {
  private domainContexts: Map<string, DomainContext> = new Map()
  private summaryHistory: Map<string, EnhancedLLMSummary> = new Map()

  constructor() {
    this.initializeDomainContexts()
    this.loadPersistedData()
  }

  /**
   * Initialize domain-specific contexts and prompts
   */
  private initializeDomainContexts(): void {
    // Business/Customer Service Domain
    this.domainContexts.set('business', {
      domain: 'business',
      keywords: [
        'product', 'service', 'customer', 'quality', 'appliance', 'home', 'kitchen',
        'washing', 'cleaning', 'efficiency', 'performance', 'warranty', 'support',
        'installation', 'maintenance', 'repair', 'troubleshooting', 'manual'
      ],
      entityTypes: [
        'product_names', 'model_numbers', 'specifications', 'features', 'measurements',
        'service_procedures', 'warranty_terms', 'contact_information'
      ],
      validationRules: [
        {
          type: 'required_keywords',
          criteria: ['product', 'service', 'customer', 'quality'],
          weight: 0.3
        },
        {
          type: 'factual_consistency',
          criteria: ['specifications_accurate', 'procedures_correct', 'safety_compliant'],
          weight: 0.4
        },
        {
          type: 'domain_relevance',
          criteria: ['business_context', 'customer_focused'],
          weight: 0.3
        }
      ],
      promptTemplate: `
You are an expert astronomical analyst specializing in exoplanet discoveries and space science. 
Analyze the following content and provide a comprehensive summary focused on:

CONTENT: {content}

Requirements:
1. KEY INSIGHTS: Extract the most significant scientific discoveries, measurements, or findings
2. CHALLENGES: Identify any scientific challenges, limitations, or uncertainties mentioned
3. MAIN CONTENT: Provide a clear, factually accurate summary of the astronomical data
4. SIGNIFICANCE: Explain the importance of this discovery/information in the context of space science

Focus on:
- Exoplanet characteristics (size, mass, orbital period, temperature)
- Host star properties (type, mass, luminosity, distance)
- Discovery methods and instruments used
- Habitability potential and atmospheric conditions
- Scientific significance and future research implications

Ensure all measurements include proper units and scientific accuracy.
Avoid speculation beyond what the data supports.
`,
      expectedOutputStructure: {
        keyInsights: 'Array of specific scientific discoveries or measurements',
        challenges: 'Array of scientific limitations or uncertainties',
        mainContent: 'Factual summary focusing on astronomical data',
        significance: 'Scientific importance and research implications'
      }
    })

    // Business/Strategy Domain
    this.domainContexts.set('business', {
      domain: 'business',
      keywords: [
        'strategy', 'market', 'revenue', 'growth', 'customer', 'product', 'analysis',
        'performance', 'competitive', 'investment', 'ROI', 'KPI', 'metrics', 'optimization'
      ],
      entityTypes: [
        'company_names', 'product_names', 'financial_metrics', 'market_segments',
        'strategic_initiatives', 'performance_indicators'
      ],
      validationRules: [
        {
          type: 'required_keywords',
          criteria: ['business', 'strategy', 'market', 'performance'],
          weight: 0.25
        },
        {
          type: 'factual_consistency',
          criteria: ['financial_accuracy', 'metric_consistency'],
          weight: 0.35
        },
        {
          type: 'completeness',
          criteria: ['strategic_context', 'actionable_insights'],
          weight: 0.4
        }
      ],
      promptTemplate: `
You are a senior business analyst with expertise in strategic planning and market analysis.
Analyze the following business content and provide insights focused on:

CONTENT: {content}

Requirements:
1. KEY INSIGHTS: Extract strategic insights, performance metrics, and business opportunities
2. CHALLENGES: Identify business challenges, risks, or market obstacles
3. MAIN CONTENT: Summarize key business information, strategies, and performance data
4. SIGNIFICANCE: Explain the strategic importance and business implications

Focus on:
- Strategic objectives and initiatives
- Market positioning and competitive advantages
- Financial performance and key metrics
- Customer insights and market opportunities
- Risk factors and mitigation strategies

Provide actionable insights based on the data presented.
`,
      expectedOutputStructure: {
        keyInsights: 'Strategic insights and business opportunities',
        challenges: 'Business risks and market obstacles',
        mainContent: 'Strategic and performance summary',
        significance: 'Business impact and strategic importance'
      }
    })

    // Technical/Engineering Domain
    this.domainContexts.set('technical', {
      domain: 'technical',
      keywords: [
        'system', 'architecture', 'implementation', 'performance', 'scalability',
        'optimization', 'algorithm', 'framework', 'infrastructure', 'integration'
      ],
      entityTypes: [
        'system_names', 'technology_stack', 'performance_metrics', 'architecture_components',
        'implementation_details', 'technical_specifications'
      ],
      validationRules: [
        {
          type: 'required_keywords',
          criteria: ['system', 'implementation', 'performance'],
          weight: 0.3
        },
        {
          type: 'factual_consistency',
          criteria: ['technical_accuracy', 'specification_consistency'],
          weight: 0.4
        },
        {
          type: 'completeness',
          criteria: ['implementation_details', 'system_context'],
          weight: 0.3
        }
      ],
      promptTemplate: `
You are a senior technical architect with expertise in system design and implementation.
Analyze the following technical content and provide insights focused on:

CONTENT: {content}

Requirements:
1. KEY INSIGHTS: Extract technical insights, architectural decisions, and implementation details
2. CHALLENGES: Identify technical challenges, limitations, or complexity factors
3. MAIN CONTENT: Summarize system architecture, implementation approach, and technical specifications
4. SIGNIFICANCE: Explain the technical importance and system implications

Focus on:
- System architecture and design patterns
- Implementation strategies and technical approaches
- Performance characteristics and scalability considerations
- Integration points and technical dependencies
- Technical trade-offs and decision rationale

Provide technically accurate analysis based on the information presented.
`,
      expectedOutputStructure: {
        keyInsights: 'Technical insights and architectural decisions',
        challenges: 'Technical limitations and complexity factors',
        mainContent: 'Technical architecture and implementation summary',
        significance: 'Technical impact and system implications'
      }
    })
  }

  /**
   * Generate enhanced LLM summary with domain awareness
   */
  async generateEnhancedSummary(request: LLMSummaryRequest): Promise<EnhancedLLMSummary> {
    // 1. Detect domain if not provided
    const detectedDomain = request.domain || this.detectContentDomain(request.content)
    const domainContext = this.domainContexts.get(detectedDomain)

    // 2. Prepare domain-specific prompt
    const prompt = this.prepareDomainPrompt(request.content, domainContext)

    // 3. Generate summary (mock LLM call - in real implementation, this would call actual LLM)
    const rawSummary = await this.callLLMService(prompt, domainContext)

    // 4. Validate and enhance summary
    const enhancedSummary = await this.validateAndEnhanceSummary(
      rawSummary,
      request,
      domainContext
    )

    // 5. Store for learning
    const summaryId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.summaryHistory.set(summaryId, enhancedSummary)
    this.persistData()

    console.log(`🧠 Generated ${detectedDomain} domain summary with ${enhancedSummary.confidence}% confidence`)

    return enhancedSummary
  }

  /**
   * Detect content domain based on keywords and patterns
   */
  private detectContentDomain(content: string): string {
    const contentLower = content.toLowerCase()
    let maxScore = 0
    let detectedDomain = 'general'

    for (const [domain, context] of this.domainContexts.entries()) {
      const score = context.keywords.reduce((acc, keyword) => {
        return acc + (contentLower.includes(keyword) ? 1 : 0)
      }, 0) / context.keywords.length

      if (score > maxScore) {
        maxScore = score
        detectedDomain = domain
      }
    }

    return maxScore > 0.1 ? detectedDomain : 'general'
  }

  /**
   * Prepare domain-specific prompt
   */
  private prepareDomainPrompt(content: string, domainContext?: DomainContext): string {
    if (!domainContext) {
      return `Analyze and summarize the following content:\n\n${content}`
    }

    return domainContext.promptTemplate.replace('{content}', content)
  }

  /**
   * Mock LLM service call (replace with actual LLM integration)
   */
  private async callLLMService(prompt: string, domainContext?: DomainContext): Promise<RawSummaryResponse> {
    // This is a mock implementation
    // In a real system, this would call OpenAI, Anthropic, or another LLM service
    
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call

    // Mock response based on domain
    if (domainContext?.domain === 'business') {
      return {
        keyInsights: [
          'Product specifications and performance characteristics',
          'Customer service procedures and support guidelines',
          'Quality standards and warranty information'
        ],
        challenges: [
          'Technical troubleshooting complexity',
          'Customer education on proper usage',
          'Maintenance schedule optimization'
        ],
        mainContent: 'Analysis of business documentation covering product information, service procedures, and customer support guidelines',
        significance: 'This information helps improve customer experience and product satisfaction through better understanding of features and support options'
      }
    }

    return {
      keyInsights: ['Key insight 1', 'Key insight 2'],
      challenges: ['Challenge 1', 'Challenge 2'],
      mainContent: 'Summary of the analyzed content',
      significance: 'Significance of the content in its domain'
    }
  }

  /**
   * Validate and enhance the raw LLM summary
   */
  private async validateAndEnhanceSummary(
    rawSummary: RawSummaryResponse,
    request: LLMSummaryRequest,
    domainContext?: DomainContext
  ): Promise<EnhancedLLMSummary> {
    const validation = this.validateSummaryQuality(rawSummary, request.content, domainContext)
    
    return {
      keyInsights: rawSummary.keyInsights || [],
      challenges: rawSummary.challenges || [],
      mainContent: rawSummary.mainContent || '',
      significance: rawSummary.significance || '',
      confidence: validation.overallScore,
      domain: domainContext?.domain || 'general',
      factualAccuracy: validation.factualAccuracy,
      completeness: validation.completeness,
      validationPassed: validation.overallScore >= 0.7,
      validationErrors: validation.errors,
      suggestedKeywords: this.extractSuggestedKeywords(rawSummary, domainContext),
      relatedConcepts: this.identifyRelatedConcepts(rawSummary, domainContext)
    }
  }

  /**
   * Validate summary quality against domain rules
   */
  private validateSummaryQuality(
    summary: RawSummaryResponse,
    originalContent: string,
    domainContext?: DomainContext
  ): {
    overallScore: number
    factualAccuracy: number
    completeness: number
    errors: string[]
  } {
    const errors: string[] = []
    let totalScore = 0.8 // Base score
    let factualAccuracy = 0.8
    let completeness = 0.8

    if (!domainContext) {
      return { overallScore: totalScore, factualAccuracy, completeness, errors }
    }

    // Validate against domain rules
    for (const rule of domainContext.validationRules) {
      let ruleScore = 0

      switch (rule.type) {
        case 'required_keywords':
          const summaryText = JSON.stringify(summary).toLowerCase()
          const foundKeywords = rule.criteria.filter(keyword => 
            summaryText.includes(keyword.toLowerCase())
          )
          ruleScore = foundKeywords.length / rule.criteria.length
          
          if (ruleScore < 0.5) {
            errors.push(`Missing required domain keywords: ${rule.criteria.join(', ')}`)
          }
          break

        case 'factual_consistency':
          // Check for consistent units, measurements, proper scientific terminology
          ruleScore = this.validateFactualConsistency(summary, originalContent, domainContext)
          factualAccuracy = ruleScore
          break

        case 'completeness':
          // Check if all expected sections are present and meaningful
          ruleScore = this.validateCompleteness(summary, domainContext)
          completeness = ruleScore
          break

        case 'domain_relevance':
          // Check if content is relevant to the domain
          ruleScore = this.validateDomainRelevance(summary, domainContext)
          break
      }

      totalScore += (ruleScore - 0.5) * rule.weight
    }

    totalScore = Math.max(0, Math.min(1, totalScore))

    return {
      overallScore: totalScore,
      factualAccuracy,
      completeness,
      errors
    }
  }

  /**
   * Validate factual consistency
   */
  private validateFactualConsistency(
    summary: RawSummaryResponse,
    originalContent: string,
    domainContext: DomainContext
  ): number {
    let score = 0.8 // Base score

    if (domainContext.domain === 'business') {
      // Check for proper business units and measurements
      const summaryText = JSON.stringify(summary)
      const hasProperUnits = /\b(rpm|kg|watts|volts|liters|degrees|minutes|hours|years)\b/.test(summaryText)
      if (hasProperUnits) score += 0.1

      // Check for business accuracy indicators
      const hasBusinessTerms = /\b(product|service|warranty|maintenance|customer|quality|support|installation)\b/.test(summaryText)
      if (hasBusinessTerms) score += 0.1
    }

    return Math.min(1, score)
  }

  /**
   * Validate completeness
   */
  private validateCompleteness(summary: RawSummaryResponse, domainContext: DomainContext): number {
    let score = 0
    const expectedFields = Object.keys(domainContext.expectedOutputStructure)

    for (const field of expectedFields) {
      const value = summary[field]
      if (value && Array.isArray(value) && value.length > 0) {
        score += 1 / expectedFields.length
      } else if (typeof value === 'string' && value.length > 0) {
        score += 1 / expectedFields.length
      }
    }

    return score
  }

  /**
   * Validate domain relevance
   */
  private validateDomainRelevance(summary: RawSummaryResponse, domainContext: DomainContext): number {
    const summaryText = JSON.stringify(summary).toLowerCase()
    const domainTerms = domainContext.keywords.filter(keyword => 
      summaryText.includes(keyword.toLowerCase())
    )

    return Math.min(1, domainTerms.length / domainContext.keywords.length + 0.3)
  }

  /**
   * Extract suggested keywords from summary
   */
  private extractSuggestedKeywords(summary: RawSummaryResponse, domainContext?: DomainContext): string[] {
    const summaryText = JSON.stringify(summary).toLowerCase()
    const keywords: string[] = []

    if (domainContext) {
      // Add domain keywords found in summary
      keywords.push(...domainContext.keywords.filter(keyword => 
        summaryText.includes(keyword.toLowerCase())
      ))
    }

    // Extract potential new keywords (simple word extraction)
    const words = summaryText.match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = [...new Set(words)]
      .filter(word => !keywords.includes(word))
      .slice(0, 5)

    keywords.push(...uniqueWords)

    return keywords.slice(0, 10)
  }

  /**
   * Identify related concepts
   */
  private identifyRelatedConcepts(summary: RawSummaryResponse, domainContext?: DomainContext): string[] {
    const concepts: string[] = []

    if (domainContext?.domain === 'business') {
      const summaryText = JSON.stringify(summary).toLowerCase()
      
      if (summaryText.includes('product')) concepts.push('Product Management')
      if (summaryText.includes('service')) concepts.push('Customer Service')
      if (summaryText.includes('warranty')) concepts.push('Product Support')
      if (summaryText.includes('maintenance')) concepts.push('Technical Service')
    }

    return concepts
  }

  /**
   * Get summary history and analytics
   */
  getSummaryAnalytics() {
    const summaries = Array.from(this.summaryHistory.values())
    
    return {
      totalSummaries: summaries.length,
      averageConfidence: summaries.reduce((acc, s) => acc + s.confidence, 0) / summaries.length,
      domainDistribution: this.getDomainDistribution(summaries),
      qualityTrend: this.getQualityTrend(summaries),
      validationPassRate: summaries.filter(s => s.validationPassed).length / summaries.length
    }
  }

  private getDomainDistribution(summaries: EnhancedLLMSummary[]) {
    const distribution = new Map<string, number>()
    summaries.forEach(summary => {
      distribution.set(summary.domain, (distribution.get(summary.domain) || 0) + 1)
    })
    return Object.fromEntries(distribution)
  }

  private getQualityTrend(summaries: EnhancedLLMSummary[]) {
    return summaries.slice(-10).map(s => s.confidence)
  }

  /**
   * Load persisted data
   */
  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('specialized_llm_summaries')
      if (stored) {
        const data = JSON.parse(stored)
        this.summaryHistory = new Map(data.summaryHistory || [])
      }
    } catch (error) {
      console.warn('Failed to load persisted LLM summary data:', error)
    }
  }

  /**
   * Persist data
   */
  private persistData(): void {
    try {
      const data = {
        summaryHistory: Array.from(this.summaryHistory.entries())
      }
      localStorage.setItem('specialized_llm_summaries', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist LLM summary data:', error)
    }
  }
}

// Singleton instance
export const specializedLLMSummarizer = new SpecializedLLMSummarizer()
