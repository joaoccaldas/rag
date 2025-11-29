'use client'

import React, { useState, useEffect } from 'react'
import { Upload, Folder, Search, MoreVertical, Eye, Download, Trash2, Calendar, User, Tag } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: string
  author: string
  tags: string[]
  status: 'processing' | 'ready' | 'error'
  preview?: string
}

interface DocumentHubViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const DocumentHubView: React.FC<DocumentHubViewProps> = ({ actionContext }) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Mock document data
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Product Manual v2.1.pdf',
        type: 'pdf',
        size: 2048576,
        uploadDate: '2024-01-15T10:30:00Z',
        author: 'John Doe',
        tags: ['manual', 'product', 'technical'],
        status: 'ready',
        preview: 'Product documentation and user guidelines...'
      },
      {
        id: '2',
        name: 'Company Policy.docx',
        type: 'docx',
        size: 1024000,
        uploadDate: '2024-01-14T14:20:00Z',
        author: 'HR Department',
        tags: ['policy', 'hr', 'guidelines'],
        status: 'ready',
        preview: 'Company policies and procedures document...'
      },
      {
        id: '3',
        name: 'Project Presentation.pptx',
        type: 'pptx',
        size: 5120000,
        uploadDate: '2024-01-13T09:15:00Z',
        author: 'Project Team',
        tags: ['presentation', 'project', 'slides'],
        status: 'processing',
        preview: 'Project overview and milestone presentation...'
      }
    ]

    setTimeout(() => {
      setDocuments(mockDocuments)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = selectedFilter === 'all' || 
                         doc.status === selectedFilter ||
                         doc.type === selectedFilter

    return matchesSearch && matchesFilter
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄'
      case 'docx': case 'doc': return '📝'
      case 'pptx': case 'ppt': return '📊'
      case 'xlsx': case 'xls': return '📈'
      case 'txt': return '📄'
      case 'md': return '📋'
      default: return '📄'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Document Hub
          </h1>
          <p className="text-gray-600">
            {actionContext ? `Context: ${actionContext}` : 'Manage and explore your document collection'}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search and Filter */}
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Documents</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="pptx">PowerPoint</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'list' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Documents */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query or filters'
                : 'Upload your first document to get started'
              }
            </p>
            {!searchQuery && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mx-auto">
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
              >
                {viewMode === 'list' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-2xl">{getTypeIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.author}
                          </span>
                          <span>{formatFileSize(doc.size)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{getTypeIcon(doc.type)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{doc.name}</h3>
                    
                    {doc.preview && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.preview}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" />
                        {doc.author}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                      <div>{formatFileSize(doc.size)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentHubView
