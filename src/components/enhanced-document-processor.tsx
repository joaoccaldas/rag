/**
 * Enhanced Document Processing Integration
 * Integrates worker manager, error handling, and batch processing with              addDocument({
                id: result.id,
                name: file.name,
                type: result.metadata.type,
                content: result.chunks.map(c => c.content).join('\n'),
                chunks: result.chunks,
                metadata: {
                  ...result.metadata,
                  processingTime: result.metadata.processingTime
                },
                uploadedAt: new Date(),
                lastModified: new Date(),
                size: file.size,
                status: 'ready'
              })stem
 */

import React, { useState, useCallback, useEffect } from 'react'
import { batchProcessor, BatchJob, BatchJobStatus } from '../utils/batch-processing'
import { errorHandler, ErrorCategory, ErrorDetails } from '../utils/error-handling'
import { documentWorkerManager } from '../workers/worker-manager'
import { useRAG } from '../rag/contexts/RAGContext'
import { CheckCircle, XCircle, Clock, Pause, Play, Trash2, AlertCircle, Upload } from 'lucide-react'
import { Button } from '../design-system/components/button'
import { Card } from '../design-system/components/card'
import { Progress } from '../design-system/components/progress'
import { Badge } from '../design-system/components/badge'

interface EnhancedDocumentProcessorProps {
  onDocumentsProcessed?: (documentIds: string[]) => void
  onError?: (error: ErrorDetails) => void
}

export function EnhancedDocumentProcessor({ 
  onDocumentsProcessed, 
  onError 
}: EnhancedDocumentProcessorProps) {
  const [activeJobs, setActiveJobs] = useState<BatchJob[]>([])
  const [recentErrors, setRecentErrors] = useState<ErrorDetails[]>([])
  const [workerStats, setWorkerStats] = useState(documentWorkerManager.getStatus())
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processingOptions, setProcessingOptions] = useState<{
    enableOCR: boolean
    enableAI: boolean
    generateSummaries: boolean
    priority: 'low' | 'normal' | 'high'
  }>({
    enableOCR: false,
    enableAI: true,
    generateSummaries: true,
    priority: 'normal'
  })
  const [activeTab, setActiveTab] = useState<'jobs' | 'errors'>('jobs')

  const { addDocument } = useRAG()

  // Set up error handling
  useEffect(() => {
    const unsubscribe = errorHandler.onError(ErrorCategory.DOCUMENT_PROCESSING, (error) => {
      setRecentErrors(prev => [error, ...prev.slice(0, 9)]) // Keep last 10 errors
      onError?.(error)
    })

    return unsubscribe
  }, [onError])

  // Update worker stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkerStats(documentWorkerManager.getStatus())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      const supportedTypes = ['pdf', 'docx', 'txt', 'md', 'html', 'rtf']
      const extension = file.name.split('.').pop()?.toLowerCase()
      
      return file.size <= maxSize && extension && supportedTypes.includes(extension)
    })

    if (validFiles.length !== fileArray.length) {
      const invalidCount = fileArray.length - validFiles.length
      errorHandler.handleError(
        new Error(`${invalidCount} files were skipped due to size or format restrictions`),
        { invalidFileCount: invalidCount, totalFiles: fileArray.length }
      )
    }

    setSelectedFiles(validFiles)
  }, [])

  // Submit batch processing job
  const handleSubmitBatch = useCallback(async () => {
    if (!selectedFiles.length) return

    try {
      const jobId = await batchProcessor.submitBatch(selectedFiles, {
        enableOCR: processingOptions.enableOCR,
        enableAI: processingOptions.enableAI,
        generateSummaries: processingOptions.generateSummaries,
        priority: processingOptions.priority,
        maxConcurrentJobs: 2,
        retryAttempts: 3
      })

      // Track job progress
      const unsubscribe = batchProcessor.onJobUpdate(jobId, (job) => {
        setActiveJobs(prev => {
          const existing = prev.findIndex(j => j.id === job.id)
          if (existing !== -1) {
            const updated = [...prev]
            updated[existing] = job
            return updated
          }
          return [...prev, job]
        })

        // Handle completion
        if (job.status === BatchJobStatus.COMPLETED) {
          const successfulResults = job.results.filter(r => r.success)
          const documentIds = successfulResults.map(r => r.fileId)
          
          // Add documents to store
          successfulResults.forEach(result => {
            if (result.chunks && result.metadata) {
              addDocument({
                id: result.fileId,
                name: result.metadata.title || 'Unknown',
                type: result.metadata.type,
                content: result.chunks.map(c => c.content).join('\n'),
                chunks: result.chunks,
                metadata: {
                  ...result.metadata
                },
                uploadedAt: new Date(),
                lastModified: new Date(),
                size: 0, // Will be set by the system
                status: 'ready'
              })
            }
          })

          onDocumentsProcessed?.(documentIds)
          unsubscribe()
        }
      })

      setSelectedFiles([])
      console.log(`✅ Submitted batch job ${jobId}`)

    } catch (error) {
      await errorHandler.handleError(error, {
        fileCount: selectedFiles.length,
        options: processingOptions
      })
    }
  }, [selectedFiles, processingOptions, addDocument, onDocumentsProcessed])

  // Job control functions
  const pauseJob = useCallback(async (jobId: string) => {
    await batchProcessor.pauseJob(jobId)
  }, [])

  const resumeJob = useCallback(async (jobId: string) => {
    await batchProcessor.resumeJob(jobId)
  }, [])

  const cancelJob = useCallback(async (jobId: string) => {
    await batchProcessor.cancelJob(jobId)
    setActiveJobs(prev => prev.filter(job => job.id !== jobId))
  }, [])

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    batchProcessor.clearCompletedJobs()
    setActiveJobs(prev => prev.filter(job => 
      job.status !== BatchJobStatus.COMPLETED && 
      job.status !== BatchJobStatus.FAILED
    ))
  }, [])

  // Render job status badge
  const getStatusBadge = (status: BatchJobStatus) => {
    const statusConfig = {
      [BatchJobStatus.QUEUED]: { color: 'gray', icon: Clock },
      [BatchJobStatus.PROCESSING]: { color: 'blue', icon: Play },
      [BatchJobStatus.COMPLETED]: { color: 'green', icon: CheckCircle },
      [BatchJobStatus.FAILED]: { color: 'red', icon: XCircle },
      [BatchJobStatus.CANCELLED]: { color: 'gray', icon: XCircle },
      [BatchJobStatus.PAUSED]: { color: 'yellow', icon: Pause }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant="outline" className="flex items-center gap-1" style={{ 
        backgroundColor: config.color === 'blue' ? '#dbeafe' : 
                        config.color === 'green' ? '#dcfce7' :
                        config.color === 'red' ? '#fee2e2' :
                        config.color === 'yellow' ? '#fef3c7' : '#f3f4f6',
        color: config.color === 'blue' ? '#1d4ed8' : 
               config.color === 'green' ? '#16a34a' :
               config.color === 'red' ? '#dc2626' :
               config.color === 'yellow' ? '#d97706' : '#6b7280'
      }}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload & Processing
          </h3>
          
          {/* File Selection */}
          <div>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.ppt,.txt,.md,.html,.rtf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedFiles.length} files selected ({Math.round(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024)}MB total)
              </div>
            )}
          </div>

          {/* Processing Options */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={processingOptions.enableOCR}
                onChange={(e) => setProcessingOptions(prev => ({ ...prev, enableOCR: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Enable OCR for scanned documents</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={processingOptions.enableAI}
                onChange={(e) => setProcessingOptions(prev => ({ ...prev, enableAI: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Enable AI enhancements</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <select
              value={processingOptions.priority}
              onChange={(e) => setProcessingOptions(prev => ({ 
                ...prev, 
                priority: e.target.value as 'low' | 'normal' | 'high'
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>

            <Button 
              onClick={handleSubmitBatch}
              disabled={selectedFiles.length === 0}
              className="px-6"
            >
              Process Documents ({selectedFiles.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Worker Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{workerStats.totalWorkers}</div>
            <div className="text-sm text-gray-500">Total Workers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{workerStats.busyWorkers}</div>
            <div className="text-sm text-gray-500">Active Workers</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-600">{workerStats.idleWorkers}</div>
            <div className="text-sm text-gray-500">Idle Workers</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{workerStats.pendingRequests}</div>
            <div className="text-sm text-gray-500">Pending Requests</div>
          </div>
        </div>
      </Card>

      {/* Jobs and Errors Tabs */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Jobs ({activeJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'errors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Recent Errors ({recentErrors.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'jobs' ? (
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No active jobs</div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={clearCompletedJobs}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Completed
                    </Button>
                  </div>
                  
                  {activeJobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(job.status)}
                          <span className="font-medium">{job.files.length} files</span>
                          <span className="text-sm text-gray-500">
                            {job.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {job.status === BatchJobStatus.PROCESSING && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseJob(job.id)}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {job.status === BatchJobStatus.PAUSED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resumeJob(job.id)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelJob(job.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {job.status === BatchJobStatus.PROCESSING && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress: {job.progress.processedFiles + job.progress.failedFiles}/{job.progress.totalFiles}</span>
                            <span>{job.progress.overallProgress}%</span>
                          </div>
                          <Progress value={job.progress.overallProgress} className="w-full" />
                          {job.progress.currentFile && (
                            <div className="text-sm text-gray-500">
                              Processing: {job.progress.currentFile}
                            </div>
                          )}
                          {job.progress.estimatedTimeRemaining && (
                            <div className="text-sm text-gray-500">
                              Est. time remaining: {Math.round(job.progress.estimatedTimeRemaining / 1000)}s
                            </div>
                          )}
                        </div>
                      )}

                      {job.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center text-red-800">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {job.errors.length} files failed to process
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentErrors.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent errors</div>
              ) : (
                recentErrors.map(error => (
                  <div key={error.id} className={`border rounded-lg p-3 ${
                    error.severity === 'HIGH' || error.severity === 'CRITICAL' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={`h-4 w-4 mt-0.5 ${
                        error.severity === 'HIGH' || error.severity === 'CRITICAL' 
                          ? 'text-red-500' 
                          : 'text-yellow-500'
                      }`} />
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{error.userMessage}</div>
                        <div className="text-sm text-gray-600">
                          {error.category} • {error.timestamp.toLocaleTimeString()}
                        </div>
                        {error.recoveryActions && error.recoveryActions.length > 0 && (
                          <div className="flex space-x-2 mt-2">
                            {error.recoveryActions
                              .filter(action => action.type === 'suggestion')
                              .map((action, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => action.action()}
                                >
                                  {action.label}
                                </Button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default EnhancedDocumentProcessor
