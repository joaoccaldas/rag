/**
 * Enhanced Error Boundary System
 * 
 * This module provides comprehensive error boundary implementation with:
 * - Global error handling
 * - Component-specific error boundaries
 * - Error reporting and analytics
 * - Graceful fallback UI components
 * - Recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode, useCallback } from 'react'
import { Button, Card } from './ui/modular-components'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

// Error types
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  retryCount: number
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'global' | 'page' | 'component'
  maxRetries?: number
}

// Error analytics service
class ErrorAnalyticsService {
  private static errors: Array<{
    id: string
    error: Error
    errorInfo: ErrorInfo
    timestamp: string
    level: string
    userAgent: string
    url: string
  }> = []

  static logError(error: Error, errorInfo: ErrorInfo, level: string): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    this.errors.push({
      id: errorId,
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      level,
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${level})`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      this.sendToErrorService({
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    return errorId
  }

  private static sendToErrorService(errorData: {
    errorId: string
    message: string
    stack?: string
    componentStack: string
    level: string
    timestamp: string
    userAgent: string
    url: string
  }): void {
    // Example implementation for error service
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.warn('Failed to send error to service:', err)
    })
  }

  static getErrorStats(): {
    totalErrors: number
    errorsByLevel: Record<string, number>
    recentErrors: number
  } {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    return {
      totalErrors: this.errors.length,
      errorsByLevel: this.errors.reduce((acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentErrors: this.errors.filter(error => 
        new Date(error.timestamp).getTime() > oneDayAgo
      ).length
    }
  }
}

// Error fallback components
export const GlobalErrorFallback: React.FC<{
  error: Error
  retry: () => void
  errorId?: string
}> = ({ error, retry, errorId }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <Card className="max-w-lg w-full">
      <div className="text-center">
        <div className="text-red-500 mb-6">
          <AlertTriangle className="h-16 w-16 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Application Error
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Something went wrong with the application. This error has been logged and our team has been notified.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">Development Error Details:</h3>
            <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {errorId && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {errorId}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={retry}
            icon={<RefreshCw className="h-4 w-4" />}
            variant="primary"
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            icon={<Home className="h-4 w-4" />}
            variant="outline"
          >
            Go Home
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={() => {
                console.error('Full Error:', error)
                const errorStats = ErrorAnalyticsService.getErrorStats()
                console.table(errorStats)
              }}
              icon={<Bug className="h-4 w-4" />}
              variant="ghost"
              size="sm"
            >
              Debug Info
            </Button>
          )}
        </div>
      </div>
    </Card>
  </div>
)

export const PageErrorFallback: React.FC<{
  error: Error
  retry: () => void
  errorId?: string
}> = ({ error, retry, errorId }) => (
  <div className="flex items-center justify-center min-h-96 p-8">
    <Card className="max-w-md w-full">
      <div className="text-center">
        <div className="text-orange-500 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Page Error
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This page encountered an error and couldn&apos;t load properly.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4 text-left">
            <pre className="text-sm text-orange-700 dark:text-orange-300 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {errorId && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Error ID: {errorId}
              </p>
            )}
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          <Button onClick={retry} size="sm" variant="primary">
            Retry
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            size="sm" 
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    </Card>
  </div>
)

export const ComponentErrorFallback: React.FC<{
  error: Error
  retry: () => void
  componentName?: string
  errorId?: string
}> = ({ error, retry, componentName, errorId }) => (
  <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="text-red-500">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          {componentName ? `${componentName} Error` : 'Component Error'}
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          This component failed to render properly.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
              Show Error Details
            </summary>
            <pre className="text-xs text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {errorId && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Error ID: {errorId}
              </p>
            )}
          </details>
        )}
        
        <Button
          onClick={retry}
          size="sm"
          variant="outline"
          className="mt-3 text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-800"
        >
          Retry Component
        </Button>
      </div>
    </div>
  </div>
)

// Main Error Boundary class
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { level = 'component', onError, maxRetries = 3 } = this.props
    
    // Log error to analytics service
    const errorId = ErrorAnalyticsService.logError(error, errorInfo, level)
    
    this.setState({
      error,
      errorInfo,
      errorId
    })

    // Call custom error handler
    onError?.(error, errorInfo)

    // Auto-retry for component-level errors (but not global ones)
    if (level === 'component' && this.state.retryCount < maxRetries) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry()
      }, 2000 * (this.state.retryCount + 1)) // Exponential backoff
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  render(): ReactNode {
    const { hasError, error, errorId } = this.state
    const { children, fallback, level = 'component' } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry)
      }

      // Use default fallbacks based on level
      switch (level) {
        case 'global':
          return (
            <GlobalErrorFallback
              error={error}
              retry={this.handleRetry}
              errorId={errorId}
            />
          )
        
        case 'page':
          return (
            <PageErrorFallback
              error={error}
              retry={this.handleRetry}
              errorId={errorId}
            />
          )
        
        case 'component':
        default:
          return (
            <ComponentErrorFallback
              error={error}
              retry={this.handleRetry}
              errorId={errorId}
            />
          )
      }
    }

    return children
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return useCallback((error: Error, _errorInfo?: { componentStack?: string }) => {
    // Throw error to be caught by nearest error boundary
    throw error
  }, [])
}

// Error boundary for async operations
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      onError={(error, errorInfo) => {
        // Handle async errors specifically
        console.error('Async operation error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Export error analytics service for external use
export { ErrorAnalyticsService }
