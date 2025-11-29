/**
 * 🔍 RAG CONTENT INSPECTOR
 * 
 * Utility to analyze and debug RAG search results and content quality
 */

export interface RAGInspectionReport {
  queryAnalysis: {
    originalQuery: string
    keyTerms: string[]
    expectedEntities: string[]
    complexity: 'simple' | 'complex'
  }
  searchResults: {
    totalFound: number
    afterFiltering: number
    averageScore: number
    topDocuments: string[]
  }
  contentAnalysis: {
    totalWords: number
    uniqueWords: number
    relevantSentences: string[]
    containsSpecificInfo: boolean
    missingKeyTerms: string[]
  }
  qualityScore: number
  recommendations: string[]
}

export class RAGContentInspector {
  static analyzeQuery(query: string): RAGInspectionReport['queryAnalysis'] {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const keyTerms = words.filter(w => !['what', 'is', 'the', 'how', 'when', 'where', 'why'].includes(w))
    
    // Extract potential entities (capitalized words)
    const entities = query.split(/\s+/).filter(word => 
      /^[A-Z][a-z]+/.test(word) || word.includes("'s")
    )
    
    return {
      originalQuery: query,
      keyTerms,
      expectedEntities: entities,
      complexity: keyTerms.length > 3 ? 'complex' : 'simple'
    }
  }

  static analyzeSearchResults(results: Record<string, unknown>[]): RAGInspectionReport['searchResults'] {
    if (!results || results.length === 0) {
      return {
        totalFound: 0,
        afterFiltering: 0,
        averageScore: 0,
        topDocuments: []
      }
    }

    const scores = results.map(r => (r['similarity'] as number) || (r['score'] as number) || 0)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    const documents = [...new Set(results.map(r => 
      (r['document'] as Record<string, unknown>)?.['name'] as string || r['title'] as string || 'Unknown'
    ))]

    return {
      totalFound: results.length,
      afterFiltering: results.length, // Assuming these are already filtered
      averageScore,
      topDocuments: documents.slice(0, 5)
    }
  }

  static analyzeContent(ragSources: Record<string, unknown>[], query: string): RAGInspectionReport['contentAnalysis'] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const allContent = ragSources.map(s => (s['content'] as string) || '').join(' ')
    
    const words = allContent.toLowerCase().split(/\s+/)
    const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    // Find sentences that contain query terms
    const relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase()
      return queryTerms.some(term => sentenceLower.includes(term))
    }).slice(0, 3)

    // Check for missing key terms
    const missingTerms = queryTerms.filter(term => 
      !allContent.toLowerCase().includes(term)
    )

    // Check if content contains specific information (not just generic text)
    const specificIndicators = ['salary', 'amount', 'price', 'cost', 'revenue', 'profit', 'figure', 'number']
    const containsSpecificInfo = specificIndicators.some(indicator => 
      allContent.toLowerCase().includes(indicator)
    )

    return {
      totalWords: words.length,
      uniqueWords: [...new Set(words)].length,
      relevantSentences,
      containsSpecificInfo,
      missingKeyTerms: missingTerms
    }
  }

  static generateReport(query: string, searchResults: Record<string, unknown>[], ragSources: Record<string, unknown>[]): RAGInspectionReport {
    const queryAnalysis = this.analyzeQuery(query)
    const searchAnalysis = this.analyzeSearchResults(searchResults)
    const contentAnalysis = this.analyzeContent(ragSources, query)

    // Calculate quality score (0-100)
    let qualityScore = 0
    qualityScore += searchAnalysis.averageScore * 30 // Search relevance (30%)
    qualityScore += (contentAnalysis.containsSpecificInfo ? 25 : 0) // Specific info (25%)
    qualityScore += Math.max(0, 20 - contentAnalysis.missingKeyTerms.length * 5) // Missing terms penalty (20%)
    qualityScore += Math.min(25, contentAnalysis.relevantSentences.length * 8) // Relevant sentences (25%)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (searchAnalysis.averageScore < 0.5) {
      recommendations.push('Search relevance is low - consider query expansion or different keywords')
    }
    
    if (contentAnalysis.missingKeyTerms.length > 0) {
      recommendations.push(`Missing key terms in content: ${contentAnalysis.missingKeyTerms.join(', ')}`)
    }
    
    if (!contentAnalysis.containsSpecificInfo) {
      recommendations.push('Content appears to be generic - may need more specific documents')
    }
    
    if (contentAnalysis.relevantSentences.length === 0) {
      recommendations.push('No clearly relevant sentences found - content may not match query intent')
    }
    
    if (searchAnalysis.totalFound === 0) {
      recommendations.push('No search results found - check if documents are properly indexed')
    }

    return {
      queryAnalysis,
      searchResults: searchAnalysis,
      contentAnalysis,
      qualityScore,
      recommendations
    }
  }

  static logReport(report: RAGInspectionReport): void {
    console.group('🔍 RAG INSPECTION REPORT')
    console.log('📊 Quality Score:', `${report.qualityScore.toFixed(1)}/100`)
    
    console.group('🎯 Query Analysis')
    console.log('Query:', report.queryAnalysis.originalQuery)
    console.log('Key Terms:', report.queryAnalysis.keyTerms)
    console.log('Expected Entities:', report.queryAnalysis.expectedEntities)
    console.groupEnd()
    
    console.group('🔍 Search Results')
    console.log('Total Found:', report.searchResults.totalFound)
    console.log('Average Score:', report.searchResults.averageScore.toFixed(3))
    console.log('Top Documents:', report.searchResults.topDocuments)
    console.groupEnd()
    
    console.group('📝 Content Analysis')
    console.log('Total Words:', report.contentAnalysis.totalWords)
    console.log('Contains Specific Info:', report.contentAnalysis.containsSpecificInfo)
    console.log('Missing Key Terms:', report.contentAnalysis.missingKeyTerms)
    console.log('Relevant Sentences:', report.contentAnalysis.relevantSentences)
    console.groupEnd()
    
    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations')
      report.recommendations.forEach(rec => console.log('•', rec))
      console.groupEnd()
    }
    
    console.groupEnd()
  }
}

export { RAGContentInspector as RAGInspector }
