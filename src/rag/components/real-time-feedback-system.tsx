"use client"

/**
 * Priority 4: Real-Time UI Feedback System
 * 
 * Advanced real-time feedback components for enhanced user experience
 * including live animations, progress indicators, and dynamic status updates.
 */

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Brain,
  Target,
  BarChart3,
  Sparkles,
  Eye,
  Cpu,
  Database
} from 'lucide-react'

// Simple utility function for className merging
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Real-time metrics interface
export interface RealTimeMetrics {
  searchSpeed: number
  accuracy: number
  confidence: number
  totalResults: number
  processingTime: number
  activeConnections: number
  systemLoad: number
  memoryUsage: number
}

export interface RealTimeFeedbackProps {
  isActive?: boolean
  metrics?: Partial<RealTimeMetrics>
  status?: 'idle' | 'searching' | 'success' | 'error'
  className?: string
}

// Main Real-Time Feedback Component
export function RealTimeFeedbackSystem({ 
  isActive = false, 
  metrics = {},
  status = 'idle',
  className 
}: RealTimeFeedbackProps) {
  const [animationState, setAnimationState] = useState<'enter' | 'active' | 'exit'>('enter')
  const [pulseAnimation, setPulseAnimation] = useState(false)

  useEffect(() => {
    if (isActive) {
      setAnimationState('active')
      setPulseAnimation(true)
    } else {
      setAnimationState('exit')
      setPulseAnimation(false)
    }
  }, [isActive])

  const defaultMetrics: RealTimeMetrics = {
    searchSpeed: 85,
    accuracy: 92,
    confidence: 88,
    totalResults: 0,
    processingTime: 0,
    activeConnections: 1,
    systemLoad: 45,
    memoryUsage: 32,
    ...metrics
  }

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out",
      animationState === 'enter' && "translate-x-full opacity-0",
      animationState === 'active' && "translate-x-0 opacity-100",
      animationState === 'exit' && "translate-x-full opacity-0",
      className
    )}>
      <div className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-80",
        pulseAnimation && "animate-pulse"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full transition-colors duration-300",
              status === 'searching' && "bg-blue-500 animate-pulse",
              status === 'success' && "bg-green-500",
              status === 'error' && "bg-red-500",
              status === 'idle' && "bg-gray-400"
            )} />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {status === 'searching' && "AI Search Active"}
              {status === 'success' && "Search Complete"}
              {status === 'error' && "Search Error"}
              {status === 'idle' && "System Ready"}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {status === 'searching' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>

        {/* Real-time Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard
            icon={<Zap className="w-4 h-4" />}
            label="Speed"
            value={`${defaultMetrics.searchSpeed}%`}
            color="blue"
            animated={status === 'searching'}
          />
          
          <MetricCard
            icon={<Target className="w-4 h-4" />}
            label="Accuracy"
            value={`${defaultMetrics.accuracy}%`}
            color="green"
            animated={status === 'searching'}
          />
          
          <MetricCard
            icon={<Brain className="w-4 h-4" />}
            label="AI Confidence"
            value={`${defaultMetrics.confidence}%`}
            color="purple"
            animated={status === 'searching'}
          />
          
          <MetricCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Results"
            value={defaultMetrics.totalResults.toString()}
            color="orange"
            animated={status === 'searching'}
          />
        </div>

        {/* Processing Time */}
        {status === 'searching' || defaultMetrics.processingTime > 0 ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Processing Time</span>
              <span className="font-mono text-blue-600">{defaultMetrics.processingTime}ms</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  status === 'searching' ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" : "bg-green-500"
                )}
                style={{ 
                  width: status === 'searching' ? '60%' : '100%' 
                }}
              />
            </div>
          </div>
        ) : null}

        {/* System Health Indicators */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">System Health</div>
          <div className="grid grid-cols-3 gap-2">
            <HealthIndicator
              icon={<Cpu className="w-3 h-3" />}
              label="CPU"
              value={defaultMetrics.systemLoad}
              threshold={80}
            />
            <HealthIndicator
              icon={<Database className="w-3 h-3" />}
              label="Memory"
              value={defaultMetrics.memoryUsage}
              threshold={90}
            />
            <HealthIndicator
              icon={<Database className="w-3 h-3" />}
              label="DB"
              value={75}
              threshold={85}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'blue' | 'green' | 'purple' | 'orange'
  animated?: boolean
}

function MetricCard({ icon, label, value, color, animated }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border border-gray-200 dark:border-gray-700",
      colorClasses[color],
      animated && "animate-pulse"
    )}>
      <div className="flex items-center space-x-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

// Health Indicator Component
interface HealthIndicatorProps {
  icon: React.ReactNode
  label: string
  value: number
  threshold: number
}

function HealthIndicator({ icon, label, value, threshold }: HealthIndicatorProps) {
  const status = value < threshold ? 'healthy' : 'warning'
  
  return (
    <div className="flex items-center space-x-1">
      <div className={cn(
        "p-1 rounded",
        status === 'healthy' ? "text-green-600 bg-green-100" : "text-orange-600 bg-orange-100"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{label}</div>
        <div className="text-xs font-medium">{value}%</div>
      </div>
    </div>
  )
}

// Progress Wave Animation Component
export function ProgressWaveAnimation({ 
  isActive = false,
  className 
}: { 
  isActive?: boolean
  className?: string 
}) {
  return (
    <div className={cn(
      "relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
      className
    )}>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-shimmer bg-[length:200%_100%]" />
      )}
    </div>
  )
}

// Floating Action Feedback
export function FloatingActionFeedback({
  message,
  type = 'info',
  duration = 3000,
  onClose
}: {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeConfig = {
    success: { icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
    error: { icon: <AlertCircle className="w-5 h-5" />, color: 'red' },
    warning: { icon: <AlertCircle className="w-5 h-5" />, color: 'orange' },
    info: { icon: <Sparkles className="w-5 h-5" />, color: 'blue' }
  }

  const config = typeConfig[type]

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <div className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border",
        config.color === 'green' && "bg-green-50 border-green-200 text-green-800",
        config.color === 'red' && "bg-red-50 border-red-200 text-red-800",
        config.color === 'orange' && "bg-orange-50 border-orange-200 text-orange-800",
        config.color === 'blue' && "bg-blue-50 border-blue-200 text-blue-800"
      )}>
        <div className={cn(
          config.color === 'green' && "text-green-600",
          config.color === 'red' && "text-red-600",
          config.color === 'orange' && "text-orange-600",
          config.color === 'blue' && "text-blue-600"
        )}>
          {config.icon}
        </div>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}

// Smart Loading States
export function SmartLoadingIndicator({ 
  stage = 'initializing',
  progress = 0,
  className 
}: { 
  stage?: 'initializing' | 'processing' | 'analyzing' | 'completing'
  progress?: number
  className?: string 
}) {
  const stageConfig = {
    initializing: { label: 'Initializing AI models...', icon: <Brain className="w-4 h-4" /> },
    processing: { label: 'Processing documents...', icon: <Database className="w-4 h-4" /> },
    analyzing: { label: 'Analyzing content...', icon: <Eye className="w-4 h-4" /> },
    completing: { label: 'Finalizing results...', icon: <CheckCircle className="w-4 h-4" /> }
  }

  const config = stageConfig[stage]

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-blue-600 animate-pulse">
          {config.icon}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {progress}% complete
      </div>
    </div>
  )
}

// Typing Animation Component
export function TypingAnimation({ 
  text, 
  speed = 50,
  className 
}: { 
  text: string
  speed?: number
  className?: string 
}) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed])

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

export default RealTimeFeedbackSystem
