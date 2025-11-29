/**
 * Enhanced File Upload Component with Folder Picker and Real Thumbnails
 * 
 * This component provides:
 * 1. Folder picker UI for selecting storage location
 * 2. Real document thumbnails/screenshots
 * 3. Enhanced file preview with proper formatting
 * 4. Integration with existing RAG system
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../design-system/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../design-system/components/card'
import { enhancedFileStorage, EnhancedStoredFile } from '../../../storage/managers/enhanced-file-storage'
import { DocumentUploadService } from '../../../rag/services/document-upload'
import { useErrorHandler } from '../../../contexts/ErrorContext'

interface EnhancedFileUploadProps {
  onFileUploaded?: (file: EnhancedStoredFile) => void
  className?: string
}

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFileUploaded,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [storedFiles, setStoredFiles] = useState<EnhancedStoredFile[]>([])
  const [storageType, setStorageType] = useState<'browser' | 'local-folder'>('browser')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  
  const { addError } = useErrorHandler()
  
  // Helper functions for notifications
  const showError = useCallback((title: string, message: string) => {
    addError({ type: 'error', title, message })
  }, [addError])
  
  const showSuccess = useCallback((title: string, message: string) => {
    addError({ type: 'success', title, message })
  }, [addError])

  const loadStoredFiles = useCallback(() => {
    const files = enhancedFileStorage.getAllStoredFiles()
    setStoredFiles(files)
  }, [])

  const checkStorageSettings = useCallback(async () => {
    // Check if user has previously selected a folder
    const config = localStorage.getItem('media-picker-config')
    if (config) {
      try {
        const parsed = JSON.parse(config)
        setStorageType(parsed.storageType || 'browser')
        if (parsed.storageType === 'local-folder') {
          setSelectedFolder('Folder selected')
        }
      } catch (error) {
        console.error('Error loading storage config:', error)
      }
    }
  }, [])

  // Load existing files on mount
  useEffect(() => {
    loadStoredFiles()
    checkStorageSettings()
  }, [loadStoredFiles, checkStorageSettings])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      showError('No files selected', 'Please select files to upload')
      return
    }

    setIsUploading(true)

    try {
      const documentUploadService = DocumentUploadService.getInstance()

      for (const file of selectedFiles) {
        // Generate document ID
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Store file with enhanced storage (real thumbnails + folder picker)
        const storedFile = await enhancedFileStorage.storeFileWithRealThumbnail(file, documentId)
        
        // Process with RAG system using the existing service
        await documentUploadService.processDocument(file, {
          generateAISummary: true,
          extractKeywords: true,
          autoStore: true
        })

        // Notify parent component
        onFileUploaded?.(storedFile)
        
        showSuccess(
          'File uploaded successfully',
          `${file.name} has been processed and stored${storedFile.localPath ? ' in your selected folder' : ' in browser storage'}`
        )
      }

      // Refresh file list
      loadStoredFiles()
      setSelectedFiles([])
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error) {
      console.error('Upload failed:', error)
      showError(
        'Upload failed',
        error instanceof Error ? error.message : 'An error occurred during upload'
      )
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, onFileUploaded, loadStoredFiles, showError, showSuccess])

  const handleFolderSelect = useCallback(async () => {
    try {
      const success = await enhancedFileStorage.selectStorageFolder()
      if (success) {
        setStorageType('local-folder')
        setSelectedFolder('Folder selected')
        showSuccess(
          'Storage folder selected',
          'Files will now be stored in your selected folder with real thumbnails'
        )
      }
    } catch (error) {
      console.error('Folder selection failed:', error)
      showError(
        'Folder selection failed',
        'Could not select storage folder. Using browser storage instead.'
      )
    }
  }, [showSuccess, showError])

  const downloadFile = useCallback(async (file: EnhancedStoredFile) => {
    try {
      const content = await enhancedFileStorage.getFileContent(file.id)
      if (content) {
        const url = URL.createObjectURL(content.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = content.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed:', error)
      showError('Download failed', 'Could not download file')
    }
  }, [showError])

  const viewFile = useCallback(async (file: EnhancedStoredFile) => {
    try {
      const content = await enhancedFileStorage.getFileContent(file.id)
      if (content) {
        const url = URL.createObjectURL(content.blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (error) {
      console.error('View failed:', error)
      showError('View failed', 'Could not open file')
    }
  }, [showError])

  const renderFilePreview = useCallback((file: EnhancedStoredFile) => (
    <Card key={file.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Real Thumbnail */}
          <div className="flex-shrink-0">
            {file.thumbnail ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.thumbnail}
                  alt={`Preview of ${file.originalName}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                {file.hasRealThumbnail && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full text-[10px]">
                    📸
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {file.originalName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                file.localPath 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {file.localPath ? '📁 Local Folder' : '🌐 Browser Storage'}
              </span>
              {file.hasRealThumbnail && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  📸 Real Preview
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadFile(file)}
              className="text-xs"
            >
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewFile(file)}
              className="text-xs"
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [downloadFile, viewFile])

  return (
    <div className={`enhanced-file-upload ${className}`}>
      {/* Storage Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📁</span>
            <span>File Storage Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="storage-type"
                value="browser"
                checked={storageType === 'browser'}
                onChange={(e) => setStorageType(e.target.value as 'browser')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">🌐 Browser Storage</div>
                <div className="text-xs text-gray-500">Files stored in your browser (limited space)</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="storage-type"
                value="local-folder"
                checked={storageType === 'local-folder'}
                onChange={(e) => setStorageType(e.target.value as 'local-folder')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">📁 Local Folder</div>
                <div className="text-xs text-gray-500">Choose a folder on your computer</div>
              </div>
            </label>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleFolderSelect}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>📁</span>
              <span>Select Storage Folder</span>
            </Button>
            
            {selectedFolder && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-md border border-green-200">
                <span>✅</span>
                <span className="text-sm">Files will be stored in your selected folder</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📤</span>
            <span>Upload Files with Real Thumbnails</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.txt,.md,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="text-4xl">📎</div>
              <div className="text-sm font-medium">Click to select files</div>
              <div className="text-xs text-gray-500">
                Supports: PDF, Text, Images, Word documents
              </div>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Selected Files ({selectedFiles.length}):</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing Files...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>📤</span>
                <span>Upload & Process Files</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stored Files with Real Thumbnails */}
      {storedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>📋</span>
                <span>Stored Files ({storedFiles.length})</span>
              </div>
              <Button
                onClick={loadStoredFiles}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storedFiles.map(renderFilePreview)}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          📸 Enhanced File Storage Features:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>✅ <strong>Real Thumbnails:</strong> Actual document previews and image thumbnails</li>
          <li>✅ <strong>Folder Picker:</strong> Choose where to store your files on your computer</li>
          <li>✅ <strong>Smart Storage:</strong> Automatic fallback to browser storage when needed</li>
          <li>✅ <strong>File Management:</strong> Download, view, and organize your documents</li>
          <li>✅ <strong>RAG Integration:</strong> Seamless search and retrieval from stored files</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedFileUpload
