"use client"

import { useState, useEffect } from 'react'
import { Database, HardDrive, AlertCircle, CheckCircle } from 'lucide-react'
import { ragStorage } from '../utils/storage'

interface StorageStats {
  available: boolean
  type: 'indexeddb' | 'localstorage'
  usage?: number
  quota?: number
}

export function StorageStatus() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const storageStats = await ragStorage.getStorageStats()
        setStats(storageStats)
      } catch (error) {
        console.error('Failed to load storage stats:', error)
        setStats({
          available: false,
          type: 'localstorage'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
        <span>Checking storage...</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>Storage unavailable</span>
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const usagePercentage = stats.usage && stats.quota 
    ? Math.round((stats.usage / stats.quota) * 100)
    : 0

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center space-x-3">
        {stats.type === 'indexeddb' ? (
          <Database className="w-5 h-5 text-blue-500" />
        ) : (
          <HardDrive className="w-5 h-5 text-yellow-500" />
        )}
        
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.type === 'indexeddb' ? 'IndexedDB' : 'LocalStorage'}
            </span>
            {stats.available && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          
          {stats.usage && stats.quota && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(stats.usage)} / {formatBytes(stats.quota)} ({usagePercentage}%)
            </div>
          )}
        </div>
      </div>
      
      {stats.usage && stats.quota && (
        <div className="w-24">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage > 80 
                  ? 'bg-red-500' 
                  : usagePercentage > 60 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
