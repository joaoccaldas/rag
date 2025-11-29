/**
 * Enhanced Source Content Formatter
 * 
 * This utility provides advanced formatting for source content display:
 * - Text cleanup and normalization
 * - Intelligent excerpt generation
 * - Line break handling
 * - Special character processing
 * - Context-aware truncation
 */

// Text cleaning utilities
export class SourceContentFormatter {
  /**
   * Clean and format source content for display
   */
  static formatSourceContent(content: string, maxLength: number = 200): string {
    if (!content || typeof content !== 'string') {
      return 'Content not available'
    }

    // Step 1: Remove excessive whitespace and normalize line breaks
    let cleaned = content
      .replace(/\r\n/g, '\n')           // Normalize line breaks
      .replace(/\r/g, '\n')             // Convert remaining \r to \n
      .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive line breaks
      .replace(/[ \t]+/g, ' ')          // Normalize whitespace
      .replace(/\n /g, '\n')            // Remove leading spaces after line breaks
      .trim()

    // Step 2: Handle special formatting patterns
    cleaned = this.processSpecialPatterns(cleaned)

    // Step 3: Generate intelligent excerpt
    const excerpt = this.generateExcerpt(cleaned, maxLength)

    // Step 4: Final cleanup
    return this.finalCleanup(excerpt)
  }

  /**
   * Process special text patterns (tables, lists, etc.)
   */
  private static processSpecialPatterns(text: string): string {
    // Handle table-like content
    text = text.replace(/\|\s*([^|]+)\s*\|/g, (match, content) => {
      return `${content.trim()}`
    })

    // Handle bullet points and lists
    text = text.replace(/^[\s]*[-•*]\s*/gm, '• ')
    text = text.replace(/^[\s]*\d+\.\s*/gm, (match, offset, string) => {
      const lineStart = string.lastIndexOf('\n', offset) + 1
      const indent = offset - lineStart
      return `${indent > 0 ? ' '.repeat(Math.min(indent, 4)) : ''}• `
    })

    // Handle headers and emphasis
    text = text.replace(/^#{1,6}\s*(.+)$/gm, '$1')  // Remove markdown headers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove bold formatting
    text = text.replace(/\*([^*]+)\*/g, '$1')       // Remove italic formatting

    // Handle code blocks
    text = text.replace(/```[\s\S]*?```/g, '[Code Block]')
    text = text.replace(/`([^`]+)`/g, '$1')

    return text
  }

  /**
   * Generate intelligent excerpt that preserves meaning
   */
  private static generateExcerpt(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    
    let excerpt = ''
    let currentLength = 0

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim()
      
      // If adding this sentence would exceed limit
      if (currentLength + cleanSentence.length > maxLength) {
        // If we have no content yet, take a portion of this sentence
        if (excerpt === '') {
          excerpt = this.truncateAtWord(cleanSentence, maxLength - 3)
          break
        }
        // Otherwise, we have enough content
        break
      }

      excerpt += (excerpt ? ' ' : '') + cleanSentence
      currentLength += cleanSentence.length + 1
    }

    return excerpt.trim()
  }

  /**
   * Truncate text at word boundary
   */
  private static truncateAtWord(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }

    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > maxLength * 0.7) { // If last space is reasonably close to end
      return truncated.substring(0, lastSpace)
    }
    
    return truncated
  }

  /**
   * Final cleanup of the formatted text
   */
  private static finalCleanup(text: string): string {
    return text
      .replace(/\s+/g, ' ')              // Normalize spaces
      .replace(/^\s+|\s+$/g, '')         // Trim
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')  // Ensure proper sentence spacing
  }

  /**
   * Clean document title for display
   */
  static formatDocumentTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return 'Untitled Document'
    }

    let cleaned = title.trim()

    // Remove common prefixes
    cleaned = cleaned.replace(/^(Document: |File: |PDF: )/i, '')

    // Remove file extensions
    cleaned = cleaned.replace(/\.[^/.]+$/, '')

    // Replace underscores and hyphens with spaces
    cleaned = cleaned.replace(/[_-]+/g, ' ')

    // Normalize spaces
    cleaned = cleaned.replace(/\s+/g, ' ')

    // Title case conversion (for better readability)
    cleaned = this.toTitleCase(cleaned)

    return cleaned || 'Untitled Document'
  }

  /**
   * Convert to title case
   */
  private static toTitleCase(str: string): string {
    const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i
    
    return str.toLowerCase().split(' ').map((word, index, array) => {
      if (index === 0 || index === array.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      
      if (smallWords.test(word)) {
        return word.toLowerCase()
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
  }

  /**
   * Extract key phrases from content for highlighting
   */
  static extractKeyPhrases(content: string, maxPhrases: number = 3): string[] {
    if (!content || typeof content !== 'string') {
      return []
    }

    // Simple keyword extraction based on word frequency and context
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })

    // Get most frequent meaningful words
    const sortedWords = Object.entries(wordFreq)
      .filter(([word]) => !this.isStopWord(word))
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxPhrases)
      .map(([word]) => word)

    return sortedWords
  }

  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
      'one', 'all', 'would', 'there', 'their'
    ])
    
    return stopWords.has(word.toLowerCase())
  }

  /**
   * Generate source preview with proper formatting
   */
  static generateSourcePreview(source: {
    title: string
    content: string
    score?: number
    documentId: string
    chunkId?: string
  }): {
    formattedTitle: string
    formattedContent: string
    keyPhrases: string[]
    scoreLabel: string
  } {
    return {
      formattedTitle: this.formatDocumentTitle(source.title),
      formattedContent: this.formatSourceContent(source.content, 180),
      keyPhrases: this.extractKeyPhrases(source.content, 3),
      scoreLabel: `${Math.round((source.score || 0) * 100)}% relevance`
    }
  }
}
