console.log('🌐 Network Configuration Test')
console.log('='.repeat(40))

// Test environment variables
console.log('Environment Variables:')
console.log('  NEXT_PUBLIC_OLLAMA_HOST:', process.env.NEXT_PUBLIC_OLLAMA_HOST || 'NOT SET')
console.log('  NEXT_PUBLIC_OLLAMA_PORT:', process.env.NEXT_PUBLIC_OLLAMA_PORT || 'NOT SET')
console.log('  NEXT_PUBLIC_OLLAMA_PROTOCOL:', process.env.NEXT_PUBLIC_OLLAMA_PROTOCOL || 'NOT SET')

// Test current location
if (typeof window !== 'undefined') {
  console.log('\nBrowser Context:')
  console.log('  Current Host:', window.location.hostname)
  console.log('  Current Port:', window.location.port)
  console.log('  Current Protocol:', window.location.protocol)
  console.log('  Full URL:', window.location.href)
} else {
  console.log('\nServer Context: Running in Node.js environment')
}

// Test network configuration
import { getNetworkConfig, getOllamaApiUrl, getOllamaProxyUrl } from '../utils/network-config'

const config = getNetworkConfig()
console.log('\nGenerated Network Config:')
console.log('  Ollama Host:', config.ollamaHost)
console.log('  Ollama Port:', config.ollamaPort)
console.log('  Dashboard Host:', config.dashboardHost)
console.log('  Dashboard Port:', config.dashboardPort)

const directUrl = getOllamaApiUrl('/api/tags')
const proxyUrl = getOllamaProxyUrl('/api/tags')

console.log('\nGenerated URLs:')
console.log('  Direct Ollama URL:', directUrl)
console.log('  Proxy URL:', proxyUrl)

console.log('\n' + '='.repeat(40))
