/**
 * Semantic Keywords Extraction Utilities
 * 
 * This module provides advanced keyword extraction capabilities using:
 * - TF-IDF (Term Frequency-Inverse Document Frequency)
 * - Natural Language Processing techniques
 * - Domain-specific keyword recognition
 * - Contextual analysis
 */

interface KeywordExtraction {
  keywords: string[]
  phrases: string[]
  entities: string[]
  confidence: number
}

interface TFIDFResult {
  term: string
  score: number
  frequency: number
}

export class SemanticKeywordExtractor {
  private stopWords: Set<string>
  private commonWords: Set<string>
  
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
      'you', 'your', 'he', 'him', 'his', 'she', 'her', 'i', 'me', 'my'
    ])
    
    this.commonWords = new Set([
      'time', 'year', 'day', 'way', 'work', 'life', 'world', 'case', 'part', 'fact',
      'right', 'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other',
      'old', 'small', 'large', 'high', 'different', 'following', 'public', 'important'
    ])
  }

  /**
   * Extract keywords using advanced TF-IDF and NLP techniques
   */
  public extractKeywords(text: string, options: {
    maxKeywords?: number
    minWordLength?: number
    includeNgrams?: boolean
    contextualWeight?: boolean
  } = {}): KeywordExtraction {
    const {
      maxKeywords = 10,
      minWordLength = 3,
      includeNgrams = true,
      contextualWeight = true
    } = options

    // Clean and tokenize text
    const tokens = this.tokenizeText(text)
    const cleanTokens = tokens.filter(token => 
      token.length >= minWordLength && 
      !this.stopWords.has(token.toLowerCase()) &&
      !this.commonWords.has(token.toLowerCase())
    )

    // Calculate TF-IDF scores
    const tfidfResults = this.calculateTFIDF(cleanTokens, text)
    
    // Extract n-grams if enabled
    const phrases = includeNgrams ? this.extractNGrams(text, 2, 3) : []
    
    // Extract named entities
    const entities = this.extractEntities(text)
    
    // Apply contextual weighting
    const weightedResults = contextualWeight ? 
      this.applyContextualWeighting(tfidfResults, text) : tfidfResults

    // Get top keywords
    const keywords = weightedResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords)
      .map(result => result.term)

    // Calculate confidence based on keyword quality
    const confidence = this.calculateExtractionConfidence(keywords, phrases, entities, text)

    return {
      keywords,
      phrases: phrases.slice(0, Math.floor(maxKeywords / 2)),
      entities: entities.slice(0, Math.floor(maxKeywords / 3)),
      confidence
    }
  }

  /**
   * Tokenize text into individual words
   */
  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0)
  }

  /**
   * Calculate TF-IDF scores for terms
   */
  private calculateTFIDF(tokens: string[], fullText: string): TFIDFResult[] {
    const termFrequency: { [key: string]: number } = {}
    const totalTerms = tokens.length

    // Calculate term frequency
    tokens.forEach(token => {
      termFrequency[token] = (termFrequency[token] || 0) + 1
    })

    // Convert to TF-IDF results
    return Object.entries(termFrequency).map(([term, frequency]) => {
      const tf = frequency / totalTerms
      // Simple IDF approximation (in real implementation, you'd use a corpus)
      const idf = Math.log(fullText.length / (frequency * term.length))
      const score = tf * idf
      
      return { term, score, frequency }
    })
  }

  /**
   * Extract n-grams (phrases) from text
   */
  private extractNGrams(text: string, minN: number = 2, maxN: number = 3): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))

    const ngrams: string[] = []
    
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ')
        if (ngram.length > 5) { // Only meaningful phrases
          ngrams.push(ngram)
        }
      }
    }

    // Count frequency and return most common
    const ngramFreq: { [key: string]: number } = {}
    ngrams.forEach(ngram => {
      ngramFreq[ngram] = (ngramFreq[ngram] || 0) + 1
    })

    return Object.entries(ngramFreq)
      .filter(([, freq]) => freq >= 2) // Appears at least twice
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([ngram]) => ngram)
  }

  /**
   * Extract named entities (basic implementation)
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = []
    
    // Find capitalized words/phrases (potential named entities)
    const capitalizedMatches = text.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g) || []
    
    // Find patterns that look like technical terms
    const technicalTerms = text.match(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g) || []
    
    // Find numbers with units or specific patterns
    const measuredTerms = text.match(/\b\d+(?:\.\d+)?\s*(?:kg|lb|m|ft|cm|mm|%|percent|dollars?|USD|EUR)\b/gi) || []
    
    entities.push(...capitalizedMatches.slice(0, 5))
    entities.push(...technicalTerms.slice(0, 3))
    entities.push(...measuredTerms.slice(0, 3))
    
    // Remove duplicates and common words
    return [...new Set(entities)]
      .filter(entity => 
        entity.length > 2 && 
        !this.commonWords.has(entity.toLowerCase()) &&
        !this.stopWords.has(entity.toLowerCase())
      )
      .slice(0, 6)
  }

  /**
   * Apply contextual weighting to improve keyword relevance
   */
  private applyContextualWeighting(tfidfResults: TFIDFResult[], fullText: string): TFIDFResult[] {
    const textLength = fullText.length
    
    return tfidfResults.map(result => {
      let weightedScore = result.score
      
      // Boost terms that appear in key positions
      const termRegex = new RegExp(`\\b${result.term}\\b`, 'gi')
      const matches = fullText.match(termRegex) || []
      
      matches.forEach(match => {
        const position = fullText.indexOf(match)
        const relativePosition = position / textLength
        
        // Boost terms that appear early (title, beginning) or late (conclusion)
        if (relativePosition < 0.1 || relativePosition > 0.9) {
          weightedScore *= 1.3
        }
        
        // Boost terms in headings (followed by line breaks)
        if (fullText.substring(position, position + 50).includes('\n')) {
          weightedScore *= 1.2
        }
      })
      
      // Boost longer terms (more specific)
      if (result.term.length > 6) {
        weightedScore *= 1.1
      }
      
      return { ...result, score: weightedScore }
    })
  }

  /**
   * Calculate confidence score for extraction quality
   */
  private calculateExtractionConfidence(
    keywords: string[], 
    phrases: string[], 
    entities: string[], 
    text: string
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Boost if we have diverse types of extracted content
    if (keywords.length >= 5) confidence += 0.2
    if (phrases.length >= 2) confidence += 0.15
    if (entities.length >= 1) confidence += 0.1
    
    // Boost based on text quality indicators
    const wordCount = text.split(/\s+/).length
    if (wordCount > 500) confidence += 0.1
    if (wordCount > 1000) confidence += 0.05
    
    // Check for technical indicators
    const hasTechnicalTerms = /\b(?:API|SDK|algorithm|data|system|method|process|analysis|implementation)\b/i.test(text)
    if (hasTechnicalTerms) confidence += 0.1
    
    return Math.min(confidence, 0.95) // Cap at 95%
  }

  /**
   * Quick keyword extraction for simple use cases
   */
  public quickExtract(text: string, count: number = 8): string[] {
    const result = this.extractKeywords(text, { 
      maxKeywords: count, 
      includeNgrams: false,
      contextualWeight: false 
    })
    return result.keywords
  }

  /**
   * Extract domain-specific keywords for RAG systems
   */
  public extractRAGKeywords(text: string): {
    conceptual: string[]    // High-level concepts
    technical: string[]     // Technical terms
    entities: string[]      // Named entities
    contextual: string[]    // Context-specific terms
  } {
    const fullResult = this.extractKeywords(text, { 
      maxKeywords: 15, 
      includeNgrams: true,
      contextualWeight: true 
    })

    const conceptual = fullResult.keywords.filter(kw => 
      kw.length > 5 && !kw.includes('_') && !/\d/.test(kw)
    ).slice(0, 4)

    const technical = fullResult.keywords.filter(kw => 
      kw.includes('_') || /[A-Z]{2,}/.test(kw) || kw.includes('.')
    ).slice(0, 3)

    const contextual = fullResult.phrases.slice(0, 4)

    return {
      conceptual,
      technical,
      entities: fullResult.entities,
      contextual
    }
  }
}

// Export convenience functions
export const extractKeywords = (text: string, count: number = 8): string[] => {
  const extractor = new SemanticKeywordExtractor()
  return extractor.quickExtract(text, count)
}

export const extractRAGKeywords = (text: string) => {
  const extractor = new SemanticKeywordExtractor()
  return extractor.extractRAGKeywords(text)
}

export default SemanticKeywordExtractor
