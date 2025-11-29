/**
 * Enhanced Document Processing Integration Example
 * Shows how to integrate the new worker-based processing with existing components
 */

import React from 'react'
import { EnhancedDocumentProcessor } from '../components/enhanced-document-processor'
import { ErrorDetails } from '../utils/error-handling'

export function EnhancedProcessingExample() {
  const handleDocumentsProcessed = (documentIds: string[]) => {
    console.log('✅ Documents processed successfully:', documentIds)
    // Here you would typically:
    // 1. Update your document store
    // 2. Refresh the UI
    // 3. Show success notification
    // 4. Navigate to processed documents view
  }

  const handleError = (error: ErrorDetails) => {
    console.error('❌ Processing error:', error)
    // Here you would typically:
    // 1. Show user-friendly error message
    // 2. Display recovery actions if available
    // 3. Log error for debugging
    // 4. Update error state in your app
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Enhanced Document Processing</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">✨ New Features</h2>
          <ul className="space-y-1 text-sm">
            <li>• <strong>Worker Processing:</strong> No more UI freezing during document processing</li>
            <li>• <strong>Batch Upload:</strong> Process multiple documents simultaneously</li>
            <li>• <strong>Smart Error Handling:</strong> User-friendly messages with recovery suggestions</li>
            <li>• <strong>Real-time Progress:</strong> Live updates on processing status</li>
            <li>• <strong>Queue Management:</strong> Pause, resume, and cancel jobs</li>
          </ul>
        </div>

        <EnhancedDocumentProcessor
          onDocumentsProcessed={handleDocumentsProcessed}
          onError={handleError}
        />

        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">🔧 Integration Instructions</h2>
          <div className="text-sm space-y-2">
            <p><strong>Step 1:</strong> Replace your existing upload component with <code>EnhancedDocumentProcessor</code></p>
            <p><strong>Step 2:</strong> Handle the <code>onDocumentsProcessed</code> callback to update your UI</p>
            <p><strong>Step 3:</strong> Handle the <code>onError</code> callback to show user-friendly errors</p>
            <p><strong>Step 4:</strong> Optionally use batch processing APIs for programmatic uploads</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example of programmatic batch processing
export async function programmaticBatchProcessingExample(files: File[]) {
  const { batchProcessor } = await import('../utils/batch-processing')
  
  try {
    // Submit batch job
    const jobId = await batchProcessor.submitBatch(files, {
      enableOCR: true,
      enableAI: true,
      priority: 'high',
      maxConcurrentJobs: 3
    })
    
    console.log(`🚀 Batch job ${jobId} submitted`)
    
    // Track progress
    const unsubscribe = batchProcessor.onJobUpdate(jobId, (job) => {
      console.log(`📊 Job ${job.id} progress: ${job.progress.overallProgress}%`)
      
      if (job.status === 'COMPLETED') {
        console.log('✅ Batch processing complete!')
        console.log(`📄 Processed ${job.results.filter(r => r.success).length} files successfully`)
        unsubscribe()
      }
    })
    
    return jobId
  } catch (error) {
    console.error('❌ Batch processing failed:', error)
    throw error
  }
}

export default EnhancedProcessingExample
