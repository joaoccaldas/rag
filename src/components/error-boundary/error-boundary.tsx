/**
 * Comprehensive Error Boundary Implementation
 * Handles different types of errors with recovery mechanisms
 */

"use client"

import React, { Component, ErrorInfo as ReactErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  timestamp?: string
  userAgent?: string
  url?: string
  level?: string
  boundaryName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'app' | 'page' | 'component'
  name?: string
  enableRetry?: boolean
  maxRetries?: number
  enableReporting?: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const enhancedErrorInfo = {
      ...errorInfo,
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      level: this.props.level || 'component',
      boundaryName: this.props.name || 'Unknown'
    }

    this.setState({
      error,
      errorInfo: enhancedErrorInfo
    })

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, enhancedErrorInfo)
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', enhancedErrorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Report error if enabled
    if (this.props.enableReporting && process.env.NODE_ENV === 'production') {
      this.reportError(error, enhancedErrorInfo)
    }
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo,
          errorId: this.state.errorId
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))

      // Add a small delay before retry to prevent immediate re-error
      this.retryTimeoutId = setTimeout(() => {
        // Force component remount by clearing error state
        this.forceUpdate()
      }, 100)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state
    const { 
      children, 
      fallback, 
      enableRetry = true, 
      maxRetries = 3,
      level = 'component' 
    } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI based on level
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    {level === 'app' ? 'Application Error' : 
                     level === 'page' ? 'Page Error' : 'Component Error'}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    Something went wrong in this {level}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border">
                <p className="text-sm font-mono text-red-800 dark:text-red-200 break-words">
                  {error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {enableRetry && retryCount < maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry ({maxRetries - retryCount} left)
                  </button>
                )}
                
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>

                {level === 'app' && (
                  <button
                    onClick={this.handleReload}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload App
                  </button>
                )}

                {level !== 'app' && (
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </button>
                )}
              </div>

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100">
                    Debug Information (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded border text-xs font-mono">
                    <div className="mb-2">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Retry Count:</strong> {retryCount}
                    </div>
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {error?.stack}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// Convenience wrapper components for different levels
export const AppErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="app" name="App" enableReporting />
)

export const PageErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="page" name="Page" />
)

export const ComponentErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="component" />
)

// HOC for easy wrapping
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

export default ErrorBoundary
