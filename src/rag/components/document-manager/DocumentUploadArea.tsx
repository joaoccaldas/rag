import React from 'react'
import { Upload, RefreshCw, FileText, Zap, Database, Check } from 'lucide-react'
import { DocumentUploadAreaProps } from './types'
import { Card } from '../../../design-system/components'

// Temporary simple spinner component
const Spinner = ({ size = "default", className = "" }: { size?: string, className?: string }) => (
  <RefreshCw className={`animate-spin ${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} ${className}`} />
)

// Progress stage indicators
const StageIndicator = ({ stage, currentStage, progress }: { 
  stage: string, 
  currentStage: string, 
  progress: number 
}) => {
  const isActive = stage === currentStage
  const isCompleted = ['upload', 'parse', 'chunk', 'embed'].indexOf(stage) < ['upload', 'parse', 'chunk', 'embed'].indexOf(currentStage)
  
  const stageIcons = {
    upload: Upload,
    parse: FileText,
    chunk: Zap,
    embed: Database,
    store: Check
  }
  
  const stageLabels = {
    upload: 'Upload',
    parse: 'Parse',
    chunk: 'Chunk',
    embed: 'Embed',
    store: 'Store'
  }
  
  const Icon = stageIcons[stage as keyof typeof stageIcons] || FileText
  
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isActive 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
      }`}>
        {isCompleted ? (
          <Check className="w-4 h-4" />
        ) : isActive ? (
          <Spinner className="text-white" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <span className={`text-xs ${isActive ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
        {stageLabels[stage as keyof typeof stageLabels]}
      </span>
      {isActive && (
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {progress}%
        </span>
      )}
    </div>
  )
}

export const DocumentUploadArea: React.FC<DocumentUploadAreaProps> = ({
  isUploading,
  uploadProgress,
  uploadDetails,
  isDragActive,
  getRootProps,
  getInputProps
}) => {
  return (
    <Card 
      {...getRootProps()}
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      <div className="p-4 text-center">
        {isUploading ? (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            
            {/* Display current upload details */}
            {uploadDetails && Object.values(uploadDetails).length > 0 ? (
              <div className="space-y-3">
                {Object.values(uploadDetails).map((upload) => (
                  <div key={upload.documentId} className="text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {upload.filename}
                      </span>
                      <span className="text-xs text-gray-500">
                        {upload.progress}%
                      </span>
                    </div>
                    
                    {/* Progress bar for this file */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    
                    {/* Processing stages */}
                    <div className="flex justify-between items-center">
                      {['upload', 'parse', 'chunk', 'embed', 'store'].map((stage) => (
                        <StageIndicator 
                          key={stage}
                          stage={stage}
                          currentStage={upload.stage || 'uploading'}
                          progress={upload.progress}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                      Status: {upload.status === 'uploading' ? 'Uploading' :
                               upload.status === 'processing' ? 'Processing' :
                               upload.status === 'chunking' ? 'Chunking' :
                               upload.status === 'embedding' ? 'Creating embeddings' :
                               upload.status === 'ready' ? 'Complete' : upload.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback simple progress */
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Processing documents... {uploadProgress}%
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            <Upload className="w-6 h-6 text-gray-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop files here' : 'Upload documents'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag & drop or click • PDF, TXT, MD, JSON, CSV, DOCX, images
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
