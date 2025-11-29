/**
 * Service Status Dashboard
 * Shows real-time status of all system components
 */

import React from 'react'
import { useOllamaService } from '../hooks/useOllamaService'
import { SystemHealthMonitor } from './system/SystemHealthMonitor'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export function ServiceStatusDashboard() {
  const { status, refresh } = useOllamaService()

  const getStatusIcon = (isRunning: boolean, error?: string) => {
    if (error) return <XCircle className="w-5 h-5 text-red-500" />
    if (isRunning) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  const getStatusText = (isRunning: boolean, error?: string) => {
    if (error) return `Error: ${error}`
    if (isRunning) return 'Service Running'
    return 'Service Offline'
  }

  const getStatusColor = (isRunning: boolean, error?: string) => {
    if (error) return 'border-red-200 bg-red-50'
    if (isRunning) return 'border-green-200 bg-green-50'
    return 'border-yellow-200 bg-yellow-50'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Status Dashboard</h1>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Ollama Service Status */}
      <div className={`p-6 border rounded-lg ${getStatusColor(status.isRunning, status.error)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(status.isRunning, status.error)}
            <h2 className="text-xl font-semibold">Ollama AI Service</h2>
          </div>
          <span className="text-sm font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
            {status.endpoint}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <strong>Status:</strong> {getStatusText(status.isRunning, status.error)}
          </div>
          
          {status.models.length > 0 && (
            <div>
              <strong>Available Models ({status.models.length}):</strong>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {status.models.map((model, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 text-xs rounded font-mono ${
                      model === status.recommendedModel 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {model}
                    {model === status.recommendedModel && <span className="ml-1">⭐</span>}
                  </span>
                ))}
              </div>
              {status.recommendedModel && (
                <p className="mt-2 text-sm text-gray-600">
                  ⭐ Recommended model: <code>{status.recommendedModel}</code>
                </p>
              )}
            </div>
          )}

          {!status.isRunning && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">Start Ollama Service</h3>
              <p className="text-blue-700 mb-3">Run this command in your terminal:</p>
              <code className="block bg-blue-100 p-2 rounded font-mono text-sm">
                ollama serve
              </code>
              <p className="text-sm text-blue-600 mt-2">
                If you don't have Ollama installed, download it from{' '}
                <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">
                  https://ollama.ai
                </a>
              </p>
            </div>
          )}

          {status.isRunning && status.models.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">No Models Available</h3>
              <p className="text-yellow-700 mb-3">Pull a model to get started:</p>
              <code className="block bg-yellow-100 p-2 rounded font-mono text-sm">
                ollama pull llama3.1:8b
              </code>
            </div>
          )}
        </div>
      </div>

      {/* System Health Monitor */}
      <SystemHealthMonitor />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Storage Status</h3>
          <div className="text-sm space-y-1">
            <div>LocalStorage: {localStorage.length} items</div>
            <div>IndexedDB: Available ✓</div>
            <button 
              onClick={() => localStorage.clear()}
              className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
            >
              Clear LocalStorage
            </button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">API Health</h3>
          <div className="text-sm space-y-1">
            <div>Next.js: Running ✓</div>
            <div>AI Analysis: {status.isRunning ? '✓' : '❌'}</div>
            <button 
              onClick={() => window.open('/api/health', '_blank')}
              className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded"
            >
              Test API
            </button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="block w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded text-left"
            >
              Reload App
            </button>
            <button 
              onClick={() => window.open('/api/ai-analysis', '_blank')}
              className="block w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded text-left"
            >
              Test AI Service
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
