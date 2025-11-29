/**
 * Screenshot Processing Integration
 * 
 * This module integrates screenshot generation with the document processing pipeline
 * and enhanced visual analysis system.
 */

import { EnhancedVisualAnalyzer, type VisualElementAnalysis } from './enhanced-visual-analysis'
import { screenshotGenerator, type ScreenshotMetadata } from './screenshot-generation'
import type { Document } from '../types'

export interface ScreenshotProcessingResult {
  documentId: string
  processedElements: number
  successfulScreenshots: number
  failedScreenshots: number
  screenshots: ScreenshotMetadata[]
  processingTime: number
  errors: string[]
}

export class ScreenshotProcessingIntegration {
  private analyzer: EnhancedVisualAnalyzer
  
  constructor() {
    this.analyzer = new EnhancedVisualAnalyzer()
  }
  
  /**
   * Process document and generate screenshots for all visual elements
   */
  async processDocumentScreenshots(
    document: Document,
    documentContainer: HTMLElement,
    onProgress?: (progress: number) => void
  ): Promise<ScreenshotProcessingResult> {
    const startTime = performance.now()
    const result: ScreenshotProcessingResult = {
      documentId: document.id,
      processedElements: 0,
      successfulScreenshots: 0,
      failedScreenshots: 0,
      screenshots: [],
      processingTime: 0,
      errors: []
    }
    
    try {
      // First, run enhanced visual analysis
      if (onProgress) onProgress(0.1)
      const analysisResult = await this.analyzer.analyzeDocument(document)
      
      if (!analysisResult.elements || analysisResult.elements.length === 0) {
        result.processingTime = performance.now() - startTime
        return result
      }
      
      // Find visual elements in the DOM
      if (onProgress) onProgress(0.2)
      const elementPairs = await this.findVisualElementsInDOM(
        analysisResult.elements,
        documentContainer
      )
      
      result.processedElements = elementPairs.length
      
      // Generate screenshots for each element
      for (let i = 0; i < elementPairs.length; i++) {
        const { element, analysis } = elementPairs[i]
        
        try {
          const screenshot = await screenshotGenerator.generateElementScreenshot(
            element,
            analysis,
            document.id
          )
          
          if (screenshot && screenshot.processingInfo.success) {
            result.screenshots.push(screenshot)
            result.successfulScreenshots++
          } else {
            result.failedScreenshots++
            if (screenshot?.processingInfo.errorMessage) {
              result.errors.push(screenshot.processingInfo.errorMessage)
            }
          }
        } catch (error) {
          result.failedScreenshots++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
        
        // Update progress
        if (onProgress) {
          const progress = 0.2 + (0.8 * (i + 1)) / elementPairs.length
          onProgress(progress)
        }
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Processing failed')
    }
    
    result.processingTime = performance.now() - startTime
    return result
  }
  
  /**
   * Find visual elements in the DOM that correspond to analysis results
   */
  private async findVisualElementsInDOM(
    analyses: VisualElementAnalysis[],
    container: HTMLElement
  ): Promise<Array<{ element: HTMLElement; analysis: VisualElementAnalysis }>> {
    const pairs: Array<{ element: HTMLElement; analysis: VisualElementAnalysis }> = []
    
    // Look for common visual element selectors
    const selectors = [
      'img',
      'canvas',
      'svg',
      'table',
      '[data-chart]',
      '[data-visualization]',
      '.chart',
      '.graph',
      '.diagram',
      '.visual-content'
    ]
    
    selectors.forEach(selector => {
      const elements = container.querySelectorAll(selector)
      elements.forEach((element, index) => {
        if (element instanceof HTMLElement) {
          // Try to match with analysis results
          const matchingAnalysis = this.matchElementWithAnalysis(
            element,
            analyses,
            index
          )
          
          if (matchingAnalysis) {
            pairs.push({
              element,
              analysis: matchingAnalysis
            })
          }
        }
      })
    })
    
    return pairs
  }
  
  /**
   * Match DOM element with analysis result
   */
  private matchElementWithAnalysis(
    element: HTMLElement,
    analyses: VisualElementAnalysis[],
    elementIndex: number
  ): VisualElementAnalysis | null {
    // Try to find analysis by element characteristics
    for (const analysis of analyses) {
      // Match by title if available
      if (analysis.title && element.textContent?.includes(analysis.title)) {
        return analysis
      }
      
      // Match by type
      if (this.elementMatchesAnalysisType(element, analysis.type)) {
        return analysis
      }
    }
    
    // Fallback: use index-based matching
    if (elementIndex < analyses.length) {
      return analyses[elementIndex]
    }
    
    return null
  }
  
  /**
   * Check if DOM element matches analysis type
   */
  private elementMatchesAnalysisType(element: HTMLElement, analysisType: string): boolean {
    const tagName = element.tagName.toLowerCase()
    
    switch (analysisType) {
      case 'data_table':
      case 'comparison_table':
      case 'summary_table':
        return tagName === 'table'
      
      case 'photo':
      case 'illustration':
      case 'screenshot':
      case 'technical_drawing':
        return tagName === 'img'
      
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
      case 'scatter_plot':
        return tagName === 'canvas' || 
               tagName === 'svg' || 
               element.classList.contains('chart') ||
               element.hasAttribute('data-chart')
      
      case 'flowchart':
      case 'org_chart':
      case 'process_diagram':
      case 'mind_map':
        return tagName === 'svg' || 
               element.classList.contains('diagram') ||
               element.classList.contains('flowchart')
      
      default:
        return false
    }
  }
  
  /**
   * Generate screenshots for specific element types only
   */
  async processSelectiveScreenshots(
    document: Document,
    documentContainer: HTMLElement,
    includeTypes: string[],
    onProgress?: (progress: number) => void
  ): Promise<ScreenshotProcessingResult> {
    const startTime = performance.now()
    
    // Run full analysis first
    const analysisResult = await this.analyzer.analyzeDocument(document)
    
    // Filter elements by type
    const filteredElements = analysisResult.elements?.filter(element => 
      includeTypes.includes(element.type)
    ) || []
    
    // Find corresponding DOM elements
    const elementPairs = await this.findVisualElementsInDOM(
      filteredElements,
      documentContainer
    )
    
    // Generate screenshots
    const screenshots = await screenshotGenerator.generateBatchScreenshots(
      elementPairs,
      document.id,
      (completed, total) => {
        if (onProgress) {
          onProgress(completed / total)
        }
      }
    )
    
    return {
      documentId: document.id,
      processedElements: elementPairs.length,
      successfulScreenshots: screenshots.filter(s => s.processingInfo.success).length,
      failedScreenshots: screenshots.filter(s => !s.processingInfo.success).length,
      screenshots,
      processingTime: performance.now() - startTime,
      errors: screenshots
        .filter(s => s.processingInfo.errorMessage)
        .map(s => s.processingInfo.errorMessage!)
    }
  }
  
  /**
   * Get processing statistics
   */
  getProcessingStats(documentId?: string): {
    totalProcessed: number
    averageProcessingTime: number
    successRate: number
    mostCommonErrors: Array<{ error: string; count: number }>
  } {
    const screenshots = documentId 
      ? screenshotGenerator.getDocumentScreenshots(documentId)
      : Object.values(screenshotGenerator.getScreenshotStats())
    
    // This is a simplified version - you could expand with more detailed analytics
    return {
      totalProcessed: Array.isArray(screenshots) ? screenshots.length : 0,
      averageProcessingTime: 0, // Would need to calculate from processing times
      successRate: screenshotGenerator.getScreenshotStats().successRate,
      mostCommonErrors: [] // Would need to analyze error patterns
    }
  }
  
  /**
   * Cleanup screenshots for a document
   */
  async cleanupDocumentScreenshots(documentId: string): Promise<number> {
    return screenshotGenerator.clearDocumentScreenshots(documentId)
  }
}

// Export singleton instance
export const screenshotProcessing = new ScreenshotProcessingIntegration()
