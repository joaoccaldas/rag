/**
 * Enhanced Ollama Connection Manager
 * Provides robust connection handling with multiple fallback strategies
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface OllamaConnectionState {
  isConnected: boolean
  isConnecting: boolean
  connectionMethod: 'direct' | 'proxy' | 'mock' | 'none'
  lastTested: Date | null
  error: string | null
  availableModels: string[]
  retryCount: number
}

export interface OllamaConnectionConfig {
  hosts: string[]
  ports: string[]
  protocols: string[]
  timeout: number
  maxRetries: number
  retryDelay: number
}

interface OllamaModel {
  name: string
  model?: string
  modified_at?: string
  size?: number
}

interface OllamaTagsResponse {
  models: OllamaModel[]
}

const DEFAULT_CONFIG: OllamaConnectionConfig = {
  hosts: ['localhost', '127.0.0.1', '192.168.86.23'],
  ports: ['11434', '11435'],
  protocols: ['http'],
  timeout: 5000,
  maxRetries: 3,
  retryDelay: 2000
}

const MOCK_MODELS = [
  'llama3.2:3b',
  'llama3.2:1b', 
  'codellama:7b',
  'mistral:7b',
  'qwen2:7b'
]

export function useOllamaConnection(config: Partial<OllamaConnectionConfig> = {}) {
  const fullConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  
  const [state, setState] = useState<OllamaConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionMethod: 'none',
    lastTested: null,
    error: null,
    availableModels: [],
    retryCount: 0
  })

  const updateState = useCallback((updates: Partial<OllamaConnectionState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const testConnection = useCallback(async (
    host: string, 
    port: string, 
    protocol: string,
    method: 'direct' | 'proxy'
  ): Promise<{ success: boolean; models?: string[]; error?: string }> => {
    try {
      const baseUrl = method === 'direct' 
        ? `${protocol}://${host}:${port}`
        : `${protocol}://${window.location.hostname}:${window.location.port || '3000'}`
      
      const endpoint = method === 'direct' 
        ? '/api/tags'
        : `/api/ollama-proxy?endpoint=${encodeURIComponent('/api/tags')}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), fullConfig.timeout)
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: OllamaTagsResponse = await response.json()
      const models = data.models?.map((m: OllamaModel) => m.name) || []
      
      return { success: true, models }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [fullConfig.timeout])

  const attemptConnection = useCallback(async (): Promise<void> => {
    updateState({ isConnecting: true, error: null })
    
    // Try all combinations of host/port with direct connection first
    for (const protocol of fullConfig.protocols) {
      for (const host of fullConfig.hosts) {
        for (const port of fullConfig.ports) {
          console.log(`🔄 Testing direct connection: ${protocol}://${host}:${port}`)
          
          const result = await testConnection(host, port, protocol, 'direct')
          if (result.success) {
            console.log(`✅ Direct connection successful: ${protocol}://${host}:${port}`)
            updateState({
              isConnected: true,
              isConnecting: false,
              connectionMethod: 'direct',
              lastTested: new Date(),
              availableModels: result.models || [],
              retryCount: 0,
              error: null
            })
            return
          }
        }
      }
    }
    
    // Try proxy connection
    console.log('🔄 Testing proxy connection...')
    const proxyResult = await testConnection('localhost', '3000', 'http', 'proxy')
    if (proxyResult.success) {
      console.log('✅ Proxy connection successful')
      updateState({
        isConnected: true,
        isConnecting: false,
        connectionMethod: 'proxy',
        lastTested: new Date(),
        availableModels: proxyResult.models || [],
        retryCount: 0,
        error: null
      })
      return
    }
    
    // Fallback to mock mode for development
    console.log('⚠️ All connections failed, using mock mode')
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      connectionMethod: 'mock',
      lastTested: new Date(),
      availableModels: MOCK_MODELS,
      retryCount: prev.retryCount + 1,
      error: 'Using mock mode - Ollama service not available'
    }))
  }, [fullConfig, testConnection, updateState])

  const retry = useCallback(async () => {
    setState(currentState => {
      if (currentState.retryCount < fullConfig.maxRetries) {
        setTimeout(attemptConnection, fullConfig.retryDelay)
        return currentState
      } else {
        return {
          ...currentState,
          isConnecting: false,
          error: `Maximum retry attempts (${fullConfig.maxRetries}) exceeded. Please check Ollama service.`
        }
      }
    })
  }, [fullConfig.maxRetries, fullConfig.retryDelay, attemptConnection])

  const disconnect = useCallback(() => {
    updateState({
      isConnected: false,
      isConnecting: false,
      connectionMethod: 'none',
      error: null,
      availableModels: [],
      retryCount: 0
    })
  }, [updateState])

  const forceReconnect = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }))
    attemptConnection()
  }, [attemptConnection])

  // Auto-connect on mount (only once)
  useEffect(() => {
    const hosts = fullConfig.hosts
    const ports = fullConfig.ports
    const protocols = fullConfig.protocols
    const timeout = fullConfig.timeout
    
    const initConnection = async () => {
      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      
      // Try all combinations of host/port with direct connection first
      for (const protocol of protocols) {
        for (const host of hosts) {
          for (const port of ports) {
            console.log(`🔄 Testing direct connection: ${protocol}://${host}:${port}`)
            
            try {
              const baseUrl = `${protocol}://${host}:${port}`
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), timeout)
              
              const response = await fetch(`${baseUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
              })
              
              clearTimeout(timeoutId)
              
              if (response.ok) {
                const data = await response.json()
                console.log(`✅ Direct connection successful: ${protocol}://${host}:${port}`)
                setState(prev => ({
                  ...prev,
                  isConnected: true,
                  isConnecting: false,
                  connectionMethod: 'direct',
                  lastTested: new Date(),
                  availableModels: data.models?.map((m: { name: string }) => m.name) || [],
                  retryCount: 0,
                  error: null
                }))
                return
              }
            } catch (error) {
              console.log(`❌ Direct connection failed: ${protocol}://${host}:${port}`, error)
            }
          }
        }
      }
      
      // Try proxy connection
      console.log('🔄 Testing proxy connection...')
      try {
        const proxyUrl = `http://${window.location.hostname}:${window.location.port || '3000'}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(`${proxyUrl}/api/ollama-proxy?endpoint=${encodeURIComponent('/api/tags')}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Proxy connection successful')
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            connectionMethod: 'proxy',
            lastTested: new Date(),
            availableModels: data.models?.map((m: { name: string }) => m.name) || [],
            retryCount: 0,
            error: null
          }))
          return
        }
      } catch (error) {
        console.log('❌ Proxy connection failed:', error)
      }
      
      // Fallback to mock mode for development
      console.log('⚠️ All connections failed, using mock mode')
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionMethod: 'mock',
        lastTested: new Date(),
        availableModels: MOCK_MODELS,
        retryCount: 1,
        error: 'Using mock mode - Ollama service not available'
      }))
    }
    
    initConnection()
  }, [fullConfig.hosts, fullConfig.ports, fullConfig.protocols, fullConfig.timeout])

  return {
    ...state,
    retry,
    disconnect,
    forceReconnect,
    testConnection: attemptConnection
  }
}

/**
 * Ollama Connection Status Component
 */
export function OllamaConnectionStatus() {
  const connection = useOllamaConnection()
  
  const getStatusColor = () => {
    if (connection.isConnecting) return 'text-yellow-600'
    if (connection.isConnected) {
      return connection.connectionMethod === 'mock' ? 'text-orange-600' : 'text-green-600'
    }
    return 'text-red-600'
  }
  
  const getStatusText = () => {
    if (connection.isConnecting) return 'Connecting...'
    if (connection.isConnected) {
      return `Connected (${connection.connectionMethod})`
    }
    return 'Disconnected'
  }
  
  const getStatusIcon = () => {
    if (connection.isConnecting) return '🔄'
    if (connection.isConnected) {
      return connection.connectionMethod === 'mock' ? '⚠️' : '✅'
    }
    return '❌'
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-lg">{getStatusIcon()}</span>
      <div className="flex-1">
        <p className={`font-medium ${getStatusColor()}`}>
          Ollama: {getStatusText()}
        </p>
        {connection.error && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {connection.error}
          </p>
        )}
        {connection.isConnected && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {connection.availableModels.length} models available
          </p>
        )}
      </div>
      {!connection.isConnected && !connection.isConnecting && (
        <button
          onClick={connection.forceReconnect}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
