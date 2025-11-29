/**
 * Document Preview Modal Component
 */

import React, { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Eye, FileText, Image as ImageIcon, File } from 'lucide-react'
import { Document } from '../../rag/types'
import { CitationButton } from '../citations'

export interface DocumentPreviewModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (document: Document) => void
  onOpenOriginal?: (document: Document) => void
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
  onOpenOriginal
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'analysis'>('content')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && document) {
      setActiveTab('content')
      setIsLoading(false)
    }
  }, [isOpen, document])

  if (!isOpen || !document) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return i >= 2 ? `${size.toFixed(2)} ${sizes[i]}` : `${Math.round(size)} ${sizes[i]}`
  }

  const getFileIcon = () => {
    const fileType = document.type || document.name?.split('.').pop()?.toLowerCase()
    
    if (fileType?.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (fileType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />
    }
    return <File className="h-6 w-6 text-gray-500" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {document.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CitationButton 
              document={document}
              variant="dropdown"
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
            />
            
            {onDownload && (
              <button
                onClick={() => onDownload(document)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
            
            {onOpenOriginal && document.metadata?.originalFileId && (
              <button
                onClick={() => onOpenOriginal(document)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                title="Open Original"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'content', label: 'Content', icon: Eye },
            { id: 'metadata', label: 'Metadata', icon: FileText },
            { id: 'analysis', label: 'AI Analysis', icon: ImageIcon }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'content' | 'metadata' | 'analysis')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Document Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Text Content */}
                    {document.content && (
                      <div className="prose dark:prose-invert max-w-none">
                        <h3 className="text-lg font-semibold mb-4">Extracted Text</h3>
                        <div className="whitespace-pre-wrap text-sm bg-white dark:bg-gray-800 p-4 rounded border">
                          {document.content}
                        </div>
                      </div>
                    )}
                    
                    {/* Chunks Preview */}
                    {document.chunks && document.chunks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Document Chunks ({document.chunks.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {document.chunks.slice(0, 5).map((chunk, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                              <div className="text-xs text-gray-500 mb-1">Chunk {index + 1}</div>
                              <div className="text-sm line-clamp-3">{chunk.content}</div>
                            </div>
                          ))}
                          {document.chunks.length > 5 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              ... and {document.chunks.length - 5} more chunks
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">File Name:</span>
                      <span className="font-medium">{document.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">File Size:</span>
                      <span className="font-medium">{formatFileSize(document.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{document.type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        document.status === 'ready' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {document.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uploaded:</span>
                      <span className="font-medium">{new Date(document.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Processing Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Processing Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chunks:</span>
                      <span className="font-medium">{document.chunks?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Visual Content:</span>
                      <span className="font-medium">{document.visualContent?.length || 0}</span>
                    </div>
                    {document.metadata && (
                      <div className="mt-4">
                        <span className="text-gray-500">Additional Metadata:</span>
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                          {JSON.stringify(document.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {document.aiAnalysis ? (
                <div className="space-y-4">
                  {/* AI Summary */}
                  {document.aiAnalysis.summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">AI Summary</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-gray-800 dark:text-gray-200">{document.aiAnalysis.summary}</p>
                        {document.aiAnalysis.confidence && (
                          <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
                            Confidence: {Math.round(document.aiAnalysis.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {document.aiAnalysis.keywords && document.aiAnalysis.keywords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {document.aiAnalysis.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {document.aiAnalysis.topics && document.aiAnalysis.topics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Topics</h3>
                      <div className="space-y-2">
                        {document.aiAnalysis.topics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <span className="font-medium">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI analysis available for this document</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
