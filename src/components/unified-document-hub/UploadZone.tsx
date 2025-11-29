/**
 * Upload Zone Component - Handles file upload with drag-and-drop
 */

"use client"

import React, { useState, useRef } from 'react'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { UploadZoneProps } from './types'

export function UploadZone({
  uploadState,
  onFilesAdded,
  onUploadCancel,
  maxFileSize,
  allowedTypes,
  className = ''
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => validateFile(file))
    
    if (validFiles.length > 0) {
      onFilesAdded(validFiles)
    }
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      alert(`File "${file.name}" is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB.`)
      return false
    }

    // Check file type - support both MIME types and extensions
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
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
      alert(`File type "${file.type}" (.${fileExtension}) is not supported.`)
      return false
    }

    return true
  }

  return (
    <div className={`upload-zone p-6 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Upload Documents
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Supported: PDF, TXT, DOCX, MD, JSON, CSV • Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file
        </p>
      </div>

      {/* Upload Progress */}
      {(uploadState.isUploading || Object.keys(uploadState.uploadProgress).length > 0) && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Upload Progress
          </h4>
          
          <div className="space-y-3">
            {Object.entries(uploadState.uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {progress.filename || 'Unknown file'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {progress.status === 'ready' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {progress.error && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => onUploadCancel(fileId)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.error 
                        ? 'bg-red-500' 
                        : progress.status === 'ready'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(progress.progress || 0, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{progress.status}</span>
                  <span>{Math.round(progress.progress || 0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {uploadState.recentUploads.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Recently Uploaded
          </h4>
          <div className="flex flex-wrap gap-2">
            {uploadState.recentUploads.slice(0, 5).map((documentId) => (
              <span
                key={documentId}
                className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Document uploaded
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
