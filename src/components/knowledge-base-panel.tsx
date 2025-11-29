"use client"

import React, { useState } from 'react'
import { ChevronLeft, Database, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { Document } from '@/rag/types'

interface KnowledgeBasePanelProps {
  className?: string
}

export function KnowledgeBasePanel({ className = "" }: KnowledgeBasePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { documents } = useRAG()
  
  const readyDocuments = documents.filter((doc: Document) => doc.status === 'ready')
  const processingDocuments = documents.filter((doc: Document) => 
    doc.status === 'processing' || doc.status === 'chunking' || doc.status === 'embedding'
  )
  const errorDocuments = documents.filter((doc: Document) => doc.status === 'error')
  const totalChunks = readyDocuments.reduce((sum: number, doc: Document) => sum + (doc.chunks?.length || 0), 0)
  
  const togglePanel = () => {
    setIsExpanded(!isExpanded)
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'processing':
      case 'chunking':
      case 'embedding':
        return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return <FileText className="w-3 h-3 text-gray-400" />
    }
  }
  
  return (
    <div className={`relative flex-shrink-0 h-full transition-all duration-300 ease-in-out ${className}`}>
      {/* Panel Container */}
      <div className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        shadow-lg h-full flex transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-80' : 'w-12'}
      `}>
        
        {/* Collapsed State - Toggle Button */}
        <div className="w-12 flex flex-col items-center justify-start pt-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <button
            onClick={togglePanel}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 group"
            title={isExpanded ? "Collapse Knowledge Base" : "Expand Knowledge Base"}
          >
            <div className="relative">
              <Database className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              {readyDocuments.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-800">
                  <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </button>
          
          {!isExpanded && readyDocuments.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {readyDocuments.length}
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        <div className={`
          flex-1 overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'}
        `}>
          {isExpanded && (
            <div className="p-4 h-full overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Knowledge Base
                  </h3>
                </div>
                <button
                  onClick={togglePanel}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {readyDocuments.length}
                  </div>
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    Ready Documents
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {totalChunks}
                  </div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">
                    Total Chunks
                  </div>
                </div>
              </div>
              
              {/* Processing Status */}
              {processingDocuments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Processing ({processingDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {processingDocuments.map((doc: Document) => (
                      <div key={doc.id} className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        {getStatusIcon(doc.status)}
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                          {doc.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Error Status */}
              {errorDocuments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Errors ({errorDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {errorDocuments.map((doc: Document) => (
                      <div key={doc.id} className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {getStatusIcon(doc.status)}
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                          {doc.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ready Documents */}
              {readyDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Files ({readyDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {readyDocuments.map((doc: Document) => (
                      <div key={doc.id} className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start space-x-2">
                          {getStatusIcon(doc.status)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {doc.name}
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.chunks?.length || 0} chunks
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(doc.size)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {doc.uploadedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {documents.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    No documents uploaded yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Upload files to build your knowledge base
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
