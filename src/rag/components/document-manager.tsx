'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Trash2, Download, Search, Filter, Eye, ChevronDown, ChevronUp, FileText, Calendar, HardDrive, AlertCircle, Clock, Check } from 'lucide-react'
import { useRAG } from '../contexts/RAGContext'
import { Document, AIAnalysisData } from '../types'
import { documentCache } from '../utils/lazy-loading'
import DocumentPreviewModal from '../../components/document-preview-modal'
import { DocumentViewer } from './document-viewer'
import { AISummaryDisplay } from '../../components/ai-summary-display'
import AISummarizer from '../../ai/summarization/ai-summarizer'

interface DocumentManagerState {
  searchTerm: string
  sortBy: 'name' | 'uploadedAt' | 'size'
  sortOrder: 'asc' | 'desc'
  filterType: string[]
  filterStatus: string[]
  showFilters: boolean
  viewMode: 'grid' | 'list'
}

export function DocumentManager() {
  const { documents, selectedDocuments, deleteDocument, toggleDocumentSelection, clearSelection, deleteSelectedDocuments, updateDocument } = useRAG()
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [analyzingDocument, setAnalyzingDocument] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  const [localState, setLocalState] = useState<DocumentManagerState>({
    searchTerm: '',
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
    filterType: [],
    filterStatus: [],
    showFilters: false,
    viewMode: 'grid'
  })

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localState.searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [localState.searchTerm])

  // Handle AI analysis completion
  const handleAIAnalysisComplete = async (documentId: string, analysisData: Partial<AIAnalysisData>) => {
    const aiAnalysis: AIAnalysisData = {
      summary: analysisData.summary || '',
      keywords: analysisData.keywords || [],
      tags: analysisData.tags || [],
      topics: analysisData.topics || [],
      sentiment: analysisData.sentiment || 'neutral',
      complexity: analysisData.complexity || 'medium',
      documentType: analysisData.documentType || 'Document',
      confidence: analysisData.confidence || 0.5,
      analyzedAt: new Date(),
      model: 'llama3:latest'
    }

    await updateDocument(documentId, { aiAnalysis })
    setAnalyzingDocument(null)
  }

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc: Document) => {
        // Search filter
        const matchesSearch = !debouncedSearchTerm || 
          doc.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          doc.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          doc.metadata?.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        
        // Type filter
        const matchesType = localState.filterType.length === 0 || localState.filterType.includes(doc.type)
        
        // Status filter
        const matchesStatus = localState.filterStatus.length === 0 || localState.filterStatus.includes(doc.status)
        
        return matchesSearch && matchesType && matchesStatus
      })
      .sort((a: Document, b: Document) => {
        let aValue: string | number | Date
        let bValue: string | number | Date
        
        switch (localState.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'uploadedAt':
            aValue = a.uploadedAt
            bValue = b.uploadedAt
            break
          case 'size':
            aValue = a.size
            bValue = b.size
            break
          default:
            aValue = a.uploadedAt
            bValue = b.uploadedAt
        }
        
        if (aValue < bValue) return localState.sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return localState.sortOrder === 'asc' ? 1 : -1
        return 0
      })
  }, [documents, debouncedSearchTerm, localState.filterType, localState.filterStatus, localState.sortBy, localState.sortOrder])

  // Document type options
  const documentTypes = useMemo(() => {
    const types = new Set(documents.map((doc: Document) => doc.type))
    return Array.from(types)
  }, [documents])

  // Status options
  const statusOptions = ['processing', 'ready', 'error']

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId)
        documentCache.delete(documentId)
        setShowDeleteConfirm(null)
      } catch (error) {
        console.error('Error deleting document:', error)
      }
    }
  }

  const handleDownloadDocument = (doc: Document) => {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSelectDocument = (documentId: string) => {
    toggleDocumentSelection(documentId)
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0) {
      clearSelection()
    } else {
      filteredDocuments.forEach((doc: Document) => {
        if (!selectedDocuments.includes(doc.id)) {
          toggleDocumentSelection(doc.id)
        }
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedDocuments.length} documents?`)) {
      try {
        await deleteSelectedDocuments()
        
        // Clear cache for deleted documents
        selectedDocuments.forEach((id: string) => documentCache.delete(id))
      } catch (error) {
        console.error('Error deleting documents:', error)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <Check className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Header with Actions */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {documents.length} documents total
            {selectedDocuments.length > 0 && (
              <span className="ml-2">
                • {selectedDocuments.length} selected
              </span>
            )}
            <span className="ml-2">
              • {documents.filter(doc => doc.aiAnalysis).length} AI analyzed
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedDocuments.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          )}
          
          <button
            onClick={() => setLocalState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {localState.showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={localState.searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalState((prev: DocumentManagerState) => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Expandable Filters */}
        {localState.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={`${localState.sortBy}-${localState.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as ['name' | 'uploadedAt' | 'size', 'asc' | 'desc']
                  setLocalState(prev => ({ ...prev, sortBy, sortOrder }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="uploadedAt-desc">Newest First</option>
                <option value="uploadedAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Document Type
              </label>
              <select
                multiple
                value={localState.filterType}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value)
                  setLocalState(prev => ({ ...prev, filterType: values }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                size={3}
              >
                {documentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                multiple
                value={localState.filterStatus}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value)
                  setLocalState(prev => ({ ...prev, filterStatus: values }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                size={3}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Documents Display - Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        {/* Select All Header for Grid */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Select All ({filteredDocuments.length} documents)
            </label>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDocuments.length > 0 && `${selectedDocuments.length} selected • `}
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 border ${
              selectedDocuments.includes(document.id) 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPreviewDocument(document)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(document)}
                      className="p-1 text-gray-400 hover:text-green-500 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(document.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1" title={document.name}>
                  {document.name}
                </h3>
                
                {document.metadata?.title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2" title={document.metadata.title}>
                    {document.metadata.title}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {document.type.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(document.status)}
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(document.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(document.uploadedAt)}</span>
                    </div>
                  </div>
                  
                  {document.aiAnalysis && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">AI Analyzed</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                        {document.aiAnalysis.summary}
                      </p>
                      {document.aiAnalysis.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {document.aiAnalysis.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="inline-block px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {document.aiAnalysis.tags.length > 3 && (
                            <span className="text-gray-500">+{document.aiAnalysis.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add AI Analysis Button if not analyzed */}
                {!document.aiAnalysis && document.status === 'ready' && (
                  <button
                    onClick={() => setAnalyzingDocument(document.id)}
                    className="mt-2 w-full px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    Generate AI Analysis
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Empty State for Grid */}
          {filteredDocuments.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {debouncedSearchTerm || localState.filterType.length > 0 || localState.filterStatus.length > 0
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Upload some documents to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument.id}
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingDocument.name}
              </h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-8rem)] p-4">
              <AISummaryDisplay document={viewingDocument} className="mb-6" />
              <DocumentViewer document={viewingDocument} onClose={() => setViewingDocument(null)} />
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {analyzingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Analysis
              </h3>
              <button
                onClick={() => setAnalyzingDocument(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AISummarizer
                content={documents.find((d: Document) => d.id === analyzingDocument)?.content || ''}
                fileName={documents.find((d: Document) => d.id === analyzingDocument)?.name || ''}
                onSummaryComplete={(data) => {
                  if (analyzingDocument) {
                    handleAIAnalysisComplete(analyzingDocument, data)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete Document
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this document? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDocument(showDeleteConfirm)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
