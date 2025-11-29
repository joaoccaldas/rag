"use client"

import { useState, useEffect, useCallback } from 'react'
import { Monitor, HardDrive, Database, Activity, RefreshCw } from 'lucide-react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { getVisualContentStats } from '@/rag/utils/visual-content-storage'
import { Button } from '@/design-system/components'

interface SystemStats {
  documents: {
    total: number
    totalSize: string
    byType: Record<string, number>
  }
  storage: {
    localStorage: string
    indexedDB: string
    visualContent: number
  }
  performance: {
    lastProcessingTime?: number
    totalProcessedDocuments: number
    averageProcessingTime?: number
  }
}

export function SystemMonitor() {
  const { documents } = useRAG()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const calculateStats = useCallback(async (): Promise<SystemStats> => {
    // Calculate document statistics
    const documentsByType = documents.reduce((acc, doc) => {
      const type = doc.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalSize = documents.reduce((acc, doc) => acc + (doc.size || 0), 0)
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Calculate storage usage
    let localStorageSize = 0
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('rag_')) {
          localStorageSize += localStorage[key].length
        }
      }
    } catch (error) {
      console.error('Error calculating localStorage size:', error)
    }

    // Visual content statistics
    const visualStats = await getVisualContentStats()

    // Performance statistics (mock for now - could be enhanced with real metrics)
    const performanceStats = {
      lastProcessingTime: undefined,
      totalProcessedDocuments: documents.length,
      averageProcessingTime: undefined
    }

    return {
      documents: {
        total: documents.length,
        totalSize: formatSize(totalSize),
        byType: documentsByType
      },
      storage: {
        localStorage: formatSize(localStorageSize * 2), // Rough estimate for UTF-16
        indexedDB: 'Calculating...', // IndexedDB size is harder to calculate
        visualContent: visualStats.total
      },
      performance: performanceStats
    }
  }, [documents])

  const refreshStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const newStats = await calculateStats()
      setStats(newStats)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error calculating system stats:', error)
    }
    setIsLoading(false)
  }, [documents])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center p-space-lg">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-space-sm text-body-small text-muted-foreground">
          Calculating system statistics...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <Monitor className="w-5 h-5 text-primary" />
          <h3 className="text-heading-3 text-foreground">System Monitor</h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStats}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="text-caption text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {/* Documents Statistics */}
          <div className="border border-border rounded-lg p-space-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <Database className="w-4 h-4 text-primary" />
              <h4 className="text-body-large font-medium text-foreground">Documents</h4>
            </div>
            
            <div className="space-y-space-sm">
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Total:</span>
                <span className="text-body-small text-foreground font-medium">{stats.documents.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Size:</span>
                <span className="text-body-small text-foreground font-medium">{stats.documents.totalSize}</span>
              </div>
              
              {Object.entries(stats.documents.byType).length > 0 && (
                <div className="pt-space-sm border-t border-border">
                  <div className="text-caption text-muted-foreground mb-1">By Type:</div>
                  {Object.entries(stats.documents.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-caption text-muted-foreground capitalize">{type}:</span>
                      <span className="text-caption text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Storage Statistics */}
          <div className="border border-border rounded-lg p-space-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <HardDrive className="w-4 h-4 text-primary" />
              <h4 className="text-body-large font-medium text-foreground">Storage</h4>
            </div>
            
            <div className="space-y-space-sm">
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Local Storage:</span>
                <span className="text-body-small text-foreground font-medium">{stats.storage.localStorage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">IndexedDB:</span>
                <span className="text-body-small text-foreground font-medium">{stats.storage.indexedDB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Visual Content:</span>
                <span className="text-body-small text-foreground font-medium">{stats.storage.visualContent} items</span>
              </div>
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="border border-border rounded-lg p-space-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <Activity className="w-4 h-4 text-primary" />
              <h4 className="text-body-large font-medium text-foreground">Performance</h4>
            </div>
            
            <div className="space-y-space-sm">
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Processed Docs:</span>
                <span className="text-body-small text-foreground font-medium">{stats.performance.totalProcessedDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Avg. Time:</span>
                <span className="text-body-small text-foreground font-medium">
                  {stats.performance.averageProcessingTime ? `${stats.performance.averageProcessingTime}ms` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-muted-foreground">Last Process:</span>
                <span className="text-body-small text-foreground font-medium">
                  {stats.performance.lastProcessingTime ? `${stats.performance.lastProcessingTime}ms` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
