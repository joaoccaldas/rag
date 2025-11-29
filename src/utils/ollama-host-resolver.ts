/**
 * Ollama Host Resolution Utility
 * Dynamically resolves the correct Ollama host based on deployment environment
 */

export interface OllamaHostConfig {
  host: string
  port: number
  protocol: 'http' | 'https'
  isReachable: boolean
  lastChecked: number
}

export class OllamaHostResolver {
  private static instance: OllamaHostResolver
  private hostConfigs: OllamaHostConfig[] = []
  private activeHost: OllamaHostConfig | null = null
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.initializeHosts()
  }

  public static getInstance(): OllamaHostResolver {
    if (!OllamaHostResolver.instance) {
      OllamaHostResolver.instance = new OllamaHostResolver()
    }
    return OllamaHostResolver.instance
  }

  /**
   * Initialize potential host configurations
   */
  private initializeHosts(): void {
    // Get the current window location to determine network context
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    
    // For network access, prioritize the environment variable
    const envHost = process.env['NEXT_PUBLIC_OLLAMA_HOST']
    const envPort = parseInt(process.env['NEXT_PUBLIC_OLLAMA_PORT'] || '11434')
    
    this.hostConfigs = [
      // Environment variable override (highest priority)
      ...(envHost ? [{
        host: envHost,
        port: envPort,
        protocol: 'http' as const,
        isReachable: false,
        lastChecked: 0
      }] : []),
      
      // Current machine IP (for network access)
      ...(currentHost !== 'localhost' && currentHost !== '127.0.0.1' ? [{
        host: currentHost,
        port: 11434,
        protocol: 'http' as const,
        isReachable: false,
        lastChecked: 0
      }] : []),
      // Localhost fallback
      {
        host: 'localhost',
        port: 11434,
        protocol: 'http',
        isReachable: false,
        lastChecked: 0
      },
      // Alternative ports
      {
        host: currentHost,
        port: 11435,
        protocol: 'http',
        isReachable: false,
        lastChecked: 0
      }
    ]
  }

  /**
   * Get the current active Ollama URL
   */
  public async getOllamaUrl(): Promise<string> {
    // Return cached active host if recent
    if (this.activeHost && this.isRecentlyChecked(this.activeHost)) {
      return this.buildUrl(this.activeHost)
    }

    // Find working host
    const workingHost = await this.findWorkingHost()
    if (workingHost) {
      this.activeHost = workingHost
      return this.buildUrl(workingHost)
    }

    // Fallback to localhost
    console.warn('🚨 No working Ollama host found, falling back to localhost')
    return 'http://localhost:11434'
  }

  /**
   * Find the first working host configuration
   */
  private async findWorkingHost(): Promise<OllamaHostConfig | null> {
    const checkPromises = this.hostConfigs.map(config => this.checkHostReachability(config))
    const results = await Promise.allSettled(checkPromises)

    for (let i = 0; i < results.length; i++) {
      const config = this.hostConfigs[i]
      if (results[i]?.status === 'fulfilled' && config?.isReachable) {
        console.log(`✅ Found working Ollama host: ${this.buildUrl(config)}`)
        return config
      }
    }

    return null
  }

  /**
   * Check if a specific host configuration is reachable
   */
  private async checkHostReachability(config: OllamaHostConfig): Promise<void> {
    const url = `${config.protocol}://${config.host}:${config.port}/api/tags`
    const timeout = 3000 // 3 second timeout

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      config.isReachable = response.ok
      config.lastChecked = Date.now()

      console.log(`🔍 Host check: ${url} - ${response.ok ? 'OK' : 'Failed'}`)
    } catch (error) {
      config.isReachable = false
      config.lastChecked = Date.now()
      console.log(`❌ Host unreachable: ${url} - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build URL from host configuration
   */
  private buildUrl(config: OllamaHostConfig): string {
    return `${config.protocol}://${config.host}:${config.port}`
  }

  /**
   * Check if host was recently verified (within 30 seconds)
   */
  private isRecentlyChecked(config: OllamaHostConfig): boolean {
    return Date.now() - config.lastChecked < 30000
  }

  /**
   * Start periodic health checking
   */
  public startHealthCheck(): void {
    if (this.checkInterval) return

    this.checkInterval = setInterval(async () => {
      await this.findWorkingHost()
    }, 60000) // Check every minute
  }

  /**
   * Stop periodic health checking
   */
  public stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Get all host configurations for debugging
   */
  public getHostConfigs(): OllamaHostConfig[] {
    return [...this.hostConfigs]
  }

  /**
   * Manually set active host (for testing)
   */
  public setActiveHost(host: string, port: number = 11434): void {
    this.activeHost = {
      host,
      port,
      protocol: 'http',
      isReachable: true,
      lastChecked: Date.now()
    }
  }
}

// Singleton instance
export const ollamaHostResolver = OllamaHostResolver.getInstance()

/**
 * Helper function for easy access
 */
export async function getOllamaBaseUrl(): Promise<string> {
  return await ollamaHostResolver.getOllamaUrl()
}

/**
 * Create Ollama API URL with endpoint
 */
export async function createOllamaUrl(endpoint: string): Promise<string> {
  const baseUrl = await getOllamaBaseUrl()
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}
