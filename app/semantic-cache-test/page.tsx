/**
 * Semantic Cache Test & Monitor
 * 
 * Use this to verify semantic caching is working and see real-time stats
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */

'use client'

import React, { useState, useEffect } from 'react'

export default function SemanticCacheTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [stats, setStats] = useState<{
    semantic?: any
    combined?: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    setTestResults(prev => [...prev, `${emoji} [${timestamp}] ${message}`])
  }

  const loadCacheStats = async () => {
    try {
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const cache = await createSemanticCacheWrapper()
      const cacheStats = cache.getStats()
      setStats(cacheStats)
      return cacheStats
    } catch (error) {
      addLog(`Error loading stats: ${error}`, 'error')
      return null
    }
  }

  const testSemanticCache = async () => {
    setIsLoading(true)
    setTestResults([])
    addLog('Starting semantic cache test...')

    try {
      // Import required modules
      addLog('Importing semantic cache modules...')
      const { createSemanticCacheWrapper } = await import('@/rag/utils/semantic-cache-wrapper')
      const { generateEmbedding } = await import('@/rag/utils/document-processing')

      // Create cache instance
      addLog('Creating cache wrapper...')
      const cache = await createSemanticCacheWrapper({
        enableSemanticCache: true,
        useLegacyCache: false,
        preferSemanticCache: true
      })

      // Test 1: Store a query result
      addLog('Test 1: Storing query "How do I reset my password?"')
      const query1 = "How do I reset my password?"
      const embedding1 = await generateEmbedding(query1)
      
      const mockResults = [
        {
          id: 'test-1',
          score: 0.95,
          content: 'To reset your password, go to Settings > Security > Change Password',
          metadata: { title: 'Password Reset Guide', type: 'document' }
        }
      ]

      await cache.set(query1, embedding1, mockResults, ['doc-1'])
      addLog('✅ Query cached successfully', 'success')

      // Test 2: Retrieve exact match
      addLog('Test 2: Retrieving exact match "How do I reset my password?"')
      const cached1 = await cache.get(query1, embedding1)
      if (cached1 && cached1.length > 0) {
        addLog(`✅ EXACT MATCH HIT! Retrieved ${cached1.length} results`, 'success')
      } else {
        addLog('❌ MISS: Exact match failed', 'error')
      }

      // Test 3: Retrieve similar query (semantic matching!)
      addLog('Test 3: Retrieving similar query "password reset instructions"')
      const query2 = "password reset instructions"
      const embedding2 = await generateEmbedding(query2)
      
      const cached2 = await cache.get(query2, embedding2)
      if (cached2 && cached2.length > 0) {
        addLog(`✅ SEMANTIC MATCH HIT! Retrieved ${cached2.length} results (DIFFERENT WORDS!)`, 'success')
        addLog('🎉 Semantic caching is WORKING!', 'success')
      } else {
        addLog('❌ MISS: Semantic match failed', 'error')
      }

      // Test 4: Different query (should miss)
      addLog('Test 4: Testing unrelated query "What is the weather?"')
      const query3 = "What is the weather?"
      const embedding3 = await generateEmbedding(query3)
      
      const cached3 = await cache.get(query3, embedding3)
      if (cached3 && cached3.length > 0) {
        addLog('⚠️ Unexpected hit on unrelated query', 'error')
      } else {
        addLog('✅ MISS: Correctly rejected unrelated query', 'success')
      }

      // Load final stats
      addLog('Loading final cache statistics...')
      const finalStats = await loadCacheStats()
      if (finalStats) {
        addLog(`📊 Cache Stats:`, 'info')
        addLog(`   L1 Hits: ${finalStats.semantic?.l1Hits || 0}`, 'info')
        addLog(`   L2 Hits: ${finalStats.semantic?.l2Hits || 0}`, 'info')
        addLog(`   Misses: ${finalStats.semantic?.misses || 0}`, 'info')
        addLog(`   Hit Rate: ${((finalStats.combined?.hitRate || 0) * 100).toFixed(1)}%`, 'info')
      }

      addLog('🎉 All tests completed!', 'success')

    } catch (error) {
      addLog(`❌ Test failed: ${error}`, 'error')
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPersistence = async () => {
    addLog('Checking cache persistence...')
    
    try {
      // Check IndexedDB
      const dbs = await indexedDB.databases()
      const semanticDB = dbs.find(db => db.name === 'SemanticCache')
      
      if (semanticDB) {
        addLog('✅ SemanticCache IndexedDB found!', 'success')
        addLog(`   Database version: ${semanticDB.version || 1}`, 'info')
        
        // Open and check size
        const request = indexedDB.open('SemanticCache')
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          const tx = db.transaction('entries', 'readonly')
          const store = tx.objectStore('entries')
          const countRequest = store.count()
          
          countRequest.onsuccess = () => {
            const count = countRequest.result
            addLog(`   L2 Cache entries: ${count}`, 'info')
            addLog('💾 Cache IS persistent (stored in IndexedDB)', 'success')
            
            if (count === 0) {
              addLog('⚠️ Cache is empty. Run the test above to populate it!', 'info')
            } else {
              addLog('✅ Cache has data! It will persist across browser sessions', 'success')
            }
          }
        }
      } else {
        addLog('⚠️ SemanticCache IndexedDB not found yet', 'info')
        addLog('   Run the test above to create it!', 'info')
      }

    } catch (error) {
      addLog(`Error checking persistence: ${error}`, 'error')
    }
  }

  useEffect(() => {
    loadCacheStats()
    const interval = setInterval(loadCacheStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">🧪 Semantic Cache Test & Monitor</h1>
          <p className="text-muted-foreground">
            Verify that semantic caching is working and monitor real-time performance
          </p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Hit Rate</div>
              <div className="text-2xl font-bold">
                {((stats.combined?.hitRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">L1 (Memory)</div>
              <div className="text-2xl font-bold">{stats.semantic?.l1Hits || 0}</div>
              <div className="text-xs text-muted-foreground">
                {stats.semantic?.cacheSize?.l1 || 0}/100 entries
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">L2 (IndexedDB)</div>
              <div className="text-2xl font-bold">{stats.semantic?.l2Hits || 0}</div>
              <div className="text-xs text-muted-foreground">
                {stats.semantic?.cacheSize?.l2 || 0}/1000 entries
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Misses</div>
              <div className="text-2xl font-bold">{stats.semantic?.misses || 0}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={testSemanticCache}
            disabled={isLoading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {isLoading ? '🔄 Testing...' : '🧪 Run Semantic Cache Test'}
          </button>

          <button
            onClick={checkPersistence}
            className="px-6 py-3 border rounded-lg hover:bg-muted font-medium"
          >
            💾 Check Persistence
          </button>

          <button
            onClick={() => {
              setTestResults([])
              loadCacheStats()
            }}
            className="px-6 py-3 border rounded-lg hover:bg-muted font-medium"
          >
            🔄 Refresh Stats
          </button>
        </div>

        {/* Test Results */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">
              Click "Run Semantic Cache Test" above to verify semantic caching is working
            </p>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="p-2 bg-muted rounded">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
            📚 How to Verify Semantic Caching Works
          </h3>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>1. Run the test above</strong> - This will:
              <ul className="list-disc ml-6 mt-1">
                <li>Store "How do I reset my password?" in cache</li>
                <li>Retrieve it with exact match (should HIT)</li>
                <li>Retrieve it with similar words "password reset instructions" (should HIT!)</li>
                <li>Try unrelated query (should MISS)</li>
              </ul>
            </div>

            <div>
              <strong>2. Check persistence</strong> - This will:
              <ul className="list-disc ml-6 mt-1">
                <li>Look for SemanticCache IndexedDB database</li>
                <li>Count entries in L2 cache</li>
                <li>Confirm data persists across sessions</li>
              </ul>
            </div>

            <div>
              <strong>3. Test in real searches</strong>:
              <ul className="list-disc ml-6 mt-1">
                <li>Go to the main RAG interface</li>
                <li>Upload a document and search for something</li>
                <li>Open browser DevTools Console (F12)</li>
                <li>Search again with similar words</li>
                <li>Look for "✨ Semantic Cache HIT" in console</li>
              </ul>
            </div>

            <div>
              <strong>4. Persistence details</strong>:
              <ul className="list-disc ml-6 mt-1">
                <li><strong>L1 (Memory)</strong>: Volatile - cleared on page refresh</li>
                <li><strong>L2 (IndexedDB)</strong>: Persistent - survives browser restarts!</li>
                <li><strong>TTL</strong>: Entries expire after 30 minutes (default)</li>
                <li><strong>Storage location</strong>: IndexedDB → SemanticCache → entries</li>
              </ul>
            </div>
          </div>
        </div>

        {/* View in Browser Tools */}
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-3">🔍 View Cache in Browser DevTools</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>To see IndexedDB cache:</strong>
              <ol className="list-decimal ml-6 mt-1 space-y-1">
                <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs">F12</kbd> to open DevTools</li>
                <li>Go to <strong>Application</strong> tab</li>
                <li>Expand <strong>IndexedDB</strong> in left sidebar</li>
                <li>Look for <strong>SemanticCache</strong></li>
                <li>Click <strong>entries</strong> to see cached queries</li>
              </ol>
            </div>

            <div>
              <strong>To see console logs:</strong>
              <ol className="list-decimal ml-6 mt-1 space-y-1">
                <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs">F12</kbd> to open DevTools</li>
                <li>Go to <strong>Console</strong> tab</li>
                <li>Perform searches in the RAG interface</li>
                <li>Look for: "✨ Semantic Cache HIT" or "💨 Cache MISS"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
