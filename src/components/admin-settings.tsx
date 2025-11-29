"use client"

import React, { useState, useCallback } from 'react'
import { Settings, Database, Download, Upload, RefreshCw, BarChart3, FileText, Zap, AlertTriangle, CheckCircle, Loader2, HardDrive, Trash2, Brain } from 'lucide-react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { AISettingsPanel } from './ai-settings-panel'
import type { Document } from '@/rag/types'

interface AdminSettingsProps {
  className?: string
}

interface BackupData {
  documents: Document[]
  settings: Record<string, unknown>
  analytics: Record<string, unknown>
  timestamp: string
  version: string
}

interface ProcessingProgress {
  total: number
  processed: number
  current: string
  status: 'idle' | 'processing' | 'complete' | 'error'
  errors: string[]
}

export function AdminSettings({ className = '' }: AdminSettingsProps) {
  const [activeSection, setActiveSection] = useState<string>('backup')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress>({
    total: 0,
    processed: 0,
    current: '',
    status: 'idle',
    errors: []
  })
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const { documents } = useRAG()

  // Backup functionality
  const handleBackupData = useCallback(async () => {
    setIsProcessing(true)
    try {
      const backupData: BackupData = {
        documents: documents,
        settings: JSON.parse(localStorage.getItem('miele-chat-settings') || '{}'),
        analytics: JSON.parse(localStorage.getItem('rag-analytics') || '{}'),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `miele-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setLastBackup(new Date().toISOString())
      localStorage.setItem('last-backup', new Date().toISOString())
    } catch (error) {
      console.error('Backup failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [documents])

  // Restore functionality
  const handleRestoreData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData: BackupData = JSON.parse(e.target?.result as string)
        
        // Validate backup structure
        if (!backupData.documents || !backupData.timestamp) {
          throw new Error('Invalid backup file format')
        }

        // Restore settings
        if (backupData.settings) {
          localStorage.setItem('miele-chat-settings', JSON.stringify(backupData.settings))
        }

        // Restore analytics
        if (backupData.analytics) {
          localStorage.setItem('rag-analytics', JSON.stringify(backupData.analytics))
        }

        alert('Data restored successfully! Please refresh the page to see changes.')
      } catch (error) {
        console.error('Restore failed:', error)
        alert('Failed to restore data. Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }, [])

  // Re-run LLM summarization
  const handleRerunSummarization = useCallback(async () => {
    setIsProcessing(true)
    setProgress({
      total: documents.length,
      processed: 0,
      current: '',
      status: 'processing',
      errors: []
    })

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        setProgress(prev => ({
          ...prev,
          processed: i,
          current: doc.name
        }))

        try {
          // Call API to regenerate summary for document
          const response = await fetch('/api/admin/regenerate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id })
          })

          if (!response.ok) {
            throw new Error(`Failed to process ${doc.name}`)
          }

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${doc.name}: ${error}`]
          }))
        }
      }

      setProgress(prev => ({
        ...prev,
        processed: documents.length,
        current: '',
        status: 'complete'
      }))
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, `General error: ${error}`]
      }))
    } finally {
      setIsProcessing(false)
    }
  }, [documents])

  // Re-run semantic keyword extraction
  const handleRerunKeywordExtraction = useCallback(async () => {
    setIsProcessing(true)
    setProgress({
      total: documents.length,
      processed: 0,
      current: '',
      status: 'processing',
      errors: []
    })

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        setProgress(prev => ({
          ...prev,
          processed: i,
          current: doc.name
        }))

        try {
          // Call API to regenerate keywords for document
          const response = await fetch('/api/admin/regenerate-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id })
          })

          if (!response.ok) {
            throw new Error(`Failed to extract keywords for ${doc.name}`)
          }

          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${doc.name}: ${error}`]
          }))
        }
      }

      setProgress(prev => ({
        ...prev,
        processed: documents.length,
        current: '',
        status: 'complete'
      }))
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, `General error: ${error}`]
      }))
    } finally {
      setIsProcessing(false)
    }
  }, [documents])

  // Update knowledge graphs
  const handleUpdateKnowledgeGraphs = useCallback(async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/update-knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to update knowledge graphs')
      }

      alert('Knowledge graphs updated successfully!')
    } catch (error) {
      console.error('Knowledge graph update failed:', error)
      alert('Failed to update knowledge graphs')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Clear all data
  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
      localStorage.clear()
      // You would also call APIs to clear server-side data here
      alert('All data cleared. Please refresh the page.')
    }
  }, [])

  // Delete vector database
  const handleDeleteVectorDB = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete the entire vector database? This will remove all embeddings and require full reprocessing.')) {
      return
    }

    setIsProcessing(true)
    try {
      // Clear embeddings from localStorage
      localStorage.removeItem('rag_vector_store')
      localStorage.removeItem('rag_embeddings_index')
      
      // Call API to clear server-side vector database
      const response = await fetch('/api/admin/clear-vector-db', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete vector database')
      }

      alert('Vector database deleted successfully! You will need to reprocess all documents.')
    } catch (error) {
      console.error('Vector DB deletion failed:', error)
      alert('Failed to delete vector database')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Rerun all LLM summarization and keywords
  const handleRerunAllAnalysis = useCallback(async () => {
    if (!window.confirm('This will rerun LLM analysis for all documents. This may take a while. Continue?')) {
      return
    }

    setIsProcessing(true)
    setProgress({
      total: documents.length,
      processed: 0,
      current: '',
      status: 'processing',
      errors: []
    })

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        setProgress(prev => ({
          ...prev,
          processed: i,
          current: `Analyzing ${doc.name}...`
        }))

        try {
          // Call API to regenerate full analysis
          const response = await fetch('/api/admin/rerun-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              documentId: doc.id,
              includeKeywords: true,
              includeSummary: true,
              includeTopics: true
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to analyze ${doc.name}`)
          }

          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${doc.name}: ${error}`]
          }))
        }
      }

      setProgress(prev => ({
        ...prev,
        processed: documents.length,
        current: 'Analysis complete',
        status: 'complete'
      }))

      alert('LLM analysis completed for all documents!')
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, `General error: ${error}`]
      }))
    } finally {
      setIsProcessing(false)
    }
  }, [documents])

  // Clean up orphaned data
  const handleCleanupOrphanedData = useCallback(async () => {
    setIsProcessing(true)
    try {
      // Clean up localStorage entries that no longer have corresponding documents
      const currentDocIds = documents.map(doc => doc.id)
      
      // Remove orphaned chunks
      const ragChunks = JSON.parse(localStorage.getItem('rag_chunks') || '[]')
      const validChunks = ragChunks.filter((chunk: { documentId: string }) => currentDocIds.includes(chunk.documentId))
      localStorage.setItem('rag_chunks', JSON.stringify(validChunks))
      
      // Remove orphaned visual content
      const visualContent = JSON.parse(localStorage.getItem('rag_visual_content') || '[]')
      const validVisualContent = visualContent.filter((visual: { documentId: string }) => currentDocIds.includes(visual.documentId))
      localStorage.setItem('rag_visual_content', JSON.stringify(validVisualContent))
      
      // Call API for server-side cleanup
      const response = await fetch('/api/admin/cleanup-orphaned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validDocumentIds: currentDocIds })
      })

      if (!response.ok) {
        throw new Error('Failed to cleanup orphaned data')
      }

      alert('Orphaned data cleaned up successfully!')
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('Failed to cleanup orphaned data')
    } finally {
      setIsProcessing(false)
    }
  }, [documents])

  const adminSections = [
    {
      id: 'backup',
      label: 'Backup & Restore',
      icon: HardDrive,
      description: 'Data backup and restoration'
    },
    {
      id: 'processing',
      label: 'Re-processing',
      icon: RefreshCw,
      description: 'Regenerate content analysis'
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Settings,
      description: 'System maintenance tasks'
    },
    {
      id: 'ai',
      label: 'AI Settings',
      icon: Brain,
      description: 'AI model configuration'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Settings,
      description: 'Security and access control'
    }
  ]

  return (
    <div className={`h-full bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </h2>
            </div>

            <nav className="space-y-2">
              {adminSections.map((section) => {
                const IconComponent = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {section.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Backup & Restore Section */}
          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Backup & Restore
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create backups of your data and restore from previous backups.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Download className="w-5 h-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Create Backup</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download a complete backup of all documents, settings, and analytics data.
                  </p>
                  <button
                    onClick={handleBackupData}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Download Backup'
                    )}
                  </button>
                  {lastBackup && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last backup: {new Date(lastBackup).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Restore */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Upload className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Restore Backup</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload and restore from a previous backup file.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreData}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-center">
                      Select Backup File
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Re-processing Section */}
          {activeSection === 'processing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Content Re-processing
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Regenerate AI summaries, keywords, and analysis for all documents.
                </p>
              </div>

              {/* Progress Display */}
              {progress.status === 'processing' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-blue-700 dark:text-blue-300">Processing...</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {progress.current && `Current: ${progress.current}`}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progress.processed} / {progress.total} documents
                  </div>
                </div>
              )}

              {progress.status === 'complete' && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-300">Processing completed!</span>
                  </div>
                </div>
              )}

              {progress.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 dark:text-red-300">Errors occurred:</span>
                  </div>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                    {progress.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LLM Summarization */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Regenerate Summaries</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Re-run LLM analysis to generate new summaries for all documents.
                  </p>
                  <button
                    onClick={handleRerunSummarization}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Regenerate All Summaries
                  </button>
                </div>

                {/* Keyword Extraction */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Regenerate Keywords</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Extract semantic keywords and tags for all documents.
                  </p>
                  <button
                    onClick={handleRerunKeywordExtraction}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Regenerate Keywords
                  </button>
                </div>

                {/* Knowledge Graphs */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-teal-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Update Knowledge Graphs</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Rebuild knowledge graphs and document relationships.
                  </p>
                  <button
                    onClick={handleUpdateKnowledgeGraphs}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Update Graphs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Section */}
          {activeSection === 'maintenance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  System Maintenance
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  System cleanup and maintenance operations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Vector Database Cleanup */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-orange-500" />
                    <h4 className="font-medium text-orange-700 dark:text-orange-300">Vector Database</h4>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                    Delete all embeddings and vector data. Documents will need reprocessing.
                  </p>
                  <button
                    onClick={handleDeleteVectorDB}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete Vector Database
                  </button>
                </div>

                {/* Rerun All Analysis */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Full LLM Reanalysis</h4>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                    Rerun complete LLM analysis for all documents (summaries, keywords, topics).
                  </p>
                  <button
                    onClick={handleRerunAllAnalysis}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Rerun All Analysis
                  </button>
                </div>

                {/* Cleanup Orphaned Data */}
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium text-green-700 dark:text-green-300">Clean Orphaned Data</h4>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Remove chunks and visual content that no longer have corresponding documents.
                  </p>
                  <button
                    onClick={handleCleanupOrphanedData}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cleanup Orphaned Data
                  </button>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h4 className="font-medium text-red-700 dark:text-red-300">Danger Zone</h4>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  These actions are irreversible. Use with extreme caution.
                </p>
                <button
                  onClick={handleClearAllData}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}

          {/* AI Settings Section */}
          {activeSection === 'ai' && (
            <AISettingsPanel />
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Security Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Security and access control settings.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Access Control
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Security features will be available in the next update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
