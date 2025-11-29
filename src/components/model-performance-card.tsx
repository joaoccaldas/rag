/**
 * Model Performance Card Component
 * Professional model selection with performance metrics and visual indicators
 */

import React from 'react'
import { Cpu, Zap, Clock, HardDrive, Activity, RefreshCw } from 'lucide-react'
import { Card, CardContent, Button, Badge } from '../design-system/components'
import { cn } from '../utils/cn'

// Temporary simple spinner component
const Spinner = ({ size = "default" }: { size?: string }) => (
  <RefreshCw className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
)

interface ModelMetrics {
  responseTime: number // ms
  tokensPerSecond: number
  memoryUsage: number // GB
  accuracy: number // 0-100
  reliability: number // 0-100
  lastUsed?: string
}

interface ModelInfo {
  name: string
  fullName: string
  tag: string
  size: string
  sizeBytes?: number
  description?: string
  capabilities: string[]
  metrics?: ModelMetrics
  isLoading?: boolean
  isSelected?: boolean
  availability: 'available' | 'downloading' | 'error' | 'loading'
}

interface ModelPerformanceCardProps {
  model: ModelInfo
  onSelect: (modelName: string) => void
  onModelInfo?: (modelName: string) => void
  compact?: boolean
  showMetrics?: boolean
  className?: string
}

export function ModelPerformanceCard({
  model,
  onSelect,
  onModelInfo,
  compact = false,
  showMetrics = true,
  className
}: ModelPerformanceCardProps) {
  const getStatusColor = (availability: ModelInfo['availability']) => {
    switch (availability) {
      case 'available': return 'success'
      case 'downloading': return 'warning'
      case 'error': return 'destructive'
      case 'loading': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPerformanceScore = (metrics?: ModelMetrics) => {
    if (!metrics) return 'N/A'
    const score = (
      (metrics.accuracy * 0.3) +
      (metrics.reliability * 0.3) +
      (Math.min(metrics.tokensPerSecond / 50, 1) * 100 * 0.2) +
      (Math.max(1 - metrics.responseTime / 5000, 0) * 100 * 0.2)
    )
    return Math.round(score)
  }

  if (compact) {
    return (
      <Card 
        variant={model.isSelected ? 'elevated' : 'default'}
        padding="sm"
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          model.isSelected && "ring-2 ring-primary ring-offset-2",
          className
        )}
        onClick={() => model.availability === 'available' && onSelect(model.name)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.tag} • {model.size}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(model.availability)}>
                {model.availability}
              </Badge>
              {model.isLoading && <Spinner size="sm" />}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      variant={model.isSelected ? 'elevated' : 'default'}
      padding="none"
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        model.isSelected && "ring-2 ring-primary ring-offset-2",
        model.availability !== 'available' && "opacity-75",
        className
      )}
      onClick={() => model.availability === 'available' && onSelect(model.name)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{model.name}</h3>
                <p className="text-sm text-muted-foreground">{model.tag} • {model.size}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(model.availability)}>
                {model.availability}
              </Badge>
              {model.isLoading && <Spinner size="sm" />}
            </div>
          </div>

          {/* Description */}
          {model.description && (
            <p className="text-sm text-muted-foreground">{model.description}</p>
          )}

          {/* Capabilities */}
          {model.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {model.capabilities.map((capability, index) => (
                <Badge key={index} variant="outline">
                  {capability}
                </Badge>
              ))}
            </div>
          )}

          {/* Performance Metrics */}
          {showMetrics && model.metrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score</span>
                <Badge variant="default">
                  {getPerformanceScore(model.metrics)}/100
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Speed</p>
                    <p className="text-sm font-medium">{model.metrics.tokensPerSecond} tok/s</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Response</p>
                    <p className="text-sm font-medium">{model.metrics.responseTime}ms</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <p className="text-sm font-medium">{model.metrics.memoryUsage.toFixed(1)}GB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-sm font-medium">{model.metrics.accuracy}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex space-x-2">
              <Button
                variant={model.isSelected ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(model.name)
                }}
                disabled={model.availability !== 'available'}
              >
                {model.isSelected ? 'Selected' : 'Select'}
              </Button>
              {onModelInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onModelInfo(model.name)
                  }}
                >
                  Details
                </Button>
              )}
            </div>
            {model.metrics?.lastUsed && (
              <span className="text-xs text-muted-foreground">
                Used {model.metrics.lastUsed}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type { ModelInfo, ModelMetrics }
