"use client"

import { useState, useEffect } from 'react'
import { X, FileText, Image as ImageIcon, BarChart3, Table, Eye, Download, Search, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { getStoredVisualContent } from '../rag/utils/visual-content-storage'

interface VisualElement {
  id: string
  type: 'image' | 'chart' | 'graph' | 'table' | 'diagram' | 'infographic'
  content: string
  description: string
  metadata: {
    documentTitle: string
    documentId: string
    pageNumber?: number
    position?: { x: number; y: number; width: number; height: number }
    extractedText?: string
    dataValues?: Record<string, unknown>[]
  }
  thumbnailUrl?: string
  fullUrl?: string
  createdAt: string
}

interface VisualContentLibraryProps {
  isOpen: boolean
  onClose: () => void
  filterByDocument?: string
  filterByType?: string
}

export function VisualContentLibrary({ 
  isOpen, 
  onClose, 
  filterByDocument,
  filterByType 
}: VisualContentLibraryProps) {
  const [visualElements, setVisualElements] = useState<VisualElement[]>([])
  const [filteredElements, setFilteredElements] = useState<VisualElement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState(filterByType || 'all')
  const [selectedDocument, setSelectedDocument] = useState(filterByDocument || 'all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedElement, setSelectedElement] = useState<VisualElement | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Load visual content
  useEffect(() => {
    const loadVisualContent = async () => {
      setLoading(true)
      try {
        const content = await getStoredVisualContent()
        console.log('Visual content loaded:', content)
        
        // Log first item for debugging
        if (content.length > 0 && content[0]) {
          const firstItem = content[0]
          console.log('First visual item structure:', {
            id: firstItem.id,
            type: firstItem.type,
            hasThumbnail: !!firstItem.thumbnail,
            thumbnailLength: firstItem.thumbnail?.length || 0,
            thumbnailType: firstItem.thumbnail?.substring(0, 30) || 'none',
            hasSource: !!firstItem.source,
            sourceLength: firstItem.source?.length || 0,
            hasDataBase64: !!(firstItem.data && firstItem.data.base64),
            dataBase64Length: firstItem.data?.base64?.length || 0,
            hasDataUrl: !!(firstItem.data && firstItem.data.url)
          })
        }
        
        let elements: VisualElement[] = []
        
        if (content.length === 0) {
          // Generate mock visual content for demonstration
          elements = [
            {
              id: 'mock-1',
              type: 'diagram',
              content: 'Mock diagram content',
              description: 'Sample diagram from history.html',
              metadata: {
                documentTitle: 'history.html',
                documentId: 'doc-1',
                pageNumber: 1,
                extractedText: 'Sample diagram showing historical data'
              },
              createdAt: new Date().toISOString()
            },
            {
              id: 'mock-2',
              type: 'chart',
              content: 'Mock chart content',
              description: 'Sample chart from analysis document',
              metadata: {
                documentTitle: 'Analysis YTD April and fight back plan.html',
                documentId: 'doc-2',
                pageNumber: 1,
                extractedText: 'Sample chart showing YTD analysis'
              },
              createdAt: new Date().toISOString()
            },
            {
              id: 'mock-3',
              type: 'table',
              content: 'Mock table content',
              description: 'Sample data table',
              metadata: {
                documentTitle: '5 years plan analysis.html',
                documentId: 'doc-3',
                pageNumber: 1,
                extractedText: 'Sample table with planning data'
              },
              createdAt: new Date().toISOString()
            }
          ]
        } else {
          // Transform stored content to our interface with guaranteed unique IDs
          const seenIds = new Set<string>()
          elements = content.map((item, index) => {
            let uniqueId = item.id
            if (!uniqueId || seenIds.has(uniqueId)) {
              // Generate truly unique ID
              const timestamp = Date.now()
              const randomSuffix = Math.random().toString(36).substring(2, 8)
              uniqueId = `visual_${timestamp}_${randomSuffix}_${index}`
            }
            seenIds.add(uniqueId)
            
            // Get thumbnail URL with fallback to reliable placeholder
            let thumbnailUrl = '';
            let fullUrl = '';
            
            // Priority: thumbnail > source > data.base64 > data.url > placeholder
            if (item.thumbnail && item.thumbnail.startsWith('data:')) {
              thumbnailUrl = item.thumbnail;
              fullUrl = item.thumbnail;
            } else if (item.source && item.source.startsWith('data:')) {
              thumbnailUrl = item.source;
              fullUrl = item.source;
            } else if (item.data?.base64 && item.data.base64.startsWith('data:')) {
              thumbnailUrl = item.data.base64;
              fullUrl = item.data.base64;
            } else if (item.data?.url) {
              thumbnailUrl = item.data.url;
              fullUrl = item.data.url;
            } else {
              // Generate simple SVG placeholder
              const iconMap: Record<string, string> = {
                chart: '📊', table: '📋', graph: '📈', image: '🖼️', diagram: '📐'
              };
              const icon = iconMap[item.type] || '📄';
              const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" rx="8"/>
                <text x="100" y="80" font-family="Arial" font-size="24" text-anchor="middle" fill="#64748b">${icon}</text>
                <text x="100" y="110" font-family="Arial" font-size="12" text-anchor="middle" fill="#475569">${item.type.toUpperCase()}</text>
              </svg>`;
              thumbnailUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
              fullUrl = thumbnailUrl;
            }
            
            return {
              id: uniqueId,
              type: item.type as VisualElement['type'],
              content: item.data?.base64 || item.data?.url || 'No content available',
              description: item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} from ${item.metadata?.documentTitle || 'document'}`,
              thumbnailUrl,
              fullUrl,
              metadata: {
                documentTitle: item.metadata?.documentTitle || 'Unknown Document',
                documentId: item.documentId || '',
                pageNumber: item.metadata?.pageNumber,
                position: item.metadata?.boundingBox,
                extractedText: '', // Default to empty string since extractedText doesn't exist in metadata
                dataValues: item.data?.dataPoints
              },
              createdAt: item.metadata?.extractedAt || new Date().toISOString()
            }
          })
        }
        
        console.log('Processed visual elements:', elements)
        console.log(`📊 Visual elements summary: ${elements.length} total`)
        elements.forEach((el, i) => {
          console.log(`  ${i + 1}. ${el.type} - ${el.description}`)
          console.log(`     Has thumbnail: ${!!el.thumbnailUrl} (${el.thumbnailUrl?.length || 0} chars)`)
          console.log(`     Thumbnail preview: ${el.thumbnailUrl?.substring(0, 50)}...`)
        })
        
        setVisualElements(elements)
        setFilteredElements(elements)
      } catch (error) {
        console.error('Error loading visual content:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadVisualContent()
    }
  }, [isOpen])

  // Filter and search
  useEffect(() => {
    let filtered = visualElements

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(element => element.type === selectedType)
    }

    // Filter by document
    if (selectedDocument !== 'all') {
      filtered = filtered.filter(element => element.metadata.documentTitle === selectedDocument)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(element => 
        element.description.toLowerCase().includes(query) ||
        element.metadata.documentTitle.toLowerCase().includes(query) ||
        element.metadata.extractedText?.toLowerCase().includes(query) ||
        element.type.toLowerCase().includes(query)
      )
    }

    setFilteredElements(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [visualElements, selectedType, selectedDocument, searchQuery])

  // Get unique documents and types for filters
  const uniqueDocuments = [...new Set(visualElements.map(el => el.metadata.documentTitle))]
  const uniqueTypes = [...new Set(visualElements.map(el => el.type))]

  // Pagination
  const totalPages = Math.ceil(filteredElements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedElements = filteredElements.slice(startIndex, startIndex + itemsPerPage)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart':
      case 'graph':
        return BarChart3
      case 'table':
        return Table
      case 'image':
      case 'diagram':
      case 'infographic':
        return ImageIcon
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chart':
      case 'graph':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'table':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'image':
      case 'diagram':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'infographic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  const handleDownload = (element: VisualElement) => {
    // Create download link
    const blob = new Blob([element.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${element.type}_${element.metadata.documentTitle}_${element.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Visual Content Library
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredElements.length} visual elements from your documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visual content..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}s
                  </option>
                ))}
              </select>
            </div>

            {/* Document Filter */}
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px] max-w-[200px]"
            >
              <option value="all">All Documents</option>
              {uniqueDocuments.map(doc => (
                <option key={doc} value={doc}>
                  {doc.length > 20 ? doc.substring(0, 20) + '...' : doc}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                } hover:bg-opacity-80 transition-colors`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                } hover:bg-opacity-80 transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Loading visual content...</span>
            </div>
          ) : filteredElements.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">
                No visual content found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchQuery || selectedType !== 'all' || selectedDocument !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Upload documents with images, charts, or tables to see them here'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {paginatedElements.map((element) => {
                    const TypeIcon = getTypeIcon(element.type)
                    return (
                      <div
                        key={element.id}
                        className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => setSelectedElement(element)}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                          {element.thumbnailUrl ? (
                            <img
                              src={element.thumbnailUrl}
                              alt={element.description}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TypeIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(element.type)}`}>
                              {element.type}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                            {element.description}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {element.metadata.documentTitle}
                          </p>
                          {element.metadata.pageNumber && (
                            <p className="text-xs text-gray-400">
                              Page {element.metadata.pageNumber}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedElement(element)
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 
                                     transition-colors flex items-center justify-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(element)
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 
                                     transition-colors flex items-center justify-center"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {paginatedElements.map((element) => {
                    const TypeIcon = getTypeIcon(element.type)
                    return (
                      <div
                        key={element.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedElement(element)}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            {element.thumbnailUrl ? (
                              <img
                                src={element.thumbnailUrl}
                                alt={element.description}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <TypeIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {element.description}
                              </h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(element.type)}`}>
                                {element.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {element.metadata.documentTitle}
                              {element.metadata.pageNumber && ` • Page ${element.metadata.pageNumber}`}
                            </p>
                            {element.metadata.extractedText && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                                {element.metadata.extractedText}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedElement(element)
                              }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                       rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(element)
                              }}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 
                                       rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredElements.length)} of {filteredElements.length} items
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                               hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 
                               disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                               hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 
                               disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedElement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 md:p-4 overflow-auto">
          <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setSelectedElement(null)} />
          <div className="relative w-full max-w-6xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 md:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="min-w-0 flex-1 mr-2 md:mr-4">
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {selectedElement.description}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {selectedElement.metadata.documentTitle}
                  {selectedElement.metadata.pageNumber && ` • Page ${selectedElement.metadata.pageNumber}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
                {/* Visual Content */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 flex items-center justify-center min-h-[250px] md:min-h-[350px] lg:min-h-[450px]">
                  {selectedElement.fullUrl || selectedElement.thumbnailUrl ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                      <img
                        src={selectedElement.fullUrl || selectedElement.thumbnailUrl}
                        alt={selectedElement.description}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      {(() => {
                        const TypeIcon = getTypeIcon(selectedElement.type)
                        return <TypeIcon className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-gray-400 mx-auto mb-3 md:mb-4" />
                      })()}
                      <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No preview available</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 md:space-y-4 overflow-y-auto max-h-[450px]">
                  <div>
                    <h4 className="text-sm md:text-base font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Type:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedElement.type)}`}>
                          {selectedElement.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Document:</span>
                        <span className="text-gray-900 dark:text-white text-right break-words" title={selectedElement.metadata.documentTitle}>
                          {selectedElement.metadata.documentTitle}
                        </span>
                      </div>
                      {selectedElement.metadata.pageNumber && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Page:</span>
                          <span className="text-gray-900 dark:text-white">{selectedElement.metadata.pageNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Created:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(selectedElement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedElement.metadata.extractedText && (
                    <div>
                      <h4 className="text-sm md:text-base font-medium text-gray-900 dark:text-white mb-2">Extracted Text</h4>
                      <div className="p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs md:text-sm text-gray-700 dark:text-gray-300 max-h-32 md:max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700">
                        {selectedElement.metadata.extractedText}
                      </div>
                    </div>
                  )}

                  {selectedElement.content && (
                    <div>
                      <h4 className="text-sm md:text-base font-medium text-gray-900 dark:text-white mb-2">Content</h4>
                      <div className="p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs md:text-sm text-gray-700 dark:text-gray-300 max-h-48 md:max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <pre className="whitespace-pre-wrap font-mono text-[10px] md:text-xs leading-relaxed">{selectedElement.content}</pre>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleDownload(selectedElement)}
                      className="flex-1 px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                               transition-colors flex items-center justify-center text-xs md:text-sm font-medium"
                    >
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedElement(null)}
                      className="flex-1 px-3 md:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                               transition-colors text-xs md:text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
