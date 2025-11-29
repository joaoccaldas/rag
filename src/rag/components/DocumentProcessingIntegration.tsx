// Enhanced Document Processing Integration
// Integrates the new document type system with existing RAG components

import React, { useState, useCallback } from 'react'
import { DOCUMENT_TYPE_CONFIGS, getConfigByExtension, getSupportedExtensions } from './document-types/document-types-config'
import { createDocumentProcessor, ProcessingResult } from './document-types/document-processor-factory'
import DocumentTypeManager from './document-types/DocumentTypeManager'

interface DocumentProcessingIntegrationProps {
  onProcessingComplete?: (results: ProcessingResult[]) => void
  onError?: (error: string) => void
}

export const DocumentProcessingIntegration: React.FC<DocumentProcessingIntegrationProps> = ({
  onProcessingComplete,
  onError
}) => {
  const [showTypeManager, setShowTypeManager] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [processingStatus, setProcessingStatus] = useState<string>('')

  const handleFileProcessing = useCallback(async (files: FileList) => {
    setProcessing(true)
    const results: ProcessingResult[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      try {
        setProcessingStatus(`Processing ${file.name}...`)
        
        // Get configuration for this file type
        const config = getConfigByExtension(extension)
        if (!config) {
          errors.push(`Unsupported file type: ${extension} for file: ${file.name}`)
          continue
        }

        // Create processor for this file type
        const processor = createDocumentProcessor(extension)
        if (!processor) {
          errors.push(`No processor available for ${extension} files`)
          continue
        }

        // Process the file
        const result = await processor.process(file)
        results.push(result)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Error processing ${file.name}: ${errorMessage}`)
      }
    }

    setProcessing(false)
    setProcessingStatus('')

    if (errors.length > 0) {
      onError?.(errors.join('; '))
    }

    if (results.length > 0) {
      onProcessingComplete?.(results)
    }
  }, [onProcessingComplete, onError])

  const supportedExtensions = getSupportedExtensions()
  const supportedTypes = Object.values(DOCUMENT_TYPE_CONFIGS).length

  return (
    <div className="document-processing-integration p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Enhanced Document Processing
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced document processing with {supportedTypes} supported types and {supportedExtensions.length} file extensions
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{supportedTypes}</div>
          <div className="text-sm text-blue-800 dark:text-blue-300">Document Types</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{supportedExtensions.length}</div>
          <div className="text-sm text-green-800 dark:text-green-300">File Extensions</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Object.values(DOCUMENT_TYPE_CONFIGS).filter(c => c.processingPipeline.visualExtraction.enabled).length}
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-300">Visual Extraction</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Object.values(DOCUMENT_TYPE_CONFIGS).filter(c => c.supportLevel === 'full').length}
          </div>
          <div className="text-sm text-orange-800 dark:text-orange-300">Fully Supported</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowTypeManager(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Manage Document Types
        </button>
        
        <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            accept={supportedExtensions.join(',')}
            onChange={(e) => e.target.files && handleFileProcessing(e.target.files)}
            className="hidden"
            disabled={processing}
          />
          {processing ? 'Processing...' : 'Upload Documents'}
        </label>
      </div>

      {/* Processing Status */}
      {processing && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-yellow-800 dark:text-yellow-200">{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Supported File Types Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          Supported File Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.values(DOCUMENT_TYPE_CONFIGS).map(config => (
            <div
              key={config.type}
              className={`px-3 py-2 rounded text-sm ${
                config.supportLevel === 'full' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : config.supportLevel === 'partial'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
              title={`${config.displayName} - ${config.supportLevel} support`}
            >
              <div className="font-medium">{config.displayName}</div>
              <div className="text-xs opacity-75">
                {config.extensions.join(', ')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Full Support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Partial Support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Experimental</span>
          </div>
        </div>
      </div>

      {/* Document Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowTypeManager(false)} />
          <div className="absolute inset-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-auto">
            <DocumentTypeManager
              onTypeSelect={(config) => {
                if (selectedTypes.includes(config.type)) {
                  setSelectedTypes(prev => prev.filter(t => t !== config.type))
                } else {
                  setSelectedTypes(prev => [...prev, config.type])
                }
              }}
              selectedTypes={selectedTypes}
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setShowTypeManager(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentProcessingIntegration
