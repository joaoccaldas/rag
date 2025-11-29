/**
 * Network Configuration Utility
 * Provides consistent network URL generation for cross-machine access
 */

export interface NetworkConfig {
  ollamaHost: string
  ollamaPort: string
  ollamaProtocol: string
  dashboardHost: string
  dashboardPort: string
}

/**
 * Get the current network configuration based on environment and runtime context
 */
export function getNetworkConfig(): NetworkConfig {
  // For client-side, use current window location for dashboard
  const dashboardHost = typeof window !== 'undefined' 
    ? window.location.hostname 
    : 'localhost'
  
  const dashboardPort = typeof window !== 'undefined' 
    ? window.location.port || '3000'
    : '3000'

  // Use environment variables for Ollama configuration
  // Respect the configured host exactly as set in environment
  const ollamaHost = process.env['NEXT_PUBLIC_OLLAMA_HOST'] || 'localhost'
  const ollamaPort = process.env['NEXT_PUBLIC_OLLAMA_PORT'] || '11434'
  const ollamaProtocol = process.env['NEXT_PUBLIC_OLLAMA_PROTOCOL'] || 'http'

  console.log('🌐 Network Config Debug:', {
    ollamaHost,
    ollamaPort,
    ollamaProtocol,
    envHost: process.env['NEXT_PUBLIC_OLLAMA_HOST'],
    dashboardHost,
    dashboardPort
  })

  return {
    ollamaHost,
    ollamaPort,
    ollamaProtocol,
    dashboardHost,
    dashboardPort
  }
}

/**
 * Generate Ollama API URL for the current network context
 */
export function getOllamaApiUrl(endpoint: string = ''): string {
  const config = getNetworkConfig()
  const baseUrl = `${config.ollamaProtocol}://${config.ollamaHost}:${config.ollamaPort}`
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  const fullUrl = `${baseUrl}${cleanEndpoint}`
  
  if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
    console.log('🌐 Network Config:', config)
    console.log('🔗 Generated Ollama URL:', fullUrl)
  }
  
  return fullUrl
}

/**
 * Generate proxy URL for CORS-safe access
 */
export function getOllamaProxyUrl(endpoint: string = '/api/tags'): string {
  const config = getNetworkConfig()
  const baseUrl = `${config.ollamaProtocol}://${config.dashboardHost}:${config.dashboardPort}`
  
  // Clean endpoint for proxy
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const proxyUrl = `${baseUrl}/api/ollama-proxy?endpoint=${encodeURIComponent(cleanEndpoint)}`
  
  if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
    console.log('🔗 Generated Proxy URL:', proxyUrl)
  }
  
  return proxyUrl
}

/**
 * Test network connectivity to Ollama service
 */
export async function testOllamaConnection(): Promise<{
  directConnection: boolean
  proxyConnection: boolean
  error?: string
}> {
  const result: {
    directConnection: boolean
    proxyConnection: boolean
    error?: string
  } = {
    directConnection: false,
    proxyConnection: false
  }

  // Test direct connection
  try {
    const directUrl = getOllamaApiUrl('/api/tags')
    const directResponse = await fetch(directUrl, { 
      method: 'GET',
      mode: 'cors'
    })
    result.directConnection = directResponse.ok
    
    if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
      console.log('✅ Direct connection test:', result.directConnection ? 'SUCCESS' : 'FAILED')
    }
  } catch (error) {
    if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
      console.log('❌ Direct connection error:', error)
    }
  }

  // Test proxy connection
  try {
    const proxyUrl = getOllamaProxyUrl('/api/tags')
    const proxyResponse = await fetch(proxyUrl, { 
      method: 'GET'
    })
    result.proxyConnection = proxyResponse.ok
    
    if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
      console.log('✅ Proxy connection test:', result.proxyConnection ? 'SUCCESS' : 'FAILED')
    }
  } catch (error) {
    if (process.env['NEXT_PUBLIC_DEBUG_NETWORK'] === 'true') {
      console.log('❌ Proxy connection error:', error)
    }
  }

  // Set error message if both failed
  if (!result.directConnection && !result.proxyConnection) {
    result.error = 'Both direct and proxy connections failed. Check Ollama service and network configuration.'
  }

  return result
}
