'use client'

import { useState, useEffect } from 'react'
import { Download, ExternalLink, Images } from 'lucide-react'
import { useRAG } from '../rag/contexts/RAGContext'
import { Document } from '../rag/types'
import { unifiedFileStorage } from '../storage/managers/unified-file-storage'
import SmartAIAnalysisSection from './ai-analysis'
import { EnhancedVisualContentRenderer } from './enhanced-visual-content-renderer'

interface DocumentPreviewModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export default function DocumentPreviewModal({ documentId, isOpen, onClose }: DocumentPreviewModalProps) {
  const { documents } = useRAG()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && documentId) {
      const foundDoc = documents.find((doc: Document) => doc.id === documentId)
      setDocument(foundDoc || null)
      setLoading(false)
    }
  }, [isOpen, documentId, documents])

  // Enhanced file access functions using Unified Storage
  const handleOpenOriginal = async () => {
    if (document) {
      try {
        const fileContent = await unifiedFileStorage.getFileContent(document.id)
        if (!fileContent) {
          alert('Original file not found. It may have been cleared from storage.')
          return
        }

        const url = URL.createObjectURL(fileContent.blob)
        const newWindow = window.open(url, '_blank')
        
        if (newWindow) {
          // Clean up URL after a delay
          setTimeout(() => URL.revokeObjectURL(url), 5000)
        } else {
          // Fallback: trigger download if popup blocked
          const link = window.document.createElement('a')
          link.href = url
          link.target = '_blank'
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Error opening file:', error)
        alert('Error opening file. Please try again.')
      }
    }
  }

  const handleDownloadOriginal = async () => {
    if (document) {
      try {
        const fileContent = await unifiedFileStorage.getFileContent(document.id)
        if (!fileContent) {
          alert('Original file not found. It may have been cleared from storage.')
          return
        }

        const url = URL.createObjectURL(fileContent.blob)
        const link = window.document.createElement('a')
        link.href = url
        link.download = fileContent.filename
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading file:', error)
        alert('Error downloading file. Please try again.')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div 
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {document?.name || 'Document Preview'}
              </h2>
              
              {/* File access buttons */}
              {document && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenOriginal}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Original</span>
                  </button>
                  <button
                    onClick={handleDownloadOriginal}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : document ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1"><span className="font-semibold">File:</span> {document.name}</p>
                      <p className="mb-1"><span className="font-semibold">Type:</span> {document.type.toUpperCase()}</p>
                      <p><span className="font-semibold">Size:</span> {(document.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <p className="mb-1"><span className="font-semibold">Uploaded:</span> {new Date(document.uploadedAt).toLocaleDateString()}</p>
                      <p className="mb-1"><span className="font-semibold">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          document.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          document.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {document.status}
                        </span>
                      </p>
                      <p><span className="font-semibold">Chunks:</span> {document.chunks?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced AI Analysis Section */}
                {document.aiAnalysis && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <SmartAIAnalysisSection 
                      aiAnalysis={document.aiAnalysis} 
                      isCompact={false}
                      className="w-full"
                    />
                  </>
                )}
                
                {/* Visual Content Section */}
                {document.visualContent && document.visualContent.length > 0 && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <Images className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Visual Content</h3>
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
                          {document.visualContent.length} item{document.visualContent.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {document.visualContent.map((visual, index) => (
                          <div 
                            key={visual.id || index}
                            className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            {/* Visual thumbnail or type indicator */}
                            <div className="aspect-video bg-white dark:bg-gray-900 rounded-md mb-3 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                              {visual.thumbnail ? (
                                <img 
                                  src={visual.thumbnail} 
                                  alt={visual.title || 'Visual content'} 
                                  className="max-w-full max-h-full object-contain rounded-md"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement
                                    img.style.display = 'none'
                                    const placeholder = document.createElement('div')
                                    placeholder.className = 'text-gray-400 text-sm'
                                    placeholder.textContent = `📊 ${visual.type}`
                                    img.parentNode?.appendChild(placeholder)
                                  }}
                                />
                              ) : (
                                <div className="text-gray-400 text-sm">
                                  📊 {visual.type}
                                </div>
                              )}
                            </div>
                            
                            {/* Visual info */}
                            <div className="space-y-2">
                              {visual.title && (
                                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                  {visual.title}
                                </h4>
                              )}
                              
                              {visual.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                                  {visual.description}
                                </p>
                              )}
                              
                              {/* LLM Summary preview */}
                              {visual.llmSummary?.mainContent && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border">
                                  <div className="font-medium mb-1">AI Analysis:</div>
                                  <div className="line-clamp-2">{visual.llmSummary.mainContent}</div>
                                </div>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex flex-wrap gap-1 text-xs">
                                {visual.metadata?.pageNumber && (
                                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                    Page {visual.metadata.pageNumber}
                                  </span>
                                )}
                                {visual.metadata?.confidence && (
                                  <span className="bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                                    {Math.round(visual.metadata.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-center">
                        <button
                          onClick={() => {
                            // Could implement full visual content viewer here
                            console.log('Open full visual content viewer')
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View all visual content →
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <hr className="border-gray-200 dark:border-gray-700" />
                
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Document Content</h3>
                  
                  {document.content && document.content.trim() ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg max-h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-700">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans break-words overflow-hidden">
                          {document.content}
                        </div>
                      </div>
                    </div>
                  ) : document.chunks && document.chunks.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        ⚠️ Original content not available. Showing processed chunks:
                      </p>
                      {document.chunks.slice(0, 10).map((chunk, index) => (
                        <div key={chunk.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                            <span className="font-semibold">Chunk {index + 1} of {document.chunks?.length}</span>
                            <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                              {chunk.content.length} chars
                            </span>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans break-words overflow-hidden">
                              {chunk.content}
                            </div>
                          </div>
                          {chunk.metadata && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                              {chunk.metadata.page && (
                                <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                  Page: {chunk.metadata.page}
                                </span>
                              )}
                              {chunk.metadata.section && (
                                <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                  Section: {chunk.metadata.section}
                                </span>
                              )}
                              {chunk.metadata.importance && (
                                <span className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                                  Importance: {chunk.metadata.importance.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {document.chunks.length > 10 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="font-medium">📄 ... and {document.chunks.length - 10} more chunks available</span>
                          <p className="text-xs mt-1">Showing first 10 chunks for performance</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-red-700 dark:text-red-300 font-medium">No content available for preview</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        This document may not have been processed correctly or the content extraction failed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Document not found.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
