/**
 * Enhanced Error Handling System
 * Provides comprehensive error management, user-friendly messages, and recovery mechanisms
 */

export enum ErrorCategory {
  DOCUMENT_PROCESSING = 'DOCUMENT_PROCESSING',
  STORAGE = 'STORAGE',
  AI_SERVICE = 'AI_SERVICE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  WORKER = 'WORKER',
  SYSTEM = 'SYSTEM'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  technicalDetails?: string
  timestamp: Date
  context?: Record<string, unknown>
  stack?: string
  recoveryActions?: RecoveryAction[]
}

export interface RecoveryAction {
  label: string
  action: () => Promise<void> | void
  type: 'automatic' | 'user' | 'suggestion'
}

export interface ErrorAnalytics {
  errorId: string
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  additionalContext: Record<string, unknown>
}

class ErrorHandlingService {
  private errorLog: ErrorDetails[] = []
  private maxLogSize = 1000
  private retryAttempts = new Map<string, number>()
  private errorCallbacks = new Map<ErrorCategory, Array<(error: ErrorDetails) => void>>()

  /**
   * Handle an error with comprehensive processing
   */
  async handleError(error: unknown, context?: Record<string, unknown>): Promise<ErrorDetails> {
    const errorDetails = this.processError(error, context)
    
    // Log the error
    this.logError(errorDetails)
    
    // Notify listeners
    this.notifyErrorCallbacks(errorDetails)
    
    // Attempt automatic recovery for certain error types
    if (errorDetails.recoveryActions?.some(action => action.type === 'automatic')) {
      await this.attemptAutoRecovery(errorDetails)
    }
    
    // Send analytics if not in development
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorAnalytics(errorDetails)
    }
    
    return errorDetails
  }

  /**
   * Process raw error into structured ErrorDetails
   */
  private processError(error: unknown, context?: Record<string, unknown>): ErrorDetails {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date()
    
    if (error instanceof Error) {
      return this.categorizeError(error, id, timestamp, context)
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return {
        id,
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        code: 'UNKNOWN_STRING_ERROR',
        message: error,
        userMessage: 'An unexpected error occurred. Please try again.',
        timestamp,
        context
      }
    }
    
    // Handle unknown error types
    return {
      id,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error type',
      userMessage: 'An unexpected error occurred. Please refresh the page and try again.',
      timestamp,
      context,
      technicalDetails: JSON.stringify(error)
    }
  }

  /**
   * Categorize error based on message, type, and context
   */
  private categorizeError(
    error: Error, 
    id: string, 
    timestamp: Date, 
    context?: Record<string, unknown>
  ): ErrorDetails {
    const message = error.message.toLowerCase()
    const stack = error.stack
    
    // Document Processing Errors
    if (message.includes('pdf') || message.includes('document') || message.includes('ocr')) {
      return {
        id,
        category: ErrorCategory.DOCUMENT_PROCESSING,
        severity: this.getSeverityFromMessage(message),
        code: this.getDocumentErrorCode(message),
        message: error.message,
        userMessage: this.getDocumentUserMessage(message),
        timestamp,
        context,
        stack,
        recoveryActions: this.getDocumentRecoveryActions(message)
      }
    }
    
    // Storage Errors
    if (message.includes('storage') || message.includes('indexeddb') || message.includes('quota')) {
      return {
        id,
        category: ErrorCategory.STORAGE,
        severity: message.includes('quota') ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        code: this.getStorageErrorCode(message),
        message: error.message,
        userMessage: this.getStorageUserMessage(message),
        timestamp,
        context,
        stack,
        recoveryActions: this.getStorageRecoveryActions(message)
      }
    }
    
    // AI Service Errors
    if (message.includes('ai') || message.includes('llama') || message.includes('embedding')) {
      return {
        id,
        category: ErrorCategory.AI_SERVICE,
        severity: ErrorSeverity.MEDIUM,
        code: this.getAIErrorCode(message),
        message: error.message,
        userMessage: this.getAIUserMessage(message),
        timestamp,
        context,
        stack,
        recoveryActions: this.getAIRecoveryActions(message)
      }
    }
    
    // Network Errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        id,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        timestamp,
        context,
        stack,
        recoveryActions: [{
          label: 'Retry Connection',
          action: async () => {
            // Retry logic would be implemented here
            await new Promise(resolve => setTimeout(resolve, 1000))
          },
          type: 'automatic'
        }]
      }
    }
    
    // Worker Errors
    if (message.includes('worker') || context?.workerType) {
      return {
        id,
        category: ErrorCategory.WORKER,
        severity: ErrorSeverity.HIGH,
        code: 'WORKER_ERROR',
        message: error.message,
        userMessage: 'Processing service encountered an issue. The system will attempt to recover automatically.',
        timestamp,
        context,
        stack,
        recoveryActions: [{
          label: 'Restart Worker',
          action: async () => {
            // Worker restart logic would be implemented here
          },
          type: 'automatic'
        }]
      }
    }
    
    // Default system error
    return {
      id,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      code: 'SYSTEM_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again or refresh the page.',
      timestamp,
      context,
      stack
    }
  }

  private getSeverityFromMessage(message: string): ErrorSeverity {
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL
    if (message.includes('timeout') || message.includes('memory')) return ErrorSeverity.HIGH
    if (message.includes('warning') || message.includes('deprecated')) return ErrorSeverity.LOW
    return ErrorSeverity.MEDIUM
  }

  private getDocumentErrorCode(message: string): string {
    if (message.includes('pdf')) return 'PDF_PROCESSING_ERROR'
    if (message.includes('ocr')) return 'OCR_PROCESSING_ERROR'
    if (message.includes('unsupported')) return 'UNSUPPORTED_FORMAT'
    if (message.includes('corrupted')) return 'CORRUPTED_FILE'
    if (message.includes('size')) return 'FILE_TOO_LARGE'
    return 'DOCUMENT_PROCESSING_ERROR'
  }

  private getDocumentUserMessage(message: string): string {
    if (message.includes('pdf')) return 'There was an issue processing your PDF file. Please ensure the file is not corrupted and try again.'
    if (message.includes('ocr')) return 'Text recognition failed. This may be due to poor image quality or unsupported content.'
    if (message.includes('unsupported')) return 'This file format is not supported. Please try with PDF, DOCX, or TXT files.'
    if (message.includes('corrupted')) return 'The file appears to be corrupted. Please check the file and try uploading again.'
    if (message.includes('size')) return 'The file is too large to process. Please try with a smaller file (under 50MB).'
    return 'There was an issue processing your document. Please check the file format and try again.'
  }

  private getDocumentRecoveryActions(message: string): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    
    if (message.includes('ocr')) {
      actions.push({
        label: 'Try without OCR',
        action: async () => {
          // Logic to retry without OCR would be implemented
        },
        type: 'suggestion'
      })
    }
    
    if (message.includes('size')) {
      actions.push({
        label: 'Compress file',
        action: async () => {
          // File compression suggestion
        },
        type: 'suggestion'
      })
    }
    
    return actions
  }

  private getStorageErrorCode(message: string): string {
    if (message.includes('quota')) return 'STORAGE_QUOTA_EXCEEDED'
    if (message.includes('indexeddb')) return 'INDEXEDDB_ERROR'
    if (message.includes('permission')) return 'STORAGE_PERMISSION_DENIED'
    return 'STORAGE_ERROR'
  }

  private getStorageUserMessage(message: string): string {
    if (message.includes('quota')) return 'Storage space is full. Please delete some documents or clear your browser storage.'
    if (message.includes('indexeddb')) return 'Database access issue. Please try refreshing the page.'
    if (message.includes('permission')) return 'Storage permission denied. Please check your browser settings.'
    return 'Storage operation failed. Please try again or refresh the page.'
  }

  private getStorageRecoveryActions(message: string): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    
    if (message.includes('quota')) {
      actions.push({
        label: 'Clear old documents',
        action: async () => {
          // Storage cleanup logic would be implemented
        },
        type: 'suggestion'
      })
    }
    
    return actions
  }

  private getAIErrorCode(message: string): string {
    if (message.includes('llama')) return 'LLAMA_SERVICE_ERROR'
    if (message.includes('embedding')) return 'EMBEDDING_GENERATION_ERROR'
    if (message.includes('timeout')) return 'AI_SERVICE_TIMEOUT'
    return 'AI_SERVICE_ERROR'
  }

  private getAIUserMessage(message: string): string {
    if (message.includes('llama')) return 'AI service is temporarily unavailable. Please try again in a moment.'
    if (message.includes('embedding')) return 'Text analysis service encountered an issue. Please try again.'
    if (message.includes('timeout')) return 'AI service is taking longer than expected. Please try again.'
    return 'AI service encountered an issue. Please try again or use the basic search features.'
  }

  private getAIRecoveryActions(message: string): RecoveryAction[] {
    return [{
      label: 'Retry AI operation',
      action: async () => {
        // AI retry logic would be implemented
        await new Promise(resolve => setTimeout(resolve, 2000))
      },
      type: 'automatic'
    }]
  }

  /**
   * Log error to internal storage
   */
  private logError(error: ErrorDetails): void {
    this.errorLog.unshift(error)
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.category} Error (${error.severity})`)
      console.error('Message:', error.message)
      console.error('User Message:', error.userMessage)
      console.error('Context:', error.context)
      if (error.stack) console.error('Stack:', error.stack)
      console.groupEnd()
    }
  }

  /**
   * Notify registered error callbacks
   */
  private notifyErrorCallbacks(error: ErrorDetails): void {
    const callbacks = this.errorCallbacks.get(error.category) || []
    callbacks.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in error callback:', err)
      }
    })
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptAutoRecovery(error: ErrorDetails): Promise<void> {
    const autoActions = error.recoveryActions?.filter(action => action.type === 'automatic') || []
    
    for (const action of autoActions) {
      try {
        await action.action()
        console.log(`✅ Auto-recovery action "${action.label}" succeeded for error ${error.id}`)
      } catch (recoveryError) {
        console.error(`❌ Auto-recovery action "${action.label}" failed:`, recoveryError)
      }
    }
  }

  /**
   * Send error analytics (production only)
   */
  private sendErrorAnalytics(error: ErrorDetails): void {
    const analytics: ErrorAnalytics = {
      errorId: error.id,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
      additionalContext: {
        category: error.category,
        severity: error.severity,
        code: error.code,
        timestamp: error.timestamp.toISOString()
      }
    }
    
    // Send to analytics service (implementation would depend on service used)
    console.log('📊 Error analytics:', analytics)
  }

  /**
   * Register error callback for specific category
   */
  onError(category: ErrorCategory, callback: (error: ErrorDetails) => void): () => void {
    if (!this.errorCallbacks.has(category)) {
      this.errorCallbacks.set(category, [])
    }
    
    this.errorCallbacks.get(category)!.push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.errorCallbacks.get(category)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): ErrorDetails[] {
    return [...this.errorLog]
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const recentErrors = this.errorLog.filter(
      error => now - error.timestamp.getTime() < oneHour
    )
    
    const statsByCategory = recentErrors.reduce((stats, error) => {
      stats[error.category] = (stats[error.category] || 0) + 1
      return stats
    }, {} as Record<string, number>)
    
    const statsBySeverity = recentErrors.reduce((stats, error) => {
      stats[error.severity] = (stats[error.severity] || 0) + 1
      return stats
    }, {} as Record<string, number>)
    
    return {
      total: this.errorLog.length,
      recentTotal: recentErrors.length,
      byCategory: statsByCategory,
      bySeverity: statsBySeverity
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error-session-id', sessionId)
    }
    return sessionId
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService()

// Utility functions for common error scenarios
export const createErrorWrapper = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, unknown>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorDetails = await errorHandler.handleError(error, {
        functionName: fn.name,
        arguments: args,
        ...context
      })
      throw errorDetails
    }
  }
}

export const withErrorBoundary = <T>(
  fn: () => T,
  fallback: T,
  context?: Record<string, unknown>
): T => {
  try {
    return fn()
  } catch (error) {
    errorHandler.handleError(error, context)
    return fallback
  }
}
