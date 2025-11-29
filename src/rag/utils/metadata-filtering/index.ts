/**
 * Advanced Metadata Filtering System
 * 
 * Provides sophisticated filtering capabilities based on document metadata,
 * date ranges, content types, sources, and custom attributes.
 * 
 * Why: Users need to narrow down search results based on specific criteria
 * like document type, creation date, author, or custom tags to find relevant information quickly.
 */

export type FilterValue = string | number | boolean | Date | string[] | number[] | [number, number] | [Date, Date]

export interface FilterCriteria {
  id: string
  field: string
  operator: FilterOperator
  value: FilterValue
  label?: string
  type: FilterType
}

export type FilterOperator = 
  | 'equals' | 'not_equals' 
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'between'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists'
  | 'before' | 'after' | 'date_range'

export type FilterType = 
  | 'text' | 'number' | 'date' | 'boolean' 
  | 'select' | 'multi_select' | 'range'
  | 'tag' | 'user' | 'file_type'

export interface FilterOption {
  value: FilterValue
  label: string
  count?: number
  icon?: string
  color?: string
}

export interface FilterConfig {
  field: string
  label: string
  type: FilterType
  options?: FilterOption[]
  operators?: FilterOperator[]
  defaultOperator?: FilterOperator
  placeholder?: string
  validation?: (value: FilterValue) => boolean
  formatter?: (value: FilterValue) => string
}

export interface DocumentMetadata {
  id: string
  title: string
  content: string
  created: Date
  modified: Date
  author?: string
  source?: string
  type: string
  size: number
  tags: string[]
  category?: string
  language?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  readingTime?: number
  wordCount?: number
  customFields?: Record<string, any>
}

export interface FilterState {
  criteria: FilterCriteria[]
  operator: 'AND' | 'OR'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface FilterResult {
  documents: DocumentMetadata[]
  totalCount: number
  filteredCount: number
  facets: Record<string, FilterOption[]>
  executionTime: number
}

export class MetadataFilterEngine {
  private documents: DocumentMetadata[] = []
  private filterConfigs: Map<string, FilterConfig> = new Map()
  private facetCache: Map<string, FilterOption[]> = new Map()

  constructor() {
    this.initializeDefaultFilters()
  }

  private initializeDefaultFilters() {
    // Define standard filter configurations
    const configs: FilterConfig[] = [
      {
        field: 'type',
        label: 'Document Type',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        defaultOperator: 'equals',
        options: [
          { value: 'pdf', label: 'PDF', icon: '📄' },
          { value: 'txt', label: 'Text', icon: '📝' },
          { value: 'docx', label: 'Word Document', icon: '📘' },
          { value: 'md', label: 'Markdown', icon: '📋' },
          { value: 'html', label: 'HTML', icon: '🌐' },
          { value: 'csv', label: 'CSV', icon: '📊' },
          { value: 'json', label: 'JSON', icon: '🔧' }
        ]
      },
      {
        field: 'created',
        label: 'Creation Date',
        type: 'date',
        operators: ['before', 'after', 'date_range', 'equals'],
        defaultOperator: 'date_range'
      },
      {
        field: 'modified',
        label: 'Last Modified',
        type: 'date',
        operators: ['before', 'after', 'date_range', 'equals'],
        defaultOperator: 'date_range'
      },
      {
        field: 'author',
        label: 'Author',
        type: 'select',
        operators: ['equals', 'not_equals', 'contains', 'in'],
        defaultOperator: 'equals'
      },
      {
        field: 'source',
        label: 'Source',
        type: 'select',
        operators: ['equals', 'not_equals', 'contains'],
        defaultOperator: 'equals'
      },
      {
        field: 'tags',
        label: 'Tags',
        type: 'tag',
        operators: ['contains', 'not_contains', 'in', 'not_in'],
        defaultOperator: 'contains'
      },
      {
        field: 'category',
        label: 'Category',
        type: 'select',
        operators: ['equals', 'not_equals', 'in'],
        defaultOperator: 'equals'
      },
      {
        field: 'size',
        label: 'File Size',
        type: 'range',
        operators: ['greater_than', 'less_than', 'between'],
        defaultOperator: 'between',
        formatter: (value: FilterValue) => this.formatFileSize(Number(value))
      },
      {
        field: 'wordCount',
        label: 'Word Count',
        type: 'range',
        operators: ['greater_than', 'less_than', 'between'],
        defaultOperator: 'between'
      },
      {
        field: 'readingTime',
        label: 'Reading Time (minutes)',
        type: 'range',
        operators: ['greater_than', 'less_than', 'between'],
        defaultOperator: 'between'
      },
      {
        field: 'language',
        label: 'Language',
        type: 'select',
        operators: ['equals', 'not_equals', 'in'],
        defaultOperator: 'equals',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
          { value: 'de', label: 'German' },
          { value: 'pt', label: 'Portuguese' },
          { value: 'it', label: 'Italian' }
        ]
      },
      {
        field: 'sentiment',
        label: 'Sentiment',
        type: 'select',
        operators: ['equals', 'not_equals'],
        defaultOperator: 'equals',
        options: [
          { value: 'positive', label: 'Positive', color: '#10b981' },
          { value: 'neutral', label: 'Neutral', color: '#6b7280' },
          { value: 'negative', label: 'Negative', color: '#ef4444' }
        ]
      }
    ]

    configs.forEach(config => {
      this.filterConfigs.set(config.field, config)
    })
  }

  // Document management
  addDocuments(documents: DocumentMetadata[]): void {
    this.documents.push(...documents)
    this.clearFacetCache()
  }

  updateDocument(document: DocumentMetadata): void {
    const index = this.documents.findIndex(doc => doc.id === document.id)
    if (index >= 0) {
      this.documents[index] = document
      this.clearFacetCache()
    }
  }

  removeDocument(documentId: string): void {
    this.documents = this.documents.filter(doc => doc.id !== documentId)
    this.clearFacetCache()
  }

  // Main filtering method
  filter(filterState: FilterState): FilterResult {
    const startTime = Date.now()

    try {
      let filteredDocuments = [...this.documents]

      // Apply filters
      if (filterState.criteria.length > 0) {
        filteredDocuments = this.applyFilters(filteredDocuments, filterState)
      }

      // Apply sorting
      if (filterState.sortBy) {
        filteredDocuments = this.sortDocuments(filteredDocuments, filterState.sortBy, filterState.sortOrder)
      }

      // Calculate facets for remaining documents
      const facets = this.calculateFacets(filteredDocuments)

      // Apply pagination
      const totalCount = filteredDocuments.length
      if (filterState.limit && filterState.offset !== undefined) {
        const start = filterState.offset
        const end = start + filterState.limit
        filteredDocuments = filteredDocuments.slice(start, end)
      }

      const executionTime = Date.now() - startTime

      return {
        documents: filteredDocuments,
        totalCount: this.documents.length,
        filteredCount: totalCount,
        facets,
        executionTime
      }
    } catch (error) {
      console.error('Filter execution error:', error)
      return {
        documents: [],
        totalCount: this.documents.length,
        filteredCount: 0,
        facets: {},
        executionTime: Date.now() - startTime
      }
    }
  }

  private applyFilters(documents: DocumentMetadata[], filterState: FilterState): DocumentMetadata[] {
    return documents.filter(document => {
      if (filterState.operator === 'OR') {
        return filterState.criteria.some(criteria => this.evaluateFilter(document, criteria))
      } else {
        return filterState.criteria.every(criteria => this.evaluateFilter(document, criteria))
      }
    })
  }

  private evaluateFilter(document: DocumentMetadata, criteria: FilterCriteria): boolean {
    const fieldValue = this.getFieldValue(document, criteria.field)

    switch (criteria.operator) {
      case 'equals':
        return this.equals(fieldValue, criteria.value)
      
      case 'not_equals':
        return !this.equals(fieldValue, criteria.value)
      
      case 'contains':
        return this.contains(fieldValue, criteria.value)
      
      case 'not_contains':
        return !this.contains(fieldValue, criteria.value)
      
      case 'starts_with':
        return this.startsWith(fieldValue, criteria.value)
      
      case 'ends_with':
        return this.endsWith(fieldValue, criteria.value)
      
      case 'greater_than':
        return this.greaterThan(fieldValue, criteria.value)
      
      case 'less_than':
        return this.lessThan(fieldValue, criteria.value)
      
      case 'between':
        return this.between(fieldValue, criteria.value)
      
      case 'in':
        return this.inArray(fieldValue, criteria.value)
      
      case 'not_in':
        return !this.inArray(fieldValue, criteria.value)
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null
      
      case 'before':
        return this.before(fieldValue, criteria.value)
      
      case 'after':
        return this.after(fieldValue, criteria.value)
      
      case 'date_range':
        return this.dateRange(fieldValue, criteria.value)
      
      default:
        return false
    }
  }

  // Filter evaluation methods
  private equals(fieldValue: any, filterValue: any): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(filterValue)
    }
    return fieldValue === filterValue
  }

  private contains(fieldValue: any, filterValue: any): boolean {
    if (typeof fieldValue === 'string') {
      return fieldValue.toLowerCase().includes(String(filterValue).toLowerCase())
    }
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(item => 
        String(item).toLowerCase().includes(String(filterValue).toLowerCase())
      )
    }
    return false
  }

  private startsWith(fieldValue: any, filterValue: any): boolean {
    return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
  }

  private endsWith(fieldValue: any, filterValue: any): boolean {
    return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
  }

  private greaterThan(fieldValue: any, filterValue: any): boolean {
    const numField = Number(fieldValue)
    const numFilter = Number(filterValue)
    return !isNaN(numField) && !isNaN(numFilter) && numField > numFilter
  }

  private lessThan(fieldValue: any, filterValue: any): boolean {
    const numField = Number(fieldValue)
    const numFilter = Number(filterValue)
    return !isNaN(numField) && !isNaN(numFilter) && numField < numFilter
  }

  private between(fieldValue: any, filterValue: any): boolean {
    if (!Array.isArray(filterValue) || filterValue.length !== 2) return false
    const numField = Number(fieldValue)
    const [min, max] = filterValue.map(Number)
    return !isNaN(numField) && !isNaN(min) && !isNaN(max) && numField >= min && numField <= max
  }

  private inArray(fieldValue: any, filterValue: any): boolean {
    if (!Array.isArray(filterValue)) return false
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(item => filterValue.includes(item))
    }
    return filterValue.includes(fieldValue)
  }

  private before(fieldValue: any, filterValue: any): boolean {
    const fieldDate = new Date(fieldValue)
    const filterDate = new Date(filterValue)
    return fieldDate < filterDate
  }

  private after(fieldValue: any, filterValue: any): boolean {
    const fieldDate = new Date(fieldValue)
    const filterDate = new Date(filterValue)
    return fieldDate > filterDate
  }

  private dateRange(fieldValue: any, filterValue: any): boolean {
    if (!Array.isArray(filterValue) || filterValue.length !== 2) return false
    const fieldDate = new Date(fieldValue)
    const [startDate, endDate] = filterValue.map(date => new Date(date))
    return fieldDate >= startDate && fieldDate <= endDate
  }

  // Utility methods
  private getFieldValue(document: DocumentMetadata, field: string): any {
    if (field.includes('.')) {
      // Support nested field access
      const parts = field.split('.')
      let value: any = document
      for (const part of parts) {
        value = value?.[part]
      }
      return value
    }
    return (document as any)[field]
  }

  private sortDocuments(
    documents: DocumentMetadata[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc' = 'asc'
  ): DocumentMetadata[] {
    return documents.sort((a, b) => {
      const valueA = this.getFieldValue(a, sortBy)
      const valueB = this.getFieldValue(b, sortBy)
      
      let comparison = 0
      
      if (valueA < valueB) {
        comparison = -1
      } else if (valueA > valueB) {
        comparison = 1
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  private calculateFacets(documents: DocumentMetadata[]): Record<string, FilterOption[]> {
    const facets: Record<string, FilterOption[]> = {}

    for (const [field, config] of this.filterConfigs.entries()) {
      // Skip range types for facets
      if (['range', 'date'].includes(config.type)) {
        continue
      }

      const counts = new Map<string, number>()
      
      documents.forEach(doc => {
        const value = this.getFieldValue(doc, field)
        
        if (Array.isArray(value)) {
          value.forEach(item => {
            const key = String(item)
            counts.set(key, (counts.get(key) || 0) + 1)
          })
        } else if (value !== undefined && value !== null) {
          const key = String(value)
          counts.set(key, (counts.get(key) || 0) + 1)
        }
      })

      facets[field] = Array.from(counts.entries())
        .map(([value, count]) => {
          const option = config.options?.find(opt => opt.value === value)
          return {
            value,
            label: option?.label || value,
            count,
            icon: option?.icon,
            color: option?.color
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Limit facet options
    }

    return facets
  }

  private clearFacetCache(): void {
    this.facetCache.clear()
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Public API methods
  getFilterConfigs(): FilterConfig[] {
    return Array.from(this.filterConfigs.values())
  }

  getFilterConfig(field: string): FilterConfig | undefined {
    return this.filterConfigs.get(field)
  }

  addFilterConfig(config: FilterConfig): void {
    this.filterConfigs.set(config.field, config)
  }

  removeFilterConfig(field: string): void {
    this.filterConfigs.delete(field)
  }

  // Preset filter combinations
  getPresetFilters(): Record<string, FilterState> {
    return {
      'recent-documents': {
        criteria: [{
          id: 'recent',
          field: 'created',
          operator: 'after',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          type: 'date'
        }],
        operator: 'AND',
        sortBy: 'created',
        sortOrder: 'desc'
      },
      'large-documents': {
        criteria: [{
          id: 'large',
          field: 'size',
          operator: 'greater_than',
          value: 1024 * 1024, // > 1MB
          type: 'range'
        }],
        operator: 'AND',
        sortBy: 'size',
        sortOrder: 'desc'
      },
      'pdf-documents': {
        criteria: [{
          id: 'pdf',
          field: 'type',
          operator: 'equals',
          value: 'pdf',
          type: 'select'
        }],
        operator: 'AND'
      }
    }
  }

  // Export current filter state
  exportFilterState(filterState: FilterState): string {
    return JSON.stringify(filterState, null, 2)
  }

  // Import filter state
  importFilterState(stateJson: string): FilterState {
    try {
      return JSON.parse(stateJson)
    } catch (error) {
      console.error('Invalid filter state JSON:', error)
      throw new Error('Invalid filter state format')
    }
  }
}
