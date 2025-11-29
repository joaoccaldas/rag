/**
 * Visual Content Debug Component
 * Temporarily add this to test visual content display
 */

import React, { useState, useEffect } from 'react'
import VisualContentRenderer from './enhanced-visual-content-renderer'
import { VisualContent } from '../rag/types'

const VisualContentDebugger: React.FC = () => {
  const [testVisualContent, setTestVisualContent] = useState<VisualContent[]>([])
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    // Create test visual content data
    const testThumbnail = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23e5e7eb"/><rect x="16" y="16" width="96" height="96" fill="%23f3f4f6" stroke="%239ca3af" stroke-width="2"/><text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="12" fill="%236b7280">TEST PREVIEW</text><circle cx="32" cy="32" r="4" fill="%2310b981"/><circle cx="32" cy="96" r="4" fill="%23f59e0b"/><circle cx="96" cy="32" r="4" fill="%23ef4444"/><circle cx="96" cy="96" r="4" fill="%238b5cf6"/></svg>`
    
    const sampleContent: VisualContent[] = [
      {
        id: 'debug_visual_1',
        documentId: 'debug_doc_1',
        type: 'image',
        title: 'Test Image Document',
        description: 'Debug test image with generated thumbnail',
        thumbnail: testThumbnail,
        source: testThumbnail,
        fullContent: testThumbnail,
        data: {
          base64: testThumbnail,
          url: testThumbnail
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          confidence: 0.95,
          documentTitle: 'Test Image Document',
          format: 'image/png',
          size: '15.2 KB',
          dimensions: '128x128'
        },
        llmSummary: {
          keyInsights: [
            'Debug test image with colored corner markers',
            'SVG-based thumbnail with text overlay',
            'Generated for testing visual content display'
          ],
          challenges: [],
          mainContent: 'This is a test visual content item to debug the display issues.',
          significance: 'Helps validate thumbnail generation and component rendering'
        }
      },
      {
        id: 'debug_visual_2',
        documentId: 'debug_doc_2',
        type: 'diagram',
        title: 'Test Diagram',
        description: 'Debug test diagram content',
        thumbnail: testThumbnail.replace('TEST PREVIEW', 'DIAGRAM'),
        source: testThumbnail.replace('TEST PREVIEW', 'DIAGRAM'),
        fullContent: testThumbnail.replace('TEST PREVIEW', 'DIAGRAM'),
        data: {
          base64: testThumbnail.replace('TEST PREVIEW', 'DIAGRAM'),
          url: testThumbnail.replace('TEST PREVIEW', 'DIAGRAM')
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          confidence: 0.90,
          documentTitle: 'Test Diagram',
          format: 'image/svg+xml',
          size: '8.7 KB',
          dimensions: 'Vector'
        },
        llmSummary: {
          keyInsights: [
            'Diagram-type visual content',
            'SVG format with vector graphics',
            'Test content for component validation'
          ],
          challenges: ['Ensuring proper rendering'],
          mainContent: 'This diagram demonstrates the visual content system capabilities.',
          significance: 'Validates diagram-specific rendering and metadata display'
        }
      }
    ]

    setTestVisualContent(sampleContent)
    
    // Add debug information
    const logs = [
      `✅ Created ${sampleContent.length} test visual content items`,
      `✅ Thumbnail data size: ${testThumbnail.length} characters`,
      `✅ Sample thumbnail preview: ${testThumbnail.substring(0, 50)}...`,
      `✅ Content types: ${sampleContent.map(c => c.type).join(', ')}`,
      `✅ All items have thumbnails: ${sampleContent.every(c => c.thumbnail)}`,
      `✅ All items have metadata: ${sampleContent.every(c => c.metadata)}`,
    ]
    
    setDebugInfo(logs)
    
    // Log to console as well
    console.log('🔍 Visual Content Debugger Initialized:')
    logs.forEach(log => console.log(log))
    
  }, [])

  return (
    <div className="p-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
        🐛 Visual Content Debug Panel
      </h3>
      
      {/* Debug Information */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border">
        <h4 className="font-medium mb-2">Debug Information:</h4>
        <ul className="text-sm space-y-1">
          {debugInfo.map((info, index) => (
            <li key={index} className="text-green-600 dark:text-green-400">
              {info}
            </li>
          ))}
        </ul>
      </div>

      {/* Test Visual Content Rendering */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test Visual Content Rendering:</h4>
        {testVisualContent.length > 0 ? (
          <VisualContentRenderer content={testVisualContent} />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No test content available</p>
        )}
      </div>

      {/* Manual Test Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Manual Test Steps:</h4>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Check if thumbnails appear above</li>
          <li>Click to expand visual content items</li>
          <li>Test the eye icon to open modal view</li>
          <li>Verify metadata displays correctly</li>
          <li>Check browser console for any errors</li>
          <li>Upload a real document to test actual thumbnail generation</li>
        </ol>
      </div>
    </div>
  )
}

export default VisualContentDebugger
