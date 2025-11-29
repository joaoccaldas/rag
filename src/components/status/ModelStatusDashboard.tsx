/**
 * Model Status Dashboard
 * Comprehensive status display for Ollama models and connections
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Server, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  Info,
  Zap,
  Database,
  Clock
} from 'lucide-react'
import { ollamaService, formatBytes, getModelDescription, getModelCapabilities, OllamaModel } from '@/services/ollama-service'

interface ModelStatusProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  connectionMethod: 'direct' | 'proxy' | 'mock'
  modelCount: number
  lastChecked: Date
  details: {
    directConnection: boolean
    proxyConnection: boolean
    modelsAvailable: boolean
    responseTime?: number
  }
  errors?: string[]
}

interface DiagnosticInfo {
  issue: string
  description: string
  solutions: string[]
  severity: 'low' | 'medium' | 'high'
}

export function ModelStatusDashboard({ 
  className = '', 
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30000 
}: ModelStatusProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const checkHealth = useCallback(async () => {
    try {
      setIsLoading(true)
      const health = await ollamaService.getHealthStatus()
      const modelResponse = await ollamaService.fetchModels()
      
      setHealthStatus(health)
      setModels(modelResponse.data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    checkHealth()
    
    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [checkHealth, autoRefresh, refreshInterval])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400 miele:text-green-700 bg-green-50 dark:bg-green-900/20 miele:bg-green-50 border-green-200 dark:border-green-800 miele:border-green-200'
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400 miele:text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 miele:bg-yellow-50 border-yellow-200 dark:border-yellow-800 miele:border-yellow-200'
      case 'unhealthy': return 'text-red-600 dark:text-red-400 miele:text-miele-red bg-red-50 dark:bg-red-900/20 miele:bg-red-50 border-red-200 dark:border-red-800 miele:border-miele-red/20'
      default: return 'text-gray-600 dark:text-gray-400 miele:text-miele-charcoal bg-gray-50 dark:bg-gray-800 miele:bg-miele-cream border-gray-200 dark:border-gray-700 miele:border-miele-silver'
    }
  }

  const getConnectionMethodIcon = (method: string) => {
    switch (method) {
      case 'direct': return <Zap className="w-4 h-4 text-green-500 miele:text-green-600" />
      case 'proxy': return <Server className="w-4 h-4 text-blue-500 miele:text-miele-red" />
      case 'mock': return <Database className="w-4 h-4 text-orange-500 miele:text-orange-600" />
      default: return <XCircle className="w-4 h-4 text-gray-500 miele:text-miele-charcoal" />
    }
  }

  const getDiagnostics = (): DiagnosticInfo[] => {
    if (!healthStatus) return []

    const diagnostics: DiagnosticInfo[] = []

    if (healthStatus.status === 'unhealthy') {
      diagnostics.push({
        issue: 'Ollama Service Unavailable',
        description: 'Cannot connect to Ollama service on any configured endpoint',
        solutions: [
          'Ensure Ollama is installed: https://ollama.ai/download',
          'Start Ollama service: "ollama serve" in terminal',
          'Check if Ollama is running on localhost:11434',
          'Verify firewall settings allow connections to port 11434',
          'Try restarting Ollama service'
        ],
        severity: 'high'
      })
    }

    if (!healthStatus.details.directConnection && healthStatus.connectionMethod !== 'mock') {
      diagnostics.push({
        issue: 'Direct Connection Failed',
        description: 'Cannot connect directly to Ollama service',
        solutions: [
          'Check if Ollama is running: "ollama list" in terminal',
          'Verify Ollama is listening on 0.0.0.0:11434 (not just localhost)',
          'Check Windows Defender or antivirus blocking connections',
          'Try accessing http://localhost:11434/api/tags in browser'
        ],
        severity: 'medium'
      })
    }

    if (!healthStatus.details.proxyConnection && healthStatus.connectionMethod === 'proxy') {
      diagnostics.push({
        issue: 'Proxy Connection Issues',
        description: 'Proxy connection is working but may have limitations',
        solutions: [
          'Direct connection preferred for better performance',
          'Check Ollama proxy configuration in Next.js API routes',
          'Verify CORS settings are properly configured'
        ],
        severity: 'low'
      })
    }

    if (healthStatus.modelCount === 0) {
      diagnostics.push({
        issue: 'No Models Available',
        description: 'Ollama service is running but no models are installed',
        solutions: [
          'Install a model: "ollama pull llama3.2:3b"',
          'Install recommended models: "ollama pull mistral:7b"',
          'Check available models: "ollama list"',
          'Visit https://ollama.ai/library for model options'
        ],
        severity: 'high'
      })
    }

    return diagnostics
  }

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (isLoading && !healthStatus) {
    return (
      <div className={`p-6 border rounded-lg bg-white dark:bg-gray-800 miele:bg-white border-gray-200 dark:border-gray-700 miele:border-miele-silver ${className}`}>
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500 miele:text-miele-red" />
          <span className="text-gray-600 dark:text-gray-300 miele:text-miele-charcoal">Checking Ollama service status...</span>
        </div>
      </div>
    )
  }

  const diagnostics = getDiagnostics()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Status Card */}
      <div className={`p-6 border rounded-lg ${healthStatus ? getStatusColor(healthStatus.status) : 'bg-gray-50 dark:bg-gray-800 miele:bg-miele-cream border-gray-200 dark:border-gray-700 miele:border-miele-silver'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {healthStatus && getStatusIcon(healthStatus.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white miele:text-miele-charcoal">Ollama Service Status</h3>
              <p className="text-sm opacity-75">
                {healthStatus?.status === 'healthy' && 'All systems operational'}
                {healthStatus?.status === 'degraded' && 'Service running with issues'}
                {healthStatus?.status === 'unhealthy' && 'Service unavailable'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50 miele:hover:bg-miele-cream/80 rounded-lg transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50 miele:hover:bg-miele-cream/80 rounded-lg transition-colors"
              title="Show diagnostics"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Connection Details */}
        {healthStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              {getConnectionMethodIcon(healthStatus.connectionMethod)}
              <div>
                <p className="text-xs uppercase font-medium opacity-75">Connection</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">{healthStatus.connectionMethod}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-600 dark:text-gray-400 miele:text-miele-charcoal" />
              <div>
                <p className="text-xs uppercase font-medium opacity-75">Models</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">{healthStatus.modelCount}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 miele:text-miele-charcoal" />
              <div>
                <p className="text-xs uppercase font-medium opacity-75">Response Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">{formatResponseTime(healthStatus.details.responseTime)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400 miele:text-miele-charcoal" />
              <div>
                <p className="text-xs uppercase font-medium opacity-75">Last Check</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">{lastRefresh.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {healthStatus?.errors && healthStatus.errors.length > 0 && (
          <div className="bg-white/50 dark:bg-gray-700/50 miele:bg-white/80 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white miele:text-miele-charcoal">Issues Detected:</p>
            <ul className="text-sm space-y-1">
              {healthStatus.errors.map((error, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <XCircle className="w-3 h-3 mt-0.5 text-red-500 miele:text-miele-red flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200 miele:text-miele-charcoal">{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics.length > 0 && (
        <div className="border rounded-lg bg-white dark:bg-gray-800 miele:bg-white border-gray-200 dark:border-gray-700 miele:border-miele-silver">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 miele:bg-miele-cream border-gray-200 dark:border-gray-600 miele:border-miele-silver">
            <h4 className="font-medium flex items-center space-x-2 text-gray-900 dark:text-white miele:text-miele-charcoal">
              <Info className="w-4 h-4" />
              <span>Diagnostics & Solutions</span>
            </h4>
          </div>
          <div className="p-4 space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="border rounded-lg p-4 border-gray-200 dark:border-gray-600 miele:border-miele-silver">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-red-600 dark:text-red-400 miele:text-miele-red">{diagnostic.issue}</h5>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    diagnostic.severity === 'high' ? 'bg-red-100 text-red-700 miele:bg-red-50 miele:text-miele-red' :
                    diagnostic.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 miele:bg-yellow-50 miele:text-yellow-700' :
                    'bg-blue-100 text-blue-700 miele:bg-blue-50 miele:text-blue-700'
                  }`}>
                    {diagnostic.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 miele:text-miele-charcoal/70 mb-3">{diagnostic.description}</p>
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white miele:text-miele-charcoal">Solutions:</p>
                  <ul className="text-sm space-y-1">
                    {diagnostic.solutions.map((solution, sIndex) => (
                      <li key={sIndex} className="flex items-start space-x-2">
                        <span className="text-blue-500 miele:text-miele-red mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-200 miele:text-miele-charcoal">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model List */}
      {showDetails && models.length > 0 && (
        <div className="border rounded-lg bg-white dark:bg-gray-800 miele:bg-white border-gray-200 dark:border-gray-700 miele:border-miele-silver">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 miele:bg-miele-cream border-gray-200 dark:border-gray-600 miele:border-miele-silver">
            <h4 className="font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">Available Models</h4>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-600 miele:divide-miele-silver">
            {models.map((model, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 miele:hover:bg-miele-cream/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-gray-900 dark:text-white miele:text-miele-charcoal">{model.name}</h5>
                      {model.size && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 miele:text-miele-charcoal/70 bg-gray-100 dark:bg-gray-600 miele:bg-miele-silver/20 px-2 py-1 rounded">
                          {formatBytes(model.size)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 miele:text-miele-charcoal/70 mt-1">
                      {getModelDescription(model.name)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getModelCapabilities(model.name).map((capability, capIndex) => (
                        <span 
                          key={capIndex}
                          className="text-xs bg-blue-100 dark:bg-blue-900/30 miele:bg-miele-red/10 text-blue-700 dark:text-blue-300 miele:text-miele-red px-2 py-1 rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 miele:text-green-600" />
                    <span className="text-sm text-green-600 dark:text-green-400 miele:text-green-700">Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="https://ollama.ai/download"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-blue-600" />
          <span className="text-blue-600 font-medium">Download Ollama</span>
        </a>
        
        <a
          href="https://ollama.ai/library"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
        >
          <Database className="w-4 h-4 text-purple-600" />
          <span className="text-purple-600 font-medium">Browse Models</span>
        </a>
        
        <button
          onClick={() => window.open('http://localhost:11434/api/tags', '_blank')}
          className="flex items-center justify-center space-x-2 p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
        >
          <Server className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">Test Direct Connection</span>
        </button>
      </div>
    </div>
  )
}
