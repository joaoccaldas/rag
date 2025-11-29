'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw, Search, Bookmark, Share, FileText, Eye, Maximize, Minimize } from 'lucide-react'
import { useRAG } from '../rag/contexts/RAGContext'
import { Document } from '../rag/types'

interface DocumentPreviewModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
  initialZoom?: number
}

const DocumentPreviewModalComponent = ({ 
  documentId, 
  isOpen, 
  onClose,
  initialZoom = 1 
}: DocumentPreviewModalProps) => {
  const { documents } = useRAG()
  const [docData, setDocData] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(initialZoom)
  const [rotation, setRotation] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (isOpen && documentId) {
      const foundDoc = documents.find((doc: Document) => doc.id === documentId)
      setDocData(foundDoc || null)
      setLoading(false)
      
      // Reset state when opening new document
      setZoom(initialZoom)
      setRotation(0)
      setSearchTerm('')
      setCurrentPage(1)
    }
  }, [isOpen, documentId, documents, initialZoom])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleZoomIn()
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleZoomOut()
          }
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            window.document.getElementById('document-search')?.focus()
          }
          break
        case 'F11':
          e.preventDefault()
          setIsFullscreen(!isFullscreen)
          break
      }
    }

    if (isOpen) {
      window.document.addEventListener('keydown', handleKeyDown)
      return () => window.document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, isFullscreen, handleZoomIn, handleZoomOut])

  const handleDownload = useCallback(() => {
    if (docData?.content) {
      const blob = new Blob([docData.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = docData.name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [docData])

  const handleShare = useCallback(async () => {
    if (navigator.share && docData) {
      try {
        await navigator.share({
          title: docData.name,
          text: `Check out this document: ${docData.name}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Document link copied to clipboard!')
    }
  }, [docData])

  const toggleBookmark = useCallback((page: number) => {
    setBookmarks(prev => 
      prev.includes(page) 
        ? prev.filter(p => p !== page)
        : [...prev, page].sort((a, b) => a - b)
    )
  }, [])

  const highlightSearchTerm = useCallback((text: string, term: string) => {
    if (!term) return text
    
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>')
  }, [])

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 z-50 ${isFullscreen ? 'bg-black' : 'bg-black bg-opacity-75'}`}
      onClick={onClose}
    >
      <div className={`flex ${isFullscreen ? 'h-screen' : 'min-h-screen items-center justify-center p-4'}`}>
        <div 
          className={`relative bg-white dark:bg-gray-900 ${
            isFullscreen 
              ? 'w-full h-full' 
              : 'rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh]'
          } overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {docData?.name || 'Document Preview'}
                </h2>
                {docData && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Size: {docData.size ? Math.round(docData.size / 1024) : 0} KB</span>
                    <span>Type: {docData.type}</span>
                    <span>Pages: {totalPages}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 mx-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="document-search"
                  type="text"
                  placeholder="Search in document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(1)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Reset zoom (100%)"
              >
                <Eye className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom out (Ctrl+-)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom in (Ctrl++)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleRotate}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => toggleBookmark(currentPage)}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  bookmarks.includes(currentPage)
                    ? 'text-yellow-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Toggle bookmark"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share"
              >
                <Share className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isFullscreen ? "Exit fullscreen (F11)" : "Fullscreen (F11)"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
                </div>
              </div>
            ) : docData ? (
              <div 
                className="h-full overflow-auto p-8 flex justify-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center top'
                }}
              >
                <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 max-w-4xl w-full">
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: searchTerm 
                        ? highlightSearchTerm(docData.content || '', searchTerm)
                        : docData.content || 'No content available'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Document not found</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Page {currentPage} of {totalPages}</span>
                {bookmarks.length > 0 && (
                  <span>{bookmarks.length} bookmarks</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Use Ctrl+F to search, F11 for fullscreen, Esc to close
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

DocumentPreviewModalComponent.displayName = 'EnhancedDocumentPreviewModal'

export const EnhancedDocumentPreviewModal = memo(DocumentPreviewModalComponent)
