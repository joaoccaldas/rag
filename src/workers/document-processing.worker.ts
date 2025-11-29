/**
 * Document Processing Web Worker
 * Handles heavy document processing operations off the main thread
 */

import { DocumentChunk, DocumentType } from '../rag/types'

// Import processing functions (these need to be worker-compatible)
let pdfjs: typeof import('pdfjs-dist') | null = null
let mammoth: typeof import('mammoth') | null = null
let tesseract: typeof import('tesseract.js') | null = null

// Lazy load dependencies
async function loadPdfjs() {
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }
  return pdfjs
}

async function loadMammoth() {
  if (!mammoth) {
    mammoth = await import('mammoth')
  }
  return mammoth
}

async function loadTesseract() {
  if (!tesseract) {
    tesseract = await import('tesseract.js')
  }
  return tesseract
}

async function loadJSZip() {
  const JSZip = await import('jszip')
  return JSZip.default
}

interface ProcessingMessage {
  type: 'PROCESS_DOCUMENT' | 'PROCESS_WITH_AI' | 'GENERATE_EMBEDDING'
  data: {
    file?: File
    documentId?: string
    options?: {
      enableOCR?: boolean
      chunkSize?: number
      chunkOverlap?: number
    }
    text?: string
  }
  id: string
}

interface ProcessingResult {
  success: boolean
  id: string
  result?: {
    chunks: DocumentChunk[]
    metadata: {
      title: string
      type: DocumentType
      size: number
      pages?: number
      processingTime: number
    }
  } | number[] | unknown // Support different result types
  error?: string
  progress?: number
}

// Main worker message handler
self.onmessage = async function(event: MessageEvent<ProcessingMessage>) {
  const { type, data, id } = event.data

  if (type === 'PROCESS_DOCUMENT') {
    try {
      if (!data.file) {
        throw new Error('No file provided for processing')
      }
      
      const startTime = Date.now()
      
      // Send progress update
      postProgress(id, 10, 'Starting document processing...')
      
      const result = await processDocument(data.file, data.options || {}, (progress, message) => {
        postProgress(id, progress, message)
      })
      
      const processingTime = Date.now() - startTime
      
      const response: ProcessingResult = {
        success: true,
        id,
        result: {
          chunks: result.chunks,
          metadata: {
            title: result.title,
            type: result.type,
            size: data.file.size,
            pages: result.pages,
            processingTime
          }
        }
      }
      
      self.postMessage(response)
    } catch (error) {
      const response: ProcessingResult = {
        success: false,
        id,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      
      self.postMessage(response)
    }
  } else if (type === 'GENERATE_EMBEDDING') {
    try {
      if (!data.text) {
        throw new Error('No text provided for embedding')
      }
      
      // Simple embedding generation (could be enhanced with actual model)
      const embedding = generateSimpleEmbedding(data.text)
      
      const response: ProcessingResult = {
        success: true,
        id,
        result: embedding
      }
      
      self.postMessage(response)
    } catch (error) {
      const response: ProcessingResult = {
        success: false,
        id,
        error: error instanceof Error ? error.message : 'Embedding generation failed'
      }
      
      self.postMessage(response)
    }
  }
}

function postProgress(id: string, progress: number, message: string) {
  const response: ProcessingResult = {
    success: true,
    id,
    progress,
    result: {
      chunks: [],
      metadata: {
        title: message,
        type: 'unknown' as DocumentType,
        size: 0,
        processingTime: 0
      }
    }
  }
  self.postMessage(response)
}

async function processDocument(
  file: File, 
  options: ProcessingMessage['data']['options'],
  onProgress: (progress: number, message: string) => void
) {
  const fileType = detectFileType(file)
  
  let text = ''
  let pages = 0
  
  onProgress(20, `Processing ${fileType.toUpperCase()} file...`)
  
  switch (fileType) {
    case 'pdf':
      const pdfResult = await processPDF(file, options?.enableOCR || false, onProgress)
      text = pdfResult.text
      pages = pdfResult.pages
      break
      
    case 'docx':
      text = await processDocx(file, onProgress)
      break
      
    case 'txt':
      text = await processText(file, onProgress)
      break
      
    case 'pptx':
      text = await processPPTX(file, onProgress)
      break
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
  
  onProgress(80, 'Creating text chunks...')
  
  // Create chunks
  const chunks = createChunks(text, {
    chunkSize: options?.chunkSize || 1000,
    chunkOverlap: options?.chunkOverlap || 200
  }, file.name.replace(/\.[^/.]+$/, ""))
  
  onProgress(100, 'Processing complete!')
  
  return {
    chunks,
    title: file.name,
    type: fileType as DocumentType,
    pages
  }
}

function detectFileType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension || 'unknown'
}

async function processPDF(
  file: File, 
  enableOCR: boolean, 
  onProgress: (progress: number, message: string) => void
) {
  const pdfLib = await loadPdfjs()
  if (!pdfLib) throw new Error('PDF.js not available')
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise
  
  let fullText = ''
  const totalPages = pdf.numPages
  
  for (let i = 1; i <= totalPages; i++) {
    onProgress(20 + (i / totalPages) * 50, `Processing page ${i} of ${totalPages}...`)
    
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    let pageText = textContent.items
      .map((item: unknown) => {
        // Type guard for text items
        if (item && typeof item === 'object' && 'str' in item) {
          return (item as { str: string }).str
        }
        return ''
      })
      .filter(str => str.trim().length > 0)
      .join(' ')
    
    // If no text found and OCR is enabled, try OCR
    if (!pageText.trim() && enableOCR) {
      onProgress(20 + (i / totalPages) * 50, `OCR processing page ${i}...`)
      pageText = await performOCR(page)
    }
    
    fullText += pageText + '\n\n'
  }
  
  return { text: fullText, pages: totalPages }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function performOCR(page: any): Promise<string> {
  try {
    const tesseractLib = await loadTesseract()
    if (!tesseractLib) {
      console.warn('Tesseract.js not available in worker environment')
      return ''
    }

    // Get page viewport and render to canvas
    const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
    const canvas = new OffscreenCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')
    
    if (!context) {
      console.warn('Canvas 2D context not available in worker')
      return ''
    }

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // Convert canvas to ImageData for Tesseract
    const imageData = context.getImageData(0, 0, viewport.width, viewport.height)
    
    // Create a canvas element from ImageData for Tesseract
    const tesseractCanvas = new OffscreenCanvas(viewport.width, viewport.height)
    const tesseractContext = tesseractCanvas.getContext('2d')
    if (!tesseractContext) return ''
    
    tesseractContext.putImageData(imageData, 0, 0)
    
    // Perform OCR with enhanced settings
    const { data: { text } } = await tesseractLib.recognize(tesseractCanvas, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          postMessage({
            type: 'PROCESSING_PROGRESS',
            payload: { message: `OCR: ${Math.round(m.progress * 100)}%` }
          })
        }
      }
    })
    
    return text.trim()
  } catch (error) {
    console.warn('OCR processing failed:', error)
    return ''
  }
}

async function processDocx(file: File, onProgress: (progress: number, message: string) => void) {
  const mammothLib = await loadMammoth()
  if (!mammothLib) throw new Error('Mammoth not available')
  
  onProgress(40, 'Extracting DOCX content...')
  
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammothLib.extractRawText({ arrayBuffer })
  
  onProgress(70, 'DOCX processing complete')
  
  return result.value
}

async function processText(file: File, onProgress: (progress: number, message: string) => void) {
  onProgress(40, 'Reading text file...')
  
  const text = await file.text()
  
  onProgress(70, 'Text file processing complete')
  
  return text
}

async function processPPTX(file: File, onProgress: (progress: number, message: string) => void) {
  onProgress(40, 'Processing PowerPoint file...')
  
  try {
    const JSZip = await loadJSZip()
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    
    onProgress(60, 'Extracting slide content...')
    
    let extractedText = `PowerPoint Presentation: ${file.name}\n\n`
    
    // Extract slide content
    const slideFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    )
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = zip.files[slideFiles[i]]
      if (slideFile) {
        const slideXml = await slideFile.async('text')
        
        // Extract text content from XML (basic extraction)
        const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g)
        if (textMatches) {
          const slideText = textMatches
            .map(match => match.replace(/<[^>]*>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ')
          
          if (slideText.trim()) {
            extractedText += `Slide ${i + 1}:\n${slideText}\n\n`
          }
        }
      }
      
      onProgress(60 + (i / slideFiles.length) * 20, `Processing slide ${i + 1}/${slideFiles.length}...`)
    }
    
    onProgress(90, 'PowerPoint processing complete')
    
    return extractedText || 'No text content found in PowerPoint file'
    
  } catch (error) {
    console.error('Error processing PowerPoint file:', error)
    
    // Fallback: basic file info
    onProgress(90, 'Using fallback processing...')
    return `PowerPoint Presentation: ${file.name}\n\nUnable to extract detailed content, but file was uploaded successfully.`
  }
}

function createChunks(text: string, options: { chunkSize: number; chunkOverlap: number }, documentId: string = 'temp_doc'): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  let chunkIndex = 0
  
  for (const sentence of sentences) {
    const sentenceText = sentence.trim() + '.'
    
    if (currentChunk.length + sentenceText.length > options.chunkSize && currentChunk.length > 0) {
      // Create chunk
      chunks.push({
        id: `chunk_${chunkIndex}`,
        documentId,
        content: currentChunk.trim(),
        startIndex: 0, // Will be calculated properly in main thread
        endIndex: currentChunk.length,
        metadata: {
          chunkIndex,
          tokenCount: estimateTokens(currentChunk)
        }
      })
      
      chunkIndex++
      
      // Start new chunk with overlap
      const overlapWords = currentChunk.split(' ').slice(-options.chunkOverlap / 10)
      currentChunk = overlapWords.join(' ') + ' ' + sentenceText
    } else {
      currentChunk += ' ' + sentenceText
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk_${chunkIndex}`,
      documentId,
      content: currentChunk.trim(),
      startIndex: 0,
      endIndex: currentChunk.length,
      metadata: {
        chunkIndex,
        tokenCount: estimateTokens(currentChunk)
      }
    })
  }
  
  return chunks
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

function generateSimpleEmbedding(text: string): number[] {
  // Simple hash-based embedding for worker environment
  const words = text.toLowerCase().split(/\s+/)
  const embedding = new Array(384).fill(0)
  
  words.forEach((word, index) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i)
      const position = (charCode + i) % 384
      embedding[position] += 1 / (index + 1)
    }
  })
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
}
