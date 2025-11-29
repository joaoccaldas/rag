/**
 * OCR Debugging Utilities
 * Tools to diagnose and test OCR functionality
 */

import { ocrExtractionService } from '../rag/services/ocr-extraction'
import { getStoredVisualContent, storeVisualContent } from '../rag/utils/visual-content-storage'

export interface OCRDebugReport {
  ocrServiceStatus: 'available' | 'unavailable' | 'error'
  tesseractStatus: 'initialized' | 'not_initialized' | 'error'
  visualContentStorageStatus: 'working' | 'error'
  storedVisualCount: number
  lastError?: string
  testResults?: {
    simpleTextExtraction: boolean
    imageProcessing: boolean
    storageOperations: boolean
  }
}

/**
 * Comprehensive OCR system health check
 */
export async function diagnoseOCRSystem(): Promise<OCRDebugReport> {
  const report: OCRDebugReport = {
    ocrServiceStatus: 'unavailable',
    tesseractStatus: 'not_initialized',
    visualContentStorageStatus: 'error',
    storedVisualCount: 0
  }

  try {
    // Test 1: Check OCR service availability
    console.log('🔍 Testing OCR service availability...')
    
    if (ocrExtractionService) {
      report.ocrServiceStatus = 'available'
      console.log('✅ OCR service is available')
      
      // Test 2: Check Tesseract initialization
      try {
        await ocrExtractionService.initialize()
        report.tesseractStatus = 'initialized'
        console.log('✅ Tesseract worker initialized')
      } catch (error) {
        report.tesseractStatus = 'error'
        report.lastError = `Tesseract init failed: ${error}`
        console.error('❌ Tesseract initialization failed:', error)
      }
    } else {
      report.lastError = 'OCR service not found'
      console.error('❌ OCR service not available')
    }

    // Test 3: Check visual content storage
    try {
      const stored = await getStoredVisualContent()
      report.storedVisualCount = stored.length
      report.visualContentStorageStatus = 'working'
      console.log(`✅ Visual content storage working: ${stored.length} items stored`)
    } catch (error) {
      report.lastError = `Storage error: ${error}`
      console.error('❌ Visual content storage failed:', error)
    }

    // Test 4: Run functional tests if OCR is available
    if (report.ocrServiceStatus === 'available' && report.tesseractStatus === 'initialized') {
      report.testResults = await runOCRFunctionalTests()
    }

  } catch (error) {
    report.lastError = `System error: ${error}`
    console.error('❌ OCR diagnosis failed:', error)
  }

  return report
}

/**
 * Run functional tests on OCR system
 */
async function runOCRFunctionalTests() {
  const results = {
    simpleTextExtraction: false,
    imageProcessing: false,
    storageOperations: false
  }

  try {
    // Test 1: Create a simple test image with text
    console.log('🧪 Testing text extraction...')
    const testImage = await createTestImageWithText('Hello OCR Test')
    
    if (testImage) {
      const ocrResult = await ocrExtractionService.extractFromFile(testImage, {
        enableThumbnails: true,
        extractVisualElements: true,
        confidenceThreshold: 0.1 // Low threshold for test
      })
      
      if (ocrResult.text.includes('Hello') || ocrResult.text.includes('OCR') || ocrResult.text.includes('Test')) {
        results.simpleTextExtraction = true
        console.log('✅ Text extraction working')
      } else {
        console.log(`⚠️ Text extraction failed. Got: "${ocrResult.text}"`)
      }
      
      if (ocrResult.visualElements.length > 0) {
        results.imageProcessing = true
        console.log('✅ Image processing working')
      }
      
      // Test storage
      try {
        await storeVisualContent(ocrResult.visualElements.map(ve => ({
          id: ve.id,
          documentId: ve.documentId,
          type: ve.type as 'chart' | 'table' | 'graph' | 'diagram' | 'image',
          title: ve.title,
          data: {
            base64: ve.data?.base64,
            url: ve.data?.url
          },
          metadata: {
            extractedAt: new Date().toISOString(),
            confidence: ve.metadata?.confidence || 0.8,
            documentTitle: 'OCR Test'
          }
        })))
        results.storageOperations = true
        console.log('✅ Storage operations working')
      } catch (error) {
        console.error('❌ Storage test failed:', error)
      }
    }
  } catch (error) {
    console.error('❌ Functional tests failed:', error)
  }

  return results
}

/**
 * Create a test image with text for OCR testing
 */
async function createTestImageWithText(text: string): Promise<File | null> {
  try {
    // Create a canvas with text
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Black text
    ctx.fillStyle = 'black'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'test-image.png', { type: 'image/png' }))
        } else {
          resolve(null)
        }
      }, 'image/png')
    })
  } catch (error) {
    console.error('Failed to create test image:', error)
    return null
  }
}

/**
 * Test OCR with a provided file
 */
export async function testOCRWithFile(file: File): Promise<{
  success: boolean
  extractedText: string
  visualElements: number
  confidence: number
  error?: string
}> {
  try {
    console.log(`🧪 Testing OCR with file: ${file.name} (${file.type}, ${file.size} bytes)`)
    
    // Initialize OCR service
    await ocrExtractionService.initialize()
    
    // Extract content
    const result = await ocrExtractionService.extractFromFile(file, {
      enableThumbnails: true,
      extractVisualElements: true,
      confidenceThreshold: 0.3
    })
    
    console.log(`📊 OCR Results:`)
    console.log(`   Text: ${result.text.length} characters`)
    console.log(`   Visual elements: ${result.visualElements.length}`)
    console.log(`   Confidence: ${result.confidence}`)
    console.log(`   Processing time: ${result.processingTime}ms`)
    
    return {
      success: true,
      extractedText: result.text,
      visualElements: result.visualElements.length,
      confidence: result.confidence
    }
  } catch (error) {
    console.error('❌ OCR test failed:', error)
    return {
      success: false,
      extractedText: '',
      visualElements: 0,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clear visual content storage for testing
 */
export async function clearVisualContentForTesting(): Promise<void> {
  try {
    localStorage.removeItem('rag_visual_content')
    localStorage.removeItem('rag_visual_index_document')
    localStorage.removeItem('rag_visual_index_type')
    console.log('✅ Visual content storage cleared for testing')
  } catch (error) {
    console.error('❌ Failed to clear visual content storage:', error)
  }
}

/**
 * Display comprehensive OCR system status
 */
export async function logOCRSystemStatus(): Promise<void> {
  console.log('🔍 =================================')
  console.log('🔍 OCR SYSTEM STATUS REPORT')
  console.log('🔍 =================================')
  
  const report = await diagnoseOCRSystem()
  
  console.log(`OCR Service: ${report.ocrServiceStatus}`)
  console.log(`Tesseract: ${report.tesseractStatus}`)
  console.log(`Storage: ${report.visualContentStorageStatus}`)
  console.log(`Stored Visual Content: ${report.storedVisualCount} items`)
  
  if (report.testResults) {
    console.log('Functional Tests:')
    console.log(`  Text Extraction: ${report.testResults.simpleTextExtraction ? '✅' : '❌'}`)
    console.log(`  Image Processing: ${report.testResults.imageProcessing ? '✅' : '❌'}`)
    console.log(`  Storage Operations: ${report.testResults.storageOperations ? '✅' : '❌'}`)
  }
  
  if (report.lastError) {
    console.log(`Last Error: ${report.lastError}`)
  }
  
  console.log('🔍 =================================')
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  interface WindowWithDebug extends Window {
    ocrDebug?: {
      diagnose: typeof diagnoseOCRSystem
      testFile: typeof testOCRWithFile
      clearStorage: typeof clearVisualContentForTesting
      logStatus: typeof logOCRSystemStatus
    }
  }
  
  (window as WindowWithDebug).ocrDebug = {
    diagnose: diagnoseOCRSystem,
    testFile: testOCRWithFile,
    clearStorage: clearVisualContentForTesting,
    logStatus: logOCRSystemStatus
  }
  
  console.log('🔧 OCR Debug tools available at window.ocrDebug')
  console.log('   - ocrDebug.diagnose() - Full system diagnosis')
  console.log('   - ocrDebug.testFile(file) - Test with specific file')
  console.log('   - ocrDebug.clearStorage() - Clear visual content storage')
  console.log('   - ocrDebug.logStatus() - Display system status')
}
