// Configuration Management System
// Centralizes all hardcoded values with environment variable support

interface SearchConfig {
  maxPerDocument: number
  vectorThreshold: number
  defaultLimit: number
  maxBoost: number
  cacheTimeout: number
  maxCacheSize: number
}

interface UIConfig {
  maxMessageLength: number
  maxFileSize: number
  uploadChunkSize: number
  animationDuration: number
}

interface AnalyticsConfig {
  maxHistoryEntries: number
  dataRetentionDays: number
  scoreThresholds: {
    excellent: number
    good: number
    warning: number
  }
  sampleDataEnabled: boolean
}

interface StorageConfig {
  databaseName: string
  databaseVersion: number
  cachePrefix: string
  compressionEnabled: boolean
}

interface SystemConfig {
  search: SearchConfig
  ui: UIConfig
  analytics: AnalyticsConfig
  storage: StorageConfig
}

// Default configuration with explanations
const DEFAULT_CONFIG: SystemConfig = {
  search: {
    // Maximum search results per document - balances relevance vs diversity
    maxPerDocument: parseInt(process.env.NEXT_PUBLIC_MAX_PER_DOCUMENT || '3'),
    
    // Vector similarity threshold - lower values include more results
    vectorThreshold: parseFloat(process.env.NEXT_PUBLIC_VECTOR_THRESHOLD || '0.1'),
    
    // Default search result limit - prevents overwhelming users
    defaultLimit: parseInt(process.env.NEXT_PUBLIC_SEARCH_LIMIT || '5'),
    
    // Maximum feedback boost to prevent gaming the system
    maxBoost: parseFloat(process.env.NEXT_PUBLIC_MAX_FEEDBACK_BOOST || '0.1'),
    
    // Cache timeout in milliseconds - 5 minutes default
    cacheTimeout: parseInt(process.env.NEXT_PUBLIC_CACHE_TIMEOUT || '300000'),
    
    // Maximum cache entries to prevent memory bloat
    maxCacheSize: parseInt(process.env.NEXT_PUBLIC_MAX_CACHE_SIZE || '1000')
  },
  
  ui: {
    // Maximum message length to prevent abuse and ensure readability
    maxMessageLength: parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_LENGTH || '4000'),
    
    // Maximum file upload size - 100MB default
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '104857600'),
    
    // Upload chunk size for progress tracking - 1MB default
    uploadChunkSize: parseInt(process.env.NEXT_PUBLIC_UPLOAD_CHUNK_SIZE || '1048576'),
    
    // Animation duration for smooth transitions
    animationDuration: parseInt(process.env.NEXT_PUBLIC_ANIMATION_DURATION || '300')
  },
  
  analytics: {
    // Maximum feedback history entries to store
    maxHistoryEntries: parseInt(process.env.NEXT_PUBLIC_MAX_ANALYTICS_ENTRIES || '100'),
    
    // Data retention period in days
    dataRetentionDays: parseInt(process.env.NEXT_PUBLIC_DATA_RETENTION_DAYS || '30'),
    
    // Performance score thresholds
    scoreThresholds: {
      excellent: parseFloat(process.env.NEXT_PUBLIC_EXCELLENT_THRESHOLD || '0.9'),
      good: parseFloat(process.env.NEXT_PUBLIC_GOOD_THRESHOLD || '0.8'),
      warning: parseFloat(process.env.NEXT_PUBLIC_WARNING_THRESHOLD || '0.6')
    },
    
    // Enable sample data for demonstrations
    sampleDataEnabled: process.env.NEXT_PUBLIC_SAMPLE_DATA_ENABLED === 'true'
  },
  
  storage: {
    // IndexedDB database name
    databaseName: process.env.NEXT_PUBLIC_DB_NAME || 'RAGDatabase',
    
    // Database version for migrations
    databaseVersion: parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1'),
    
    // Cache key prefix to avoid conflicts
    cachePrefix: process.env.NEXT_PUBLIC_CACHE_PREFIX || 'rag_',
    
    // Enable compression for large documents
    compressionEnabled: process.env.NEXT_PUBLIC_COMPRESSION_ENABLED !== 'false'
  }
}

// Configuration validation
function validateConfig(config: SystemConfig): void {
  const errors: string[] = []
  
  // Validate search config
  if (config.search.maxPerDocument < 1 || config.search.maxPerDocument > 10) {
    errors.push('search.maxPerDocument must be between 1 and 10')
  }
  
  if (config.search.vectorThreshold < 0 || config.search.vectorThreshold > 1) {
    errors.push('search.vectorThreshold must be between 0 and 1')
  }
  
  if (config.search.maxBoost < 0 || config.search.maxBoost > 1) {
    errors.push('search.maxBoost must be between 0 and 1')
  }
  
  // Validate UI config
  if (config.ui.maxMessageLength < 100 || config.ui.maxMessageLength > 10000) {
    errors.push('ui.maxMessageLength must be between 100 and 10000')
  }
  
  if (config.ui.maxFileSize < 1048576 || config.ui.maxFileSize > 1073741824) { // 1MB to 1GB
    errors.push('ui.maxFileSize must be between 1MB and 1GB')
  }
  
  // Validate analytics config
  if (config.analytics.maxHistoryEntries < 10 || config.analytics.maxHistoryEntries > 10000) {
    errors.push('analytics.maxHistoryEntries must be between 10 and 10000')
  }
  
  const { excellent, good, warning } = config.analytics.scoreThresholds
  if (excellent <= good || good <= warning || warning < 0 || excellent > 1) {
    errors.push('analytics.scoreThresholds must be ordered: 0 < warning < good < excellent <= 1')
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
  }
}

// Singleton pattern for global config access
class ConfigurationManager {
  private static instance: ConfigurationManager
  private config: SystemConfig
  
  private constructor() {
    this.config = { ...DEFAULT_CONFIG }
    this.validateAndInit()
  }
  
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager()
    }
    return ConfigurationManager.instance
  }
  
  private validateAndInit(): void {
    try {
      validateConfig(this.config)
    } catch (error) {
      console.error('Configuration validation failed:', error)
      // Fall back to safe defaults
      this.config = { ...DEFAULT_CONFIG }
    }
  }
  
  public getConfig(): SystemConfig {
    return this.config
  }
  
  public getSearchConfig(): SearchConfig {
    return this.config.search
  }
  
  public getUIConfig(): UIConfig {
    return this.config.ui
  }
  
  public getAnalyticsConfig(): AnalyticsConfig {
    return this.config.analytics
  }
  
  public getStorageConfig(): StorageConfig {
    return this.config.storage
  }
  
  // Runtime configuration updates (for admin panel)
  public updateSearchConfig(updates: Partial<SearchConfig>): void {
    this.config.search = { ...this.config.search, ...updates }
    validateConfig(this.config)
  }
  
  public updateUIConfig(updates: Partial<UIConfig>): void {
    this.config.ui = { ...this.config.ui, ...updates }
    validateConfig(this.config)
  }
  
  public updateAnalyticsConfig(updates: Partial<AnalyticsConfig>): void {
    this.config.analytics = { ...this.config.analytics, ...updates }
    validateConfig(this.config)
  }
  
  // Export current config for backup/restore
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }
  
  // Import config from backup
  public importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson) as SystemConfig
      validateConfig(importedConfig)
      this.config = importedConfig
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`)
    }
  }
}

// Export singleton instance and helper functions
export const config = ConfigurationManager.getInstance()

// Convenient getters for common use cases
export const getSearchConfig = () => config.getSearchConfig()
export const getUIConfig = () => config.getUIConfig() 
export const getAnalyticsConfig = () => config.getAnalyticsConfig()
export const getStorageConfig = () => config.getStorageConfig()

// Type exports
export type { SystemConfig, SearchConfig, UIConfig, AnalyticsConfig, StorageConfig }
