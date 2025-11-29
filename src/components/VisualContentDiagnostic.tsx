/**
 * Visual Content Diagnostic Component
 * Provides real-time debugging and testing for the visual content system
 */

import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Eye, Download, RefreshCw } from 'lucide-react'
import { ocrExtractionService } from '../rag/services/ocr-extraction'
import { getStoredVisualContent } from '../rag/utils/visual-content-storage'
import { diagnoseOCRSystem, clearVisualContentForTesting, OCRDebugReport } from '../utils/ocr-debug'

interface DiagnosticStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string | undefined
  details?: string[] | undefined
}

export const VisualContentDiagnostic: React.FC = () => {
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    { id: 'storage', name: 'Visual Content Storage', status: 'pending' },
    { id: 'filesystem', name: 'File System Storage', status: 'pending' },
    { id: 'ocr', name: 'OCR Service Initialization', status: 'pending' },
    { id: 'tesseract', name: 'Tesseract.js Worker', status: 'pending' },
    { id: 'pdfjs', name: 'PDF.js Configuration', status: 'pending' },
    { id: 'extraction', name: 'Visual Extraction Test', status: 'pending' },
    { id: 'thumbnails', name: 'Thumbnail Generation', status: 'pending' }
  ])
  
  const [storedContentCount, setStoredContentCount] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<OCRDebugReport | null>(null)

  const updateStep = (id: string, status: DiagnosticStep['status'], message?: string, details?: string[]) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { 
        ...step, 
        status, 
        message: message || step.message,
        details: details || step.details 
      } : step
    ))
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    
    try {
      // Step 1: Check storage
      updateStep('storage', 'running', 'Checking visual content storage...')
      const stored = await getStoredVisualContent()
      setStoredContentCount(stored.length)
      updateStep('storage', 'success', `Found ${stored.length} stored visual items`, [
        `Storage location: localStorage['rag_visual_content']`,
        `Total items: ${stored.length}`,
        `Data size: ${JSON.stringify(stored).length} characters`
      ])

      // Step 2: Check file system storage
      updateStep('filesystem', 'running', 'Checking file system storage capabilities...')
      try {
        // Only try file system storage on server side
        if (typeof window === 'undefined') {
          const { getStorageStats } = await import('../rag/utils/file-system-visual-storage')
          const stats = await getStorageStats()
          updateStep('filesystem', 'success', `File system storage: ${stats.hasFileSystemAccess ? 'Available' : 'Not available'}`, [
            `Storage location: ${stats.storageLocation}`,
            `Total items: ${stats.totalItems}`,
            `Total file size: ${Math.round(stats.totalFileSize / 1024)} KB`,
            `Thumbnail size: ${Math.round(stats.totalThumbnailSize / 1024)} KB`,
            `File system access: ${stats.hasFileSystemAccess ? 'Yes' : 'No'}`
          ])
        } else {
          updateStep('filesystem', 'success', 'File system storage: Client-side mode (localStorage only)', [
            'Running in browser environment',
            'File system access: Not available in browser',
            'Using localStorage for visual content storage'
          ])
        }
      } catch (error) {
        updateStep('filesystem', 'error', `File system check failed: ${error}`)
      }

      // Step 3: OCR Service
      updateStep('ocr', 'running', 'Testing OCR service availability...')
      try {
        if (ocrExtractionService) {
          updateStep('ocr', 'success', 'OCR service is available')
          
          // Step 4: Tesseract initialization
          updateStep('tesseract', 'running', 'Initializing Tesseract worker...')
          await ocrExtractionService.initialize()
          updateStep('tesseract', 'success', 'Tesseract worker initialized successfully')
          
        } else {
          updateStep('ocr', 'error', 'OCR service not found')
          updateStep('tesseract', 'error', 'Cannot test - OCR service unavailable')
        }
      } catch (error) {
        updateStep('ocr', 'error', `OCR initialization failed: ${error}`)
        updateStep('tesseract', 'error', `Tesseract error: ${error}`)
      }

      // Step 5: PDF.js configuration
      updateStep('pdfjs', 'running', 'Checking PDF.js worker...')
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        updateStep('pdfjs', 'success', 'PDF.js worker configured', [
          'Worker source: /pdf.worker.min.mjs',
          'PDF.js version: ' + pdfjsLib.version
        ])
      } catch (error) {
        updateStep('pdfjs', 'error', `PDF.js error: ${error}`)
      }

      // Step 6: Test extraction
      updateStep('extraction', 'running', 'Testing visual extraction...')
      try {
        // Create a simple test image
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, 400, 200)
          ctx.fillStyle = 'black'
          ctx.font = '24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Test Visual Content', 200, 100)
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const testFile = new File([blob], 'test-image.png', { type: 'image/png' })
              const result = await ocrExtractionService.extractFromFile(testFile, {
                enableThumbnails: true,
                extractVisualElements: true,
                confidenceThreshold: 0.1
              })
              updateStep('extraction', 'success', `Extracted text: "${result.text.trim()}"`, [
                `Confidence: ${Math.round(result.confidence * 100)}%`,
                `Visual elements: ${result.visualElements.length}`,
                `Thumbnails: ${result.thumbnails.length}`,
                `Processing time: ${result.processingTime}ms`
              ])
            } else {
              updateStep('extraction', 'error', 'Failed to create test image blob')
            }
          })
        } else {
          updateStep('extraction', 'error', 'Canvas context not available')
        }
      } catch (error) {
        updateStep('extraction', 'error', `Extraction test failed: ${error}`)
      }

      // Step 7: Thumbnail generation
      updateStep('thumbnails', 'running', 'Testing thumbnail generation...')
      try {
        // Create a simple canvas image for thumbnail test
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 150
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#3b82f6'
          ctx.fillRect(0, 0, 200, 150)
          ctx.fillStyle = 'white'
          ctx.font = '16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Thumbnail Test', 100, 75)
          
          canvas.toBlob((blob) => {
            if (blob) {
              updateStep('thumbnails', 'success', 'Thumbnail generation working', [
                `Canvas size: 200x150`,
                `Blob size: ${blob.size} bytes`,
                `MIME type: ${blob.type}`
              ])
            } else {
              updateStep('thumbnails', 'error', 'Canvas toBlob failed')
            }
          })
        } else {
          updateStep('thumbnails', 'error', 'Canvas context not available')
        }
      } catch (error) {
        updateStep('thumbnails', 'error', `Thumbnail test failed: ${error}`)
      }

      // Run comprehensive diagnosis
      const fullDiagnosis = await diagnoseOCRSystem()
      setTestResults(fullDiagnosis)

    } catch (error) {
      console.error('Diagnostic failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const clearStorage = async () => {
    try {
      await clearVisualContentForTesting()
      setStoredContentCount(0)
      updateStep('storage', 'success', 'Storage cleared successfully')
    } catch (error) {
      updateStep('storage', 'error', `Clear storage failed: ${error}`)
    }
  }

  const getStatusIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'running': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Eye className="w-6 h-6 mr-2" />
              Visual Content System Diagnostics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Test and debug the visual content extraction system
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </button>
            
            <button
              onClick={clearStorage}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Clear Storage
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Storage Status</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {storedContentCount} items
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stored visual content
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">System Status</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {steps.filter(s => s.status === 'success').length}/{steps.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tests passed
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Diagnostic Steps</h3>
          {steps.map((step) => (
            <div key={step.id} className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              {getStatusIcon(step.status)}
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    step.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    step.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    step.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {step.status}
                  </span>
                </div>
                
                {step.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {step.message}
                  </p>
                )}
                
                {step.details && (
                  <ul className="text-xs text-gray-500 dark:text-gray-500 mt-2 space-y-1">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {testResults && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Full Diagnostic Report</h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default VisualContentDiagnostic
