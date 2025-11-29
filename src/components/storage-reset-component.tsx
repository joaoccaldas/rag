/**
 * STORAGE RESET COMPONENT
 * 
 * Admin component to reset all storage systems and sync with database state
 */

import React, { useState } from 'react'
import { Trash2, RotateCcw, Database, HardDrive, Eye, AlertTriangle } from 'lucide-react'
import { storageResetManager, ResetStats } from '../utils/storage-reset'
import { unifiedStorage } from '../storage/unified-storage-manager'

interface StorageStats {
  itemCount: number
  totalSize: number
  freeSpace?: number
  lastModified: Date
}

interface VerificationResult {
  isClean: boolean
  remainingItems: string[]
}

interface StorageResetComponentProps {
  onResetComplete?: () => void
  className?: string
}

export const StorageResetComponent: React.FC<StorageResetComponentProps> = ({
  onResetComplete,
  className = ''
}) => {
  const [isResetting, setIsResetting] = useState(false)
  const [resetStats, setResetStats] = useState<ResetStats | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const handleFullReset = async () => {
    if (!confirm('⚠️ This will clear ALL storage data including visual content, documents, and analysis. This action cannot be undone. Continue?')) {
      return
    }

    setIsResetting(true)
    setResetStats(null)

    try {
      console.log('🧹 Starting full storage reset...')
      const stats = await storageResetManager.resetAllStorage()
      setResetStats(stats)
      
      // Trigger any parent callbacks
      onResetComplete?.()
      
      console.log('✅ Full reset completed')
      
    } catch (error) {
      console.error('❌ Reset failed:', error)
      alert(`Reset failed: ${error}`)
    } finally {
      setIsResetting(false)
    }
  }

  const handleVisualContentReset = async () => {
    if (!confirm('Clear all visual content storage? This will remove cached thumbnails and analysis.')) {
      return
    }

    setIsResetting(true)

    try {
      await storageResetManager.clearVisualContentStorage()
      alert('✅ Visual content storage cleared')
      onResetComplete?.()
    } catch (error) {
      console.error('❌ Visual content reset failed:', error)
      alert(`Visual content reset failed: ${error}`)
    } finally {
      setIsResetting(false)
    }
  }

  const handleStorageCheck = async () => {
    try {
      const [stats, verification] = await Promise.all([
        unifiedStorage.getStorageStats(),
        storageResetManager.verifyStorageClean()
      ])
      
      setStorageStats(stats)
      setVerificationResult(verification)
      
    } catch (error) {
      console.error('Storage check failed:', error)
      alert(`Storage check failed: ${error}`)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <HardDrive className="w-6 h-6 text-red-600 dark:text-red-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Storage Management</h2>
      </div>

      {/* Warning Message */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Important</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Use these tools when visual content shows cached data after database reset. 
              This ensures the frontend storage syncs with the database state.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleStorageCheck}
          disabled={isResetting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Check Storage
        </button>

        <button
          onClick={handleVisualContentReset}
          disabled={isResetting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Visual Content
        </button>

        <button
          onClick={handleFullReset}
          disabled={isResetting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? 'Resetting...' : 'Full Reset'}
        </button>
      </div>

      {/* Storage Statistics */}
      {storageStats && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Storage Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Active Adapter:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {unifiedStorage.getActiveAdapter()}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Items:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {storageStats.itemCount}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Size:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {(storageStats.totalSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Last Modified:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {storageStats.lastModified?.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results */}
      {verificationResult && (
        <div className={`rounded-lg p-4 mb-4 ${
          verificationResult.isClean 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            verificationResult.isClean 
              ? 'text-green-800 dark:text-green-200'
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            Storage Verification
          </h3>
          <p className={`text-sm ${
            verificationResult.isClean 
              ? 'text-green-700 dark:text-green-300'
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {verificationResult.isClean ? '✅ Storage is clean' : `⚠️ Found ${verificationResult.remainingItems.length} remaining items`}
          </p>
          {!verificationResult.isClean && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">View remaining items</summary>
              <ul className="mt-2 text-xs space-y-1">
                {verificationResult.remainingItems.map((item: string, idx: number) => (
                  <li key={idx} className="font-mono">{item}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Reset Results */}
      {resetStats && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">Reset Complete</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-300">localStorage keys removed:</span>
              <span className="ml-2 font-bold">{resetStats.localStorageKeysRemoved}</span>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300">Unified storage cleared:</span>
              <span className="ml-2">{resetStats.unifiedStorageCleared ? '✅' : '❌'}</span>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300">IndexedDB cleared:</span>
              <span className="ml-2">{resetStats.indexedDbCleared ? '✅' : '❌'}</span>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300">Cache cleared:</span>
              <span className="ml-2">{resetStats.cacheCleared ? '✅' : '❌'}</span>
            </div>
          </div>
          
          {resetStats.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">Errors:</p>
              <ul className="text-xs text-red-600 dark:text-red-400 mt-1">
                {resetStats.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Available Adapters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Available storage adapters: {unifiedStorage.getAvailableAdapters().join(', ')}
        </p>
      </div>
    </div>
  )
}

export default StorageResetComponent
