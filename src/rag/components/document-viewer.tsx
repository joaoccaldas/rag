"use client"

import { useState } from 'react'
import { Document } from '../types'
import { X, Download, FileText, Clock, Hash } from 'lucide-react'

interface DocumentViewerProps {
  document: Document
  onClose: () => void
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'chunks' | 'metadata'>('content')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{document.type.toUpperCase()}</span>
                <span>•</span>
                <span>{formatFileSize(document.size)}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  document.status === 'ready'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : document.status === 'error'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                }`}>
                  {document.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Create download link
                const element = window.document.createElement('a')
                const file = new Blob([document.content], { type: 'text/plain' })
                element.href = URL.createObjectURL(file)
                element.download = document.name
                window.document.body.appendChild(element)
                element.click()
                window.document.body.removeChild(element)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="px-6">
            <nav className="flex space-x-1">
              {[
                { id: 'content' as const, label: 'Content', icon: FileText },
                { id: 'chunks' as const, label: 'Chunks', icon: Hash },
                { id: 'metadata' as const, label: 'Metadata', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Document Content
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {document.content}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'chunks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Document Chunks
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {document.chunks?.length || 0} chunks
                </span>
              </div>
              
              {document.chunks && document.chunks.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {document.chunks.map((chunk, index) => (
                    <div
                      key={chunk.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Chunk {index + 1}
                        </span>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Chars: {chunk.content.length}</span>
                          <span>Pos: {chunk.startIndex}-{chunk.endIndex}</span>
                          {chunk.metadata.importance && (
                            <span>Importance: {(chunk.metadata.importance * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Hash className="w-8 h-8 mx-auto mb-2" />
                  <p>No chunks available</p>
                  <p className="text-xs">Document may still be processing</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Document Metadata
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">File Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">File Name:</span>
                      <span className="text-gray-900 dark:text-white">{document.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">File Type:</span>
                      <span className="text-gray-900 dark:text-white">{document.type.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                      <span className="text-gray-900 dark:text-white">{formatFileSize(document.size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        document.status === 'ready'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : document.status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}>
                        {document.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Processing Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Uploaded:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(document.uploadedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Modified:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(document.lastModified)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chunks:</span>
                      <span className="text-gray-900 dark:text-white">{document.chunks?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Word Count:</span>
                      <span className="text-gray-900 dark:text-white">{document.metadata.wordCount || 0}</span>
                    </div>
                  </div>
                </div>

                {(document.metadata.title || document.aiAnalysis) && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:col-span-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Content Metadata</h4>
                    <div className="space-y-2 text-sm">
                      {document.metadata.title && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Title: </span>
                          <span className="text-gray-900 dark:text-white">{document.metadata.title}</span>
                        </div>
                      )}
                      {document.metadata.author && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Author: </span>
                          <span className="text-gray-900 dark:text-white">{document.metadata.author}</span>
                        </div>
                      )}
                      {document.metadata.language && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Language: </span>
                          <span className="text-gray-900 dark:text-white">{document.metadata.language}</span>
                        </div>
                      )}
                      {document.metadata.tags && document.metadata.tags.length > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Tags: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.metadata.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(document.metadata.summary || document.aiAnalysis?.summary) && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Summary: </span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {document.aiAnalysis?.summary || document.metadata.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Analysis Section */}
                {document.aiAnalysis && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 md:col-span-2 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      AI Analysis Results
                    </h4>
                    <div className="space-y-3 text-sm">
                      {document.aiAnalysis.keywords && document.aiAnalysis.keywords.length > 0 && (
                        <div>
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Keywords: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.aiAnalysis.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {document.aiAnalysis.tags && document.aiAnalysis.tags.length > 0 && (
                        <div>
                          <span className="text-blue-700 dark:text-blue-300 font-medium">AI Tags: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.aiAnalysis.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {document.aiAnalysis.topics && document.aiAnalysis.topics.length > 0 && (
                        <div>
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Topics: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.aiAnalysis.topics.map((topic, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 rounded"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            {((document.aiAnalysis.confidence || 0) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">
                            {document.aiAnalysis.sentiment || 'neutral'}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Sentiment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">
                            {document.aiAnalysis.complexity || 'medium'}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Complexity</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
