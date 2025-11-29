/**
 * Citation Formatter - Generates properly formatted citations
 * Supports APA, MLA, Chicago, IEEE, Harvard, and Vancouver styles
 */

import { DocumentMetadata, CitationOptions, CitationFormatResult, CitationStyle } from './types'

export class CitationFormatter {
  /**
   * Format a citation based on the specified style
   */
  static format(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const style = options.style
    
    switch (style) {
      case 'APA':
        return this.formatAPA(metadata, options)
      case 'MLA':
        return this.formatMLA(metadata, options)
      case 'Chicago':
        return this.formatChicago(metadata, options)
      case 'IEEE':
        return this.formatIEEE(metadata, options)
      case 'Harvard':
        return this.formatHarvard(metadata, options)
      case 'Vancouver':
        return this.formatVancouver(metadata, options)
      default:
        return this.formatAPA(metadata, options)
    }
  }

  /**
   * APA 7th Edition Format
   * Example: Author, A. A. (Year). Title of work. Publisher. https://doi.org/xxx
   */
  private static formatAPA(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, url, doi } = metadata
    const parts: string[] = []

    // Authors
    if (authors.length > 0) {
      if (authors.length === 1 && authors[0]) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}.`)
      } else if (authors.length === 2 && authors[0] && authors[1]) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}, & ${this.formatAuthorLastFirst(authors[1] ?? "")}.`)
      } else if (authors.length <= 20) {
        const authorList = authors.slice(0, -1).filter((a): a is string => !!a).map(a => this.formatAuthorLastFirst(a)).join(', ')
        const lastAuthor = authors[authors.length - 1]
        if (lastAuthor) {
          parts.push(`${authorList}, & ${this.formatAuthorLastFirst(lastAuthor)}.`)
        }
      } else {
        // 21+ authors: first 19, ellipsis, last author
        const first19 = authors.slice(0, 19).filter((a): a is string => !!a).map(a => this.formatAuthorLastFirst(a)).join(', ')
        const lastAuthor = authors[authors.length - 1]
        if (lastAuthor) {
          parts.push(`${first19}, ... ${this.formatAuthorLastFirst(lastAuthor)}.`)
        }
      }
    }

    // Year
    const year = this.extractYear(publishDate)
    if (year) {
      parts.push(`(${year}).`)
    } else {
      parts.push('(n.d.).')
    }

    // Title (italicized in print)
    parts.push(`${title}.`)

    // Publisher
    if (publisher) {
      parts.push(`${publisher}.`)
    }

    // DOI or URL
    if (options.includeDoi && doi) {
      parts.push(`https://doi.org/${doi}`)
    } else if (options.includeUrl && url) {
      parts.push(url)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      inlineReference: this.formatAPAInline(metadata)
    }
  }

  private static formatAPAInline(metadata: DocumentMetadata): string {
    const { authors = [], publishDate } = metadata
    const year = this.extractYear(publishDate) || 'n.d.'
    
    if (authors.length === 0) {
      return `(${metadata.title}, ${year})`
    } else if (authors.length === 1 && authors[0]) {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName}, ${year})`
    } else if (authors.length === 2 && authors[0] && authors[1]) {
      const last1 = this.extractLastName(authors[0] ?? "")
      const last2 = this.extractLastName(authors[1] ?? "")
      return `(${last1} & ${last2}, ${year})`
    } else if (authors[0]) {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName} et al., ${year})`
    }
    return `(${metadata.title}, ${year})`
  }

  /**
   * MLA 9th Edition Format
   * Example: Author. "Title of Work." Publisher, Year.
   */
  private static formatMLA(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, url } = metadata
    const parts: string[] = []

    // Authors
    if (authors.length > 0) {
      if (authors.length === 1) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}.`)
      } else if (authors.length === 2) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}, and ${this.formatAuthorFirstLast(authors[1] ?? "")}.`)
      } else {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}, et al.`)
      }
    }

    // Title (in quotes for articles, italicized for books)
    parts.push(`"${title}."`)

    // Publisher
    if (publisher) {
      parts.push(`${publisher},`)
    }

    // Year
    const year = this.extractYear(publishDate)
    if (year) {
      parts.push(`${year}.`)
    }

    // URL
    if (options.includeUrl && url) {
      parts.push(url)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      inlineReference: this.formatMLAInline(metadata)
    }
  }

  private static formatMLAInline(metadata: DocumentMetadata): string {
    const { authors = [], pageNumbers } = metadata
    
    if (authors.length === 0) {
      return `("${metadata.title}"${pageNumbers ? ' ' + pageNumbers : ''})`
    } else if (authors.length === 1) {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName}${pageNumbers ? ' ' + pageNumbers : ''})`
    } else if (authors.length === 2) {
      const last1 = this.extractLastName(authors[0] ?? "")
      const last2 = this.extractLastName(authors[1] ?? "")
      return `(${last1} and ${last2}${pageNumbers ? ' ' + pageNumbers : ''})`
    } else {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName} et al.${pageNumbers ? ' ' + pageNumbers : ''})`
    }
  }

  /**
   * Chicago Manual of Style (Notes and Bibliography)
   * Example: Author. Title. Place: Publisher, Year.
   */
  private static formatChicago(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, url } = metadata
    const parts: string[] = []

    // Authors
    if (authors.length > 0) {
      if (authors.length === 1) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}.`)
      } else if (authors.length === 2) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")} and ${this.formatAuthorFirstLast(authors[1] ?? "")}.`)
      } else if (authors.length === 3) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}, ${this.formatAuthorFirstLast(authors[1] ?? "")}, and ${this.formatAuthorFirstLast(authors[2] ?? "")}.`)
      } else {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")} et al.`)
      }
    }

    // Title
    parts.push(`${title}.`)

    // Publisher and Year
    const year = this.extractYear(publishDate)
    if (publisher && year) {
      parts.push(`${publisher}, ${year}.`)
    } else if (publisher) {
      parts.push(`${publisher}.`)
    } else if (year) {
      parts.push(`${year}.`)
    }

    // URL
    if (options.includeUrl && url) {
      parts.push(url)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      footnote: this.formatChicagoFootnote(metadata)
    }
  }

  private static formatChicagoFootnote(metadata: DocumentMetadata): string {
    const { title, authors = [], publishDate, pageNumbers } = metadata
    const year = this.extractYear(publishDate)
    
    if (authors.length === 0) {
      return `"${title}"${year ? ` (${year})` : ''}${pageNumbers ? ', ' + pageNumbers : ''}.`
    } else if (authors.length === 1) {
      return `${this.formatAuthorFirstLast(authors[0] ?? "")}, "${title}"${year ? ` (${year})` : ''}${pageNumbers ? ', ' + pageNumbers : ''}.`
    } else if (authors.length === 2) {
      return `${this.formatAuthorFirstLast(authors[0] ?? "")} and ${this.formatAuthorFirstLast(authors[1] ?? "")}, "${title}"${year ? ` (${year})` : ''}${pageNumbers ? ', ' + pageNumbers : ''}.`
    } else {
      return `${this.formatAuthorFirstLast(authors[0] ?? "")} et al., "${title}"${year ? ` (${year})` : ''}${pageNumbers ? ', ' + pageNumbers : ''}.`
    }
  }

  /**
   * IEEE Citation Style
   * Example: [1] A. Author, "Title," Publisher, Year.
   */
  private static formatIEEE(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, doi, url } = metadata
    const parts: string[] = []

    // Authors (initials first)
    if (authors.length > 0) {
      if (authors.length <= 6) {
        const authorList = authors.map(a => this.formatAuthorInitials(a)).join(', ')
        parts.push(`${authorList},`)
      } else {
        const firstAuthor = this.formatAuthorInitials(authors[0] ?? "")
        parts.push(`${firstAuthor} et al.,`)
      }
    }

    // Title
    parts.push(`"${title},"`)

    // Publisher
    if (publisher) {
      parts.push(`${publisher},`)
    }

    // Year
    const year = this.extractYear(publishDate)
    if (year) {
      parts.push(`${year}.`)
    }

    // DOI or URL
    if (options.includeDoi && doi) {
      parts.push(`doi: ${doi}`)
    } else if (options.includeUrl && url) {
      parts.push(`[Online]. Available: ${url}`)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      inlineReference: '[#]' // Numbered reference, actual number assigned during bibliography generation
    }
  }

  /**
   * Harvard Referencing Style
   * Example: Author, A. (Year) Title. Publisher.
   */
  private static formatHarvard(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, url } = metadata
    const parts: string[] = []

    // Authors
    if (authors.length > 0) {
      if (authors.length === 1) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}`)
      } else if (authors.length === 2) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")} and ${this.formatAuthorLastFirst(authors[1] ?? "")}`)
      } else if (authors.length === 3) {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")}, ${this.formatAuthorLastFirst(authors[1] ?? "")} and ${this.formatAuthorLastFirst(authors[2] ?? "")}`)
      } else {
        parts.push(`${this.formatAuthorLastFirst(authors[0] ?? "")} et al.`)
      }
    }

    // Year
    const year = this.extractYear(publishDate)
    if (year) {
      parts.push(`(${year})`)
    }

    // Title
    parts.push(`${title}.`)

    // Publisher
    if (publisher) {
      parts.push(`${publisher}.`)
    }

    // URL
    if (options.includeUrl && url) {
      const accessDate = options.includeAccessDate ? ` [Accessed ${this.formatDate(new Date())}]` : ''
      parts.push(`Available at: ${url}${accessDate}`)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      inlineReference: this.formatHarvardInline(metadata)
    }
  }

  private static formatHarvardInline(metadata: DocumentMetadata): string {
    const { authors = [], publishDate, pageNumbers } = metadata
    const year = this.extractYear(publishDate) || 'n.d.'
    
    if (authors.length === 0) {
      return `(${metadata.title}, ${year}${pageNumbers ? ', p. ' + pageNumbers : ''})`
    } else if (authors.length === 1) {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName}, ${year}${pageNumbers ? ', p. ' + pageNumbers : ''})`
    } else if (authors.length === 2) {
      const last1 = this.extractLastName(authors[0] ?? "")
      const last2 = this.extractLastName(authors[1] ?? "")
      return `(${last1} and ${last2}, ${year}${pageNumbers ? ', p. ' + pageNumbers : ''})`
    } else {
      const lastName = this.extractLastName(authors[0] ?? "")
      return `(${lastName} et al., ${year}${pageNumbers ? ', p. ' + pageNumbers : ''})`
    }
  }

  /**
   * Vancouver Citation Style (Numeric)
   * Example: Author A, Author B. Title. Publisher; Year.
   */
  private static formatVancouver(metadata: DocumentMetadata, options: CitationOptions): CitationFormatResult {
    const { title, authors = [], publishDate, publisher, url } = metadata
    const parts: string[] = []

    // Authors
    if (authors.length > 0) {
      if (authors.length <= 6) {
        const authorList = authors.map(a => this.formatAuthorInitials(a)).join(', ')
        parts.push(`${authorList}.`)
      } else {
        const firstSix = authors.slice(0, 6).map(a => this.formatAuthorInitials(a)).join(', ')
        parts.push(`${firstSix}, et al.`)
      }
    }

    // Title
    parts.push(`${title}.`)

    // Publisher and Year
    const year = this.extractYear(publishDate)
    if (publisher && year) {
      parts.push(`${publisher}; ${year}.`)
    } else if (publisher) {
      parts.push(`${publisher}.`)
    } else if (year) {
      parts.push(`${year}.`)
    }

    // URL
    if (options.includeUrl && url) {
      parts.push(`Available from: ${url}`)
    }

    const citation = parts.join(' ')
    
    return {
      citation,
      bibliography: citation,
      inlineReference: '[#]' // Numbered reference
    }
  }

  /**
   * Helper: Format author as "Last, F. M."
   */
  private static formatAuthorLastFirst(author: string): string {
    if (!author) return ''
    const parts = author.trim().split(' ').filter(p => p)
    if (parts.length === 1) return parts[0] || ''
    
    const lastName = parts[parts.length - 1]
    const initials = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + '.').join(' ')
    return `${lastName}, ${initials}`
  }

  /**
   * Helper: Format author as "First M. Last"
   */
  private static formatAuthorFirstLast(author: string): string {
    if (!author) return ''
    const parts = author.trim().split(' ').filter(p => p)
    if (parts.length === 1) return parts[0] || ''
    
    const lastName = parts[parts.length - 1]
    const firstName = parts[0]
    const middleInitials = parts.slice(1, -1).map(p => p.charAt(0).toUpperCase() + '.').join(' ')
    return middleInitials 
      ? `${firstName} ${middleInitials} ${lastName}`
      : `${firstName} ${lastName}`
  }

  /**
   * Helper: Format author as "A. B. Last"
   */
  private static formatAuthorInitials(author: string): string {
    if (!author) return ''
    const parts = author.trim().split(' ').filter(p => p)
    if (parts.length === 1) return parts[0] || ''
    
    const lastName = parts[parts.length - 1]
    const initials = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + '.').join(' ')
    return `${initials} ${lastName}`
  }

  /**
   * Helper: Extract last name
   */
  private static extractLastName(author: string): string {
    if (!author) return ''
    const parts = author.trim().split(' ').filter(p => p)
    return parts[parts.length - 1] || ''
  }
  
  /**
   * Helper: Safely get author from array
   */
  private static getAuthor(authors: (string | undefined)[], index: number): string {
    return authors[index] || ''
  }

  /**
   * Helper: Extract year from date
   */
  private static extractYear(date?: Date | string): string | null {
    if (!date) return null
    
    if (typeof date === 'string') {
      const year = date.match(/\d{4}/)
      return year ? year[0] : null
    }
    
    if (date instanceof Date) {
      return date.getFullYear().toString()
    }
    
    return null
  }

  /**
   * Helper: Format date as DD Month YYYY
   */
  private static formatDate(date: Date): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  /**
   * Generate a bibliography from multiple citations
   */
  static generateBibliography(
    documents: DocumentMetadata[], 
    style: CitationStyle,
    options: Partial<CitationOptions> = {}
  ): string[] {
    const fullOptions: CitationOptions = {
      style,
      type: 'bibliography',
      includeUrl: true,
      includeDoi: true,
      includeAccessDate: false,
      ...options
    }

    return documents
      .map(doc => this.format(doc, fullOptions).bibliography)
      .filter((bib): bib is string => bib !== undefined)
      .sort((a, b) => a.localeCompare(b)) // Alphabetical order
  }

  /**
   * Copy citation to clipboard
   */
  static async copyToClipboard(citation: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(citation)
      return true
    } catch (error) {
      console.error('Failed to copy citation:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = citation
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return false
      } catch {
        return false
      }
    }
  }

  /**
   * Export bibliography to file
   */
  static exportBibliography(bibliography: string[], style: CitationStyle, filename?: string): void {
    const content = bibliography.join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `bibliography_${style.toLowerCase()}_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export default CitationFormatter
