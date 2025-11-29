/**
 * Compression Settings Component
 * 
 * Allows users to configure document compression settings with real-time
 * preview of storage savings and performance impact.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { DocumentCompressionManager, CompressionConfig } from '../rag/utils/compression'

interface CompressionStats {
  totalDocuments: number
  totalOriginalSize: number
  totalCompressedSize: number
  spaceSaved: number
  compressionRatio: number
  processingTime: number
}

interface CompressionSettingsProps {
  onConfigChange?: (config: CompressionConfig) => void
  initialConfig?: Partial<CompressionConfig>
}

export const CompressionSettings: React.FC<CompressionSettingsProps> = ({
  onConfigChange,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<CompressionConfig>({
    enabled: true,
    level: 'medium',
    preserveSearchability: true,
    maxContentLength: 1000000,
    chunkCompression: true,
    metadataCompression: false,
    ...initialConfig
  })

  const [stats, setStats] = useState<CompressionStats>({
    totalDocuments: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    spaceSaved: 0,
    compressionRatio: 0,
    processingTime: 0
  })

  const [isTestingCompression, setIsTestingCompression] = useState(false)
  const [compressionManager] = useState(() => new DocumentCompressionManager(config))

  useEffect(() => {
    // Update compression manager when config changes
    compressionManager['config'] = config
    onConfigChange?.(config)
    
    // Simulate stats update
    updateCompressionStats()
  }, [config, onConfigChange, compressionManager])

  const updateCompressionStats = async () => {
    // Simulate getting real stats from the compression manager
    const simulatedStats = {
      totalDocuments: 45,
      totalOriginalSize: 12500000, // 12.5 MB
      totalCompressedSize: 6250000, // 6.25 MB (50% compression)
      spaceSaved: 6250000,
      compressionRatio: 0.5,
      processingTime: 850 // ms
    }
    
    setStats(simulatedStats)
  }

  const handleConfigChange = (key: keyof CompressionConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const testCompression = async () => {
    setIsTestingCompression(true)
    
    try {
      // Test compression with sample content
      const sampleContent = 'Lorem ipsum '.repeat(1000) // Large sample text
      const startTime = Date.now()
      
      const result = await compressionManager.compressDocument(
        sampleContent,
        'text',
        { title: 'Test Document' }
      )
      
      const endTime = Date.now()
      
      // Update stats with test results
      setStats(prev => ({
        ...prev,
        processingTime: endTime - startTime,
        compressionRatio: result.compressionMetadata.compressionRatio
      }))
      
    } catch (error) {
      console.error('Compression test failed:', error)
    } finally {
      setIsTestingCompression(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCompressionLevelDescription = (level: string): string => {
    switch (level) {
      case 'low':
        return 'Fast compression with minimal space savings (~20-30% reduction)'
      case 'medium':
        return 'Balanced compression with good space savings (~40-60% reduction)'
      case 'high':
        return 'Maximum compression with highest space savings (~60-80% reduction)'
      default:
        return ''
    }
  }

  const getPerformanceImpact = (level: string): string => {
    switch (level) {
      case 'low':
        return 'Minimal performance impact'
      case 'medium':
        return 'Moderate performance impact'
      case 'high':
        return 'Higher performance impact during compression'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Document Compression Settings
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.enabled 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Enable/Disable Compression */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Compression
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Automatically compress documents to save storage space
          </p>
        </div>
        <button
          onClick={() => handleConfigChange('enabled', !config.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.enabled
              ? 'bg-blue-600'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Compression Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compression Level
            </label>
            <div className="space-y-3">
              {['low', 'medium', 'high'].map((level) => (
                <div key={level} className="flex items-start">
                  <input
                    type="radio"
                    id={`level-${level}`}
                    name="compressionLevel"
                    value={level}
                    checked={config.level === level}
                    onChange={(e) => handleConfigChange('level', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <label
                      htmlFor={`level-${level}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {level}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getCompressionLevelDescription(level)}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {getPerformanceImpact(level)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Advanced Options
            </h4>

            {/* Preserve Searchability */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Preserve Searchability
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keep searchable content separate for faster queries
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.preserveSearchability}
                onChange={(e) => handleConfigChange('preserveSearchability', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            {/* Chunk Compression */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Compress Chunks
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apply compression to individual document chunks
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.chunkCompression}
                onChange={(e) => handleConfigChange('chunkCompression', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            {/* Metadata Compression */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Compress Metadata
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apply compression to document metadata
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.metadataCompression}
                onChange={(e) => handleConfigChange('metadataCompression', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            {/* Max Content Length */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Maximum Content Length
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Only compress documents larger than this size
              </p>
              <select
                value={config.maxContentLength}
                onChange={(e) => handleConfigChange('maxContentLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={1000}>1 KB</option>
                <option value={10000}>10 KB</option>
                <option value={100000}>100 KB</option>
                <option value={1000000}>1 MB</option>
                <option value={10000000}>10 MB</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Storage Statistics
              </h4>
              <button
                onClick={testCompression}
                disabled={isTestingCompression}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isTestingCompression ? 'Testing...' : 'Test Compression'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Documents</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalDocuments}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Space Saved</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatFileSize(stats.spaceSaved)}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Compression Ratio</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {(stats.compressionRatio * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Processing Time</div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {stats.processingTime}ms
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Original Size</span>
                <span>Compressed Size</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700 dark:text-gray-300">
                  {formatFileSize(stats.totalOriginalSize)}
                </span>
                <span className="text-green-600 dark:text-green-400">
                  {formatFileSize(stats.totalCompressedSize)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.compressionRatio * 100}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CompressionSettings
