// Document Processing Utilities

import { DocumentChunk, DocumentType } from '../types'
import { tokenAwareChunking, estimateTokenCount } from './enhanced-chunking'
import { RTFProcessor, YAMLProcessor, EPUBProcessor } from './processors'
import type { VisualContent } from '../types'
import type { PDFPageProxy } from 'pdfjs-dist'
import { semanticChunkingService } from '../services/semantic-chunking'

// Import enhanced processing components
import { documentWorkerManager } from '../../workers/worker-manager'
import { errorHandler, createErrorWrapper, ErrorCategory } from '../../utils/error-handling'
import { batchProcessor } from '../../utils/batch-processing'

/**
 * Check if semantic chunking is enabled
 */
function shouldUseSemanticChunking(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Check environment variable first
    const envSetting = process.env['NEXT_PUBLIC_USE_SEMANTIC_CHUNKING']
    if (envSetting !== undefined) {
      return envSetting === 'true'
    }
    
    // Fallback to localStorage setting
    const settings = localStorage.getItem('miele-rag-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.useSemanticChunking ?? false
    }
  } catch (error) {
    console.warn('Failed to check semantic chunking setting:', error)
  }
  
  return false // Default to hybrid chunking
}

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
      const jszipModule = await import('jszip')
      JSZip = jszipModule.default
    } catch (error) {
      console.warn('jszip not available:', error)
    }
  }
  return JSZip
}

// OCR function for PDF pages
async function extractTextWithOCR(page: PDFPageProxy): Promise<string> {
  try {
    const tesseractLib = await loadTesseract()
    if (!tesseractLib) return ''

    // Render page to canvas
    const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) return ''
    
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      canvas: canvas,
      viewport: viewport
    }).promise

    // Convert canvas to image data
    const imageData = canvas.toDataURL('image/png')
    
    // Perform OCR
    const { data: { text } } = await tesseractLib.recognize(imageData, 'eng', {
      logger: () => {} // Disable logging
    })
    
    return text.trim()
  } catch (error) {
    console.warn('OCR extraction failed:', error)
    return ''
  }
}

/**
 * Process document content and split into chunks with enhanced token-aware chunking
 * Enhanced version with worker support and error handling
 */
export async function processDocument(file: File, documentId: string): Promise<{
  content: string
  chunks: DocumentChunk[]
  wordCount: number
  visualContent?: VisualContent[]
}> {
  // Feature flag for worker processing
  const useWorkerProcessing = process.env.NODE_ENV !== 'development' // Enable in production
  
  try {
    // Try worker processing first if enabled
    if (useWorkerProcessing && typeof Worker !== 'undefined') {
      try {
        console.log(`🚀 Using worker processing for ${file.name}`)
        const workerResult = await documentWorkerManager.processDocument(file, documentId, {
          enableOCR: true,
          chunkSize: 512,
          chunkOverlap: 50
        }) as {
          chunks?: DocumentChunk[]
          metadata?: {
            title: string
            type: DocumentType
            size: number
            pages?: number
            processingTime: number
          }
        }
        
        if (workerResult?.chunks) {
          // Worker processing succeeded
          const wordCount = workerResult.chunks.reduce((sum, chunk) => 
            sum + chunk.content.split(/\s+/).filter(word => word.length > 0).length, 0
          )
          
          return {
            content: workerResult.chunks.map(c => c.content).join('\n'),
            chunks: workerResult.chunks,
            wordCount,
            visualContent: []
          }
        }
      } catch (workerError) {
        console.warn('⚠️ Worker processing failed, falling back to main thread:', workerError)
        await errorHandler.handleError(workerError, {
          context: 'worker-fallback',
          fileName: file.name,
          fileSize: file.size
        })
      }
    }
    
    // Fallback to main thread processing
    console.log(`🔄 Using main thread processing for ${file.name}`)
    const content = await extractTextContent(file)
    
    // Extract visual content from document using the enhanced pipeline
    const visualContent = await extractVisualContent(file, documentId)
    
    // Check if semantic chunking is enabled
    const useSemanticChunking = shouldUseSemanticChunking()
    let chunks: DocumentChunk[]
    
    if (useSemanticChunking) {
      console.log('🧠 Using semantic chunking with embeddings...')
      try {
        // Use semantic chunking service
        const semanticChunks = await semanticChunkingService.generateSemanticChunks(
          content,
          documentId,
          {
            maxTokens: 512,
            minTokens: 100,
            targetTokens: 400,
            overlapSentences: 2,
            similarityThreshold: 0.7,
            useEmbeddings: true,
            preserveStructure: true
          }
        )
        
        // Convert to DocumentChunk format
        chunks = semanticChunks.map(chunk =>
          semanticChunkingService.convertToDocumentChunk(chunk, documentId)
        )
        
        console.log(`✅ Semantic chunking complete: ${chunks.length} chunks created`)
      } catch (error) {
        console.warn('⚠️ Semantic chunking failed, falling back to hybrid:', error)
        
        // Fallback to hybrid chunking
        const tokenChunks = tokenAwareChunking(content, documentId, {
          maxTokens: 512,
          overlap: 50,
          preferSentenceBoundaries: true,
          preserveStructure: true
        })
        
        chunks = tokenChunks.map(tokenChunk => ({
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
      }
    } else {
      console.log('🔧 Using hybrid token-aware chunking...')
      
      // Use enhanced token-aware chunking
      const tokenChunks = tokenAwareChunking(content, documentId, {
        maxTokens: 512,
        overlap: 50,
        preferSentenceBoundaries: true,
        preserveStructure: true
      })
      
      // Convert TokenBasedChunk to DocumentChunk for compatibility
      chunks = tokenChunks.map(tokenChunk => ({
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
    }
    
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

    console.log(`✅ Processing complete: ${chunks.length} chunks, avg ${Math.round(chunks.reduce((sum, c) => sum + estimateTokenCount(c.content), 0) / chunks.length)} tokens per chunk`)
    console.log(`🎯 Visual content extraction: ${visualContent.length} elements found`)

    return {
      content,
      chunks,
      wordCount,
      visualContent
    }
  } catch (error) {
    // Enhanced error handling
    const errorDetails = await errorHandler.handleError(error, {
      context: 'document-processing',
      fileName: file.name,
      fileSize: file.size,
      fileType: getFileType(file.name)
    })
    
    // Re-throw with enhanced error details
    throw new Error(errorDetails.userMessage)
  }
}

/**
 * Enhanced batch processing function
 */
export async function processDocuments(
  files: File[], 
  options: {
    enableOCR?: boolean
    enableAI?: boolean
    priority?: 'low' | 'normal' | 'high'
    onProgress?: (progress: { completed: number; total: number; currentFile?: string }) => void
  } = {}
): Promise<string> {
  try {
    console.log(`📦 Starting batch processing for ${files.length} files`)
    
    const jobId = await batchProcessor.submitBatch(files, {
      enableOCR: options.enableOCR ?? true,
      enableAI: options.enableAI ?? true,
      priority: options.priority ?? 'normal',
      maxConcurrentJobs: 2,
      retryAttempts: 3
    })
    
    // Set up progress tracking if callback provided
    if (options.onProgress) {
      const unsubscribe = batchProcessor.onJobUpdate(jobId, (job) => {
        options.onProgress?.({
          completed: job.progress.processedFiles + job.progress.failedFiles,
          total: job.progress.totalFiles,
          currentFile: job.progress.currentFile
        })
        
        // Clean up when job completes
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          unsubscribe()
        }
      })
    }
    
    return jobId
  } catch (error) {
    await errorHandler.handleError(error, {
      context: 'batch-processing',
      fileCount: files.length
    })
    throw error
  }
}

/**
 * Safe wrapper for single document processing with error handling
 */
export const processDocumentSafe = createErrorWrapper(
  async (file: File, documentId: string) => {
    return await processDocument(file, documentId)
  },
  { context: 'safe-document-processing' }
)

/**
 * Extract text content from different file types
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
    
    case 'log':
    case 'toml':
    case 'ini':
    case 'cfg':
      return await readTextFile(file) // These are text-based
    
    // Code file processing
    case 'js':
    case 'py':
    case 'css':
    case 'sql':
    case 'php':
    case 'java':
    case 'cpp':
    case 'ruby':
    case 'go':
    case 'rust':
    case 'swift':
    case 'kotlin':
      return await processCodeFile(file)
    
    case 'image':
      return await processImage(file)
    
    default:
      return await readTextFile(file)
  }
}

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
 * Process CSV file with enhanced content generation for better search
 */
async function processCSV(file: File): Promise<string> {
  const text = await readTextFile(file)
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return ''
  
  const headers = lines[0]?.split(',').map(h => h.trim()) || []
  
  // Create meaningful content based on file name and headers
  let content = `Data from ${file.name}\n`
  content += `CSV Headers: ${headers.join(', ')}\n\n`
  
  // Enhanced data description for better understanding
  content += 'This dataset contains structured information with tabular data. Each row represents a record with various attributes and characteristics.\n\n'
  
  // Process data rows with enhanced descriptions
  const dataRows = lines.slice(1, Math.min(101, lines.length))
  dataRows.forEach((row, index) => {
    const cells = row.split(',').map(c => c.trim())
    
    if (cells.length >= headers.length) {
      // Create descriptive text for data entries
      let rowContent = `Data entry ${index + 1}: `
      
      headers.forEach((header, i) => {
        if (cells[i] && cells[i] !== '') {
          const headerLower = header.toLowerCase()
          const value = cells[i]
          
          if (headerLower.includes('name') || headerLower.includes('title')) {
            rowContent += `Name: ${value}. `
          } else if (headerLower.includes('type') || headerLower.includes('category')) {
            rowContent += `Type: ${value}. `
          } else if (headerLower.includes('value') || headerLower.includes('amount')) {
            rowContent += `Value: ${value}. `
          } else if (headerLower.includes('date') || headerLower.includes('year')) {
            rowContent += `Date: ${value}. `
          } else {
            rowContent += `${header}: ${value}. `
          }
        }
      })
      
      content += rowContent + '\n\n'
    } else {
      // Standard row processing
      content += `Row ${index + 1}: ${cells.join(' | ')}\n`
    }
  })
  
  if (lines.length > 101) {
    content += `\n... and ${lines.length - 101} more rows of data`
  }
  
  return content
}

/**
 * Process PDF file using PDF.js (browser-compatible)
 */
async function processPDF(file: File): Promise<string> {
  console.log(`Processing PDF: ${file.name}, Size: ${file.size} bytes`)
  
  try {
    const pdfjsLib = await loadPdfjs()
    if (!pdfjsLib) {
      const errorMsg = `[PDF Content] ${file.name} - PDF processing library not available. Install with: npm install pdfjs-dist`
      console.error(errorMsg)
      return errorMsg
    }

    console.log('PDF.js library loaded successfully')
    
    const arrayBuffer = await file.arrayBuffer()
    console.log(`PDF ArrayBuffer created, size: ${arrayBuffer.byteLength} bytes`)
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    console.log(`PDF loaded successfully, pages: ${pdf.numPages}`)
    
    let fullText = ''
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`)
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .filter((item) => {
            // Only include items that have text content
            return 'str' in item && (item as { str: string }).str.trim().length > 0
          })
          .map((item) => {
            // Handle both TextItem and TextMarkedContent
            if ('str' in item) {
              return (item as { str: string }).str
            }
            return ''
          })
          .join(' ')
          .replace(/\s+/g, ' ') // Clean up multiple spaces
          .trim()
        
        console.log(`Page ${pageNum} extracted ${pageText.length} characters: "${pageText.substring(0, 100)}..."`)
        
        if (pageText.length > 0) {
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
        } else {
          console.warn(`Page ${pageNum} contains no extractable text - might be an image/scanned page`)
          
          // Try OCR for pages with no text
          try {
            const ocrText = await extractTextWithOCR(page)
            if (ocrText && ocrText.trim().length > 0) {
              console.log(`OCR extracted ${ocrText.length} characters from page ${pageNum}`)
              fullText += `\n--- Page ${pageNum} (OCR) ---\n${ocrText}\n`
            }
          } catch (ocrError) {
            console.log(`OCR failed for page ${pageNum}:`, ocrError)
          }
          fullText += `\n--- Page ${pageNum} ---\n[No extractable text found - page may contain images or scanned content]\n`
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNum}:`, pageError)
        fullText += `\n--- Page ${pageNum} ---\n[Error extracting page content: ${pageError instanceof Error ? pageError.message : 'Unknown error'}]\n`
      }
    }
    
    const result = fullText.trim() || `[PDF Content] ${file.name} - Could not extract text from PDF`
    console.log(`PDF processing complete. Total text length: ${result.length} characters`)
    return result
  } catch (error) {
    const errorMsg = `[PDF Content] ${file.name} - Error processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('PDF processing error:', error)
    return errorMsg
  }
}

/**
 * Process DOCX file using mammoth
 */
async function processDOCX(file: File): Promise<string> {
  try {
    const mammothLib = await loadMammoth()
    if (!mammothLib) {
      return `[DOCX Content] ${file.name} - DOCX processing library not available. Install with: npm install mammoth`
    }

    const arrayBuffer = await file.arrayBuffer()
    const result = await mammothLib.extractRawText({ arrayBuffer })
    
    return result.value || `[DOCX Content] ${file.name} - Could not extract text from DOCX`
  } catch (error) {
    console.error('DOCX processing error:', error)
    return `[DOCX Content] ${file.name} - Error processing DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Process HTML file with improved parsing and debugging
 */
async function processHTML(file: File): Promise<string> {
  console.log(`🌐 Processing HTML file: ${file.name} (${file.size} bytes)`)
  
  const text = await readTextFile(file)
  console.log(`📄 Raw HTML length: ${text.length} characters`)
  console.log(`📝 HTML preview: ${text.substring(0, 200)}...`)
  
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ HTML file is empty')
    return 'HTML file appears to be empty'
  }
  
  // Enhanced HTML processing with better content extraction
  const content = text
    // Remove script and style blocks first (most aggressive removal)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert structural HTML elements to readable text with clear formatting
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    // Handle lists properly
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Handle divs and sections
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<section[^>]*>/gi, '\n')
    .replace(/<\/section>/gi, '')
    .replace(/<article[^>]*>/gi, '\n')
    .replace(/<\/article>/gi, '')
    // Handle tables
    .replace(/<table[^>]*>/gi, '\n\nTable:\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<\/tr>/gi, '')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<\/td>/gi, '')
    .replace(/<th[^>]*>/gi, ' | ')
    .replace(/<\/th>/gi, '')
    // Handle other common elements
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<i[^>]*>/gi, '*')
    .replace(/<\/i>/gi, '*')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Clean up HTML entities (extended list)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    // Clean up whitespace more aggressively
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple+ newlines
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .trim()

  console.log(`✅ Processed HTML content length: ${content.length} characters`)
  console.log(`📋 Content preview: ${content.substring(0, 300)}...`)
  
  if (!content || content.length === 0) {
    console.warn('⚠️ No content extracted from HTML after processing')
    return `HTML file "${file.name}" processed but no readable text content was found. The file may contain only images, scripts, or styling without textual content.`
  }
  
  return content
}

/**
 * Process code files with syntax highlighting and structure preservation
 */
async function processCodeFile(file: File): Promise<string> {
  const rawContent = await readTextFile(file)
  const fileType = getFileType(file.name)
  
  // Add file context and structure information
  let content = `Code File: ${file.name}\n`
  content += `Language: ${getLanguageName(fileType)}\n`
  content += `Size: ${file.size} bytes\n\n`
  
  // Add structure analysis based on file type
  const structureInfo = analyzeCodeStructure(rawContent, fileType)
  if (structureInfo.length > 0) {
    content += 'Code Structure:\n'
    structureInfo.forEach(item => {
      content += `- ${item}\n`
    })
    content += '\n'
  }
  
  // Add the actual code content with proper formatting
  content += 'Code Content:\n'
  content += '```' + getLanguageName(fileType).toLowerCase() + '\n'
  content += rawContent
  content += '\n```\n'
  
  return content
}

/**
 * Get human-readable language name from DocumentType
 */
function getLanguageName(type: DocumentType): string {
  switch (type) {
    case 'js': return 'JavaScript/TypeScript'
    case 'py': return 'Python'
    case 'css': return 'CSS'
    case 'sql': return 'SQL'
    case 'php': return 'PHP'
    case 'java': return 'Java'
    case 'cpp': return 'C++'
    case 'ruby': return 'Ruby'
    case 'go': return 'Go'
    case 'rust': return 'Rust'
    case 'swift': return 'Swift'
    case 'kotlin': return 'Kotlin'
    default: return 'Code'
  }
}

/**
 * Analyze code structure to extract meaningful information
 */
function analyzeCodeStructure(code: string, type: DocumentType): string[] {
  const structure: string[] = []
  const lines = code.split('\n')
  
  switch (type) {
    case 'js':
      // Analyze JavaScript/TypeScript
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.match(/^(function|const|let|var)\s+\w+|^class\s+\w+|^interface\s+\w+|^type\s+\w+/)) {
          structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
        }
      })
      break
      
    case 'py':
      // Analyze Python
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.match(/^(def|class)\s+\w+|^import\s+|^from\s+/)) {
          structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
        }
      })
      break
      
    case 'java':
      // Analyze Java
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.match(/^(public|private|protected)?\s*(class|interface|enum)\s+\w+|^(public|private|protected)?\s*\w+\s+\w+\s*\(/)) {
          structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
        }
      })
      break
      
    case 'css':
      // Analyze CSS
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.match(/^[.#]?\w+[-\w]*\s*{|^@\w+/)) {
          structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
        }
      })
      break
      
    case 'sql':
      // Analyze SQL
      lines.forEach((line, index) => {
        const trimmed = line.trim().toUpperCase()
        if (trimmed.match(/^(CREATE|DROP|ALTER|SELECT|INSERT|UPDATE|DELETE|WITH)\s+/)) {
          structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
        }
      })
      break
      
    default:
      // Generic analysis for other languages
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('#') && !trimmed.startsWith('*')) {
          if (trimmed.match(/^(function|def|class|interface|struct|enum|type|const|let|var|public|private|protected)/)) {
            structure.push(`Line ${index + 1}: ${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}`)
          }
        }
      })
  }
  
  return structure.slice(0, 20) // Limit to first 20 items
}

/**
 * Process XML file
 */
async function processXML(file: File): Promise<string> {
  const text = await readTextFile(file)
  // Simple XML tag removal - in real implementation would use proper XML parser
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get file type from filename
 */
function getFileType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf': return 'pdf'
    case 'txt': return 'txt'
    case 'docx': return 'docx'
    case 'md': return 'markdown'
    case 'json': return 'json'
    case 'csv': return 'csv'
    case 'xlsx': return 'xlsx'
    case 'html':
    case 'htm': return 'html'
    case 'xml': return 'xml'
    case 'pptx':
    case 'ppt': return 'pptx' // Map both PPT and PPTX to pptx processing
    case 'rtf': return 'rtf'
    case 'odt': return 'odt'
    case 'ods': return 'ods'
    case 'odp': return 'odp'
    case 'epub': return 'epub'
    case 'mobi': return 'mobi'
    case 'azw': return 'azw'
    case 'log': return 'log'
    case 'yaml':
    case 'yml': return 'yaml'
    case 'toml': return 'toml'
    case 'ini': return 'ini'
    case 'cfg': return 'cfg'
    // Code file extensions
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': return 'js'
    case 'py': return 'py'
    case 'css':
    case 'scss':
    case 'sass': return 'css'
    case 'sql': return 'sql'
    case 'php': return 'php'
    case 'java': return 'java'
    case 'cpp':
    case 'cc':
    case 'c': return 'cpp'
    case 'rb': return 'ruby'
    case 'go': return 'go'
    case 'rs': return 'rust'
    case 'swift': return 'swift'
    case 'kt':
    case 'kts': return 'kotlin'
    // Image file extensions
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'tiff':
    case 'svg':
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
        // Reduced verbosity - only log every 10th embedding or for short texts
        if (text.length < 100 || Math.random() < 0.1) {
          console.log(`Generated embedding for text of length ${text.length}`)
        }
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

/**
 * Process RTF file using modular processor
 */
async function processRTF(file: File): Promise<string> {
  const processor = new RTFProcessor()
  return await processor.process(file)
}

/**
 * Process YAML file using modular processor
 */
async function processYAML(file: File): Promise<string> {
  const processor = new YAMLProcessor()
  return await processor.process(file)
}

/**
 * Process EPUB file using modular processor
 */
async function processEPUB(file: File): Promise<string> {
  const processor = new EPUBProcessor()
  return await processor.process(file)
}

/**
 * Process OpenDocument formats (ODT, ODS, ODP)
 */
async function processOpenDocument(file: File): Promise<string> {
  try {
    // OpenDocument files are ZIP archives with XML content
    const JSZip = await loadJSZip()
    if (!JSZip) {
      throw new Error('JSZip not available')
    }

    const zip = new JSZip()
    const contents = await zip.loadAsync(file)

    // Look for content.xml which contains the main document content
    const contentFile = contents.files['content.xml']
    if (contentFile) {
      const contentXml = await contentFile.async('text')
      return extractTextFromOpenDocumentXML(contentXml)
    }

    // Fallback: try to find any text content
    const textFiles = Object.keys(contents.files).filter(name => 
      name.endsWith('.xml') && !name.includes('META-INF')
    )

    let extractedText = ''
    for (const textFile of textFiles) {
      try {
        const xmlContent = await contents.files[textFile].async('text')
        const text = extractTextFromOpenDocumentXML(xmlContent)
        if (text.trim()) {
          extractedText += text + '\n\n'
        }
      } catch (error) {
        console.warn(`Failed to process ${textFile}:`, error)
      }
    }

    return extractedText || 'No readable content found in OpenDocument file'

  } catch (error) {
    console.error('Error processing OpenDocument file:', error)
    throw new Error(`Failed to process OpenDocument file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from OpenDocument XML content
 */
function extractTextFromOpenDocumentXML(xml: string): string {
  // Remove XML tags but preserve text content
  const text = xml
    .replace(/<text:p[^>]*>/g, '\n')
    .replace(/<text:h[^>]*>/g, '\n## ')
    .replace(/<text:list-item[^>]*>/g, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}

/**
 * Process PowerPoint files (both PPTX and older PPT formats)
 */
async function processPPTX(file: File): Promise<string> {
  try {
    const JSZipModule = await loadJSZip()
    if (!JSZipModule) {
      // Fallback to basic text extraction if JSZip not available
      return await processBasicPPT(file)
    }
    
    const arrayBuffer = await file.arrayBuffer()
    
    // Check if it's an older PPT format (not ZIP-based)
    const uint8Array = new Uint8Array(arrayBuffer)
    const header = String.fromCharCode(...uint8Array.slice(0, 8))
    
    if (!header.includes('PK')) {
      // Older PPT format - use basic extraction
      console.log('Detected older PPT format, using basic extraction')
      return await processBasicPPT(file)
    }
    
    // Modern PPTX format
    const zip = new JSZipModule()
    await zip.loadAsync(arrayBuffer)
    
    let extractedText = `PowerPoint Presentation: ${file.name}\n\n`
    
    // Extract text from slides
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    ).sort() // Sort to maintain slide order
    
    console.log(`Found ${slideFiles.length} slides in presentation`)
    
    for (const slideFile of slideFiles) {
      const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1] || '?'
      const slideContent = await zip.files[slideFile].async('text')
      
      extractedText += `--- Slide ${slideNumber} ---\n`
      
      // Extract text from XML using improved regex patterns
      const textElements = [
        // Title and content text
        /<a:t[^>]*>([^<]*)<\/a:t>/g,
        // Alternative text patterns
        /<t[^>]*>([^<]*)<\/t>/g
      ]
      
      let slideText = ''
      textElements.forEach(pattern => {
        const matches = slideContent.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const textContent = match.replace(/<[^>]*>/g, '').trim()
            if (textContent.length > 0) {
              slideText += textContent + ' '
            }
          })
        }
      })
      
      if (slideText.trim()) {
        extractedText += slideText.trim() + '\n\n'
      } else {
        extractedText += '[No extractable text content]\n\n'
      }
    }
    
    // Extract notes if available
    const notesFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/notesSlides/') && name.endsWith('.xml')
    )
    
    if (notesFiles.length > 0) {
      extractedText += '--- Speaker Notes ---\n'
      for (const notesFile of notesFiles) {
        const notesContent = await zip.files[notesFile].async('text')
        const notesText = notesContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
        if (notesText) {
          const cleanNotes = notesText.map(match => 
            match.replace(/<[^>]*>/g, '').trim()
          ).filter(text => text.length > 0).join(' ')
          
          if (cleanNotes) {
            extractedText += cleanNotes + '\n\n'
          }
        }
      }
    }
    
    return extractedText.trim() || 'No text content found in PowerPoint file'
  } catch (error) {
    console.error('Error processing PowerPoint:', error)
    // Fallback to basic processing
    return await processBasicPPT(file)
  }
}

/**
 * Basic PPT processing for older formats or when ZIP processing fails
 */
async function processBasicPPT(file: File): Promise<string> {
  try {
    // For older PPT files or when advanced processing fails
    // Read as text and try to extract readable content
    const text = await readTextFile(file)
    
    let content = `PowerPoint File: ${file.name}\n`
    content += `Format: ${file.name.toLowerCase().endsWith('.ppt') ? 'Legacy PPT' : 'PPTX'}\n`
    content += `Size: ${file.size} bytes\n\n`
    
    // Try to extract any readable text using basic patterns
    const readableText = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
      .replace(/\s+/g, ' ')
      .trim()
    
    // Look for common PowerPoint text patterns
    const textChunks = readableText.split(/\s+/).filter(chunk => 
      chunk.length > 2 && 
      /^[a-zA-Z0-9]/.test(chunk) &&
      !chunk.includes('Microsoft') &&
      !chunk.includes('PowerPoint')
    )
    
    if (textChunks.length > 10) {
      content += 'Extracted content:\n'
      content += textChunks.slice(0, 100).join(' ') // Limit to first 100 meaningful chunks
      
      if (textChunks.length > 100) {
        content += '\n\n[Additional content truncated...]'
      }
    } else {
      content += 'This appears to be a PowerPoint file with primarily visual content.\n'
      content += 'Text extraction may be limited for this file format.\n'
      content += 'Consider converting to PPTX format for better text extraction.'
    }
    
    return content
  } catch (error) {
    console.error('Basic PPT processing failed:', error)
    return `PowerPoint File: ${file.name}\nError: Could not extract text from this PowerPoint file.`
  }
}

/**
 * Process Excel XLSX file
 */
async function processXLSX(file: File): Promise<string> {
  try {
    const JSZipModule = await loadJSZip()
    if (!JSZipModule) {
      throw new Error('JSZip not available')
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const zip = new JSZipModule()
    await zip.loadAsync(arrayBuffer)
    
    let extractedText = ''
    
    // Extract shared strings first (Excel stores text in shared strings)
    let sharedStrings: string[] = []
    const sharedStringsFile = zip.files['xl/sharedStrings.xml']
    if (sharedStringsFile) {
      const sharedStringsContent = await sharedStringsFile.async('text')
      const stringMatches = sharedStringsContent.match(/<t[^>]*>([^<]*)<\/t>/g)
      if (stringMatches) {
        sharedStrings = stringMatches.map(match => {
          const text = match.replace(/<[^>]*>/g, '')
          return text.trim()
        })
      }
    }
    
    // Extract worksheet data
    const worksheetFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('xl/worksheets/sheet') && name.endsWith('.xml')
    )
    
    for (const worksheetFile of worksheetFiles) {
      const worksheetContent = await zip.files[worksheetFile].async('text')
      
      // Extract worksheet name
      const sheetNumber = worksheetFile.match(/sheet(\d+)\.xml/)?.[1] || '1'
      extractedText += `\n--- Worksheet ${sheetNumber} ---\n`
      
      // Extract cell values
      const cellMatches = worksheetContent.match(/<c[^>]*>.*?<\/c>/g)
      if (cellMatches) {
        const cellData: string[] = []
        
        cellMatches.forEach(cellMatch => {
          // Check if it's a shared string reference
          if (cellMatch.includes('t="s"')) {
            const valueMatch = cellMatch.match(/<v>(\d+)<\/v>/)
            if (valueMatch) {
              const stringIndex = parseInt(valueMatch[1])
              if (sharedStrings[stringIndex]) {
                cellData.push(sharedStrings[stringIndex])
              }
            }
          } else {
            // Direct value
            const valueMatch = cellMatch.match(/<v>([^<]*)<\/v>/)
            if (valueMatch) {
              cellData.push(valueMatch[1])
            }
          }
        })
        
        if (cellData.length > 0) {
          extractedText += cellData.join(' | ') + '\n'
        }
      }
    }
    
    return extractedText.trim() || 'No text content found in Excel file'
  } catch (error) {
    console.error('Error processing XLSX:', error)
    return 'Error processing Excel file'
  }
}

/**
 * Process image file with OCR
 */
async function processImage(file: File): Promise<string> {
  try {
    const tesseractModule = await loadTesseract()
    if (!tesseractModule) {
      throw new Error('Tesseract.js not available')
    }
    
    const worker = await tesseractModule.createWorker('eng')
    const result = await worker.recognize(file)
    await worker.terminate()
    
    return result.data.text.trim() || 'No text found in image'
  } catch (error) {
    console.error('Error processing image with OCR:', error)
    return 'Error processing image file'
  }
}

/**
 * Extract visual content from documents
 */
export async function extractVisualContent(
  file: File, 
  documentId: string
): Promise<VisualContent[]> {
  try {
    // Use the real OCR extraction service instead of mock pattern extraction
    const { ocrExtractionService } = await import('../services/ocr-extraction')
    
    try {
      await ocrExtractionService.initialize()
      console.log('🤖 OCR service initialized for visual content extraction...')
      
      const ocrResult = await ocrExtractionService.extractFromFile(file, {
        enableThumbnails: true,
        extractVisualElements: true,
        confidenceThreshold: 0.5
      })
      
      console.log(`🎯 OCR Results: ${ocrResult.visualElements.length} visual elements extracted`)
      
      // Return real OCR visual elements with proper documentId
      return ocrResult.visualElements.map(element => ({
        ...element,
        documentId, // Ensure consistent documentId
        metadata: {
          ...element.metadata,
          documentTitle: element.metadata?.documentTitle || file.name
        }
      }))
      
    } catch (ocrError) {
      console.warn('⚠️ OCR visual extraction failed:', ocrError)
      return []
    }

  } catch (error) {
    console.error('❌ Visual content extraction failed:', error)
    return []
  }
}
