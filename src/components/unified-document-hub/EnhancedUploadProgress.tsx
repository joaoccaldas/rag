/**
 * Enhanced Upload Progress Component with Multi-Stage Processing
 */

import React from 'react'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

export interface UploadStage {
  id: string
  name: string
  description: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export interface EnhancedUploadProgressProps {
  fileName: string
  fileSize: number
  stages: UploadStage[]
  overallProgress: number
  onCancel?: () => void
  onClose?: () => void
}

export function EnhancedUploadProgress({
  fileName,
  fileSize,
  stages,
  overallProgress,
  onCancel,
  onClose
}: EnhancedUploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return i >= 2 ? `${size.toFixed(2)} ${sizes[i]}` : `${Math.round(size)} ${sizes[i]}`
  }

  const getStageIcon = (stage: UploadStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const isCompleted = overallProgress === 100
  const hasError = stages.some(stage => stage.status === 'error')

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(fileSize)} • Processing document
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4">
          {!isCompleted && !hasError && onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          )}
          {(isCompleted || hasError) && onClose && (
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              hasError
                ? 'bg-red-500'
                : isCompleted
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Processing Stages */}
      <div className="space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              stage.status === 'processing'
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : stage.status === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : stage.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Stage Icon */}
            <div className="flex-shrink-0">
              {getStageIcon(stage)}
            </div>

            {/* Stage Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {stage.name}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(stage.progress)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stage.description}
              </p>
              
              {/* Stage Progress Bar */}
              {stage.status === 'processing' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div
                      className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Message */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Document processed successfully!
            </span>
          </div>
        </div>
      )}

      {hasError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Processing failed. Please try again.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
