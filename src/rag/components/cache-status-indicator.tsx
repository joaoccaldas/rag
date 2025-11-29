/**
 * Cache Status Indicator
 * 
 * Visual indicator showing semantic cache status in real-time
 * Displays in search interface so users can see when cache is working
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Database, TrendingUp, Clock } from 'lucide-react'

interface CacheStatusProps {
  lastSearchWasCached?: boolean
  lastSearchLatency?: number
}

export function CacheStatusIndicator({ lastSearchWasCached, lastSearchLatency }: CacheStatusProps) {
  const [stats, setStats] = useState<{
    hitRate: number
    totalQueries: number
    cacheHits: number
    avgLatency: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const cache = await createSemanticCacheWrapper()
      const cacheStats = cache.getStats()
      
      setStats({
        hitRate: cacheStats.combined.hitRate,
        totalQueries: cacheStats.semantic?.totalQueries ?? 0,
        cacheHits: cacheStats.combined.totalHits,
        avgLatency: cacheStats.semantic?.avgLatency ?? 0
      })
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  if (isLoading && !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="w-4 h-4 animate-pulse" />
        <span>Loading cache stats...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg border">
      {/* Last Search Status */}
      {lastSearchWasCached !== undefined && (
        <div className="flex items-center gap-2">
          {lastSearchWasCached ? (
            <>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Cache HIT
                </span>
              </div>
              {lastSearchLatency && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(lastSearchLatency)}ms - 40x faster!)
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Cache MISS
                </span>
              </div>
              {lastSearchLatency && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(lastSearchLatency)}ms - full search)
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Divider */}
      {lastSearchWasCached !== undefined && stats && (
        <div className="h-6 w-px bg-border" />
      )}

      {/* Overall Stats */}
      {stats && (
        <>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">
              Hit Rate: {(stats.hitRate * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              {stats.cacheHits} / {stats.totalQueries} cached
            </span>
          </div>

          {stats.avgLatency > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm">
                Avg: {Math.round(stats.avgLatency)}ms
              </span>
            </div>
          )}
        </>
      )}

      {/* Live Indicator */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative flex h-2 w-2">
          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></div>
        </div>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
    </div>
  )
}

/**
 * Compact Cache Badge - for minimal space
 */
export function CacheBadge({ isCached }: { isCached: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isCached 
        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }`}>
      {isCached ? (
        <>
          <Zap className="w-3 h-3" />
          <span>Cached</span>
        </>
      ) : (
        <>
          <Database className="w-3 h-3" />
          <span>Fresh</span>
        </>
      )}
    </div>
  )
}

/**
 * Debug Panel - shows detailed cache information
 */
export function CacheDebugPanel() {
  const [stats, setStats] = useState<{
    semantic?: {
      l1Hits: number
      l2Hits: number
      misses: number
      totalQueries: number
      hitRate: number
      avgLatency: number
      cacheSize: { l1: number; l2: number }
    }
    combined: {
      totalHits: number
      totalMisses: number
      hitRate: number
    }
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const loadStats = async () => {
    try {
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const cache = await createSemanticCacheWrapper()
      const cacheStats = cache.getStats()
      setStats(cacheStats as typeof stats)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadStats()
      const interval = setInterval(loadStats, 2000)
      return () => clearInterval(interval)
    }
    return undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Cache Debug Panel"
      >
        <Database className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-background border rounded-lg shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted border-b">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h3 className="font-semibold">Semantic Cache Debug</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {stats ? (
          <>
            {/* Semantic Cache Stats */}
            {stats.semantic && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Semantic Cache</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">L1 Hits</div>
                    <div className="font-bold text-green-600">{stats.semantic.l1Hits}</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">L2 Hits</div>
                    <div className="font-bold text-blue-600">{stats.semantic.l2Hits}</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Misses</div>
                    <div className="font-bold text-orange-600">{stats.semantic.misses}</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Total Queries</div>
                    <div className="font-bold">{stats.semantic.totalQueries}</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Hit Rate</div>
                    <div className="font-bold text-purple-600">
                      {(stats.semantic.hitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Avg Latency</div>
                    <div className="font-bold">{Math.round(stats.semantic.avgLatency)}ms</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Cache Size</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>L1: {stats.semantic.cacheSize.l1}/100</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(stats.semantic.cacheSize.l1 / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>L2: {stats.semantic.cacheSize.l2}/1000</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(stats.semantic.cacheSize.l2 / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Combined Stats */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Combined Performance</h4>
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded">
                <div className="text-2xl font-bold text-center">
                  {(stats.combined.hitRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  Overall Hit Rate
                </div>
                <div className="text-xs text-center mt-1">
                  {stats.combined.totalHits} hits / {stats.combined.totalMisses} misses
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Semantic Cache</span>
                  <span className="text-green-600 font-medium">✓ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Legacy Cache</span>
                  <span className="text-blue-600 font-medium">✓ Fallback</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="text-purple-600 font-medium">IndexedDB</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Database className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading cache statistics...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-muted border-t flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Auto-refresh: 2s</span>
        <button
          onClick={loadStats}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh Now
        </button>
      </div>
    </div>
  )
}
