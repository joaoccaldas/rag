/**
 * Storage Migration Component
 * Helps users migrate from localStorage to unlimited IndexedDB storage
 */

"use client"

import { useState, useEffect } from 'react'
import { Database, HardDrive, Cloud, Check, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react'
import { unlimitedRAGStorage, getStorageCapacityInfo } from '../storage/unlimited-rag-storage'

interface StorageInfo {
  hasUnlimitedStorage: boolean
  estimatedCapacity: string
  currentUsage: string
  recommendations: string[]
}

interface MigrationStatus {
  isComplete: boolean
  isInProgress: boolean
  documentsCount: number
  visualCount: number
  chatCount: number
  error?: string | undefined
}

export function StorageMigrationPanel() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    isComplete: false,
    isInProgress: false,
    documentsCount: 0,
    visualCount: 0,
    chatCount: 0
  })
  const [localStorageUsage, setLocalStorageUsage] = useState<{
    total: number
    documents: number
    visual: number
    chat: number
  }>({ total: 0, documents: 0, visual: 0, chat: 0 })

  useEffect(() => {
    loadStorageInfo()
    calculateLocalStorageUsage()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageCapacityInfo()
      setStorageInfo(info)
    } catch (error) {
      console.error('Failed to load storage info:', error)
    }
  }

  const calculateLocalStorageUsage = () => {
    try {
      let total = 0
      let documents = 0
      let visual = 0
      let chat = 0

      // Calculate localStorage usage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          const size = value.length * 2 // UTF-16 encoding

          total += size

          if (key === 'rag_documents') documents = size
          else if (key === 'rag_visual_content') visual = size
          else if (key === 'chat_history') chat = size
        }
      }

      setLocalStorageUsage({
        total: Math.round(total / 1024), // KB
        documents: Math.round(documents / 1024),
        visual: Math.round(visual / 1024),
        chat: Math.round(chat / 1024)
      })
    } catch (error) {
      console.error('Failed to calculate localStorage usage:', error)
    }
  }

  const performMigration = async () => {
    setMigrationStatus(prev => ({ 
      ...prev, 
      isInProgress: true, 
      error: undefined 
    }))

    try {
      const result = await unlimitedRAGStorage.migrateFromLocalStorage()
      
      setMigrationStatus({
        isComplete: true,
        isInProgress: false,
        documentsCount: result.documentsCount,
        visualCount: result.visualCount,
        chatCount: result.chatCount
      })

      // Refresh storage info
      await loadStorageInfo()
      calculateLocalStorageUsage()

    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isInProgress: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      }))
    }
  }

  const clearLocalStorage = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear localStorage? This will remove all local data. Make sure you have migrated to unlimited storage first!'
    )
    
    if (confirmed) {
      // Keep only essential settings
      const settings = localStorage.getItem('miele-chat-settings')
      localStorage.clear()
      if (settings) {
        localStorage.setItem('miele-chat-settings', settings)
      }
      
      calculateLocalStorageUsage()
      alert('localStorage cleared! Only essential settings were preserved.')
    }
  }

  if (!storageInfo) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Loading Storage Information...</h3>
        </div>
        <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Storage Capacity Overview */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Storage Capacity</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Unlimited Storage</div>
            <div className="text-lg font-semibold text-green-600">
              {storageInfo.hasUnlimitedStorage ? '✅ Available' : '❌ Not Available'}
            </div>
            <div className="text-sm text-gray-500">IndexedDB Support</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Estimated Capacity</div>
            <div className="text-lg font-semibold text-blue-600">
              {storageInfo.estimatedCapacity}
            </div>
            <div className="text-sm text-gray-500">Available Space</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Current Usage</div>
            <div className="text-lg font-semibold text-purple-600">
              {storageInfo.currentUsage}
            </div>
            <div className="text-sm text-gray-500">Unlimited Storage</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold mb-2">Recommendations:</h4>
          <ul className="space-y-1">
            {storageInfo.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Current localStorage Usage */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Current localStorage Usage</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            localStorageUsage.total > 5000 ? 'bg-red-100 text-red-700' : 
            localStorageUsage.total > 2000 ? 'bg-yellow-100 text-yellow-700' : 
            'bg-green-100 text-green-700'
          }`}>
            {localStorageUsage.total}KB / ~10MB limit
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{localStorageUsage.total}KB</div>
            <div className="text-sm text-gray-600">Total Usage</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">{localStorageUsage.documents}KB</div>
            <div className="text-sm text-gray-600">Documents</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">{localStorageUsage.visual}KB</div>
            <div className="text-sm text-gray-600">Visual Content</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">{localStorageUsage.chat}KB</div>
            <div className="text-sm text-gray-600">Chat History</div>
          </div>
        </div>

        {localStorageUsage.total > 5000 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">
              localStorage usage is high ({localStorageUsage.total}KB). Consider migrating to unlimited storage.
            </span>
          </div>
        )}
      </div>

      {/* Migration Panel */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Migrate to Unlimited Storage</h3>
        </div>

        {migrationStatus.isComplete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Migration completed successfully!</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{migrationStatus.documentsCount}</div>
                <div className="text-sm text-gray-600">Documents Migrated</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{migrationStatus.visualCount}</div>
                <div className="text-sm text-gray-600">Visual Items Migrated</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{migrationStatus.chatCount}</div>
                <div className="text-sm text-gray-600">Chat Messages Migrated</div>
              </div>
            </div>

            <button
              onClick={clearLocalStorage}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear localStorage (Optional)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {migrationStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-700">Migration failed: {migrationStatus.error}</span>
              </div>
            )}

            <p className="text-gray-600">
              Migrate your RAG data from limited localStorage to unlimited IndexedDB storage. 
              This will move all documents, visual content, and chat history to a storage system 
              that can handle gigabytes of data instead of being limited to ~10MB.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={performMigration}
                disabled={migrationStatus.isInProgress || !storageInfo.hasUnlimitedStorage}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {migrationStatus.isInProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Start Migration
                  </>
                )}
              </button>

              {!storageInfo.hasUnlimitedStorage && (
                <span className="text-sm text-red-600">
                  Unlimited storage not available in this browser
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
