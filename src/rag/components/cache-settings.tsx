/**
 * Cache Settings Component
 * 
 * UI for managing semantic cache configuration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Zap, 
  Activity, 
  TrendingUp, 
  Clock, 
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface CacheStats {
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
}

export function CacheSettings() {
  const [semanticEnabled, setSemanticEnabled] = useState(true)
  const [legacyEnabled, setLegacyEnabled] = useState(true)
  const [preferSemantic, setPreferSemantic] = useState(true)
  const [threshold, setThreshold] = useState([85])
  const [ttl, setTtl] = useState([30])
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const cache = await createSemanticCacheWrapper()
      const cacheStats = cache.getStats()
      setStats(cacheStats as CacheStats)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const updateCacheConfig = async () => {
    try {
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const { semanticCache } = await import('@/rag/utils/semantic-cache')
      
      const cache = await createSemanticCacheWrapper()
      
      // Update wrapper config
      cache.updateConfig({
        enableSemanticCache: semanticEnabled,
        useLegacyCache: legacyEnabled,
        preferSemanticCache: preferSemantic
      })
      
      // Update semantic cache config
      semanticCache.updateConfig({
        semanticThreshold: (threshold[0] ?? 85) / 100,
        defaultTTL: (ttl[0] ?? 30) * 60 * 1000 // Convert minutes to milliseconds
      })
      
      console.log('✅ Cache configuration updated')
    } catch (error) {
      console.error('Failed to update cache config:', error)
    }
  }

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear the entire cache?')) return
    
    try {
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const cache = await createSemanticCacheWrapper()
      await cache.clear()
      await loadStats()
      console.log('🧹 Cache cleared')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const hitRatePercentage = stats?.combined.hitRate
    ? (stats.combined.hitRate * 100).toFixed(1)
    : '0.0'

  const avgLatency = stats?.semantic?.avgLatency
    ? Math.round(stats.semantic.avgLatency)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Semantic Cache Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure multi-level semantic caching for 40x faster query responses
        </p>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Cache Performance
          </CardTitle>
          <CardDescription>
            Real-time cache analytics and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Hit Rate */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Hit Rate</span>
              </div>
              <div className="text-2xl font-bold">{hitRatePercentage}%</div>
              <div className="text-xs text-muted-foreground">
                {stats?.combined.totalHits || 0} hits / {stats?.semantic?.totalQueries || 0} queries
              </div>
            </div>

            {/* L1 Cache */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">L1 (Memory)</span>
              </div>
              <div className="text-2xl font-bold">{stats?.semantic?.l1Hits || 0}</div>
              <div className="text-xs text-muted-foreground">
                {stats?.semantic?.cacheSize.l1 || 0}/100 entries
              </div>
            </div>

            {/* L2 Cache */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">L2 (IndexedDB)</span>
              </div>
              <div className="text-2xl font-bold">{stats?.semantic?.l2Hits || 0}</div>
              <div className="text-xs text-muted-foreground">
                {stats?.semantic?.cacheSize.l2 || 0}/1000 entries
              </div>
            </div>

            {/* Avg Latency */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Avg Latency</span>
              </div>
              <div className="text-2xl font-bold">{avgLatency}ms</div>
              <div className="text-xs text-muted-foreground">
                {stats?.semantic?.misses || 0} cache misses
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cache Configuration
          </CardTitle>
          <CardDescription>
            Adjust semantic caching behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Semantic Cache */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                Enable Semantic Cache
                <Badge variant={semanticEnabled ? 'default' : 'secondary'}>
                  {semanticEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </Label>
              <p className="text-sm text-muted-foreground">
                Use embedding similarity to match similar queries (40x faster)
              </p>
            </div>
            <input
              type="checkbox"
              checked={semanticEnabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSemanticEnabled(e.target.checked)
                updateCacheConfig()
              }}
              className="w-5 h-5"
            />
          </div>

          {/* Enable Legacy Cache */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                Enable Legacy Cache
                <Badge variant={legacyEnabled ? 'default' : 'secondary'}>
                  {legacyEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </Label>
              <p className="text-sm text-muted-foreground">
                Use existing QueryCacheManager as fallback
              </p>
            </div>
            <input
              type="checkbox"
              checked={legacyEnabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setLegacyEnabled(e.target.checked)
                updateCacheConfig()
              }}
              className="w-5 h-5"
            />
          </div>

          {/* Prefer Semantic Cache */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                Prefer Semantic Cache
                <Badge variant={preferSemantic ? 'default' : 'secondary'}>
                  {preferSemantic ? 'Preferred' : 'Secondary'}
                </Badge>
              </Label>
              <p className="text-sm text-muted-foreground">
                Check semantic cache first before legacy cache
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferSemantic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPreferSemantic(e.target.checked)
                updateCacheConfig()
              }}
              className="w-5 h-5"
            />
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Similarity Threshold</Label>
              <span className="text-sm font-medium">{threshold[0]}%</span>
            </div>
            <input
              type="range"
              value={threshold[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreshold([parseInt(e.target.value)])}
              onMouseUp={updateCacheConfig}
              min={70}
              max={95}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher = stricter matching (fewer false positives, more cache misses)
            </p>
          </div>

          {/* TTL (Time to Live) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cache TTL</Label>
              <span className="text-sm font-medium">{ttl[0]} minutes</span>
            </div>
            <input
              type="range"
              value={ttl[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTtl([parseInt(e.target.value)])}
              onMouseUp={updateCacheConfig}
              min={5}
              max={120}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How long cached results stay valid before expiring
            </p>
          </div>

          {/* Clear Cache Button */}
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={clearCache}
              className="w-full"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Clear Entire Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How Semantic Caching Works
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                When you search for &ldquo;How to reset password?&rdquo;, semantic cache will also match 
                similar queries like &ldquo;password reset instructions&rdquo; or &ldquo;forgot my password&rdquo; without 
                re-running the expensive search. This provides 40x faster responses (50ms vs 2000ms).
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                <strong>L1 Cache (Memory):</strong> Ultra-fast, 100 hot queries<br />
                <strong>L2 Cache (IndexedDB):</strong> Persistent, 1000 queries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
