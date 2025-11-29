/**
 * Network Debug Component
 * Shows current network configuration and connection status
 */

"use client"

import React, { useState, useEffect } from 'react'
import { getNetworkConfig, getOllamaApiUrl, getOllamaProxyUrl, testOllamaConnection, NetworkConfig } from '../../utils/network-config'

export function NetworkDebugPanel() {
  const [config, setConfig] = useState<NetworkConfig | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    directConnection: boolean
    proxyConnection: boolean
    error?: string
  } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const networkConfig = getNetworkConfig()
    setConfig(networkConfig)
    
    // Test connections on mount
    testOllamaConnection().then(setConnectionStatus)
  }, [])

  const handleRetest = async () => {
    setConnectionStatus(null)
    const result = await testOllamaConnection()
    setConnectionStatus(result)
  }

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        🌐 Network Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg border rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Network Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      {config && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Configuration:</h4>
          <div className="text-sm space-y-1">
            <div>Ollama: {config.ollamaProtocol}://{config.ollamaHost}:{config.ollamaPort}</div>
            <div>Dashboard: {config.dashboardHost}:{config.dashboardPort}</div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-medium mb-2">Generated URLs:</h4>
        <div className="text-sm space-y-1">
          <div className="break-all">Direct: {getOllamaApiUrl('/api/tags')}</div>
          <div className="break-all">Proxy: {getOllamaProxyUrl('/api/tags')}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Connection Status:</h4>
          <button 
            onClick={handleRetest}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Retest
          </button>
        </div>
        {connectionStatus ? (
          <div className="text-sm space-y-1">
            <div className={connectionStatus.directConnection ? 'text-green-600' : 'text-red-600'}>
              Direct: {connectionStatus.directConnection ? '✅ Connected' : '❌ Failed'}
            </div>
            <div className={connectionStatus.proxyConnection ? 'text-green-600' : 'text-red-600'}>
              Proxy: {connectionStatus.proxyConnection ? '✅ Connected' : '❌ Failed'}
            </div>
            {connectionStatus.error && (
              <div className="text-red-600 text-xs">{connectionStatus.error}</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Testing connections...</div>
        )}
      </div>
    </div>
  )
}
