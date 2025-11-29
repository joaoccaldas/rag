/**
 * Screenshot Generation Pipeline
 * 
 * This module provides comprehensive screenshot generation capabilities for visual elements
 * during document processing, including metadata storage and integration with the RAG system.
 * 
 * Features:
 * - Automatic screenshot capture during document processing
 * - Element-specific screenshot generation for charts, tables, images
 * - Screenshot metadata storage and retrieval
 * - Integration with enhanced visual analysis system
 * - Batch screenshot processing for multiple documents
 */

import type { VisualElementAnalysis, EnhancedVisualType } from './enhanced-visual-analysis'

// HTML2Canvas type declaration
interface Html2CanvasOptions {
  allowTaint?: boolean
  useCORS?: boolean
  scale?: number
  width?: number
  height?: number
}

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: Html2CanvasOptions) => Promise<HTMLCanvasElement>
  }
}

export interface ScreenshotMetadata {
  id: string
  documentId: string
  elementId: string
  elementType: EnhancedVisualType
  timestamp: number
  
  // Screenshot details
  screenshot: {
    base64: string
    format: 'png' | 'jpeg' | 'webp'
    width: number
    height: number
    quality: number
    fileSize: number
  }
  
  // Element context
  elementContext: {
    pageNumber: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
    title?: string
    description?: string
    extractedText?: string
  }
  
  // Processing metadata
  processingInfo: {
    captureMethod: 'canvas' | 'html2canvas' | 'puppeteer' | 'manual'
    processingTime: number
    retryCount: number
    success: boolean
    errorMessage?: string
  }
}

export interface ScreenshotGenerationOptions {
  quality: number // 0.1 to 1.0
  format: 'png' | 'jpeg' | 'webp'
  maxWidth?: number
  maxHeight?: number
  enableRetry: boolean
  maxRetries: number
  includeElementContext: boolean
  generateThumbnails: boolean
  compressionLevel: number // 0 to 9
}

export class ScreenshotGenerator {
  private options: ScreenshotGenerationOptions
  private screenshots: Map<string, ScreenshotMetadata> = new Map()
  
  constructor(options: Partial<ScreenshotGenerationOptions> = {}) {
    this.options = {
      quality: 0.9,
      format: 'png',
      maxWidth: 1920,
      maxHeight: 1080,
      enableRetry: true,
      maxRetries: 3,
      includeElementContext: true,
      generateThumbnails: true,
      compressionLevel: 6,
      ...options
    }
    
    this.loadScreenshotsFromStorage()
  }
  
  /**
   * Generate screenshot for a visual element
   */
  async generateElementScreenshot(
    element: HTMLElement,
    elementAnalysis: VisualElementAnalysis,
    documentId: string
  ): Promise<ScreenshotMetadata | null> {
    const startTime = performance.now()
    let retryCount = 0
    
    while (retryCount <= this.options.maxRetries) {
      try {
        const screenshot = await this.captureElement(element)
        
        const metadata: ScreenshotMetadata = {
          id: `screenshot_${elementAnalysis.id}_${Date.now()}`,
          documentId,
          elementId: elementAnalysis.id,
          elementType: elementAnalysis.type,
          timestamp: Date.now(),
          
          screenshot: {
            base64: screenshot.base64,
            format: this.options.format,
            width: screenshot.width,
            height: screenshot.height,
            quality: this.options.quality,
            fileSize: this.calculateBase64Size(screenshot.base64)
          },
          
          elementContext: {
            pageNumber: 1, // TODO: Extract from document context
            boundingBox: this.getElementBoundingBox(element),
            title: elementAnalysis.title,
            description: elementAnalysis.description
          },
          
          processingInfo: {
            captureMethod: 'html2canvas',
            processingTime: performance.now() - startTime,
            retryCount,
            success: true
          }
        }
        
        // Store screenshot metadata
        this.screenshots.set(metadata.id, metadata)
        this.saveScreenshotsToStorage()
        
        // Generate thumbnail if enabled
        if (this.options.generateThumbnails) {
          await this.generateThumbnail(metadata)
        }
        
        return metadata
        
      } catch (error) {
        retryCount++
        console.warn(`Screenshot generation attempt ${retryCount} failed:`, error)
        
        if (retryCount > this.options.maxRetries) {
          const failureMetadata: ScreenshotMetadata = {
            id: `screenshot_${elementAnalysis.id}_${Date.now()}`,
            documentId,
            elementId: elementAnalysis.id,
            elementType: elementAnalysis.type,
            timestamp: Date.now(),
            
            screenshot: {
              base64: '',
              format: this.options.format,
              width: 0,
              height: 0,
              quality: 0,
              fileSize: 0
            },
            
            elementContext: {
              pageNumber: 1,
              title: elementAnalysis.title,
              description: elementAnalysis.description
            },
            
            processingInfo: {
              captureMethod: 'html2canvas',
              processingTime: performance.now() - startTime,
              retryCount,
              success: false,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          }
          
          this.screenshots.set(failureMetadata.id, failureMetadata)
          return failureMetadata
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
    
    return null
  }
  
  /**
   * Capture element using html2canvas (fallback to canvas API)
   */
  private async captureElement(element: HTMLElement): Promise<{
    base64: string
    width: number
    height: number
  }> {
    // Try html2canvas first (if available)
    if (typeof window !== 'undefined' && window.html2canvas) {
      const canvas = await window.html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        width: this.options.maxWidth,
        height: this.options.maxHeight
      })
      
      return {
        base64: canvas.toDataURL(`image/${this.options.format}`, this.options.quality),
        width: canvas.width,
        height: canvas.height
      }
    }
    
    // Fallback to Canvas API
    return this.captureElementWithCanvas(element)
  }
  
  /**
   * Fallback canvas capture method
   */
  private async captureElementWithCanvas(element: HTMLElement): Promise<{
    base64: string
    width: number
    height: number
  }> {
    const rect = element.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Unable to get canvas context')
    }
    
    canvas.width = Math.min(rect.width, this.options.maxWidth || 1920)
    canvas.height = Math.min(rect.height, this.options.maxHeight || 1080)
    
    // Draw element content (simplified approach)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text content if available
    const textContent = element.textContent || element.innerText
    if (textContent) {
      ctx.fillStyle = 'black'
      ctx.font = '14px Arial'
      const words = textContent.split(' ')
      let line = ''
      let y = 30
      
      words.forEach(word => {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > canvas.width - 20 && line !== '') {
          ctx.fillText(line, 10, y)
          line = word + ' '
          y += 20
        } else {
          line = testLine
        }
      })
      ctx.fillText(line, 10, y)
    }
    
    return {
      base64: canvas.toDataURL(`image/${this.options.format}`, this.options.quality),
      width: canvas.width,
      height: canvas.height
    }
  }
  
  /**
   * Generate thumbnail for screenshot
   */
  private async generateThumbnail(metadata: ScreenshotMetadata): Promise<void> {
    try {
      const img = new Image()
      img.src = metadata.screenshot.base64
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Unable to get canvas context for thumbnail'))
            return
          }
          
          // Calculate thumbnail dimensions (max 200px)
          const maxSize = 200
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Store thumbnail
          const thumbnailKey = `${metadata.id}_thumb`
          localStorage.setItem(thumbnailKey, canvas.toDataURL('image/jpeg', 0.7))
          
          resolve()
        }
        img.onerror = reject
      })
    } catch (error) {
      console.warn('Thumbnail generation failed:', error)
    }
  }
  
  /**
   * Get element bounding box
   */
  private getElementBoundingBox(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    }
  }
  
  /**
   * Calculate base64 string size in bytes
   */
  private calculateBase64Size(base64: string): number {
    return Math.ceil((base64.length * 3) / 4)
  }
  
  /**
   * Batch generate screenshots for multiple elements
   */
  async generateBatchScreenshots(
    elements: Array<{
      element: HTMLElement
      analysis: VisualElementAnalysis
    }>,
    documentId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ScreenshotMetadata[]> {
    const results: ScreenshotMetadata[] = []
    
    for (let i = 0; i < elements.length; i++) {
      const { element, analysis } = elements[i]
      
      try {
        const screenshot = await this.generateElementScreenshot(element, analysis, documentId)
        if (screenshot) {
          results.push(screenshot)
        }
      } catch (error) {
        console.error(`Failed to generate screenshot for element ${analysis.id}:`, error)
      }
      
      if (onProgress) {
        onProgress(i + 1, elements.length)
      }
      
      // Add small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }
  
  /**
   * Get screenshot by ID
   */
  getScreenshot(screenshotId: string): ScreenshotMetadata | undefined {
    return this.screenshots.get(screenshotId)
  }
  
  /**
   * Get all screenshots for a document
   */
  getDocumentScreenshots(documentId: string): ScreenshotMetadata[] {
    return Array.from(this.screenshots.values())
      .filter(screenshot => screenshot.documentId === documentId)
  }
  
  /**
   * Get screenshots by element type
   */
  getScreenshotsByType(elementType: EnhancedVisualType): ScreenshotMetadata[] {
    return Array.from(this.screenshots.values())
      .filter(screenshot => screenshot.elementType === elementType)
  }
  
  /**
   * Delete screenshot
   */
  deleteScreenshot(screenshotId: string): boolean {
    const screenshot = this.screenshots.get(screenshotId)
    if (screenshot) {
      this.screenshots.delete(screenshotId)
      
      // Remove thumbnail
      localStorage.removeItem(`${screenshotId}_thumb`)
      
      this.saveScreenshotsToStorage()
      return true
    }
    return false
  }
  
  /**
   * Clear all screenshots for a document
   */
  clearDocumentScreenshots(documentId: string): number {
    const documentScreenshots = this.getDocumentScreenshots(documentId)
    let deletedCount = 0
    
    documentScreenshots.forEach(screenshot => {
      if (this.deleteScreenshot(screenshot.id)) {
        deletedCount++
      }
    })
    
    return deletedCount
  }
  
  /**
   * Get screenshot statistics
   */
  getScreenshotStats(): {
    totalScreenshots: number
    totalSize: number
    byType: Partial<Record<EnhancedVisualType, number>>
    byDocument: Record<string, number>
    successRate: number
  } {
    const screenshots = Array.from(this.screenshots.values())
    const totalScreenshots = screenshots.length
    const totalSize = screenshots.reduce((sum, s) => sum + s.screenshot.fileSize, 0)
    
    const byType: Partial<Record<EnhancedVisualType, number>> = {}
    const byDocument: Record<string, number> = {}
    let successCount = 0
    
    screenshots.forEach(screenshot => {
      // Count by type
      byType[screenshot.elementType] = (byType[screenshot.elementType] || 0) + 1
      
      // Count by document
      byDocument[screenshot.documentId] = (byDocument[screenshot.documentId] || 0) + 1
      
      // Count successes
      if (screenshot.processingInfo.success) {
        successCount++
      }
    })
    
    return {
      totalScreenshots,
      totalSize,
      byType,
      byDocument,
      successRate: totalScreenshots > 0 ? successCount / totalScreenshots : 0
    }
  }
  
  /**
   * Export screenshots as JSON
   */
  exportScreenshots(): string {
    const data = {
      screenshots: Array.from(this.screenshots.values()),
      exportedAt: new Date().toISOString(),
      stats: this.getScreenshotStats()
    }
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * Import screenshots from JSON
   */
  importScreenshots(jsonData: string): number {
    try {
      const data = JSON.parse(jsonData)
      let importedCount = 0
      
      if (data.screenshots && Array.isArray(data.screenshots)) {
        data.screenshots.forEach((screenshot: ScreenshotMetadata) => {
          this.screenshots.set(screenshot.id, screenshot)
          importedCount++
        })
        
        this.saveScreenshotsToStorage()
      }
      
      return importedCount
    } catch (error) {
      console.error('Failed to import screenshots:', error)
      return 0
    }
  }
  
  /**
   * Save screenshots to localStorage
   */
  private saveScreenshotsToStorage(): void {
    try {
      const data = Array.from(this.screenshots.values())
      localStorage.setItem('rag-screenshots', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save screenshots to storage:', error)
    }
  }
  
  /**
   * Load screenshots from localStorage
   */
  private loadScreenshotsFromStorage(): void {
    try {
      const data = localStorage.getItem('rag-screenshots')
      if (data) {
        const screenshots: ScreenshotMetadata[] = JSON.parse(data)
        screenshots.forEach(screenshot => {
          this.screenshots.set(screenshot.id, screenshot)
        })
      }
    } catch (error) {
      console.warn('Failed to load screenshots from storage:', error)
    }
  }
}

// Singleton instance
export const screenshotGenerator = new ScreenshotGenerator()

// Export utilities
export const ScreenshotUtils = {
  /**
   * Convert screenshot to blob for download
   */
  async screenshotToBlob(screenshot: ScreenshotMetadata): Promise<Blob> {
    const response = await fetch(screenshot.screenshot.base64)
    return response.blob()
  },
  
  /**
   * Download screenshot
   */
  async downloadScreenshot(screenshot: ScreenshotMetadata, filename?: string): Promise<void> {
    const blob = await this.screenshotToBlob(screenshot)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `screenshot_${screenshot.elementId}.${screenshot.screenshot.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
  
  /**
   * Get human readable file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  },
  
  /**
   * Validate screenshot data
   */
  validateScreenshot(screenshot: ScreenshotMetadata): boolean {
    return !!(
      screenshot.id &&
      screenshot.documentId &&
      screenshot.elementId &&
      screenshot.screenshot.base64 &&
      screenshot.screenshot.width > 0 &&
      screenshot.screenshot.height > 0
    )
  }
}
