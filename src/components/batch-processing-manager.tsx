/**
 * Batch Processing Management Component
 * 
 * Provides UI for managing bulk operations on documents with
 * real-time progress tracking and error handling.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { BatchProcessor, BatchJob, BatchJobType, BatchJobProgress } from '../rag/utils/batch-processing'

interface BatchProcessingProps {
  onJobComplete?: (jobId: string, results: unknown[]) => void
  onJobError?: (jobId: string, error: string) => void
}

export const BatchProcessingManager: React.FC<BatchProcessingProps> = ({
  onJobComplete,
  onJobError
}) => {
  const [processor] = useState(() => new BatchProcessor())
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedJobType, setSelectedJobType] = useState<BatchJobType>('upload')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [jobProgress, setJobProgress] = useState<Map<string, BatchJobProgress>>(new Map())

  // Refresh jobs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs([...processor.getAllJobs()])
      
      // Update progress for active jobs
      processor.getActiveJobs().forEach(() => {
        // This would typically come from the processor's progress callback
        // For now, we'll simulate progress updates
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [processor])

  const jobTypes: Array<{ value: BatchJobType; label: string; description: string; icon: string }> = [
    {
      value: 'upload',
      label: 'Upload Documents',
      description: 'Process and upload multiple documents',
      icon: '📤'
    },
    {
      value: 'delete',
      label: 'Delete Documents',
      description: 'Remove multiple documents from the system',
      icon: '🗑️'
    },
    {
      value: 'update_metadata',
      label: 'Update Metadata',
      description: 'Bulk update document metadata',
      icon: '✏️'
    },
    {
      value: 'reprocess',
      label: 'Reprocess Documents',
      description: 'Re-analyze and re-index documents',
      icon: '🔄'
    },
    {
      value: 'compress',
      label: 'Compress Documents',
      description: 'Apply compression to reduce storage usage',
      icon: '🗜️'
    },
    {
      value: 'index',
      label: 'Index Documents',
      description: 'Build search indexes for documents',
      icon: '📇'
    },
    {
      value: 'analyze',
      label: 'Analyze Documents',
      description: 'Extract insights and metadata',
      icon: '🔍'
    },
    {
      value: 'backup',
      label: 'Backup Documents',
      description: 'Create backup copies of documents',
      icon: '💾'
    }
  ]

  const handleCreateJob = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to process')
      return
    }

    try {
      const jobId = await processor.createJob(selectedJobType, selectedFiles, {
        priority: 'normal',
        retryFailed: true,
        maxRetries: 3,
        onProgress: (progress) => {
          setJobProgress(prev => new Map(prev.set(progress.jobId, progress)))
        },
        onComplete: (results) => {
          onJobComplete?.(jobId, results)
        },
        onError: (error) => {
          onJobError?.(jobId, error.error)
        }
      })

      setShowCreateJob(false)
      setSelectedFiles([])
      console.log(`Created job: ${jobId}`)
    } catch (error) {
      console.error('Failed to create job:', error)
      alert('Failed to create batch job')
    }
  }

  const handlePauseJob = (jobId: string) => {
    processor.pauseJob(jobId)
    setJobs([...processor.getAllJobs()])
  }

  const handleResumeJob = (jobId: string) => {
    processor.resumeJob(jobId)
    setJobs([...processor.getAllJobs()])
  }

  const handleCancelJob = (jobId: string) => {
    processor.cancelJob(jobId)
    setJobs([...processor.getAllJobs()])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatTimeRemaining = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`
    } else {
      return `${seconds}s remaining`
    }
  }

  const statistics = processor.getStatistics()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Batch Processing
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage bulk operations on your documents
          </p>
        </div>
        <button
          onClick={() => setShowCreateJob(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Job
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {statistics.totalJobs}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.activeJobs}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {statistics.completedJobs}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {statistics.failedJobs}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {statistics.totalItemsProcessed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Items Processed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(statistics.averageProcessingTime / 1000)}s
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time</div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Jobs
          </h3>
        </div>
        
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No batch jobs yet. Create your first job to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((job) => {
              const progress = jobProgress.get(job.id)
              const jobTypeInfo = jobTypes.find(t => t.value === job.type)
              
              return (
                <div key={job.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{jobTypeInfo?.icon || '📋'}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {jobTypeInfo?.label || job.type}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {job.totalItems} items • Started {formatDuration(job.startTime)}
                          {job.endTime && ' ago'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      
                      {job.status === 'running' && (
                        <button
                          onClick={() => handlePauseJob(job.id)}
                          className="p-1 text-orange-600 hover:text-orange-700"
                          title="Pause Job"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        </button>
                      )}
                      
                      {job.status === 'paused' && (
                        <button
                          onClick={() => handleResumeJob(job.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Resume Job"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                      )}
                      
                      {['pending', 'running', 'paused'].includes(job.status) && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Cancel Job"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {job.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>{job.processedItems + job.failedItems} of {job.totalItems} items</span>
                        {progress && (
                          <span>{formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      {progress && (
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{Math.round(job.progress)}% complete</span>
                          <span>{progress.itemsPerSecond.toFixed(1)} items/sec</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Results Summary */}
                  {['completed', 'failed'].includes(job.status) && (
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-green-600 dark:text-green-400">
                        ✅ {job.processedItems} successful
                      </div>
                      <div className="text-red-600 dark:text-red-400">
                        ❌ {job.failedItems} failed
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        ⏱️ {job.endTime && formatDuration(job.startTime, job.endTime)}
                      </div>
                    </div>
                  )}
                  
                  {/* Error Summary */}
                  {job.errors.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                      <div className="text-red-800 dark:text-red-200 font-medium">
                        {job.errors.length} error{job.errors.length !== 1 ? 's' : ''}:
                      </div>
                      <div className="text-red-600 dark:text-red-400 mt-1">
                        {job.errors.slice(0, 3).map(error => error.error).join(', ')}
                        {job.errors.length > 3 && ` and ${job.errors.length - 3} more...`}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Batch Job
            </h4>
            
            {/* Job Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Type
              </label>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value as BatchJobType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {jobTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {jobTypes.find(t => t.value === selectedJobType)?.description}
              </p>
            </div>
            
            {/* File Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items to Process
              </label>
              <textarea
                value={selectedFiles.join('\n')}
                onChange={(e) => setSelectedFiles(e.target.value.split('\n').filter(f => f.trim()))}
                placeholder="Enter file IDs or names, one per line"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedFiles.length} items selected
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateJob(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchProcessingManager
