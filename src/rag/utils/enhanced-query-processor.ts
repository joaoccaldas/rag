// Enhanced Query Processing & Relevance Validation
// Addresses Issue 1: Unrelated sources getting high matching scores

import { SearchResult, Document } from '../types'

interface QueryIntent {
  domain: string
  entityTypes: string[]
  searchScope: 'specific' | 'broad' | 'contextual'
  expectedResultTypes: string[]
}

interface RelevanceValidation {
  semanticRelevance: number
  domainRelevance: number
  entityRelevance: number
  finalScore: number
  explanation: string
}

// Dynamic domain keyword detection using custom keyword sets
function getCustomDomainKeywords(): Record<string, string[]> {
  // Only access localStorage on client side
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('miele-domain-keywords')
      if (stored) {
        const data = JSON.parse(stored)
        const keywordSets = data.keywordSets || []
        
        const result: Record<string, string[]> = {}
        
        for (const set of keywordSets) {
          if (set.isActive) {
            if (!result[set.domain]) {
              result[set.domain] = []
            }
            result[set.domain].push(...set.keywords)
          }
        }
        
        // Remove duplicates
        for (const domain in result) {
          result[domain] = [...new Set(result[domain])]
        }
        
        return result
      }
    } catch (error) {
      console.warn('Failed to load custom domain keywords:', error)
    }
  }
  
  // Fallback to default keywords
  return {
    'business': ['strategy', 'market', 'revenue', 'customer', 'product', 'analysis', 'appliance', 'home', 'quality'],
    'technical': ['system', 'process', 'implementation', 'architecture', 'performance', 'specification', 'feature'],
    'service': ['support', 'maintenance', 'repair', 'warranty', 'installation', 'troubleshooting']
  }
}

export class EnhancedQueryProcessor {
  // Use dynamic keywords from custom keyword sets
  private static get DOMAIN_KEYWORDS() {
    return getCustomDomainKeywords()
  }

  private static readonly ENTITY_PATTERNS = {
    'planets': /\b(exoplanet|planet|world|sphere|celestial\s+body)\b/gi,
    'stars': /\b(star|stellar|solar|sun|dwarf|giant)\b/gi,
    'measurements': /\b(\d+\.\d+|\d+)\s*(km|miles|au|light\s*years?|days?|years?)\b/gi,
    'discovery': /\b(discover|find|identify|observe|detect)\b/gi
  }

  /**
   * Analyze query intent and extract domain context
   */
  static analyzeQueryIntent(query: string): QueryIntent {
    const normalizedQuery = query.toLowerCase()
    
    // Detect domain
    let domain = 'general'
    let maxDomainScore = 0
    
    for (const [domainName, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (normalizedQuery.includes(keyword) ? 1 : 0)
      }, 0) / keywords.length
      
      if (score > maxDomainScore) {
        maxDomainScore = score
        domain = domainName
      }
    }

    // Extract entities
    const entityTypes: string[] = []
    for (const [entityType, pattern] of Object.entries(this.ENTITY_PATTERNS)) {
      if (pattern.test(query)) {
        entityTypes.push(entityType)
      }
    }

    // Determine search scope
    const specificIndicators = ['specific', 'exact', 'particular', 'named', 'id', 'number']
    const broadIndicators = ['all', 'any', 'list', 'overview', 'summary']
    
    let searchScope: 'specific' | 'broad' | 'contextual' = 'contextual'
    if (specificIndicators.some(indicator => normalizedQuery.includes(indicator))) {
      searchScope = 'specific'
    } else if (broadIndicators.some(indicator => normalizedQuery.includes(indicator))) {
      searchScope = 'broad'
    }

    // Expected result types based on query
    const expectedResultTypes: string[] = []
    if (query.includes('data') || query.includes('csv')) expectedResultTypes.push('dataset')
    if (query.includes('analysis') || query.includes('report')) expectedResultTypes.push('analysis')
    if (query.includes('image') || query.includes('chart')) expectedResultTypes.push('visual')

    return {
      domain,
      entityTypes,
      searchScope,
      expectedResultTypes
    }
  }

  /**
   * Expand query with domain-specific context
   */
  static expandQuery(query: string, intent: QueryIntent): string {
    let expandedQuery = query

    // Add domain context
    if (intent.domain !== 'general') {
      const domainKeywords = this.DOMAIN_KEYWORDS[intent.domain as keyof typeof this.DOMAIN_KEYWORDS] || []
      const relevantKeywords = domainKeywords.slice(0, 3).join(' ')
      expandedQuery += ` ${relevantKeywords}`
    }

    // Add entity context
    if (intent.entityTypes.length > 0) {
      expandedQuery += ` ${intent.entityTypes.join(' ')}`
    }

    return expandedQuery
  }

  /**
   * Validate result relevance against query intent
   */
  static validateRelevance(
    result: SearchResult, 
    query: string, 
    intent: QueryIntent
  ): RelevanceValidation {
    const content = result.chunk.content.toLowerCase()
    const title = (result.document.metadata?.title || result.document.name).toLowerCase()
    const queryLower = query.toLowerCase()

    // 1. Semantic Relevance (current similarity score)
    const semanticRelevance = result.similarity

    // 2. Domain Relevance
    let domainRelevance = 0.5 // Base score
    if (intent.domain !== 'general') {
      const domainKeywords = this.DOMAIN_KEYWORDS[intent.domain as keyof typeof this.DOMAIN_KEYWORDS] || []
      const domainMatches = domainKeywords.filter(keyword => 
        content.includes(keyword) || title.includes(keyword)
      ).length
      domainRelevance = Math.min(1.0, domainMatches / domainKeywords.length + 0.3)
    }

    // 3. Entity Relevance
    let entityRelevance = 0.5 // Base score
    if (intent.entityTypes.length > 0) {
      let entityMatches = 0
      for (const entityType of intent.entityTypes) {
        const pattern = this.ENTITY_PATTERNS[entityType as keyof typeof this.ENTITY_PATTERNS]
        if (pattern && pattern.test(content)) {
          entityMatches++
        }
      }
      entityRelevance = Math.min(1.0, entityMatches / intent.entityTypes.length + 0.2)
    }

    // 4. Query Term Exact Matches (boost for exact term matches)
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2)
    const exactMatches = queryTerms.filter(term => 
      content.includes(term) || title.includes(term)
    ).length
    const exactMatchBoost = Math.min(0.3, exactMatches / queryTerms.length * 0.3)

    // Calculate final score with weights
    const weights = {
      semantic: 0.4,
      domain: 0.3,
      entity: 0.2,
      exact: 0.1
    }

    const finalScore = (
      semanticRelevance * weights.semantic +
      domainRelevance * weights.domain +
      entityRelevance * weights.entity +
      exactMatchBoost * weights.exact
    )

    // Generate explanation
    const explanation = this.generateRelevanceExplanation(
      semanticRelevance,
      domainRelevance, 
      entityRelevance,
      exactMatchBoost,
      intent
    )

    return {
      semanticRelevance,
      domainRelevance,
      entityRelevance,
      finalScore,
      explanation
    }
  }

  private static generateRelevanceExplanation(
    semantic: number,
    domain: number,
    entity: number,
    exact: number,
    intent: QueryIntent
  ): string {
    const parts = []
    
    if (semantic > 0.8) parts.push('High semantic similarity')
    else if (semantic > 0.6) parts.push('Moderate semantic similarity')
    else parts.push('Low semantic similarity')

    if (domain > 0.7) parts.push(`Strong ${intent.domain} domain relevance`)
    else if (domain > 0.5) parts.push(`Moderate ${intent.domain} domain relevance`)
    
    if (entity > 0.7) parts.push('Entity types match well')
    if (exact > 0.2) parts.push('Contains exact query terms')

    return parts.join(', ')
  }

  /**
   * Rerank search results using enhanced relevance scoring
   */
  static reRankResults(
    results: SearchResult[],
    query: string,
    intent: QueryIntent
  ): SearchResult[] {
    const validatedResults = results.map(result => {
      const validation = this.validateRelevance(result, query, intent)
      return {
        ...result,
        similarity: validation.finalScore,
        relevanceValidation: validation
      }
    })

    // Filter out low-relevance results
    const filteredResults = validatedResults.filter(result => {
      // Dynamic threshold based on query intent
      let threshold = 0.3 // Base threshold
      
      if (intent.searchScope === 'specific') threshold = 0.5
      else if (intent.searchScope === 'broad') threshold = 0.2
      
      return result.similarity >= threshold
    })

    // Sort by final relevance score
    return filteredResults.sort((a, b) => b.similarity - a.similarity)
  }
}

// Usage in search flow:
export async function enhancedSearch(
  query: string,
  documents: Document[],
  originalResults: SearchResult[]
): Promise<SearchResult[]> {
  // 1. Analyze query intent
  const intent = EnhancedQueryProcessor.analyzeQueryIntent(query)
  
  // 2. Expand query with context (for future embedding improvements)
  const expandedQuery = EnhancedQueryProcessor.expandQuery(query, intent)
  
  // 3. Validate and rerank results
  const rerankedResults = EnhancedQueryProcessor.reRankResults(
    originalResults,
    query,
    intent
  )
  
  console.log('🔍 Enhanced Search Results:')
  console.log(`Query Intent: ${intent.domain} domain, ${intent.searchScope} scope`)
  console.log(`Expanded Query: ${expandedQuery}`)
  console.log(`Original results: ${originalResults.length}, Filtered: ${rerankedResults.length}`)
  
  return rerankedResults
}
