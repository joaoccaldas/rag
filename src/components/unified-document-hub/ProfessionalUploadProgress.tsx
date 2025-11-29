/**
 * Professional Upload Progress Component with Detailed Steps
 * Shows each processing s        <div className="w-full bg-neutral-200 dark:bg-neutral-60        <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />ed-full h-2 mb-2">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />th individual progress and status
 */

"use client"

import React from 'react'
import { CheckCircle, AlertCircle, Loader2, Upload, FileText, Brain, Search } from 'lucide-react'

export interface UploadStage {
  id: string
  name: string
  description: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ProfessionalUploadProgressProps {
  filename: string
  fileSize: number
  overallProgress: number
  stages: UploadStage[]
  onCancel?: () => void
  isCompact?: boolean
}

export function ProfessionalUploadProgress({
  filename,
  fileSize,
  overallProgress,
  stages,
  onCancel,
  isCompact = false
}: ProfessionalUploadProgressProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStageIcon = (stage: UploadStage) => {
    const IconComponent = stage.icon
    
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <IconComponent className="h-5 w-5 text-neutral-400" />
    }
  }

  const isCompleted = overallProgress === 100
  const hasError = stages.some(stage => stage.status === 'error')

  if (isCompact) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-48">
                {filename}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(overallProgress)}%
            </span>
            {onCancel && !isCompleted && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              hasError ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Current Stage */}
        {!isCompleted && !hasError && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stages.find(s => s.status === 'processing')?.name || 'Processing...'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {filename}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(fileSize)} • Processing document
            </p>
          </div>
        </div>
        
        {onCancel && !isCompleted && (
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(overallProgress)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Processing Stages */}
      <div className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex-shrink-0">
              {getStageIcon(stage)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`text-sm font-medium ${
                  stage.status === 'processing'
                    ? 'text-blue-700 dark:text-blue-300'
                    : stage.status === 'completed'
                    ? 'text-green-700 dark:text-green-300'
                    : stage.status === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stage.name}
                </h4>
                
                {stage.status === 'processing' && (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round(stage.progress)}%
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {stage.description}
              </p>
              
              {/* Stage Progress Bar */}
              {stage.status === 'processing' && (
                <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Messages */}
      {isCompleted && (
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Document processed successfully! Ready for use.
            </span>
          </div>
        </div>
      )}

      {hasError && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Processing failed. Please try uploading again.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Default stages for document processing
export const createDefaultUploadStages = (): UploadStage[] => [
  {
    id: 'upload',
    name: 'File Upload',
    description: 'Uploading file to server',
    progress: 0,
    status: 'pending',
    icon: Upload
  },
  {
    id: 'parsing',
    name: 'Document Parsing',
    description: 'Extracting text and structure',
    progress: 0,
    status: 'pending',
    icon: FileText
  },
  {
    id: 'ai-analysis',
    name: 'AI Analysis',
    description: 'Generating summaries and insights',
    progress: 0,
    status: 'pending',
    icon: Brain
  },
  {
    id: 'indexing',
    name: 'Search Indexing',
    description: 'Making document searchable',
    progress: 0,
    status: 'pending',
    icon: Search
  }
]
