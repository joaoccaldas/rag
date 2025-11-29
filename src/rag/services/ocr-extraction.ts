/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OCR Extraction Service
 * Modular component for extracting text and visual elements from documents
 */

import { VisualContent } from '../types'

export interface OCRExtractionOptions {
  enableThumbnails?: boolean
  thumbnailSize?: { width: number; height: number }
  extractVisualElements?: boolean
  confidenceThreshold?: number
  languages?: string[]
}

export interface OCRResult {
  text: string
  confidence: number
  visualElements: VisualContent[]
  thumbnails: string[]
  processingTime: number
}

/**
 * OCR Extraction Service Class
 */
export class OCRExtractionService {
  private static instance: OCRExtractionService | null = null
  private tesseractWorker: any = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): OCRExtractionService {
    if (!OCRExtractionService.instance) {
      OCRExtractionService.instance = new OCRExtractionService()
    }
    return OCRExtractionService.instance
  }

  /**
   * Initialize Tesseract.js worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamic import to avoid SSR issues
      const Tesseract = await import('tesseract.js')
      this.tesseractWorker = await Tesseract.createWorker(['eng'])
      this.isInitialized = true
      console.log('✅ OCR Service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize OCR service:', error)
      throw new Error('OCR service initialization failed')
    }
  }

  /**
   * Extract text and visual elements from a file
   */
  async extractFromFile(
    file: File,
    options: OCRExtractionOptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()
    
    if (!this.isInitialized) {
      await this.initialize()
    }

    const {
      enableThumbnails = true,
      thumbnailSize = { width: 200, height: 150 },
      extractVisualElements = true,
      confidenceThreshold = 0.7
    } = options

    console.log(`Processing with confidence threshold: ${confidenceThreshold}`)

    try {
      let visualElements: VisualContent[] = []
      let thumbnails: string[] = []
      let extractedText = ''
      let overallConfidence = 0

      if (file.type.startsWith('image/')) {
        // Process image file directly
        const result = await this.processImageFile(file)
        extractedText = result.text
        overallConfidence = result.confidence

        if (enableThumbnails) {
          thumbnails.push(await this.generateThumbnail(file, thumbnailSize))
        }

        if (extractVisualElements) {
          visualElements.push({
            id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            documentId: `doc_${Date.now()}`,
            type: 'image',
            title: file.name,
            description: `OCR extracted from ${file.name}`,
            data: {
              base64: await this.fileToBase64(file)
            },
            metadata: {
              extractedText,
              confidence: overallConfidence,
              extractedAt: new Date().toISOString(),
              documentTitle: file.name
            },
            thumbnail: thumbnails[0] || undefined
          })
        }
      } else if (file.type === 'application/pdf') {
        // Process PDF file
        const pdfResult = await this.processPDFFile(file, options)
        extractedText = pdfResult.text
        overallConfidence = pdfResult.confidence
        visualElements = pdfResult.visualElements
        thumbnails = pdfResult.thumbnails
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
                 file.type === 'application/vnd.ms-powerpoint') {
        // PowerPoint processing - create visual placeholders for slides
        console.log('🎯 Processing PowerPoint file for visual content...')
        const result = await this.processPowerPointFile(file, options)
        extractedText = result.text
        overallConfidence = result.confidence
        visualElements = result.visualElements
        thumbnails = result.thumbnails
      } else {
        // For unsupported file types, return empty result instead of throwing error
        console.warn(`Unsupported file type for OCR: ${file.type}. Skipping visual extraction.`)
        extractedText = ''
        overallConfidence = 0
        visualElements = []
        thumbnails = []
      }

      const processingTime = Date.now() - startTime

      return {
        text: extractedText,
        confidence: overallConfidence,
        visualElements,
        thumbnails,
        processingTime
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      throw error
    }
  }

  /**
   * Process a single image file
   */
  private async processImageFile(file: File): Promise<{ text: string; confidence: number }> {
    if (!this.tesseractWorker) {
      throw new Error('OCR worker not initialized')
    }

    const result = await this.tesseractWorker.recognize(file)
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100 // Convert to 0-1 range
    }
  }

  /**
   * Process PDF file with OCR
   */
  private async processPDFFile(
    file: File, 
    options: OCRExtractionOptions
  ): Promise<{ text: string; confidence: number; visualElements: VisualContent[]; thumbnails: string[] }> {
    try {
      // Dynamic import for PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''
      let totalConfidence = 0
      let pageCount = 0
      const visualElements: VisualContent[] = []
      const thumbnails: string[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        
        // Extract text content first
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')

        if (pageText.trim().length > 0) {
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
        } else {
          // Page has no text, try OCR
          const pageImage = await this.renderPDFPageToImage(page)
          if (pageImage) {
            const ocrResult = await this.processImageBlob(pageImage)
            if (ocrResult.text.trim().length > 0) {
              fullText += `\n--- Page ${pageNum} (OCR) ---\n${ocrResult.text}\n`
              totalConfidence += ocrResult.confidence
              pageCount++
            }

            // Generate thumbnail from first page or if requested
            if (options.enableThumbnails && (pageNum === 1 || thumbnails.length === 0)) {
              thumbnails.push(await this.blobToBase64(pageImage))
            }

            // Create visual element for the page
            if (options.extractVisualElements) {
              visualElements.push({
                id: `pdf_page_${pageNum}_${Date.now()}`,
                documentId: `doc_${Date.now()}`,
                type: 'image',
                title: `Page ${pageNum}`,
                description: `Page ${pageNum} from ${file.name}`,
                data: {
                  base64: await this.blobToBase64(pageImage)
                },
                metadata: {
                  pageNumber: pageNum,
                  extractedText: ocrResult.text,
                  confidence: ocrResult.confidence,
                  extractedAt: new Date().toISOString(),
                  documentTitle: file.name
                },
                thumbnail: await this.generateThumbnailFromBlob(pageImage, options.thumbnailSize)
              })
            }
          }
        }
      }

      const averageConfidence = pageCount > 0 ? totalConfidence / pageCount : 0.8

      return {
        text: fullText,
        confidence: averageConfidence,
        visualElements,
        thumbnails
      }
    } catch (error) {
      console.error('PDF processing failed:', error)
      throw error
    }
  }

  /**
   * Render PDF page to image
   */
  private async renderPDFPageToImage(page: any): Promise<Blob | null> {
    try {
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) return null
      
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise

      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })
    } catch (error) {
      console.warn('Failed to render PDF page:', error)
      return null
    }
  }

  /**
   * Process image blob with OCR
   */
  private async processImageBlob(blob: Blob): Promise<{ text: string; confidence: number }> {
    if (!this.tesseractWorker) {
      throw new Error('OCR worker not initialized')
    }

    const result = await this.tesseractWorker.recognize(blob)
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100
    }
  }

  /**
   * Generate thumbnail from file
   */
  private async generateThumbnail(
    file: File, 
    size: { width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        canvas.width = size.width
        canvas.height = size.height

        // Calculate aspect ratio
        const aspectRatio = img.width / img.height
        let drawWidth = size.width
        let drawHeight = size.height

        if (aspectRatio > 1) {
          drawHeight = size.width / aspectRatio
        } else {
          drawWidth = size.height * aspectRatio
        }

        const x = (size.width - drawWidth) / 2
        const y = (size.height - drawHeight) / 2

        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, size.width, size.height)
        ctx.drawImage(img, x, y, drawWidth, drawHeight)

        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Generate thumbnail from blob
   */
  private async generateThumbnailFromBlob(
    blob: Blob, 
    size = { width: 200, height: 150 }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        canvas.width = size.width
        canvas.height = size.height

        const aspectRatio = img.width / img.height
        let drawWidth = size.width
        let drawHeight = size.height

        if (aspectRatio > 1) {
          drawHeight = size.width / aspectRatio
        } else {
          drawWidth = size.height * aspectRatio
        }

        const x = (size.width - drawWidth) / 2
        const y = (size.height - drawHeight) / 2

        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, size.width, size.height)
        ctx.drawImage(img, x, y, drawWidth, drawHeight)

        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(blob)
    })
  }

  /**
   * Process PowerPoint file - extract text and create visual elements for slides
   */
  private async processPowerPointFile(file: File, _options: OCRExtractionOptions): Promise<OCRResult> {
    try {
      console.log('🎯 Processing PowerPoint file for text and visual content extraction...')
      
      const visualElements: VisualContent[] = []
      const thumbnails: string[] = []
      let fullText = ''
      
      try {
        // Import PizZip (JSZip fork) to read .pptx file
        const PizZip = (await import('pizzip')).default
        
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer()
        const zip = new PizZip(arrayBuffer)
        
        // Extract slide XML files from the .pptx (which is a zip archive)
        const slideFiles = Object.keys(zip.files).filter(name => 
          name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        )
        
        console.log(`📄 Found ${slideFiles.length} slides in PowerPoint`)
        
        // Process each slide
        for (let i = 0; i < slideFiles.length; i++) {
          const slideFile = slideFiles[i]
          const slideNum = i + 1
          
          try {
            // Get slide XML content
            const slideFileData = zip.files[slideFile as keyof typeof zip.files]
            if (!slideFileData) continue
            
            const slideXml = slideFileData.asText()
            
            // Extract text from slide XML (basic text extraction)
            // PowerPoint XML has text in <a:t> tags
            const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || []
            const slideText = textMatches
              .map((match: string) => match.replace(/<[^>]+>/g, ''))
              .filter((text: string) => text.trim().length > 0)
              .join(' ')
            
            if (slideText.trim().length > 0) {
              fullText += `\n--- Slide ${slideNum} ---\n${slideText}\n`
            }
            
            // Create visual element for this slide with enhanced thumbnail
            const slideThumbnail = this.generateEnhancedSlideThumbnail(
              slideNum, 
              slideText.substring(0, 100), 
              file.name
            )
            
            const visualElement: VisualContent = {
              id: `ppt_slide_${slideNum}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              documentId: `doc_${Date.now()}`,
              type: 'diagram',
              title: `Slide ${slideNum}: ${slideText.substring(0, 50)}${slideText.length > 50 ? '...' : ''}`,
              description: `Slide ${slideNum} from ${file.name}`,
              thumbnail: slideThumbnail,
              fullContent: slideThumbnail,
              metadata: {
                pageNumber: slideNum,
                extractedText: slideText,
                confidence: 0.8,
                extractedAt: new Date().toISOString(),
                documentTitle: file.name,
                format: 'PowerPoint'
              }
            }
            
            visualElements.push(visualElement)
            if (slideNum === 1) {
              thumbnails.push(slideThumbnail)
            }
            
          } catch (slideError) {
            console.warn(`Failed to process slide ${slideNum}:`, slideError)
          }
        }
        
        console.log(`✅ Extracted text from ${visualElements.length} PowerPoint slides`)
        
      } catch (zipError) {
        console.warn('Failed to extract PowerPoint content:', zipError)
        // Fallback to placeholder
        const placeholderThumbnail = this.generatePresentationThumbnail(file.name)
        visualElements.push({
          id: `ppt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          documentId: `doc_${Date.now()}`,
          type: 'diagram',
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: `PowerPoint presentation: ${file.name}`,
          thumbnail: placeholderThumbnail,
          fullContent: placeholderThumbnail,
          metadata: {
            extractedText: `PowerPoint presentation: ${file.name}`,
            confidence: 0.7,
            extractedAt: new Date().toISOString(),
            format: 'PowerPoint'
          }
        })
        thumbnails.push(placeholderThumbnail)
      }
      
      return {
        text: fullText || `PowerPoint presentation: ${file.name}`,
        confidence: visualElements.length > 0 ? 0.8 : 0.7,
        visualElements,
        thumbnails,
        processingTime: Date.now()
      }
      
    } catch (error) {
      console.error('PowerPoint processing failed:', error)
      return {
        text: '',
        confidence: 0,
        visualElements: [],
        thumbnails: [],
        processingTime: Date.now()
      }
    }
  }
  
  /**
   * Generate an enhanced thumbnail for a PowerPoint slide with text preview
   */
  private generateEnhancedSlideThumbnail(slideNumber: number, previewText: string, _fileName: string): string {
    const shortText = previewText.length > 60 ? previewText.substring(0, 60) + '...' : previewText
    const lines = this.splitTextIntoLines(shortText, 20)
    
    const textElements = lines.map((line, idx) => 
      `<text x="100" y="${45 + idx * 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#374151">${this.escapeXml(line)}</text>`
    ).join('\n')
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <defs>
          <linearGradient id="slideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#991B1B;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#slideGrad)" rx="8"/>
        <rect x="15" y="15" width="170" height="120" fill="white" rx="4" opacity="0.95"/>
        <text x="100" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#DC2626">
          Slide ${slideNumber}
        </text>
        ${textElements}
        <circle cx="25" cy="138" r="3" fill="#DC2626" opacity="0.6"/>
        <circle cx="35" cy="138" r="3" fill="#DC2626" opacity="0.8"/>
        <circle cx="45" cy="138" r="3" fill="#DC2626"/>
      </svg>
    `
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }
  
  /**
   * Split text into lines of maximum length
   */
  private splitTextIntoLines(text: string, maxLength: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
      if (lines.length >= 4) break // Max 4 lines
    }
    if (currentLine && lines.length < 4) lines.push(currentLine)
    
    return lines
  }
  
  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Generate a placeholder thumbnail for PowerPoint presentations
   */
  private generatePresentationThumbnail(fileName: string): string {
    const shortName = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect width="100%" height="100%" fill="#D97706" rx="8"/>
        <rect x="20" y="20" width="160" height="110" fill="white" rx="4"/>
        <text x="100" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#D97706">📊</text>
        <text x="100" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#374151">
          ${shortName}
        </text>
        <text x="100" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#6B7280">
          PowerPoint Presentation
        </text>
        <circle cx="30" cy="130" r="3" fill="#D97706" opacity="0.6"/>
        <circle cx="40" cy="130" r="3" fill="#D97706" opacity="0.8"/>
        <circle cx="50" cy="130" r="3" fill="#D97706"/>
      </svg>
    `
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
    }
    this.isInitialized = false
  }
}

// Export singleton instance
export const ocrExtractionService = OCRExtractionService.getInstance()
