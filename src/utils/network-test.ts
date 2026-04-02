
// Test environment variables

// Test current location
if (typeof window !== 'undefined') {
} else {
}

// Test network configuration
import { getNetworkConfig, getOllamaApiUrl, getOllamaProxyUrl } from '../utils/network-config'

const config = getNetworkConfig()

const directUrl = getOllamaApiUrl('/api/tags')
const proxyUrl = getOllamaProxyUrl('/api/tags')


