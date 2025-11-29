/**
 * Enhanced Semantic Keyword Extraction
 * Generates contextual, topic-based keywords for better pattern recognition
 */

interface KeywordResult {
  keyword: string
  weight: number
  category: 'topic' | 'entity' | 'concept' | 'technical' | 'domain'
  context?: string
}

export interface SemanticKeywords {
  primary: string[]
  secondary: string[]
  entities: string[]
  concepts: string[]
  topics: string[]
  patterns: {
    industryTerms: string[]
    businessConcepts: string[]
    technicalTerms: string[]
    processes: string[]
  }
}

// Comprehensive domain-specific keyword dictionaries
const DOMAIN_VOCABULARIES = {
  business: [
    'strategy', 'revenue', 'profit', 'growth', 'market', 'customer', 'sales', 'performance',
    'management', 'leadership', 'operations', 'planning', 'analysis', 'investment', 'risk',
    'opportunity', 'competitive', 'advantage', 'value', 'efficiency', 'productivity',
    'innovation', 'transformation', 'digital', 'optimization', 'quality', 'sustainability'
  ],
  manufacturing: [
    'production', 'assembly', 'manufacturing', 'supply chain', 'logistics', 'inventory',
    'quality control', 'automation', 'machinery', 'equipment', 'materials', 'components',
    'precision', 'engineering', 'design', 'development', 'testing', 'certification',
    'standards', 'compliance', 'safety', 'maintenance', 'reliability', 'durability'
  ],
  technology: [
    'software', 'hardware', 'system', 'platform', 'infrastructure', 'data', 'analytics',
    'artificial intelligence', 'machine learning', 'automation', 'integration', 'api',
    'database', 'cloud', 'security', 'scalability', 'performance', 'architecture',
    'deployment', 'monitoring', 'optimization', 'user experience', 'interface'
  ],
  finance: [
    'budget', 'cost', 'expense', 'investment', 'return', 'margin', 'profit', 'loss',
    'cash flow', 'revenue', 'financial', 'accounting', 'audit', 'compliance', 'tax',
    'valuation', 'asset', 'liability', 'equity', 'debt', 'capital', 'funding'
  ],
  appliances: [
    'washing machine', 'dishwasher', 'oven', 'refrigerator', 'dryer', 'cooktop',
    'range hood', 'coffee maker', 'vacuum', 'steam', 'cleaning', 'cooking', 'food',
    'kitchen', 'laundry', 'energy efficient', 'smart home', 'connected', 'sensor',
    'program', 'cycle', 'temperature', 'capacity', 'performance', 'durability'
  ]
}

// Named entity patterns
const ENTITY_PATTERNS = {
  companies: /\b[A-Z][a-zA-Z&\s]+(?:Inc|Ltd|Corp|Company|Corporation|Group|AG|GmbH)\b/g,
  products: /\b[A-Z][a-zA-Z0-9\s\-]+(®|™)?\b/g,
  numbers: /\b\d+(?:[.,]\d+)*\s*(?:%|percent|million|billion|thousand|kg|tons|units|euros?|dollars?)\b/gi,
  dates: /\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
  locations: /\b[A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2,})\b/g
}

// Concept extraction patterns
const CONCEPT_PATTERNS = {
  processes: /\b\w+(?:ing|tion|ment|ance|ence)\b/g,
  goals: /\b(?:achieve|improve|increase|reduce|optimize|enhance|develop|implement|establish|maintain)\s+\w+/gi,
  challenges: /\b(?:challenge|problem|issue|concern|difficulty|obstacle|barrier|risk)\b/gi,
  solutions: /\b(?:solution|approach|method|strategy|technique|process|system|framework)\b/gi
}

// Advanced TF-IDF style scoring with domain awareness
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on',
  'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
  'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us'
])

/**
 * Extract semantic keywords with context awareness
 */
export function extractSemanticKeywords(
  content: string, 
  documentTitle?: string,
  additionalContext?: string
): SemanticKeywords {
  const text = content.toLowerCase()
  
  // Include title and context in analysis if provided
  const enrichedText = [text, documentTitle?.toLowerCase(), additionalContext?.toLowerCase()]
    .filter(Boolean)
    .join(' ')
  
  const words = enrichedText.split(/\W+/).filter(word => 
    word.length > 2 && !STOP_WORDS.has(word)
  )

  // Calculate word frequencies
  const wordFreq: Record<string, number> = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Extract entities
  const entities = extractEntities(content)
  
  // Extract domain-specific terms
  const domainTerms = extractDomainTerms(text)
  
  // Extract concepts and processes
  const concepts = extractConcepts(content)
  
  // Calculate weighted keywords
  const weightedKeywords = calculateKeywordWeights(wordFreq, text, domainTerms)
  
  // Categorize keywords by importance and type
  const primary = weightedKeywords
    .filter(k => k.weight > 0.7)
    .slice(0, 8)
    .map(k => k.keyword)
    
  const secondary = weightedKeywords
    .filter(k => k.weight > 0.4 && k.weight <= 0.7)
    .slice(0, 12)
    .map(k => k.keyword)

  // Extract topics using co-occurrence analysis
  const topics = extractTopics(text, [...primary, ...secondary])

  return {
    primary,
    secondary,
    entities: entities.slice(0, 10),
    concepts: concepts.slice(0, 8),
    topics: topics.slice(0, 6),
    patterns: {
      industryTerms: domainTerms.business.concat(domainTerms.manufacturing).slice(0, 8),
      businessConcepts: domainTerms.business.slice(0, 6),
      technicalTerms: domainTerms.technology.slice(0, 6),
      processes: concepts.filter(c => c.includes('ing') || c.includes('tion')).slice(0, 5)
    }
  }
}

/**
 * Extract named entities from text
 */
function extractEntities(content: string): string[] {
  const entities: string[] = []
  
  // Extract companies, products, numbers, dates, locations
  Object.values(ENTITY_PATTERNS).forEach(pattern => {
    const matches = content.match(pattern) || []
    entities.push(...matches.map(match => match.trim()))
  })
  
  // Remove duplicates and filter by relevance
  return [...new Set(entities)]
    .filter(entity => entity.length > 2 && entity.length < 50)
    .sort((a, b) => b.length - a.length)
}

/**
 * Extract domain-specific terms
 */
function extractDomainTerms(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  
  Object.entries(DOMAIN_VOCABULARIES).forEach(([domain, terms]) => {
    result[domain] = terms.filter(term => 
      text.includes(term.toLowerCase())
    ).sort((a, b) => {
      // Sort by frequency in text
      const freqA = (text.match(new RegExp(a.toLowerCase(), 'g')) || []).length
      const freqB = (text.match(new RegExp(b.toLowerCase(), 'g')) || []).length
      return freqB - freqA
    })
  })
  
  return result
}

/**
 * Extract conceptual terms and processes
 */
function extractConcepts(content: string): string[] {
  const concepts: string[] = []
  
  Object.values(CONCEPT_PATTERNS).forEach(pattern => {
    const matches = content.match(pattern) || []
    concepts.push(...matches.map(match => match.trim().toLowerCase()))
  })
  
  return [...new Set(concepts)]
    .filter(concept => concept.length > 3)
    .sort((a, b) => b.length - a.length)
}

/**
 * Calculate weighted keyword scores
 */
function calculateKeywordWeights(
  wordFreq: Record<string, number>,
  text: string,
  domainTerms: Record<string, string[]>
): KeywordResult[] {
  const totalWords = Object.values(wordFreq).reduce((sum, freq) => sum + freq, 0)
  const results: KeywordResult[] = []
  
  Object.entries(wordFreq).forEach(([word, freq]) => {
    let weight = freq / totalWords
    
    // Boost domain-specific terms
    const isDomainTerm = Object.values(domainTerms).some(terms => 
      terms.some(term => term.toLowerCase().includes(word))
    )
    if (isDomainTerm) weight *= 2.0
    
    // Boost terms that appear in titles or headers
    if (text.includes(`# ${word}`) || text.includes(`## ${word}`)) {
      weight *= 1.5
    }
    
    // Boost capitalized terms (likely important)
    if (text.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
      weight *= 1.3
    }
    
    // Boost longer terms (more specific)
    if (word.length > 6) weight *= 1.2
    
    results.push({
      keyword: word,
      weight,
      category: categorizeKeyword(word, domainTerms)
    })
  })
  
  return results.sort((a, b) => b.weight - a.weight)
}

/**
 * Categorize keywords by type
 */
function categorizeKeyword(
  word: string,
  domainTerms: Record<string, string[]>
): 'topic' | 'entity' | 'concept' | 'technical' | 'domain' {
  if (domainTerms.technology.some(term => term.includes(word))) return 'technical'
  if (domainTerms.business.some(term => term.includes(word))) return 'domain'
  if (word.includes('ing') || word.includes('tion')) return 'concept'
  if (word.length > 8) return 'entity'
  return 'topic'
}

/**
 * Extract topics using co-occurrence analysis
 */
function extractTopics(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const topicClusters: Record<string, string[]> = {}
  
  // Find keywords that frequently appear together
  sentences.forEach(sentence => {
    const sentenceKeywords = keywords.filter(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (sentenceKeywords.length >= 2) {
      const topicKey = sentenceKeywords.slice(0, 2).sort().join('-')
      if (!topicClusters[topicKey]) topicClusters[topicKey] = []
      topicClusters[topicKey].push(...sentenceKeywords)
    }
  })
  
  // Generate topic labels from clusters
  return Object.entries(topicClusters)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 6)
    .map(([key]) => key.replace('-', ' & '))
}

/**
 * Generate correlation patterns between documents
 */
export function generateCorrelationPatterns(
  documentsKeywords: Array<{ id: string; keywords: SemanticKeywords }>
): Array<{
  pattern: string
  documents: string[]
  strength: number
  type: 'topic' | 'concept' | 'entity'
}> {
  const patterns: Array<{
    pattern: string
    documents: string[]
    strength: number
    type: 'topic' | 'concept' | 'entity'
  }> = []
  
  // Find common topics across documents
  const allTopics: Record<string, string[]> = {}
  
  documentsKeywords.forEach(({ id, keywords }) => {
    [...keywords.primary, ...keywords.topics].forEach(topic => {
      if (!allTopics[topic]) allTopics[topic] = []
      allTopics[topic].push(id)
    })
  })
  
  // Generate patterns for topics that appear in multiple documents
  Object.entries(allTopics).forEach(([topic, docIds]) => {
    if (docIds.length > 1) {
      patterns.push({
        pattern: topic,
        documents: [...new Set(docIds)],
        strength: docIds.length / documentsKeywords.length,
        type: 'topic'
      })
    }
  })
  
  return patterns.sort((a, b) => b.strength - a.strength)
}
