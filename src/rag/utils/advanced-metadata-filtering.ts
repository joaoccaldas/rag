/**
 * Advanced Metadata Filtering & Faceted Search System
 * 
 * Provides sophisticated search and filtering capabilities with dynamic facets,
 * saved queries, advanced search operators, and real-time filter updates.
 * 
 * Features:
 * - Dynamic faceted search with real-time updates
 * - Advanced search operators (AND, OR, NOT, proximity, wildcards)
 * - Saved search queries and filters
 * - Date range filtering with smart presets
 * - File type and size filtering
 * - AI-based content classification filters
 * - Search result ranking and relevance scoring
 * - Export and sharing of search results
 */

import { Document } from '../types'

export interface SearchFacet {
  id: string
  name: string
  type: 'single' | 'multi' | 'range' | 'date' | 'text'
  values: FacetValue[]
  isExpanded: boolean
  isVisible: boolean
  order: number
}

export interface FacetValue {
  value: string | number
  label: string
  count: number
  selected: boolean
  isExclusive?: boolean
}

export interface SearchFilter {
  id: string
  facetId: string
  operation: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'between' | 'greaterThan' | 'lessThan' | 'in' | 'notIn'
  value: unknown
  label: string
  isNegated: boolean
}

export interface DateRangeFilter {
  start?: Date
  end?: Date
  preset?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'
}

export interface SavedSearchQuery {
  id: string
  name: string
  query: string
  filters: SearchFilter[]
  facetStates: Record<string, boolean>
  createdAt: Date
  lastUsed: Date
  useCount: number
  isDefault: boolean
  isShared: boolean
  tags: string[]
}

export interface SearchOperator {
  type: 'AND' | 'OR' | 'NOT' | 'NEAR' | 'EXACT' | 'WILDCARD'
  field?: string
  distance?: number // For proximity search
}

export interface AdvancedSearchQuery {
  terms: SearchTerm[]
  filters: SearchFilter[]
  sort: SortOption
  facets: string[]
  limit: number
  offset: number
}

export interface SearchTerm {
  value: string
  field?: string
  operator: SearchOperator
  boost?: number
  fuzzy?: number
}

export interface SortOption {
  field: 'relevance' | 'date' | 'size' | 'name' | 'type' | 'aiScore'
  direction: 'asc' | 'desc'
}

export interface SearchResult {
  document: Document
  score: number
  highlights: SearchHighlight[]
  matchedFacets: string[]
  rank: number
}

export interface SearchHighlight {
  field: string
  fragments: string[]
  type: 'exact' | 'fuzzy' | 'semantic'
}

export interface FacetedSearchResults {
  documents: SearchResult[]
  facets: SearchFacet[]
  total: number
  took: number
  query: AdvancedSearchQuery
  aggregations: Record<string, FacetAggregation>
}

export interface FacetAggregation {
  buckets: Array<{
    key: string
    count: number
    subAggregations?: Record<string, FacetAggregation>
  }>
  total: number
  missing: number
}

export class AdvancedMetadataFilter {
  private documents: Document[] = []
  private facetDefinitions: SearchFacet[] = []
  private savedQueries: Map<string, SavedSearchQuery> = new Map()
  private searchHistory: string[] = []
  private facetCache: Map<string, FacetAggregation> = new Map()

  constructor() {
    this.initializeFacets()
    this.loadSavedQueries()
  }

  /**
   * Set the document collection to search and filter
   */
  setDocuments(documents: Document[]): void {
    this.documents = documents
    this.updateFacetCounts()
    console.log(`🔍 Initialized advanced filtering for ${documents.length} documents`)
  }

  /**
   * Execute advanced search with faceted filtering
   */
  async search(query: AdvancedSearchQuery): Promise<FacetedSearchResults> {
    const startTime = Date.now()

    // Parse and validate query
    const normalizedQuery = this.normalizeQuery(query)
    
    // Apply text search
    let results = await this.executeTextSearch(normalizedQuery)
    
    // Apply filters
    results = this.applyFilters(results, normalizedQuery.filters)
    
    // Apply sorting
    results = this.applySorting(results, normalizedQuery.sort)
    
    // Calculate facets for current result set
    const facets = this.calculateFacets(results, normalizedQuery.facets)
    
    // Calculate aggregations
    const aggregations = this.calculateAggregations(results)
    
    // Apply pagination
    const paginatedResults = results.slice(
      normalizedQuery.offset,
      normalizedQuery.offset + normalizedQuery.limit
    )

    const took = Date.now() - startTime

    // Add to search history
    this.addToSearchHistory(this.queryToString(normalizedQuery))

    return {
      documents: paginatedResults,
      facets,
      total: results.length,
      took,
      query: normalizedQuery,
      aggregations
    }
  }

  /**
   * Get available facets with current counts
   */
  getFacets(documentSubset?: Document[]): SearchFacet[] {
    const docs = documentSubset || this.documents
    return this.facetDefinitions.map(facet => ({
      ...facet,
      values: this.calculateFacetValues(facet, docs)
    }))
  }

  /**
   * Save a search query for reuse
   */
  saveQuery(query: AdvancedSearchQuery, name: string, tags: string[] = []): SavedSearchQuery {
    const savedQuery: SavedSearchQuery = {
      id: this.generateId(),
      name,
      query: this.queryToString(query),
      filters: query.filters,
      facetStates: {},
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      isDefault: false,
      isShared: false,
      tags
    }

    this.savedQueries.set(savedQuery.id, savedQuery)
    this.persistSavedQueries()

    console.log(`💾 Saved search query: ${name}`)
    return savedQuery
  }

  /**
   * Load and execute a saved query
   */
  async loadSavedQuery(queryId: string): Promise<FacetedSearchResults> {
    const savedQuery = this.savedQueries.get(queryId)
    if (!savedQuery) {
      throw new Error(`Saved query not found: ${queryId}`)
    }

    // Update usage stats
    savedQuery.lastUsed = new Date()
    savedQuery.useCount++

    // Parse the saved query back to AdvancedSearchQuery
    const query = this.stringToQuery(savedQuery.query)
    query.filters = savedQuery.filters

    return this.search(query)
  }

  /**
   * Get smart search suggestions based on current context
   */
  getSearchSuggestions(partialQuery: string): Array<{
    type: 'query' | 'filter' | 'facet' | 'recent'
    value: string
    label: string
    score: number
    icon?: string
  }> {
    const suggestions: Array<{
      type: 'query' | 'filter' | 'facet' | 'recent'
      value: string
      label: string
      score: number
      icon?: string
    }> = []

    // Query suggestions from search history
    this.searchHistory
      .filter(q => q.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 5)
      .forEach(query => {
        suggestions.push({
          type: 'recent',
          value: query,
          label: `Recent: ${query}`,
          score: 0.8,
          icon: '🕒'
        })
      })

    // Facet value suggestions
    this.facetDefinitions.forEach(facet => {
      facet.values
        .filter(val => val.label.toLowerCase().includes(partialQuery.toLowerCase()))
        .slice(0, 3)
        .forEach(value => {
          suggestions.push({
            type: 'facet',
            value: `${facet.name}:"${value.label}"`,
            label: `${facet.name}: ${value.label} (${value.count})`,
            score: 0.6,
            icon: '🏷️'
          })
        })
    })

    // Smart query completions
    if (partialQuery.length > 2) {
      const smartSuggestions = this.generateSmartSuggestions(partialQuery)
      suggestions.push(...smartSuggestions)
    }

    // Sort by score and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }

  /**
   * Export search results in various formats
   */
  async exportResults(
    results: FacetedSearchResults,
    format: 'csv' | 'json' | 'excel' | 'pdf'
  ): Promise<Blob> {
    switch (format) {
      case 'csv':
        return this.exportToCsv(results)
      case 'json':
        return this.exportToJson(results)
      case 'excel':
        return this.exportToExcel(results)
      case 'pdf':
        return this.exportToPdf(results)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Create shareable search URLs
   */
  createShareableUrl(query: AdvancedSearchQuery): string {
    const encoded = btoa(JSON.stringify(query))
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/search?q=${encodeURIComponent(encoded)}`
  }

  /**
   * Parse shareable URL back to query
   */
  parseShareableUrl(url: string): AdvancedSearchQuery | null {
    try {
      const urlObj = new URL(url)
      const encoded = urlObj.searchParams.get('q')
      if (!encoded) return null

      const decoded = atob(decodeURIComponent(encoded))
      return JSON.parse(decoded) as AdvancedSearchQuery
    } catch (error) {
      console.error('Failed to parse shareable URL:', error)
      return null
    }
  }

  // Private implementation methods

  private initializeFacets(): void {
    this.facetDefinitions = [
      {
        id: 'type',
        name: 'File Type',
        type: 'multi',
        values: [],
        isExpanded: true,
        isVisible: true,
        order: 1
      },
      {
        id: 'size',
        name: 'File Size',
        type: 'range',
        values: [],
        isExpanded: false,
        isVisible: true,
        order: 2
      },
      {
        id: 'uploadDate',
        name: 'Upload Date',
        type: 'date',
        values: [],
        isExpanded: false,
        isVisible: true,
        order: 3
      },
      {
        id: 'aiKeywords',
        name: 'AI Keywords',
        type: 'multi',
        values: [],
        isExpanded: true,
        isVisible: true,
        order: 4
      },
      {
        id: 'hasVisuals',
        name: 'Has Images/Charts',
        type: 'single',
        values: [],
        isExpanded: false,
        isVisible: true,
        order: 5
      },
      {
        id: 'language',
        name: 'Language',
        type: 'multi',
        values: [],
        isExpanded: false,
        isVisible: true,
        order: 6
      },
      {
        id: 'readingTime',
        name: 'Reading Time',
        type: 'range',
        values: [],
        isExpanded: false,
        isVisible: true,
        order: 7
      }
    ]
  }

  private normalizeQuery(query: AdvancedSearchQuery): AdvancedSearchQuery {
    return {
      terms: query.terms || [],
      filters: query.filters || [],
      sort: query.sort || { field: 'relevance', direction: 'desc' },
      facets: query.facets || this.facetDefinitions.map(f => f.id),
      limit: Math.min(query.limit || 50, 1000),
      offset: Math.max(query.offset || 0, 0)
    }
  }

  private async executeTextSearch(query: AdvancedSearchQuery): Promise<SearchResult[]> {
    if (!query.terms.length) {
      return this.documents.map((doc, index) => ({
        document: doc,
        score: 1.0,
        highlights: [],
        matchedFacets: [],
        rank: index + 1
      }))
    }

    const results: SearchResult[] = []

    for (const doc of this.documents) {
      const score = this.calculateRelevanceScore(doc, query.terms)
      if (score > 0) {
        const highlights = this.generateHighlights(doc, query.terms)
        const matchedFacets = this.getMatchedFacets(doc)

        results.push({
          document: doc,
          score,
          highlights,
          matchedFacets,
          rank: 0 // Will be set after sorting
        })
      }
    }

    // Set ranks based on scores
    results.sort((a, b) => b.score - a.score)
    results.forEach((result, index) => {
      result.rank = index + 1
    })

    return results
  }

  private calculateRelevanceScore(document: Document, terms: SearchTerm[]): number {
    let totalScore = 0
    let maxPossibleScore = 0

    for (const term of terms) {
      maxPossibleScore += term.boost || 1

      const fieldScore = this.calculateFieldScore(document, term)
      totalScore += fieldScore * (term.boost || 1)
    }

    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0
  }

  private calculateFieldScore(document: Document, term: SearchTerm): number {
    const searchText = term.value.toLowerCase()
    let score = 0

    // Search in different fields with different weights
    const fields = [
      { text: document.name, weight: 3 },
      { text: document.content, weight: 1 },
      { text: document.aiAnalysis?.summary || '', weight: 2 },
      { text: document.aiAnalysis?.keywords?.join(' ') || '', weight: 2.5 }
    ]

    for (const field of fields) {
      if (!field.text) continue

      const fieldText = field.text.toLowerCase()
      
      switch (term.operator.type) {
        case 'EXACT':
          if (fieldText.includes(`"${searchText}"`)) {
            score += field.weight * 2
          }
          break
          
        case 'WILDCARD':
          const wildcardRegex = new RegExp(searchText.replace(/\*/g, '.*'), 'i')
          if (wildcardRegex.test(fieldText)) {
            score += field.weight * 1.5
          }
          break
          
        case 'NEAR':
          // Proximity search implementation
          const distance = term.operator.distance || 5
          if (this.isNearMatch(fieldText, searchText, distance)) {
            score += field.weight * 1.8
          }
          break
          
        default:
          // Standard text matching
          if (fieldText.includes(searchText)) {
            const exactMatch = fieldText === searchText
            const startsWithMatch = fieldText.startsWith(searchText)
            
            if (exactMatch) {
              score += field.weight * 2
            } else if (startsWithMatch) {
              score += field.weight * 1.5
            } else {
              score += field.weight
            }
          }
          
          // Fuzzy matching if specified
          if (term.fuzzy && term.fuzzy > 0) {
            const fuzzyScore = this.calculateFuzzyScore(fieldText, searchText, term.fuzzy)
            score += fuzzyScore * field.weight * 0.5
          }
      }
    }

    return Math.min(score, 10) // Cap at 10 for normalization
  }

  private isNearMatch(text: string, searchTerm: string, maxDistance: number): boolean {
    const words = text.split(/\s+/)
    const searchWords = searchTerm.split(/\s+/)
    
    for (let i = 0; i <= words.length - searchWords.length; i++) {
      let allFound = true
      let lastFoundIndex = i - 1
      
      for (const searchWord of searchWords) {
        let found = false
        for (let j = lastFoundIndex + 1; j < Math.min(words.length, lastFoundIndex + maxDistance + 2); j++) {
          if (words[j].toLowerCase().includes(searchWord.toLowerCase())) {
            lastFoundIndex = j
            found = true
            break
          }
        }
        if (!found) {
          allFound = false
          break
        }
      }
      
      if (allFound) return true
    }
    
    return false
  }

  private calculateFuzzyScore(text: string, pattern: string, maxDistance: number): number {
    // Simple Levenshtein distance implementation
    const matrix: number[][] = []
    
    for (let i = 0; i <= text.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= pattern.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= text.length; i++) {
      for (let j = 1; j <= pattern.length; j++) {
        const cost = text[i - 1] === pattern[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }
    
    const distance = matrix[text.length][pattern.length]
    return distance <= maxDistance ? 1 - (distance / maxDistance) : 0
  }

  private generateHighlights(document: Document, terms: SearchTerm[]): SearchHighlight[] {
    const highlights: SearchHighlight[] = []
    
    // Generate highlights for each field and term
    const fields = ['name', 'content']
    
    for (const field of fields) {
      const text = field === 'name' ? document.name : field === 'content' ? document.content : ''
      if (!text) continue
      
      for (const term of terms) {
        const fragments = this.findHighlightFragments(text, term.value)
        if (fragments.length > 0) {
          highlights.push({
            field,
            fragments,
            type: term.operator.type === 'EXACT' ? 'exact' : 'fuzzy'
          })
        }
      }
    }
    
    return highlights
  }

  private findHighlightFragments(text: string, searchTerm: string): string[] {
    const fragments: string[] = []
    const lowerText = text.toLowerCase()
    const lowerTerm = searchTerm.toLowerCase()
    
    let startIndex = 0
    while (true) {
      const index = lowerText.indexOf(lowerTerm, startIndex)
      if (index === -1) break
      
      // Create fragment with context
      const contextStart = Math.max(0, index - 50)
      const contextEnd = Math.min(text.length, index + searchTerm.length + 50)
      
      let fragment = text.substring(contextStart, contextEnd)
      
      // Add ellipsis if truncated
      if (contextStart > 0) fragment = '...' + fragment
      if (contextEnd < text.length) fragment = fragment + '...'
      
      // Highlight the search term
      const highlightStart = index - contextStart + (contextStart > 0 ? 3 : 0)
      const highlightEnd = highlightStart + searchTerm.length
      
      fragment = fragment.substring(0, highlightStart) +
                 '<mark>' + fragment.substring(highlightStart, highlightEnd) + '</mark>' +
                 fragment.substring(highlightEnd)
      
      fragments.push(fragment)
      startIndex = index + 1
    }
    
    return fragments.slice(0, 3) // Limit to 3 fragments per field
  }

  private applyFilters(results: SearchResult[], filters: SearchFilter[]): SearchResult[] {
    return results.filter(result => {
      return filters.every(filter => this.evaluateFilter(result.document, filter))
    })
  }

  private evaluateFilter(document: Document, filter: SearchFilter): boolean {
    const value = this.getDocumentFieldValue(document, filter.facetId)
    let matches = false

    switch (filter.operation) {
      case 'equals':
        matches = value === filter.value
        break
      case 'contains':
        matches = typeof value === 'string' && value.toLowerCase().includes(String(filter.value).toLowerCase())
        break
      case 'startsWith':
        matches = typeof value === 'string' && value.toLowerCase().startsWith(String(filter.value).toLowerCase())
        break
      case 'endsWith':
        matches = typeof value === 'string' && value.toLowerCase().endsWith(String(filter.value).toLowerCase())
        break
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2 && typeof value === 'number') {
          matches = value >= filter.value[0] && value <= filter.value[1]
        }
        break
      case 'greaterThan':
        matches = typeof value === 'number' && typeof filter.value === 'number' && value > filter.value
        break
      case 'lessThan':
        matches = typeof value === 'number' && typeof filter.value === 'number' && value < filter.value
        break
      case 'in':
        matches = Array.isArray(filter.value) && filter.value.includes(value)
        break
      case 'notIn':
        matches = Array.isArray(filter.value) && !filter.value.includes(value)
        break
    }

    return filter.isNegated ? !matches : matches
  }

  private getDocumentFieldValue(document: Document, fieldId: string): unknown {
    switch (fieldId) {
      case 'type':
        return document.type
      case 'size':
        return document.size
      case 'uploadDate':
        return new Date(document.uploadedAt)
      case 'aiKeywords':
        return document.aiAnalysis?.keywords || []
      case 'hasVisuals':
        return document.visualContent && document.visualContent.length > 0
      case 'language':
        return document.metadata?.language || 'unknown'
      case 'readingTime':
        return Math.ceil(document.content.length / 1000) // Rough estimate: 1000 chars per minute
      default:
        return null
    }
  }

  private applySorting(results: SearchResult[], sort: SortOption): SearchResult[] {
    return [...results].sort((a, b) => {
      let compareValue = 0

      switch (sort.field) {
        case 'relevance':
          compareValue = b.score - a.score
          break
        case 'date':
          compareValue = new Date(b.document.uploadedAt).getTime() - new Date(a.document.uploadedAt).getTime()
          break
        case 'size':
          compareValue = b.document.size - a.document.size
          break
        case 'name':
          compareValue = a.document.name.localeCompare(b.document.name)
          break
        case 'type':
          compareValue = a.document.type.localeCompare(b.document.type)
          break
        case 'aiScore':
          const aScore = a.document.aiAnalysis?.confidence || 0
          const bScore = b.document.aiAnalysis?.confidence || 0
          compareValue = bScore - aScore
          break
      }

      return sort.direction === 'desc' ? compareValue : -compareValue
    })
  }

  private calculateFacets(results: SearchResult[], requestedFacets: string[]): SearchFacet[] {
    return this.facetDefinitions
      .filter(facet => requestedFacets.includes(facet.id))
      .map(facet => ({
        ...facet,
        values: this.calculateFacetValues(facet, results.map(r => r.document))
      }))
  }

  private calculateFacetValues(facet: SearchFacet, documents: Document[]): FacetValue[] {
    const valueCounts: Map<string, number> = new Map()

    for (const doc of documents) {
      const value = this.getDocumentFieldValue(doc, facet.id)
      
      if (Array.isArray(value)) {
        // Handle multi-value fields (like keywords)
        for (const v of value) {
          const key = String(v)
          valueCounts.set(key, (valueCounts.get(key) || 0) + 1)
        }
      } else if (value !== null && value !== undefined) {
        const key = String(value)
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1)
      }
    }

    // Convert to FacetValue array and sort by count
    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        value,
        label: this.formatFacetLabel(facet.id, value),
        count,
        selected: false
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Limit to top 20 values
  }

  private formatFacetLabel(facetId: string, value: string): string {
    switch (facetId) {
      case 'size':
        const size = parseInt(value)
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
        if (size < 1024 * 1024 * 1024) return `${Math.round(size / (1024 * 1024))} MB`
        return `${Math.round(size / (1024 * 1024 * 1024))} GB`
      case 'uploadDate':
        return new Date(value).toLocaleDateString()
      case 'hasVisuals':
        return value === 'true' ? 'Has Images/Charts' : 'Text Only'
      case 'readingTime':
        const time = parseInt(value)
        if (time < 60) return `${time} min`
        return `${Math.round(time / 60)} hr`
      default:
        return value
    }
  }

  private calculateAggregations(results: SearchResult[]): Record<string, FacetAggregation> {
    const aggregations: Record<string, FacetAggregation> = {}

    for (const facet of this.facetDefinitions) {
      const buckets = this.calculateFacetValues(facet, results.map(r => r.document))
        .map(value => ({
          key: value.value.toString(),
          count: value.count
        }))

      aggregations[facet.id] = {
        buckets,
        total: buckets.reduce((sum, bucket) => sum + bucket.count, 0),
        missing: results.length - buckets.reduce((sum, bucket) => sum + bucket.count, 0)
      }
    }

    return aggregations
  }

  private getMatchedFacets(document: Document): string[] {
    const matched: string[] = []

    for (const facet of this.facetDefinitions) {
      const value = this.getDocumentFieldValue(document, facet.id)
      if (value !== null && value !== undefined) {
        matched.push(facet.id)
      }
    }

    return matched
  }

  private updateFacetCounts(): void {
    // Update facet counts based on current document set
    for (const facet of this.facetDefinitions) {
      facet.values = this.calculateFacetValues(facet, this.documents)
    }
  }

  private generateSmartSuggestions(
    partialQuery: string
  ): Array<{
    type: 'query' | 'filter' | 'facet' | 'recent'
    value: string
    label: string
    score: number
    icon?: string
  }> {
    const suggestions: Array<{
      type: 'query' | 'filter' | 'facet' | 'recent'
      value: string
      label: string
      score: number
      icon?: string
    }> = []

    // AI-powered query completion would go here
    // For now, we'll use simple pattern matching

    const patterns = [
      { pattern: /documents? (?:from|in) (\d{4})/, suggestion: 'Documents from {year}', icon: '📅' },
      { pattern: /large files?/, suggestion: 'size:>10MB', icon: '📁' },
      { pattern: /recent files?/, suggestion: 'uploaded:last-week', icon: '🕒' },
      { pattern: /pdf files?/, suggestion: 'type:pdf', icon: '📄' }
    ]

    for (const { pattern, suggestion, icon } of patterns) {
      if (pattern.test(partialQuery.toLowerCase())) {
        suggestions.push({
          type: 'query',
          value: suggestion,
          label: `Smart suggestion: ${suggestion}`,
          score: 0.9,
          icon
        })
      }
    }

    return suggestions
  }

  private queryToString(query: AdvancedSearchQuery): string {
    const parts: string[] = []

    // Add terms
    for (const term of query.terms) {
      let termStr = term.value
      if (term.field) termStr = `${term.field}:${termStr}`
      if (term.operator.type === 'EXACT') termStr = `"${termStr}"`
      if (term.operator.type === 'WILDCARD') termStr = `${termStr}*`
      parts.push(termStr)
    }

    // Add filters
    for (const filter of query.filters) {
      let filterStr = `${filter.facetId}:${filter.value}`
      if (filter.isNegated) filterStr = `-${filterStr}`
      parts.push(filterStr)
    }

    return parts.join(' ')
  }

  private stringToQuery(queryString: string): AdvancedSearchQuery {
    // Simple parser - in practice, you'd use a proper query parser
    const terms: SearchTerm[] = []
    const filters: SearchFilter[] = []

    const tokens = queryString.split(/\s+/)

    for (const token of tokens) {
      if (token.includes(':')) {
        // This is a filter
        const [field, value] = token.split(':')
        const isNegated = field.startsWith('-')
        const cleanField = isNegated ? field.substring(1) : field

        filters.push({
          id: this.generateId(),
          facetId: cleanField,
          operation: 'equals',
          value,
          label: `${cleanField}: ${value}`,
          isNegated
        })
      } else {
        // This is a search term
        const isExact = token.startsWith('"') && token.endsWith('"')
        const isWildcard = token.includes('*')

        let operatorType: SearchOperator['type'] = 'AND'
        if (isExact) operatorType = 'EXACT'
        else if (isWildcard) operatorType = 'WILDCARD'

        terms.push({
          value: isExact ? token.slice(1, -1) : token,
          operator: { type: operatorType }
        })
      }
    }

    return {
      terms,
      filters,
      sort: { field: 'relevance', direction: 'desc' },
      facets: this.facetDefinitions.map(f => f.id),
      limit: 50,
      offset: 0
    }
  }

  private addToSearchHistory(query: string): void {
    if (query.trim()) {
      this.searchHistory.unshift(query)
      // Keep only last 50 searches
      this.searchHistory = this.searchHistory.slice(0, 50)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('ragSearchHistory', JSON.stringify(this.searchHistory))
      }
    }
  }

  private loadSavedQueries(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ragSavedQueries')
        if (saved) {
          const queries = JSON.parse(saved)
          for (const query of queries) {
            this.savedQueries.set(query.id, query)
          }
        }

        const history = localStorage.getItem('ragSearchHistory')
        if (history) {
          this.searchHistory = JSON.parse(history)
        }
      } catch (error) {
        console.warn('Failed to load saved queries:', error)
      }
    }
  }

  private persistSavedQueries(): void {
    if (typeof window !== 'undefined') {
      try {
        const queries = Array.from(this.savedQueries.values())
        localStorage.setItem('ragSavedQueries', JSON.stringify(queries))
      } catch (error) {
        console.warn('Failed to persist saved queries:', error)
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Export methods (simplified implementations)

  private exportToCsv(results: FacetedSearchResults): Promise<Blob> {
    const headers = ['Name', 'Type', 'Size', 'Upload Date', 'Score', 'Keywords']
    const rows = results.documents.map(result => [
      result.document.name,
      result.document.type,
      result.document.size.toString(),
      new Date(result.document.uploadedAt).toISOString(),
      result.score.toFixed(3),
      result.document.aiAnalysis?.keywords?.join('; ') || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return Promise.resolve(new Blob([csvContent], { type: 'text/csv' }))
  }

  private exportToJson(results: FacetedSearchResults): Promise<Blob> {
    const jsonContent = JSON.stringify(results, null, 2)
    return Promise.resolve(new Blob([jsonContent], { type: 'application/json' }))
  }

  private exportToExcel(results: FacetedSearchResults): Promise<Blob> {
    // Simplified - in practice, you'd use a library like SheetJS
    return this.exportToCsv(results)
  }

  private exportToPdf(results: FacetedSearchResults): Promise<Blob> {
    // Simplified - in practice, you'd use a library like jsPDF
    const content = `Search Results\n\nQuery: ${results.query}\nTotal Results: ${results.total}\nSearch Time: ${results.took}ms\n\n`
    return Promise.resolve(new Blob([content], { type: 'application/pdf' }))
  }
}

// Export singleton instance
export const advancedMetadataFilter = new AdvancedMetadataFilter()
