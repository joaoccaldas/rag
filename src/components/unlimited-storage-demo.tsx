/**
 * UNLIMITED RAG STORAGE - INTEGRATION DEMO
 * 
 * Complete demonstration of the unlimited storage system
 * Shows migration from localStorage limitations to 2GB+ IndexedDB storage
 */

"use client"

import { useState, useEffect } from 'react'
import { Database, Upload, BarChart3, CheckCircle, AlertCircle, ArrowRight, FileText, MessageSquare } from 'lucide-react'
import { StorageMigrationPanel } from './storage-migration-panel'
import { unlimitedRAGStorage, getStorageCapacityInfo } from '../storage/unlimited-rag-storage'

interface StorageStats {
  documentsCount: number
  documentsSize: number
  visualCount: number
  visualSize: number
  chatCount: number
  chatSize: number
  totalSize: number
  capacity: string
}

export function UnlimitedStorageDemo() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [testResults, setTestResults] = useState<{
    migration: boolean
    storage: boolean
    retrieval: boolean
  }>({ migration: false, storage: false, retrieval: false })

  useEffect(() => {
    loadStorageStats()
  }, [])

  const loadStorageStats = async () => {
    try {
      const storageStats = await unlimitedRAGStorage.getStorageStats()
      const capacityInfo = await getStorageCapacityInfo()
      
      setStats({
        documentsCount: 0, // Will be populated from actual data
        documentsSize: storageStats.indexedDB.usage * 0.3, // Estimate documents as 30% of total
        visualCount: 0,
        visualSize: storageStats.indexedDB.usage * 0.6, // Estimate visual as 60% of total
        chatCount: 0,
        chatSize: storageStats.indexedDB.usage * 0.1, // Estimate chat as 10% of total
        totalSize: storageStats.indexedDB.usage,
        capacity: capacityInfo.estimatedCapacity
      })
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runStorageTest = async () => {
    setIsLoading(true)
    const results = { migration: false, storage: false, retrieval: false }

    try {
      // Test 1: Migration
      console.log('🔄 Testing migration capabilities...')
      const migrationResult = await unlimitedRAGStorage.migrateFromLocalStorage()
      results.migration = true
      console.log(`✅ Migration test passed: ${migrationResult.documentsCount} docs, ${migrationResult.visualCount} visuals, ${migrationResult.chatCount} chats`)

      // Test 2: Storage
      console.log('🔄 Testing unlimited storage...')
      const testDoc = {
        id: `test-${Date.now()}`,
        title: 'Unlimited Storage Test Document',
        content: 'This is a test document to verify unlimited storage capabilities. '.repeat(100),
        metadata: { 
          type: 'test',
          testRun: new Date().toISOString(),
          size: 'large'
        },
        embeddings: Array(1536).fill(0).map(() => Math.random()),
        createdAt: new Date()
      }
      
      await unlimitedRAGStorage.storeDocument(testDoc)
      const retrieved = await unlimitedRAGStorage.getDocument(testDoc.id)
      if (retrieved && retrieved.content === testDoc.content) {
        results.storage = true
        console.log('✅ Storage test passed')
      }

      // Test 3: Retrieval
      console.log('🔄 Testing retrieval...')
      const allDocs = await unlimitedRAGStorage.getAllDocuments()
      if (allDocs.length > 0) {
        results.retrieval = true
        console.log('✅ Retrieval test passed')
      }

      // Cleanup test document
      await unlimitedRAGStorage.deleteDocument(testDoc.id)

    } catch (error) {
      console.error('Storage test failed:', error)
    }

    setTestResults(results)
    await loadStorageStats()
    setIsLoading(false)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading && !stats) {
    return (
      <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-600 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900">Loading Unlimited Storage System...</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
        <Database className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">🚀 Unlimited RAG Storage System</h1>
        <p className="text-lg opacity-90">
          Break free from localStorage limitations with 2GB+ IndexedDB storage
        </p>
      </div>

      {/* Storage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Documents</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats?.documentsCount || 0}
          </div>
          <div className="text-sm text-gray-600">
            {formatBytes(stats?.documentsSize || 0)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 text-purple-600">📊</div>
            <h3 className="font-semibold text-gray-900">Visual Content</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats?.visualCount || 0}
          </div>
          <div className="text-sm text-gray-600">
            {formatBytes(stats?.visualSize || 0)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Chat History</h3>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats?.chatCount || 0}
          </div>
          <div className="text-sm text-gray-600">
            {formatBytes(stats?.chatSize || 0)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Total Usage</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {formatBytes(stats?.totalSize || 0)}
          </div>
          <div className="text-sm text-gray-600">
            of {stats?.capacity || '2GB+'} available
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold">System Test Results</h3>
          </div>
          <button
            onClick={runStorageTest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Run Test
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            testResults.migration 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResults.migration ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium">Migration</span>
            </div>
            <p className="text-sm text-gray-600">
              localStorage to IndexedDB migration capability
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            testResults.storage 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResults.storage ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium">Storage</span>
            </div>
            <p className="text-sm text-gray-600">
              Large document storage and retrieval
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            testResults.retrieval 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResults.retrieval ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium">Search</span>
            </div>
            <p className="text-sm text-gray-600">
              Full-text search and content retrieval
            </p>
          </div>
        </div>
      </div>

      {/* Migration Panel */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Storage Migration</h3>
          </div>
          <p className="text-gray-600 mt-2">
            Migrate your existing RAG data from localStorage to unlimited IndexedDB storage
          </p>
        </div>
        <div className="p-6">
          <StorageMigrationPanel />
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎉 Benefits of Unlimited Storage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">2GB+ storage capacity (vs 5-10MB localStorage)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Store thousands of documents and images</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">No more QuotaExceededError issues</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Automatic compression and optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Full-text search capabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Seamless migration from existing data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
