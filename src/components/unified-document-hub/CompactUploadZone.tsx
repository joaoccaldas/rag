/**
 * Compact Upload Zone Component - Better space utilization
 */

"use client"

import React, { useState, useRef } from 'react'
import { Upload, Plus, Minimize2, FileText, Brain, Search } from 'lucide-react'
import { UploadZoneProps } from './types'
import { ProfessionalUploadProgress } from './ProfessionalUploadProgress'
import { useErrorHandler } from '@/contexts/ErrorContext'

export function CompactUploadZone({
  uploadState,
  onFilesAdded,
  onUploadCancel,
  maxFileSize,
  allowedTypes,
  className = ''
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addError } = useErrorHandler()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => validateFile(file))
    
    if (validFiles.length > 0) {
      onFilesAdded(validFiles)
      setIsExpanded(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => validateFile(file))
    
    if (validFiles.length > 0) {
      onFilesAdded(validFiles)
      setIsExpanded(true)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateFile = (file: File): boolean => {
    if (maxFileSize && file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
      addError({
        type: 'error',
        title: 'File Too Large',
        message: `"${file.name}" exceeds the maximum size of ${maxSizeMB}MB. Please select a smaller file.`,
        autoClose: true,
        duration: 5000
      })
      return false
    }
    
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      // Check both MIME types and extensions
      const isMimeTypeAllowed = allowedTypes.includes(file.type)
      const isExtensionAllowed = fileExtension && allowedTypes.includes(`.${fileExtension}`)
      
      if (!isMimeTypeAllowed && !isExtensionAllowed) {
        console.log(`File validation failed for "${file.name}":`, {
          fileName: file.name,
          fileType: file.type,
          extension: fileExtension,
          allowedTypes: allowedTypes,
          isMimeTypeAllowed,
          isExtensionAllowed
        })
        
        const supportedFormats = allowedTypes
          .filter(t => t.startsWith('.'))
          .map(t => t.toUpperCase())
          .join(', ')
        
        addError({
          type: 'error',
          title: 'Unsupported File Type',
          message: `".${fileExtension?.toUpperCase()}" files are not supported. Please upload one of: ${supportedFormats || 'PDF, DOCX, TXT'}`,
          autoClose: true,
          duration: 6000
        })
        return false
      }
    }
    
    return true
  }

  const hasActiveUploads = uploadState.uploadQueue.length > 0
  const shouldShowProgress = hasActiveUploads || isExpanded

  // Compact view when no uploads and not expanded
  if (!shouldShowProgress) {
    return (
      <div className={`mb-4 ${className}`}>
        <div
          className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center justify-center gap-3">
            <Upload className="h-6 w-6 text-gray-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Upload Documents
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag files here or click to browse
              </p>
            </div>
            <button
              type="button"
              className="ml-auto px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              Browse
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes?.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  // Expanded view with upload progress
  return (
    <div className={`mb-4 ${className}`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Progress
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            disabled={hasActiveUploads}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={hasActiveUploads ? "Cannot minimize during upload" : "Minimize"}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload Queue with Enhanced Progress */}
      <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
        {uploadState.uploadQueue.map((file, index) => {
          const progress = uploadState.uploadProgress[file.name]
          const stages = [
            {
              id: 'upload',
              name: 'File Upload',
              description: 'Uploading file to server...',
              progress: progress?.progress || 0,
              status: progress?.status === 'uploading' ? 'processing' as const : 
                     progress?.status === 'ready' ? 'completed' as const : 
                     progress?.error ? 'error' as const : 'pending' as const,
              icon: Upload
            },
            {
              id: 'processing',
              name: 'Document Processing',
              description: 'Extracting text and analyzing content...',
              progress: progress?.status === 'processing' ? progress.progress : 
                       progress?.status === 'ready' ? 100 : 0,
              status: progress?.status === 'processing' ? 'processing' as const : 
                     progress?.status === 'ready' ? 'completed' as const : 'pending' as const,
              icon: FileText
            },
            {
              id: 'indexing',
              name: 'Content Indexing',
              description: 'Creating searchable index...',
              progress: progress?.status === 'chunking' ? progress.progress : 
                       progress?.status === 'ready' ? 100 : 0,
              status: progress?.status === 'chunking' ? 'processing' as const : 
                     progress?.status === 'ready' ? 'completed' as const : 'pending' as const,
              icon: Search
            },
            {
              id: 'analysis',
              name: 'AI Analysis',
              description: 'Generating insights and summaries...',
              progress: progress?.status === 'embedding' ? progress.progress : 
                       progress?.status === 'ready' ? 100 : 0,
              status: progress?.status === 'embedding' ? 'processing' as const : 
                     progress?.status === 'ready' ? 'completed' as const : 'pending' as const,
              icon: Brain
            }
          ]

          return (
            <ProfessionalUploadProgress
              key={`${file.name}-${index}`}
              filename={file.name}
              fileSize={file.size}
              overallProgress={progress?.progress || 0}
              stages={stages}
              isCompact={true}
              onCancel={progress?.status === 'uploading' ? () => onUploadCancel(file.name) : undefined}
            />
          )
        })}
      </div>

      {/* Add More Files - Compact */}
      <div
        className={`border border-dashed rounded-lg p-3 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Add more files
          </span>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes?.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

// Export as both names for compatibility
export { CompactUploadZone as UploadZone }
