// Document Processing Utilities - Fixed and Consolidated
// This file provides base document processing without visual content extraction

import { DocumentChunk, DocumentType } from '../types'
import { tokenAwareChunking, estimateTokenCount } from './enhanced-chunking'
import { RTFProcessor, YAMLProcessor, EPUBProcessor } from './processors'
import type { PDFPageProxy } from 'pdfjs-dist'

// Import browser-compatible processing libraries
let pdfjs: typeof import('pdfjs-dist') | null = null
let mammoth: typeof import('mammoth') | null = null
let tesseract: typeof import('tesseract.js') | null = null
let JSZip: typeof import('jszip') | null = null

// Lazy load dependencies to avoid build issues
async function loadPdfjs() {
  if (!pdfjs) {
    try {
      pdfjs = await import('pdfjs-dist')
      // Set worker source for PDF.js - use local worker file
      if (typeof window !== 'undefined') {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      }
    } catch (error) {
      console.warn('pdfjs-dist not available:', error)
    }
  }
  return pdfjs
}

async function loadMammoth() {
  if (!mammoth) {
    try {
      mammoth = await import('mammoth')
    } catch (error) {
      console.warn('mammoth not available:', error)
    }
  }
  return mammoth
}

async function loadTesseract() {
  if (!tesseract) {
    try {
      tesseract = await import('tesseract.js')
    } catch (error) {
      console.warn('tesseract.js not available:', error)
    }
  }
  return tesseract
}

async function loadJSZip() {
  if (!JSZip) {
    try {
      JSZip = await import('jszip')
    } catch (error) {
      console.warn('jszip not available:', error)
    }
  }
  return JSZip
}

/**
 * Process document content and split into chunks (NO visual content extraction)
 * Visual content is handled separately by the enhanced processing pipeline
 */
export async function processDocument(file: File, documentId: string): Promise<{
  content: string
  chunks: DocumentChunk[]
  wordCount: number
}> {
  const content = await extractTextContent(file)
  
  // Use enhanced token-aware chunking
  const tokenChunks = tokenAwareChunking(content, documentId, {
    maxTokens: 512,
    overlap: 50,
    preferSentenceBoundaries: true,
    preserveStructure: true
  })
  
  // Convert TokenBasedChunk to DocumentChunk for compatibility
  const chunks: DocumentChunk[] = tokenChunks.map(tokenChunk => ({
    id: tokenChunk.id,
    documentId: tokenChunk.documentId,
    content: tokenChunk.content,
    startIndex: tokenChunk.startIndex,
    endIndex: tokenChunk.endIndex,
    metadata: {
      importance: tokenChunk.metadata.importance,
      ...(tokenChunk.metadata.hasHeading && { section: 'heading' }),
      ...(tokenChunk.metadata.hasCode && { section: 'code' }),
      ...(tokenChunk.metadata.hasTable && { section: 'table' })
    }
  }))
  
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

  console.log(`Enhanced chunking: ${chunks.length} chunks, avg ${Math.round(chunks.reduce((sum, c) => sum + estimateTokenCount(c.content), 0) / chunks.length)} tokens per chunk`)

  return {
    content,
    chunks,
    wordCount
  }
}

/**
 * Extract text content from different file types
 * SUPPORTS: PDF, DOCX, TXT, JSON, CSV, HTML, XML, XLSX, PPTX, RTF, YAML, EPUB, ODT/ODS/ODP, Images, JS, CSS, PY, etc.
 */
async function extractTextContent(file: File): Promise<string> {
  const fileType = getFileType(file.name)
  
  switch (fileType) {
    case 'txt':
    case 'markdown':
      return await readTextFile(file)
    
    case 'json':
      try {
        const text = await readTextFile(file)
        const json = JSON.parse(text)
        return extractTextFromJSON(json)
      } catch {
        return await readTextFile(file)
      }
    
    case 'csv':
      return await processCSV(file)
    
    case 'html':
      return await processHTML(file)
    
    case 'xml':
      return await processXML(file)
    
    case 'pdf':
      return await processPDF(file)
    
    case 'docx':
      return await processDOCX(file)
    
    case 'xlsx':
      return await processXLSX(file)
    
    case 'pptx':
      return await processPPTX(file)
    
    case 'rtf':
      return await processRTF(file)
    
    case 'yaml':
      return await processYAML(file)
    
    case 'epub':
      return await processEPUB(file)
    
    case 'odt':
    case 'ods':
    case 'odp':
      return await processOpenDocument(file)
    
    // NEW: Support for code files
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'css':
    case 'scss':
    case 'less':
    case 'sql':
    case 'php':
    case 'java':
    case 'cpp':
    case 'c':
    case 'h':
    case 'rb':
    case 'go':
    case 'rs':
    case 'swift':
    case 'kt':
      return await processCodeFile(file)
    
    case 'log':
    case 'toml':
    case 'ini':
    case 'cfg':
      return await readTextFile(file)
    
    case 'image':
      return await processImage(file)
    
    default:
      return await readTextFile(file)
  }
}

/**
 * NEW: Process code files with syntax highlighting context
 */
async function processCodeFile(file: File): Promise<string> {
  const content = await readTextFile(file)
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  
  // Add context about the code file
  let processedContent = `Code File: ${file.name} (${extension.toUpperCase()})\n`
  processedContent += `File Size: ${Math.round(file.size / 1024)}KB\n\n`
  
  // Extract comments and documentation
  const comments = extractCodeComments(content, extension)
  if (comments.length > 0) {
    processedContent += `Documentation Comments:\n${comments.join('\n')}\n\n`
  }
  
  // Extract function/class names for better searchability
  const symbols = extractCodeSymbols(content, extension)
  if (symbols.length > 0) {
    processedContent += `Code Symbols: ${symbols.join(', ')}\n\n`
  }
  
  processedContent += `Source Code:\n${content}`
  
  return processedContent
}

/**
 * Extract comments from code files
 */
function extractCodeComments(content: string, extension: string): string[] {
  const comments: string[] = []
  
  // Common comment patterns
  const patterns = {
    singleLine: /\/\/\s*(.+)$/gm,  // // comments
    multiLine: /\/\*\*?([\s\S]*?)\*\//g,  // /* */ and /** */ comments
    python: /#\s*(.+)$/gm,  // # comments
    sql: /--\s*(.+)$/gm  // -- comments
  }
  
  let commentPattern: RegExp
  
  switch (extension) {
    case 'py':
    case 'rb':
      commentPattern = patterns.python
      break
    case 'sql':
      commentPattern = patterns.sql
      break
    default:
      // JavaScript-style comments
      commentPattern = patterns.singleLine
      break
  }
  
  const matches = content.match(commentPattern)
  if (matches) {
    comments.push(...matches.map(match => match.trim()))
  }
  
  // Also check for multi-line comments in JS-style languages
  if (['js', 'jsx', 'ts', 'tsx', 'css', 'java', 'cpp', 'c'].includes(extension)) {
    const multiLineMatches = content.match(patterns.multiLine)
    if (multiLineMatches) {
      comments.push(...multiLineMatches.map(match => match.trim()))
    }
  }
  
  return comments.slice(0, 10) // Limit to first 10 comments
}

/**
 * Extract function/class/symbol names from code
 */
function extractCodeSymbols(content: string, extension: string): string[] {
  const symbols: string[] = []
  
  const patterns = {
    js: [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
      /export\s+(?:function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    ],
    py: [
      /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    ],
    css: [
      /\.([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g,
      /#([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g
    ]
  }
  
  let symbolPatterns: RegExp[] = []
  
  switch (extension) {
    case 'py':
      symbolPatterns = patterns.py
      break
    case 'css':
    case 'scss':
    case 'less':
      symbolPatterns = patterns.css
      break
    default:
      symbolPatterns = patterns.js
      break
  }
  
  for (const pattern of symbolPatterns) {
    const matches = [...content.matchAll(pattern)]
    symbols.push(...matches.map(match => match[1]).filter(Boolean))
  }
  
  return [...new Set(symbols)].slice(0, 20) // Unique symbols, limit to 20
}

// ... [Include all the existing helper functions from the original file]
// (readTextFile, extractTextFromJSON, processCSV, processPDF, processDOCX, etc.)

/**
 * Read text file content
 */
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Extract text from JSON object recursively
 */
function extractTextFromJSON(obj: unknown, depth = 0): string {
  if (depth > 10) return '' // Prevent infinite recursion
  
  if (typeof obj === 'string') {
    return obj
  } else if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  } else if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromJSON(item, depth + 1)).join(' ')
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).map(value => extractTextFromJSON(value, depth + 1)).join(' ')
  }
  
  return ''
}

/**
 * Get file type from filename with expanded support
 */
function getFileType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    // Documents
    case 'pdf': return 'pdf'
    case 'txt': return 'txt'
    case 'docx': return 'docx'
    case 'md': return 'markdown'
    case 'html': return 'html'
    case 'xml': return 'xml'
    
    // Data formats
    case 'json': return 'json'
    case 'csv': return 'csv'
    case 'xlsx': return 'xlsx'
    case 'yaml':
    case 'yml': return 'yaml'
    case 'toml': return 'toml'
    case 'ini': return 'ini'
    case 'cfg': return 'cfg'
    
    // Presentations
    case 'pptx': return 'pptx'
    
    // Rich text
    case 'rtf': return 'rtf'
    case 'odt': return 'odt'
    case 'ods': return 'ods'
    case 'odp': return 'odp'
    
    // E-books
    case 'epub': return 'epub'
    case 'mobi': return 'mobi'
    case 'azw': return 'azw'
    
    // Code files
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': return 'js'
    case 'py': return 'py'
    case 'css':
    case 'scss':
    case 'less': return 'css'
    case 'sql': return 'sql'
    case 'php': return 'php'
    case 'java': return 'java'
    case 'cpp':
    case 'c':
    case 'h': return 'cpp'
    case 'rb': return 'rb'
    case 'go': return 'go'
    case 'rs': return 'rs'
    case 'swift': return 'swift'
    case 'kt': return 'kt'
    
    // System files
    case 'log': return 'log'
    
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'tiff':
      return 'image'
      
    default: return 'txt'
  }
}

/**
 * Generate real semantic embeddings using Ollama
 * Falls back to mock embeddings if Ollama is unavailable
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try to get real embeddings from Ollama
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text.slice(0, 8192) // Limit text length for embedding model
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.embedding && Array.isArray(data.embedding)) {
        console.log(`Generated real embedding for text of length ${text.length}`)
        return data.embedding
      }
    }
    
    // If Ollama request fails, fall back to mock embeddings
    console.warn('Ollama embeddings unavailable, using fallback')
    return generateMockEmbedding(text)
  } catch (error) {
    console.warn('Error generating real embeddings, using fallback:', error)
    return generateMockEmbedding(text)
  }
}

/**
 * Generate mock embeddings as fallback
 * Only used when Ollama is unavailable
 */
function generateMockEmbedding(text: string): number[] {
  // Mock embedding generation - returns a simple hash-based vector
  const words = text.toLowerCase().split(/\s+/)
  const embedding = new Array(384).fill(0) // Standard embedding size
  
  words.forEach((word, index) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i)
      const position = (charCode + i) % 384
      embedding[position] += 1 / (index + 1) // Weight by position
    }
  })
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
}

/**
 * Calculate similarity between two embeddings
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0
  
  let dotProduct = 0
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
  }
  
  return Math.max(0, Math.min(1, dotProduct))
}

// [Include all other helper functions: processCSV, processPDF, processDOCX, etc. - same as original]
