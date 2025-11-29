/**
 * React Error Boundary Component
 * 
 * Provides React error boundary functionality with integration to the
 * RAG error recovery system. Catches JavaScript errors anywhere in the
 * component tree and displays user-friendly error UI with recovery options.
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorSeverity, ErrorCategory, ragErrorRecovery, RecoveryAction } from '../utils/error-recovery'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: {
    operation: string
    documentId?: string
    userId?: string
  }
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  recoveryActions: RecoveryAction[]
  isRetrying: boolean
}

export class RAGErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      recoveryActions: [],
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RAG Error Boundary caught an error:', error, errorInfo)

    // Create a RAG error with context
    const ragError = ragErrorRecovery.createError(
      error.message,
      'REACT_ERROR',
      ErrorCategory.PROCESSING,
      ErrorSeverity.HIGH,
      {
        operation: this.props.context?.operation || 'react_render',
        documentId: this.props.context?.documentId,
        userId: this.props.context?.userId,
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundaryProps: this.props.context
        }
      },
      error
    )

    // Get error display information
    const errorDisplay = ragErrorRecovery.getErrorDisplay(ragError)

    // Update state with recovery actions
    this.setState({
      errorInfo,
      recoveryActions: errorDisplay.recoveryActions.map(action => ({
        ...action,
        action: this.wrapRecoveryAction(action.action)
      }))
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private wrapRecoveryAction = (originalAction: () => Promise<void> | void) => {
    return async () => {
      this.setState({ isRetrying: true })
      
      try {
        await originalAction()
        
        // If successful, reset the error boundary
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          recoveryActions: [],
          isRetrying: false
        })
      } catch (recoveryError) {
        console.error('Recovery action failed:', recoveryError)
        this.setState({ isRetrying: false })
      }
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      recoveryActions: [],
      isRetrying: false
    })
  }

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto h-12 w-12 text-red-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                We encountered an unexpected error. Don&apos;t worry, we&apos;re here to help you get back on track.
              </p>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Error Details (Development)
                </h3>
                <p className="text-sm text-red-700 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-700 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="mt-6 space-y-3">
              {/* Primary Actions */}
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {this.state.isRetrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>

              {/* Secondary Actions */}
              <button
                onClick={this.handleRefresh}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>

              {/* Custom Recovery Actions */}
              {this.state.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={this.state.isRetrying}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                If the problem persists, please{' '}
                <a
                  href="mailto:support@example.com"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  contact support
                </a>
                {' '}with details about what you were doing when this happened.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <RAGErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </RAGErrorBoundary>
    )
  }

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithErrorBoundaryComponent
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: {
    operation: string
    documentId?: string
    userId?: string
  }) => {
    // Create RAG error
    const ragError = ragErrorRecovery.createError(
      error.message,
      'HOOK_ERROR',
      ErrorCategory.PROCESSING,
      ErrorSeverity.MEDIUM,
      {
        operation: context?.operation || 'hook_operation',
        documentId: context?.documentId,
        userId: context?.userId
      },
      error
    )

    // In a functional component, we can't use error boundaries directly
    // So we'll log the error and could potentially show a toast notification
    console.error('Error handled by useErrorHandler:', ragError)

    // You could integrate with a toast/notification system here
    // For example: toast.error(ragError.userMessage)
    
    return ragError
  }

  return { handleError }
}

/**
 * Error Boundary wrapper for specific RAG operations
 */
export const RAGOperationBoundary: React.FC<{
  children: ReactNode
  operation: string
  documentId?: string
  onError?: (error: Error) => void
}> = ({ children, operation, documentId, onError }) => {
  return (
    <RAGErrorBoundary
      context={{ operation, documentId }}
      onError={(error, errorInfo) => {
        console.error(`Error in RAG operation "${operation}":`, error, errorInfo)
        onError?.(error)
      }}
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error in {operation}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Something went wrong with this operation. Please try again.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </RAGErrorBoundary>
  )
}
