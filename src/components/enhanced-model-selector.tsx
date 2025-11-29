/**
 * Enhanced Model Selector Component - Professional Design System
 * Advanced model selection with performance metrics, comparison, and filtering
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Filter, Grid, List, BarChart3, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../design-system/components'
import { ModelPerformanceCard, type ModelInfo, type ModelMetrics } from './model-performance-card'
import { cn } from '../utils/cn'

interface EnhancedModelSelectorProps {
  selectedModel: string
  onModelSelect: (model: string) => void
  className?: string
  showMetrics?: boolean
  enableComparison?: boolean
  maxHeight?: string
}

// Mock performance data for demonstration
const mockMetrics: Record<string, ModelMetrics> = {
  'gpt-oss:20b': {
    responseTime: 2100,
    tokensPerSecond: 15,
    memoryUsage: 12.8,
    accuracy: 87,
    reliability: 92,
    lastUsed: '2 hours ago'
  },
  'llama3:latest': {
    responseTime: 1800,
    tokensPerSecond: 25,
    memoryUsage: 4.3,
    accuracy: 89,
    reliability: 95,
    lastUsed: '30 minutes ago'
  },
  'mistral:latest': {
    responseTime: 1400,
    tokensPerSecond: 35,
    memoryUsage: 3.8,
    accuracy: 85,
    reliability: 88,
    lastUsed: '1 hour ago'
  },
  'deepseek-coder:6.7b': {
    responseTime: 1600,
    tokensPerSecond: 28,
    memoryUsage: 3.6,
    accuracy: 91,
    reliability: 87,
    lastUsed: '5 minutes ago'
  }
}

const modelCapabilities: Record<string, string[]> = {
  'gpt-oss:20b': ['General Chat', 'Reasoning', 'Large Context', 'Creative Writing'],
  'llama3:latest': ['General Chat', 'Coding', 'Analysis', 'Fast Response'],
  'mistral:latest': ['General Chat', 'Fast Response', 'Multilingual', 'Concise'],
  'deepseek-coder:6.7b': ['Code Generation', 'Code Review', 'Technical Writing', 'Debugging'],
  'mistral:instruct': ['Instruction Following', 'Task Completion', 'Structured Output'],
  'openhermes:latest': ['Conversation', 'Roleplay', 'Creative Tasks']
}

export function EnhancedModelSelector({
  selectedModel,
  onModelSelect,
  className,
  showMetrics = true,
  enableComparison = true,
  maxHeight = '600px'
}: EnhancedModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'available' | 'fast' | 'accurate'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'speed' | 'size'>('performance')
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const fetchModels = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      
      // Handle the actual API response format
      const modelList = data.models || data.chatModels || []
      
      if (modelList && modelList.length > 0) {
        const modelsWithMetrics: ModelInfo[] = modelList.map((model: { name: string; size?: number }) => {
          const baseName = model.name.split(':')[0]
          const tag = model.name.split(':')[1] || 'latest'
          const sizeFormatted = model.size ? `${(model.size / (1024 * 1024 * 1024)).toFixed(1)}GB` : 'Unknown'
          
          return {
            name: baseName,
            fullName: model.name,
            tag,
            size: sizeFormatted,
            sizeBytes: model.size,
            description: getModelDescription(baseName),
            capabilities: modelCapabilities[model.name] || ['General Purpose'],
            metrics: mockMetrics[model.name],
            isSelected: model.name === selectedModel,
            availability: 'available' as const
          }
        })
        
        setModels(modelsWithMetrics)
      } else {
        setError('No models found. Please ensure Ollama is running.')
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      setError('Failed to connect to Ollama service')
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const getModelDescription = (baseName: string): string => {
    const descriptions: Record<string, string> = {
      'gpt-oss': 'Large language model optimized for general tasks and reasoning',
      'llama3': 'Fast and efficient model for general conversation and coding',
      'mistral': 'Lightweight model with excellent speed and multilingual support',
      'deepseek-coder': 'Specialized coding assistant with advanced programming capabilities',
      'openhermes': 'Conversational model optimized for dialogue and creative tasks'
    }
    return descriptions[baseName] || 'Advanced language model for various tasks'
  }

  const filteredAndSortedModels = useMemo(() => {
    const filtered = models.filter(model => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!model.name.toLowerCase().includes(query) && 
            !model.capabilities.some(cap => cap.toLowerCase().includes(query))) {
          return false
        }
      }

      // Category filter
      switch (filterBy) {
        case 'available':
          return model.availability === 'available'
        case 'fast':
          return model.metrics && model.metrics.tokensPerSecond > 20
        case 'accurate':
          return model.metrics && model.metrics.accuracy > 85
        default:
          return true
      }
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'speed':
          return (b.metrics?.tokensPerSecond || 0) - (a.metrics?.tokensPerSecond || 0)
        case 'size':
          return (a.sizeBytes || 0) - (b.sizeBytes || 0)
        case 'performance':
        default:
          const getScore = (metrics?: ModelMetrics) => {
            if (!metrics) return 0
            return (metrics.accuracy * 0.4) + (metrics.reliability * 0.3) + (metrics.tokensPerSecond * 0.3)
          }
          return getScore(b.metrics) - getScore(a.metrics)
      }
    })

    return filtered
  }, [models, searchQuery, filterBy, sortBy])

  const handleComparisonToggle = (modelName: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(modelName)) {
        return prev.filter(name => name !== modelName)
      } else if (prev.length < 3) {
        return [...prev, modelName]
      }
      return prev
    })
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchModels}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>AI Model Selection</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={fetchModels} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            {enableComparison && selectedForComparison.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                Compare ({selectedForComparison.length})
              </Button>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search models or capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10"
            />
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                  className="text-sm border border-input rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 h-8"
                >
                  <option value="all">All Models</option>
                  <option value="available">Available</option>
                  <option value="fast">Fast ({'>'}20 tok/s)</option>
                  <option value="accurate">Accurate ({'>'}85%)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm border border-input rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 h-8"
                >
                  <option value="performance">Performance</option>
                  <option value="name">Name</option>
                  <option value="speed">Speed</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{filteredAndSortedModels.length} models</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading models...</span>
              </div>
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-200",
              viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-2",
              viewMode === 'list' && "space-y-4 p-2",
              viewMode === 'compact' && "space-y-2 p-1"
            )}>
              {filteredAndSortedModels.map((model) => (
                <div key={model.fullName} className="relative group">
                  <ModelPerformanceCard
                    model={{...model, isSelected: model.fullName === selectedModel}}
                    onSelect={onModelSelect}
                    compact={viewMode === 'compact'}
                    showMetrics={showMetrics && viewMode !== 'compact'}
                  />
                  {enableComparison && (
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(model.fullName)}
                        onChange={() => handleComparisonToggle(model.fullName)}
                        className="rounded border border-input"
                        disabled={!selectedForComparison.includes(model.fullName) && selectedForComparison.length >= 3}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && filteredAndSortedModels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No models found matching your criteria
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedModelSelector
