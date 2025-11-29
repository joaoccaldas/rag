/**
 * Enhanced chunking utilities with token-awareness and semantic improvements
 */

export interface ChunkingOptions {
  maxTokens?: number
  overlap?: number
  preferSentenceBoundaries?: boolean
  preserveStructure?: boolean
}

export interface TokenBasedChunk {
  id: string
  documentId: string
  content: string
  tokenCount: number
  startIndex: number
  endIndex: number
  metadata: {
    importance: number
    hasCode?: boolean
    hasTable?: boolean
    hasHeading?: boolean
    topics?: string[]
  }
}

/**
 * Simple token estimation (approximation)
 * More accurate than character-based, simpler than full tokenizer
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // More sophisticated than character counting but doesn't require external deps
  
  const words = text.trim().split(/\s+/)
  let tokenCount = 0
  
  for (const word of words) {
    if (word.length === 0) continue
    
    // Simple heuristics for token estimation
    if (word.length <= 3) {
      tokenCount += 1
    } else if (word.length <= 8) {
      tokenCount += Math.ceil(word.length / 4)
    } else {
      tokenCount += Math.ceil(word.length / 3.5) // Longer words tend to be more tokens
    }
    
    // Add extra tokens for special characters, numbers, etc.
    if (/[0-9]/.test(word)) tokenCount += 0.2
    if (/[^\w\s]/.test(word)) tokenCount += 0.1
  }
  
  return Math.ceil(tokenCount)
}

/**
 * Enhanced token-aware chunking with semantic boundaries
 */
export function tokenAwareChunking(
  text: string, 
  documentId: string, 
  options: ChunkingOptions = {}
): TokenBasedChunk[] {
  const {
    maxTokens = 512,
    overlap = 50,
    preferSentenceBoundaries = true,
    preserveStructure = true
  } = options

  const chunks: TokenBasedChunk[] = []
  
  // First, try to preserve document structure
  const sections = preserveStructure ? extractSections(text) : [{ content: text, type: 'content' }]
  
  for (const section of sections) {
    const sectionChunks = chunkSection(section.content, documentId, chunks.length, {
      maxTokens,
      overlap,
      preferSentenceBoundaries,
      sectionType: section.type
    })
    chunks.push(...sectionChunks)
  }
  
  return chunks
}

/**
 * Extract document sections (headings, paragraphs, code blocks, etc.)
 */
function extractSections(text: string): { content: string; type: string }[] {
  const sections: { content: string; type: string }[] = []
  const lines = text.split('\n')
  
  let currentSection = ''
  let currentType = 'content'
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Detect headings (markdown-style or by pattern)
    if (trimmedLine.match(/^#{1,6}\s+/) || 
        trimmedLine.match(/^[A-Z][^.!?]*$/) ||
        trimmedLine.match(/^\d+\.\s+[A-Z]/)) {
      
      // Save previous section
      if (currentSection.trim()) {
        sections.push({ content: currentSection.trim(), type: currentType })
      }
      
      // Start new section
      currentSection = line + '\n'
      currentType = 'heading'
    }
    // Detect code blocks
    else if (trimmedLine.startsWith('```') || trimmedLine.startsWith('    ')) {
      if (currentType !== 'code') {
        if (currentSection.trim()) {
          sections.push({ content: currentSection.trim(), type: currentType })
        }
        currentSection = line + '\n'
        currentType = 'code'
      } else {
        currentSection += line + '\n'
      }
    }
    // Detect tables
    else if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
      if (currentType !== 'table') {
        if (currentSection.trim()) {
          sections.push({ content: currentSection.trim(), type: currentType })
        }
        currentSection = line + '\n'
        currentType = 'table'
      } else {
        currentSection += line + '\n'
      }
    }
    // Regular content
    else {
      if (currentType !== 'content' && trimmedLine) {
        if (currentSection.trim()) {
          sections.push({ content: currentSection.trim(), type: currentType })
        }
        currentSection = line + '\n'
        currentType = 'content'
      } else {
        currentSection += line + '\n'
      }
    }
  }
  
  // Add final section
  if (currentSection.trim()) {
    sections.push({ content: currentSection.trim(), type: currentType })
  }
  
  return sections
}

/**
 * Chunk a section with token awareness
 */
function chunkSection(
  text: string,
  documentId: string,
  startIndex: number,
  options: ChunkingOptions & { sectionType?: string }
): TokenBasedChunk[] {
  const { maxTokens = 512, overlap = 50, preferSentenceBoundaries = true, sectionType = 'content' } = options
  
  const chunks: TokenBasedChunk[] = []
  
  // For small sections, keep as single chunk
  const totalTokens = estimateTokenCount(text)
  if (totalTokens <= maxTokens) {
    chunks.push(createTokenChunk(text, documentId, startIndex, 0, text.length, sectionType))
    return chunks
  }
  
  // Split into sentences for better boundaries
  const sentences = preferSentenceBoundaries ? smartSentenceSplit(text) : [text]
  
  let currentChunk = ''
  let currentTokens = 0
  let chunkIndex = 0
  let charIndex = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokenCount(sentence)
    
    // If adding this sentence exceeds max tokens, create a new chunk
    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(createTokenChunk(
        currentChunk.trim(), 
        documentId, 
        startIndex + chunkIndex, 
        charIndex - currentChunk.length, 
        charIndex,
        sectionType
      ))
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlap)
      currentChunk = overlapText + ' ' + sentence
      currentTokens = estimateTokenCount(currentChunk)
      chunkIndex++
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
      currentTokens += sentenceTokens
    }
    
    charIndex += sentence.length + 1 // +1 for space
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createTokenChunk(
      currentChunk.trim(),
      documentId,
      startIndex + chunkIndex,
      charIndex - currentChunk.length,
      charIndex,
      sectionType
    ))
  }
  
  return chunks
}

/**
 * Smart sentence splitting with improved boundary detection
 */
function smartSentenceSplit(text: string): string[] {
  // More sophisticated sentence splitting
  const sentences: string[] = []
  
  // Split on sentence boundaries but be smart about abbreviations
  const parts = text.split(/([.!?]+(?:\s+|$))/)
  
  let currentSentence = ''
  
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i]?.trim()
    const punctuation = parts[i + 1]?.trim()
    
    if (sentence) {
      currentSentence += sentence
      
      if (punctuation) {
        currentSentence += punctuation
        
        // Better sentence ending detection
        if (isCompleteSentence(currentSentence, parts[i + 2])) {
          sentences.push(currentSentence.trim())
          currentSentence = ''
        } else {
          currentSentence += ' '
        }
      }
    }
  }
  
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim())
  }
  
  return sentences.filter(s => s.length > 0)
}

/**
 * Determine if this is a complete sentence
 */
function isCompleteSentence(sentence: string, nextPart?: string): boolean {
  // Common abbreviations
  const abbreviations = new Set([
    'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.',
    'vs.', 'etc.', 'e.g.', 'i.e.', 'cf.', 'al.',
    'Inc.', 'Ltd.', 'Corp.', 'Co.', 'LLC'
  ])
  
  const words = sentence.trim().split(/\s+/)
  const lastWord = words[words.length - 1]
  
  // Check for abbreviations
  if (abbreviations.has(lastWord)) return false
  
  // Check if next part starts with lowercase
  if (nextPart && /^\s*[a-z]/.test(nextPart)) return false
  
  // Check minimum sentence length
  if (sentence.trim().length < 10) return false
  
  // Check for proper sentence structure
  const hasSubject = /\b(I|you|he|she|it|we|they|this|that|the|a|an)\b/i.test(sentence)
  if (!hasSubject && sentence.length < 50) return false
  
  return true
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.trim().split(/\s+/)
  const estimatedWordsNeeded = Math.ceil(overlapTokens * 0.75) // Rough word-to-token ratio
  
  if (words.length <= estimatedWordsNeeded) return text
  
  return words.slice(-estimatedWordsNeeded).join(' ')
}

/**
 * Create a token-based chunk with enhanced metadata
 */
function createTokenChunk(
  content: string,
  documentId: string,
  index: number,
  startIndex: number,
  endIndex: number,
  sectionType: string
): TokenBasedChunk {
  const tokenCount = estimateTokenCount(content)
  
  return {
    id: `${documentId}_chunk_${index}`,
    documentId,
    content: content.trim(),
    tokenCount,
    startIndex,
    endIndex,
    metadata: {
      importance: calculateEnhancedImportance(content, sectionType),
      hasCode: /```|`[^`]+`|\b(function|class|var|let|const|def|import)\b/.test(content),
      hasTable: content.includes('|') && content.split('|').length > 4,
      hasHeading: sectionType === 'heading' || /^#{1,6}\s+/.test(content),
      topics: extractTopics(content)
    }
  }
}

/**
 * Enhanced importance calculation
 */
function calculateEnhancedImportance(content: string, sectionType: string): number {
  let score = 0.5 // base score
  
  // Section type scoring
  switch (sectionType) {
    case 'heading': score += 0.3; break
    case 'code': score += 0.2; break
    case 'table': score += 0.25; break
    default: score += 0.0
  }
  
  // Content length scoring (optimal length gets bonus)
  const tokenCount = estimateTokenCount(content)
  if (tokenCount >= 100 && tokenCount <= 400) score += 0.1
  if (tokenCount >= 200 && tokenCount <= 300) score += 0.1
  
  // Question and answer patterns
  if (/\b(what|how|why|when|where|who|which)\b/i.test(content)) score += 0.15
  if (/\b(answer|solution|result|conclusion)\b/i.test(content)) score += 0.1
  
  // Technical terms and specificity
  const technicalTerms = (content.match(/\b[A-Z]{2,}\b/g) || []).length
  score += Math.min(technicalTerms * 0.02, 0.1)
  
  // Numbers and data
  const numbers = (content.match(/\b\d+(\.\d+)?%?\b/g) || []).length
  score += Math.min(numbers * 0.01, 0.05)
  
  return Math.min(Math.max(score, 0), 1)
}

/**
 * Simple topic extraction
 */
function extractTopics(content: string): string[] {
  // Extract potential topics (capitalized words, technical terms)
  const words = content.match(/\b[A-Z][a-z]+\b/g) || []
  const technicalTerms = content.match(/\b[A-Z]{2,}\b/g) || []
  
  // Combine and filter
  const candidates = [...words, ...technicalTerms]
    .filter(word => word.length > 3)
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  // Get most frequent terms
  return Object.entries(candidates)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word.toLowerCase())
}
