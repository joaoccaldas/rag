/**
 * Enhanced Error Handling & Recovery System
 * 
 * Provides comprehensive error handling, retry mechanisms, and recovery strategies
 * for the RAG pipeline. Includes graceful degradation, circuit breaker patterns,
 * and user-friendly error messaging.
 * 
 * Features:
 * - Centralized error classification and handling
 * - Automatic retry with exponential backoff
 * - Circuit breaker for external services
 * - Graceful degradation strategies
 * - Error reporting and analytics
 * - Recovery suggestions and actions
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  PARSING = 'parsing',
  STORAGE = 'storage',
  PROCESSING = 'processing',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  operation: string
  documentId?: string
  userId?: string
  timestamp: number
  userAgent?: string
  sessionId?: string
  retryAttempt?: number
  additionalData?: Record<string, unknown>
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'manual' | 'refresh'
  label: string
  description: string
  action: () => Promise<void> | void
  priority: number
}

export interface RAGError extends Error {
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  originalError?: Error
  recoveryActions?: RecoveryAction[]
  userMessage?: string
  technicalDetails?: string
  isRetryable: boolean
  retryAfter?: number
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  exponentialBase: number
  jitter: boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringWindow: number
}

export class RAGErrorRecovery {
  private errorHistory: Map<string, RAGError[]> = new Map()
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private retryConfig: RetryConfig
  private circuitBreakerConfig: CircuitBreakerConfig

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    circuitBreakerConfig: Partial<CircuitBreakerConfig> = {}
  ) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      jitter: true,
      ...retryConfig
    }

    this.circuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringWindow: 300000,
      ...circuitBreakerConfig
    }
  }

  /**
   * Create a standardized RAG error
   */
  createError(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: Partial<ErrorContext>,
    originalError?: Error
  ): RAGError {
    const ragError: RAGError = {
      name: 'RAGError',
      message,
      code,
      category,
      severity,
      context: {
        operation: context.operation || 'unknown',
        timestamp: Date.now(),
        retryAttempt: 0,
        ...context
      },
      originalError,
      isRetryable: this.isRetryableError(category, code),
      stack: originalError?.stack || new Error().stack
    }

    // Add user-friendly messages and recovery actions
    this.enhanceErrorWithRecovery(ragError)
    
    // Log error for monitoring
    this.logError(ragError)

    return ragError
  }

  /**
   * Execute operation with automatic retry and error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig }
    const serviceKey = context.operation || 'default'

    // Check circuit breaker
    if (this.isCircuitOpen(serviceKey)) {
      throw this.createError(
        'Service temporarily unavailable',
        'CIRCUIT_OPEN',
        ErrorCategory.SERVICE_UNAVAILABLE,
        ErrorSeverity.HIGH,
        context
      )
    }

    let lastError: unknown
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation()
        
        // Success - reset circuit breaker
        this.recordSuccess(serviceKey)
        return result

      } catch (error) {
        lastError = error
        
        // Record failure for circuit breaker
        this.recordFailure(serviceKey)

        const ragError = error instanceof Error && 'category' in error 
          ? error as RAGError
          : this.createError(
              error instanceof Error ? error.message : 'Unknown error',
              'OPERATION_FAILED',
              this.categorizeError(error),
              ErrorSeverity.MEDIUM,
              { ...context, retryAttempt: attempt },
              error instanceof Error ? error : undefined
            )

        // Don't retry if not retryable or circuit is open
        if (!ragError.isRetryable || attempt === config.maxAttempts || this.isCircuitOpen(serviceKey)) {
          throw ragError
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config)
        console.log(`🔄 Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms for ${context.operation}`)
        
        await this.sleep(delay)
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError instanceof Error ? lastError : new Error('Unknown error occurred')
  }

  /**
   * Execute operation with fallback
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryOperation, context)
    } catch (primaryError) {
      console.warn(`Primary operation failed, trying fallback for ${context.operation}:`, primaryError)
      
      try {
        return await fallbackOperation()
      } catch (fallbackError) {
        // Create combined error with both failures
        throw this.createError(
          `Both primary and fallback operations failed`,
          'FALLBACK_FAILED',
          ErrorCategory.PROCESSING,
          ErrorSeverity.HIGH,
          context,
          fallbackError instanceof Error ? fallbackError : undefined
        )
      }
    }
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getErrorDisplay(error: RAGError): {
    title: string
    message: string
    recoveryActions: RecoveryAction[]
    severity: ErrorSeverity
  } {
    return {
      title: this.getErrorTitle(error),
      message: error.userMessage || error.message,
      recoveryActions: error.recoveryActions || [],
      severity: error.severity
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(timeWindow: number = 3600000): {
    totalErrors: number
    errorsByCategory: Record<ErrorCategory, number>
    errorsBySeverity: Record<ErrorSeverity, number>
    mostCommonErrors: Array<{ code: string, count: number }>
    circuitBreakerStatus: Record<string, string>
  } {
    const now = Date.now()
    const cutoff = now - timeWindow
    
    let totalErrors = 0
    const errorsByCategory = Object.values(ErrorCategory).reduce((acc, cat) => {
      acc[cat] = 0
      return acc
    }, {} as Record<ErrorCategory, number>)
    
    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, sev) => {
      acc[sev] = 0
      return acc
    }, {} as Record<ErrorSeverity, number>)
    
    const errorCounts: Record<string, number> = {}

    // Initialize counts - no longer needed since we're using reduce above

    // Count errors in time window
    this.errorHistory.forEach(errors => {
      errors.forEach(error => {
        if (error.context.timestamp >= cutoff) {
          totalErrors++
          errorsByCategory[error.category]++
          errorsBySeverity[error.severity]++
          errorCounts[error.code] = (errorCounts[error.code] || 0) + 1
        }
      })
    })

    // Get most common errors
    const mostCommonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }))

    // Get circuit breaker status
    const circuitBreakerStatus: Record<string, string> = {}
    this.circuitBreakers.forEach((state, service) => {
      circuitBreakerStatus[service] = state.state
    })

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      mostCommonErrors,
      circuitBreakerStatus
    }
  }

  /**
   * Clear error history (useful for testing or cleanup)
   */
  clearErrorHistory(): void {
    this.errorHistory.clear()
    this.circuitBreakers.clear()
    console.log('🧹 Cleared error recovery history')
  }

  // Private methods

  private enhanceErrorWithRecovery(error: RAGError): void {
    // Add user-friendly message
    error.userMessage = this.getUserFriendlyMessage(error)
    
    // Add recovery actions based on error type
    error.recoveryActions = this.generateRecoveryActions(error)
    
    // Set retry timing if applicable
    if (error.isRetryable) {
      error.retryAfter = this.calculateDelay(1, this.retryConfig)
    }
  }

  private getUserFriendlyMessage(error: RAGError): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'Unable to connect to the service. Please check your internet connection.',
      PARSING_ERROR: 'There was an issue processing your document. The file might be corrupted or in an unsupported format.',
      STORAGE_ERROR: 'Unable to save your data. Please try again or contact support if the issue persists.',
      RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
      QUOTA_EXCEEDED: 'Usage limit reached. Please upgrade your plan or try again later.',
      SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again in a few minutes.',
      VALIDATION_ERROR: 'The provided data is invalid. Please check your input and try again.',
      AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.'
    }

    return messages[error.code] || 'An unexpected error occurred. Please try again or contact support.'
  }

  private generateRecoveryActions(error: RAGError): RecoveryAction[] {
    const actions: RecoveryAction[] = []

    // Common retry action for retryable errors
    if (error.isRetryable) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        description: 'Retry the operation',
        action: () => {}, // Will be implemented by caller
        priority: 1
      })
    }

    // Specific actions based on error category
    switch (error.category) {
      case ErrorCategory.NETWORK:
        actions.push({
          type: 'refresh',
          label: 'Refresh Page',
          description: 'Refresh the page to restore connection',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          },
          priority: 2
        })
        break

      case ErrorCategory.STORAGE:
        actions.push({
          type: 'fallback',
          label: 'Download Data',
          description: 'Download your data as a backup',
          action: () => {}, // Implement based on context
          priority: 2
        })
        break

      case ErrorCategory.PARSING:
        actions.push({
          type: 'manual',
          label: 'Try Different Format',
          description: 'Convert your document to a different format and try again',
          action: () => {}, // No automatic action
          priority: 2
        })
        break

      case ErrorCategory.AUTHENTICATION:
        actions.push({
          type: 'manual',
          label: 'Log In Again',
          description: 'Sign out and log in again',
          action: () => {}, // Implement based on auth system
          priority: 1
        })
        break
    }

    return actions.sort((a, b) => a.priority - b.priority)
  }

  private getErrorTitle(error: RAGError): string {
    const titles: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Connection Error',
      [ErrorCategory.PARSING]: 'Document Processing Error',
      [ErrorCategory.STORAGE]: 'Storage Error',
      [ErrorCategory.PROCESSING]: 'Processing Error',
      [ErrorCategory.VALIDATION]: 'Validation Error',
      [ErrorCategory.AUTHENTICATION]: 'Authentication Error',
      [ErrorCategory.RATE_LIMIT]: 'Rate Limit Exceeded',
      [ErrorCategory.QUOTA_EXCEEDED]: 'Quota Exceeded',
      [ErrorCategory.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [ErrorCategory.UNKNOWN]: 'Unexpected Error'
    }

    return titles[error.category] || 'Error'
  }

  private isRetryableError(category: ErrorCategory, code: string): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVICE_UNAVAILABLE,
      ErrorCategory.RATE_LIMIT
    ]

    const nonRetryableCodes = [
      'VALIDATION_ERROR',
      'AUTHENTICATION_ERROR',
      'QUOTA_EXCEEDED',
      'PARSING_ERROR'
    ]

    return retryableCategories.includes(category) && !nonRetryableCodes.includes(code)
  }

  private categorizeError(error: unknown): ErrorCategory {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return ErrorCategory.NETWORK
      }
      if (message.includes('parse') || message.includes('invalid json') || message.includes('syntax')) {
        return ErrorCategory.PARSING
      }
      if (message.includes('storage') || message.includes('quota') || message.includes('disk')) {
        return ErrorCategory.STORAGE
      }
      if (message.includes('auth') || message.includes('token') || message.includes('permission')) {
        return ErrorCategory.AUTHENTICATION
      }
      if (message.includes('rate') || message.includes('limit') || message.includes('throttle')) {
        return ErrorCategory.RATE_LIMIT
      }
    }

    return ErrorCategory.UNKNOWN
  }

  private logError(error: RAGError): void {
    const key = error.context.operation || 'unknown'
    
    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, [])
    }
    
    const errors = this.errorHistory.get(key)!
    errors.push(error)

    // Keep only recent errors (last 100 per operation)
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100)
    }

    // Log to console based on severity
    const logMethod = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                     error.severity === ErrorSeverity.HIGH ? 'error' :
                     error.severity === ErrorSeverity.MEDIUM ? 'warn' : 'log'
    
    console[logMethod](`🚨 [${error.severity.toUpperCase()}] ${error.category}/${error.code}:`, {
      message: error.message,
      context: error.context,
      originalError: error.originalError
    })
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1)
    delay = Math.min(delay, config.maxDelay)
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.floor(delay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Circuit Breaker Implementation

  private isCircuitOpen(serviceKey: string): boolean {
    const state = this.circuitBreakers.get(serviceKey)
    if (!state) return false

    const now = Date.now()

    switch (state.state) {
      case 'closed':
        return false
      case 'open':
        if (now - state.lastFailureTime >= this.circuitBreakerConfig.resetTimeout) {
          // Transition to half-open
          state.state = 'half-open'
          this.circuitBreakers.set(serviceKey, state)
          return false
        }
        return true
      case 'half-open':
        return false
      default:
        return false
    }
  }

  private recordSuccess(serviceKey: string): void {
    const state = this.circuitBreakers.get(serviceKey)
    if (state) {
      state.state = 'closed'
      state.failureCount = 0
      this.circuitBreakers.set(serviceKey, state)
    }
  }

  private recordFailure(serviceKey: string): void {
    const now = Date.now()
    let state = this.circuitBreakers.get(serviceKey)

    if (!state) {
      state = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: now,
        firstFailureTime: now
      }
    }

    state.failureCount++
    state.lastFailureTime = now

    // Check if we should open the circuit
    if (state.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      state.state = 'open'
    }

    this.circuitBreakers.set(serviceKey, state)
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime: number
  firstFailureTime: number
}

// Export singleton instance
export const ragErrorRecovery = new RAGErrorRecovery()

// Export utility functions
export const withErrorRecovery = async <T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> => {
  return ragErrorRecovery.executeWithRetry(operation, context, retryConfig)
}

export const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  context: Partial<ErrorContext>
): Promise<T> => {
  return ragErrorRecovery.executeWithFallback(primary, fallback, context)
}
