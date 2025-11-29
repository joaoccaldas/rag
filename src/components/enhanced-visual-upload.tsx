/**
 * Enhanced Visual Content Upload Component
 * 
 * Features:
 * 1. Real thumbnail generation and display
 * 2. Folder picker for external storage
 * 3. Progress indicators for processing
 * 4. Visual content preview gallery
 */

"use client"

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  Upload, 
  Folder, 
  Image as ImageIcon, 
  Eye, 
  Check, 
  AlertCircle, 
  Loader2,
  Download,
  Trash2
} from 'lucide-react'
import { enhancedMediaPicker, initializeFolderPicker } from '../rag/utils/enhanced-visual-processing'
import { VisualContent } from '../rag/types'

interface EnhancedVisualUploadProps {
  onFilesProcessed?: (files: VisualContent[]) => void
  onError?: (error: string) => void
  className?: string
}

interface ProcessedFile {
  file: File
  visualContent: VisualContent
  status: 'processing' | 'complete' | 'error'
  progress: number
  error?: string
}

export function EnhancedVisualUpload({ 
  onFilesProcessed, 
  onError, 
  className = '' 
}: EnhancedVisualUploadProps) {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle folder selection
  const handleFolderSelect = useCallback(async () => {
    try {
      const success = await initializeFolderPicker()
      if (success) {
        const config = enhancedMediaPicker.getConfig()
        setSelectedFolder(config.selectedFolder?.name || 'Selected')
      }
    } catch {
      onError?.('Failed to select folder')
    }
  }, [onError])

  // Process uploaded files
  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true)
    const fileArray = Array.from(files)
    const newProcessedFiles: ProcessedFile[] = []

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        if (!file) continue // Skip if file is undefined
        
        const documentId = `doc_${Date.now()}_${i}`

        // Initialize processing state
        const processedFile: ProcessedFile = {
          file,
          visualContent: {} as VisualContent,
          status: 'processing',
          progress: 0
        }
        newProcessedFiles.push(processedFile)
        setProcessedFiles(prev => [...prev, processedFile])

        try {
          // Update progress
          processedFile.progress = 30
          setProcessedFiles(prev => [...prev])

          // Process file with enhanced media picker
          const visualContent = await enhancedMediaPicker.processFile(file, documentId)
          
          // Update progress
          processedFile.progress = 70
          setProcessedFiles(prev => [...prev])

          // Complete processing
          processedFile.visualContent = visualContent
          processedFile.status = 'complete'
          processedFile.progress = 100
          setProcessedFiles(prev => [...prev])

        } catch (error) {
          processedFile.status = 'error'
          processedFile.error = error instanceof Error ? error.message : 'Processing failed'
          setProcessedFiles(prev => [...prev])
        }
      }

      // Call success callback with completed files
      const completedFiles = newProcessedFiles
        .filter(pf => pf.status === 'complete')
        .map(pf => pf.visualContent)
      
      if (completedFiles.length > 0) {
        onFilesProcessed?.(completedFiles)
      }

    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsProcessing(false)
    }
  }, [onFilesProcessed, onError])

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  // Remove processed file
  const removeFile = useCallback((index: number) => {
    setProcessedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Download processed file
  const downloadFile = useCallback((processedFile: ProcessedFile) => {
    if (processedFile.status === 'complete' && processedFile.visualContent.thumbnail) {
      const link = document.createElement('a')
      link.href = processedFile.visualContent.thumbnail
      link.download = `thumbnail_${processedFile.file.name.split('.')[0]}.jpg`
      link.click()
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Enhanced Visual Content Upload
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload files with real thumbnail generation and folder picker
          </p>
        </div>
        
        {/* Folder Picker Button */}
        <button
          onClick={handleFolderSelect}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            selectedFolder 
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>{selectedFolder ? `Folder: ${selectedFolder}` : 'Select Storage Folder'}</span>
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
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
          accept="image/*,.pdf,.txt,.md"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className={`w-12 h-12 ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dragActive ? 'Drop files here' : 'Upload documents with real thumbnails'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Supports images, PDFs, and text files
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Processing files with real thumbnail generation...
            </span>
          </div>
        </div>
      )}

      {/* Processed Files */}
      {processedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Processed Files ({processedFiles.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedFiles.map((processedFile, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                  {processedFile.status === 'complete' && processedFile.visualContent.thumbnail ? (
                    <Image
                      src={processedFile.visualContent.thumbnail}
                      alt={processedFile.file.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : processedFile.status === 'processing' ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {processedFile.status === 'complete' && (
                      <div className="bg-green-500 text-white p-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {processedFile.status === 'processing' && (
                      <div className="bg-blue-500 text-white p-1 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                    )}
                    {processedFile.status === 'error' && (
                      <div className="bg-red-500 text-white p-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {processedFile.file.name}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {(processedFile.file.size / 1024).toFixed(1)} KB
                  </p>
                  
                  {/* Progress Bar */}
                  {processedFile.status === 'processing' && (
                    <div className="mt-2">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${processedFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {processedFile.progress}% complete
                      </p>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {processedFile.status === 'error' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {processedFile.error}
                    </p>
                  )}
                  
                  {/* Success Info */}
                  {processedFile.status === 'complete' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Real thumbnail generated
                    </p>
                  )}
                </div>

                {/* Actions */}
                {processedFile.status === 'complete' && (
                  <div className="px-4 pb-4 flex space-x-2">
                    <button
                      onClick={() => {
                        // Open preview modal or expand view
                        console.log('Preview:', processedFile.visualContent)
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => downloadFile(processedFile)}
                      className="flex-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => removeFile(index)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
          <ImageIcon className="w-4 h-4 mr-2" />
          Enhanced Features
        </h5>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Real thumbnail generation from PDF first pages</li>
          <li>• Image resizing and optimization</li>
          <li>• Text file content previews</li>
          <li>• External folder storage with File System Access API</li>
          <li>• Progress tracking and error handling</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedVisualUpload
