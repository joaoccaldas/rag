"use client"

import { useRef, useState } from 'react'
import { useRAG } from '../contexts/RAGContext'
import { Upload, FileText, File, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Document, UploadProgress as UploadProgressType } from '../types'
import { AIAnalysisDisplay } from '../../components/ai-analysis-display'
import { getSupportedMimeTypes, getSupportedExtensions } from '../components/document-types/document-types-config'

export function UploadProgress() {
  const { uploadDocument, uploadProgress, documents } = useRAG()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      if (isValidFile(file)) {
        uploadDocument(file)
      }
    })
  }

  const isValidFile = (file: File) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedMimeTypes = getSupportedMimeTypes()
    const allowedExtensions = getSupportedExtensions()

    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 100MB.`)
      return false
    }

    // Check both MIME type and extension
    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.type)
    const isExtensionAllowed = allowedExtensions.includes(fileExtension)

    if (!isMimeTypeAllowed && !isExtensionAllowed) {
      console.log(`File validation failed for "${file.name}":`, {
        fileName: file.name,
        fileType: file.type,
        extension: fileExtension,
        allowedMimeTypes: allowedMimeTypes.slice(0, 5), // Log first 5 for brevity
        allowedExtensions: allowedExtensions.slice(0, 5),
        isMimeTypeAllowed,
        isExtensionAllowed
      })
      alert(`File type ${file.type} (${fileExtension}) is not supported.`)
      return false
    }

    return true
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="w-5 h-5 text-green-500" />
      default:
        return <File className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadProgressList = Object.values(uploadProgress) as UploadProgressType[]
  const completedUploads = documents.filter((doc: Document) => 
    uploadProgressList.some((upload: UploadProgressType) => upload.documentId === doc.id)
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Upload Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Documents
        </h2>
        
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.docx,.pptx,.ppt,.md,.json,.csv,.xlsx,.html,.xml"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Support for PDF, TXT, DOCX, Markdown, JSON, CSV, XLSX, HTML, XML
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Maximum file size: 100MB</span>
              <span>•</span>
              <span>Multiple files supported</span>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Supported File Types
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: 'PDF', desc: 'PDF documents', icon: '📄' },
              { type: 'TXT', desc: 'Plain text files', icon: '📝' },
              { type: 'DOCX', desc: 'Word documents', icon: '📊' },
              { type: 'MD', desc: 'Markdown files', icon: '📋' },
              { type: 'JSON', desc: 'JSON data files', icon: '🔧' },
              { type: 'CSV', desc: 'CSV spreadsheets', icon: '📈' },
              { type: 'XLSX', desc: 'Excel files', icon: '📊' },
              { type: 'HTML', desc: 'Web pages', icon: '🌐' }
            ].map((format) => (
              <div
                key={format.type}
                className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <span className="text-lg">{format.icon}</span>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {format.type}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Progress List */}
      <div className="flex-1 overflow-auto p-6">
        {uploadProgressList.length === 0 && completedUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Upload className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
            <p className="text-sm text-center">
              Upload documents to start building your RAG knowledge base
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upload Status
            </h3>
            
            <div className="space-y-4">
              {/* Active Uploads */}
              {uploadProgressList.map((upload: UploadProgressType) => (
                <div
                  key={upload.documentId}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4">
                    {getFileIcon(upload.filename)}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {upload.filename}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                          {upload.progress}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {upload.status}
                      </span>
                    </div>
                  </div>
                  
                  {upload.error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {upload.error}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Completed Uploads */}
              {completedUploads.map((document: Document) => (
                <div
                  key={document.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {getFileIcon(document.name)}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {document.name}
                      </h4>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatFileSize(document.size)} • {document.chunks?.length || 0} chunks
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(document.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${
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
                  
                  {/* AI Analysis Results */}
                  {document.aiAnalysis && (
                    <AIAnalysisDisplay 
                      summary={{
                        summary: document.aiAnalysis.summary,
                        keywords: document.aiAnalysis.keywords,
                        tags: document.aiAnalysis.tags,
                        topics: document.aiAnalysis.topics,
                        sentiment: document.aiAnalysis.sentiment,
                        complexity: document.aiAnalysis.complexity,
                        documentType: document.aiAnalysis.documentType,
                        confidence: document.aiAnalysis.confidence
                      }}
                      fileName={document.name}
                      showDetails={true}
                      className="mt-4"
                    />
                  )}
                  
                  {/* Processing Status for AI Analysis */}
                  {document.status === 'processing' && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          Processing AI analysis...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {document.status === 'error' && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-300">
                          Processing failed. Please try uploading again.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
