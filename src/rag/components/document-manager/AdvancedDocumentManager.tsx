import React, { useState, useCallback, useMemo, useRef } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useDropzone } from 'react-dropzone'
import { Grid3X3, List as ListIcon, FileText } from 'lucide-react'

import { useDocumentManagement } from '../../contexts/DocumentManagementContext'
import { useUploadProcessing } from '../../contexts/UploadProcessingContext'
import { Document } from '../../types'
import { FileStorageManager } from '../../utils/file-storage'
import { Button, Card } from '../../../design-system/components'
import DocumentPreviewModal from '../../../components/document-preview-modal'

import { DocumentManagerState } from './types'
import { DocumentCard } from './DocumentCard'
import { DocumentListItem } from './DocumentListItem'
import { DocumentUploadArea } from './DocumentUploadArea'
import { DocumentFilters } from './DocumentFilters'
import { DocumentBulkActions } from './DocumentBulkActions'

interface DocumentItemProps {
  index: number
  style: React.CSSProperties
  data: {
    documents: Document[]
    selectedDocuments: Set<string>
    viewMode: 'grid' | 'list'
    itemsPerRow: number
    onToggleSelect: (id: string) => void
    onPreview: (document: Document) => void
    onDownload: (document: Document) => void
    onDelete: (document: Document) => void
    onOpenOriginal: (document: Document) => void
  }
}

// Virtual list item component
const DocumentItem: React.FC<DocumentItemProps> = ({ index, style, data }) => {
  const { 
    documents, 
    selectedDocuments, 
    viewMode, 
    itemsPerRow,
    onToggleSelect, 
    onPreview, 
    onDownload, 
    onDelete,
    onOpenOriginal
  } = data
  
  if (viewMode === 'grid') {
    // For grid view, render multiple documents per row
    const startIndex = index * itemsPerRow
    const endIndex = Math.min(startIndex + itemsPerRow, documents.length)
    const rowDocuments = documents.slice(startIndex, endIndex)
    
    return (
      <div style={style} className="py-6 px-3">
        <div className="grid grid-cols-4 gap-8">
          {rowDocuments.map((document) => {
            const isSelected = selectedDocuments.has(document.id)
            return (
              <DocumentCard
                key={document.id}
                document={document}
                isSelected={isSelected}
                onToggleSelect={onToggleSelect}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
                onOpenOriginal={onOpenOriginal}
              />
            )
          })}
        </div>
      </div>
    )
  }
  
  // For list view, render single document
  const document = documents[index]
  if (!document) return null
  const isSelected = selectedDocuments.has(document.id)
  
  return (
    <div style={style} className="p-1">
      <DocumentListItem
        document={document}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onOpenOriginal={onOpenOriginal}
      />
    </div>
  )
}

export const AdvancedDocumentManager: React.FC = () => {
  const { documents, deleteDocument, addDocument, refreshDocuments } = useDocumentManagement()
  const { processDocument, uploadProgress: contextUploadProgress } = useUploadProcessing()
  const [state, setState] = useState<DocumentManagerState>({
    searchTerm: '',
    selectedFileTypes: [],
    selectedStatuses: [],
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
    viewMode: 'grid',
    showFilters: false,
    selectedDocuments: new Set(),
    showBulkActions: false
  })
  
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const listRef = useRef<List>(null)

  // Calculate overall upload progress from context
  const isUploading = Object.keys(contextUploadProgress).length > 0
  const uploadProgress = useMemo(() => {
    const uploads = Object.values(contextUploadProgress)
    if (uploads.length === 0) return 0
    
    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0)
    return Math.round(totalProgress / uploads.length)
  }, [contextUploadProgress])

  // Drag and drop functionality with real upload processing
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      console.log(`📁 Processing ${acceptedFiles.length} files for upload`)
      
      // Process each file through the proper upload pipeline
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        
        console.log(`🔄 Processing file ${i + 1}/${acceptedFiles.length}: ${file.name}`)
        
        // Process document and add to state when ready
        await processDocument(file, (document) => {
          console.log(`✅ Document processed and ready: ${document.name}`)
          addDocument(document)
        })
      }
      
      // Refresh document list to ensure UI is up to date
      console.log('🔄 Refreshing document list after upload completion')
      await refreshDocuments()
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
    }
  }, [processDocument, addDocument, refreshDocuments])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true
  })

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      // Search filter
      const matchesSearch = state.searchTerm === '' || 
        doc.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        doc.content?.toLowerCase().includes(state.searchTerm.toLowerCase())

      // File type filter
      const matchesFileType = state.selectedFileTypes.length === 0 ||
        state.selectedFileTypes.some(type => doc.type.includes(type))

      // Status filter
      const matchesStatus = state.selectedStatuses.length === 0 ||
        state.selectedStatuses.includes(doc.status)

      return matchesSearch && matchesFileType && matchesStatus
    })

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'uploadedAt':
          aValue = a.uploadedAt.getTime()
          bValue = b.uploadedAt.getTime()
          break
        case 'size':
          aValue = a.size
          bValue = b.size
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }

      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [documents, state.searchTerm, state.selectedFileTypes, state.selectedStatuses, state.sortBy, state.sortOrder])

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedDocuments)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return {
        ...prev,
        selectedDocuments: newSelected,
        showBulkActions: newSelected.size > 0
      }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedDocuments: new Set(filteredAndSortedDocuments.map(doc => doc.id)),
      showBulkActions: filteredAndSortedDocuments.length > 0
    }))
  }, [filteredAndSortedDocuments])

  const handleClearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedDocuments: new Set(),
      showBulkActions: false
    }))
  }, [])

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (state.selectedDocuments.size === 0) return
    
    if (confirm(`Delete ${state.selectedDocuments.size} selected documents?`)) {
      for (const id of state.selectedDocuments) {
        await deleteDocument(id)
      }
      handleClearSelection()
    }
  }, [state.selectedDocuments, deleteDocument, handleClearSelection])

  // Document actions
  const handlePreview = useCallback((document: Document) => {
    setPreviewDocument(document)
  }, [])

  const handleDownload = useCallback((doc: Document) => {
    // Create download link
    const blob = new Blob([doc.content || ''], { type: doc.type })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const handleDelete = useCallback(async (document: Document) => {
    if (confirm(`Delete "${document.name}"?`)) {
      await deleteDocument(document.id)
    }
  }, [deleteDocument])

  const handleOpenOriginal = useCallback(async (document: Document) => {
    const originalFileId = document.metadata?.originalFileId
    if (originalFileId) {
      const fileStorage = new FileStorageManager()
      await fileStorage.openOriginalFile(originalFileId)
    } else {
      console.warn('No original file ID found for document:', document.name)
    }
  }, [])

  // File type and status options for filters
  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'txt', label: 'Text' },
    { value: 'docx', label: 'Word' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'md', label: 'Markdown' },
    { value: 'image', label: 'Images' }
  ]

  const statusOptions = [
    { value: 'uploading', label: 'Uploading' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready', label: 'Ready' },
    { value: 'error', label: 'Error' }
  ]

  // Virtual list settings
  const itemSize = state.viewMode === 'grid' ? 460 : 80
  const itemsPerRow = state.viewMode === 'grid' ? 4 : 1
  const itemData = { 
    documents: filteredAndSortedDocuments, 
    itemsPerRow,
    viewMode: state.viewMode,
    selectedDocuments: state.selectedDocuments,
    onToggleSelect: handleToggleSelect,
    onPreview: handlePreview,
    onDownload: handleDownload,
    onDelete: handleDelete,
    onOpenOriginal: handleOpenOriginal
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Document Management
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={state.viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <DocumentFilters
          state={state}
          setState={setState}
          fileTypeOptions={fileTypeOptions}
          statusOptions={statusOptions}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
        {/* Compact upload area */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <DocumentUploadArea
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadDetails={contextUploadProgress}
            isDragActive={isDragActive}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />
        </div>

        {/* Bulk actions */}
        <div className="p-4 md:p-6 pt-4">
          <DocumentBulkActions
            selectedCount={state.selectedDocuments.size}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkDelete={handleBulkDelete}
          />

          {/* Document list info */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedDocuments.length} document{filteredAndSortedDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Document list with virtual scrolling */}
          {filteredAndSortedDocuments.length > 0 ? (
            <div className="min-h-[400px] max-h-[calc(100vh-400px)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <List
                ref={listRef}
                height={Math.min(600, Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 400 : 600))}
                itemCount={Math.ceil(filteredAndSortedDocuments.length / itemsPerRow)}
                itemSize={itemSize}
                itemData={itemData}
                width="100%"
                className="p-2"
              >
                {DocumentItem}
              </List>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {state.searchTerm || state.selectedFileTypes.length > 0 || state.selectedStatuses.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first document to get started'
                }
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Document preview modal */}
      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument.id}
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  )
}
