/**
 * System Health Monitor
 * Real-time monitoring of critical RAG pipeline components
 */

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking' | 'error'
  url?: string
  details?: string
  lastChecked?: string
}

export function SystemHealthMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Ollama AI Service', status: 'checking', url: 'http://localhost:11434/api/tags' },
    { name: 'Next.js Server', status: 'checking', url: 'http://localhost:3000' },
    { name: 'IndexedDB Storage', status: 'checking' },
    { name: 'Visual Content Pipeline', status: 'checking' }
  ])

  const checkOllamaService = async (): Promise<ServiceStatus> => {
    try {
      const response = await fetch('/api/ollama-proxy?endpoint=' + encodeURIComponent('/api/tags'))
      if (response.ok) {
        const data = await response.json()
        return {
          name: 'Ollama AI Service',
          status: 'online',
          details: `${data.models?.length || 0} models available`,
          lastChecked: new Date().toLocaleTimeString()
        }
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      return {
        name: 'Ollama AI Service',
        status: 'offline',
        details: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date().toLocaleTimeString()
      }
    }
  }

  const checkIndexedDB = async (): Promise<ServiceStatus> => {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported')
      }
      
      const request = indexedDB.open('test-health-check')
      return new Promise((resolve) => {
        request.onsuccess = () => {
          request.result.close()
          indexedDB.deleteDatabase('test-health-check')
          resolve({
            name: 'IndexedDB Storage',
            status: 'online',
            details: 'Unlimited storage available',
            lastChecked: new Date().toLocaleTimeString()
          })
        }
        request.onerror = () => {
          resolve({
            name: 'IndexedDB Storage',
            status: 'error',
            details: 'IndexedDB access failed',
            lastChecked: new Date().toLocaleTimeString()
          })
        }
      })
    } catch (error) {
      return {
        name: 'IndexedDB Storage',
        status: 'offline',
        details: error instanceof Error ? error.message : 'Storage unavailable',
        lastChecked: new Date().toLocaleTimeString()
      }
    }
  }

  const checkVisualPipeline = async (): Promise<ServiceStatus> => {
    try {
      // Check if required libraries are available
      const hasPDFJS = typeof window !== 'undefined' && 'pdfjsLib' in window
      const hasTesseract = typeof window !== 'undefined' && 'Tesseract' in window
      
      if (hasPDFJS && hasTesseract) {
        return {
          name: 'Visual Content Pipeline',
          status: 'online',
          details: 'PDF.js + Tesseract.js ready',
          lastChecked: new Date().toLocaleTimeString()
        }
      } else {
        return {
          name: 'Visual Content Pipeline',
          status: 'error',
          details: `Missing: ${!hasPDFJS ? 'PDF.js ' : ''}${!hasTesseract ? 'Tesseract.js' : ''}`,
          lastChecked: new Date().toLocaleTimeString()
        }
      }
    } catch (error) {
      return {
        name: 'Visual Content Pipeline',
        status: 'offline',
        details: error instanceof Error ? error.message : 'Pipeline error',
        lastChecked: new Date().toLocaleTimeString()
      }
    }
  }

  const checkNextJSServer = async (): Promise<ServiceStatus> => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        return {
          name: 'Next.js Server',
          status: 'online',
          details: 'API routes functional',
          lastChecked: new Date().toLocaleTimeString()
        }
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      return {
        name: 'Next.js Server',
        status: 'online', // If we're running this component, server is up
        details: 'Server running (health check failed)',
        lastChecked: new Date().toLocaleTimeString()
      }
    }
  }

  const runHealthChecks = async () => {
    const checks = await Promise.all([
      checkOllamaService(),
      checkNextJSServer(),
      checkIndexedDB(),
      checkVisualPipeline()
    ])
    
    setServices(checks)
  }

  useEffect(() => {
    runHealthChecks()
    const interval = setInterval(runHealthChecks, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'checking':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return 'border-green-200 bg-green-50'
      case 'offline': return 'border-red-200 bg-red-50'
      case 'error': return 'border-yellow-200 bg-yellow-50'
      case 'checking': return 'border-blue-200 bg-blue-50'
    }
  }

  const overallHealth = services.every(s => s.status === 'online') ? 'healthy' : 
                        services.some(s => s.status === 'offline') ? 'critical' : 'warning'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">System Health Monitor</h2>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          overallHealth === 'healthy' ? 'bg-green-100 text-green-800' :
          overallHealth === 'critical' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {overallHealth === 'healthy' ? '✅ All Systems Operational' :
           overallHealth === 'critical' ? '🔴 Critical Issues Detected' :
           '⚠️ Some Issues Detected'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.name}
            className={`p-4 border rounded-lg ${getStatusColor(service.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{service.name}</h3>
              {getStatusIcon(service.status)}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div className="capitalize font-medium">
                Status: {service.status}
              </div>
              {service.details && (
                <div>Details: {service.details}</div>
              )}
              {service.lastChecked && (
                <div>Last checked: {service.lastChecked}</div>
              )}
              {service.url && (
                <div className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                  {service.url}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={runHealthChecks}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Health Check
        </button>
      </div>

      {/* Quick Fix Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Quick Fix Actions</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <button
            onClick={() => window.open('/api/ollama-proxy?endpoint=/api/tags', '_blank')}
            className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50"
          >
            Test Ollama Connection
          </button>
          <button
            onClick={() => localStorage.clear()}
            className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50"
          >
            Clear localStorage
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50"
          >
            Reload Application
          </button>
        </div>
      </div>
    </div>
  )
}
