/**
 * 🛡️ ENHANCED ERROR BOUNDARY SYSTEM
 * 
 * Provides hierarchical error boundaries with recovery mechanisms
 * and user-friendly error displays for different application features.
 */

"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, FileText, Search, Upload } from 'lucide-react'

// ==================== ERROR TYPES ====================

interface ErrorState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  timestamp: Date
  feature: string | undefined
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  feature?: string
  fallback?: ComponentType<ErrorFallbackProps> | undefined
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  feature: string | undefined
  onRetry: () => void
  onGoHome: () => void
  retryCount: number
  maxRetries: number
  canRetry: boolean
}

type ComponentType<P = object> = React.ComponentType<P>

// ==================== ENHANCED ERROR BOUNDARY ====================

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      timestamp: new Date(),
      feature: props.feature,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
      timestamp: new Date()
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Error Boundary Caught Error in ${this.props.feature || 'Unknown'}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    })

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to analytics/monitoring service
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error tracking service
    const errorReport = {
      errorId: this.state.errorId,
      feature: this.props.feature,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: this.state.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    }

    console.log('📊 Error Report:', errorReport)
    
    // You could send to services like Sentry, LogRocket, etc.
    // window.errorTracker?.captureException(error, errorReport)
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount >= maxRetries) {
      console.warn(`⚠️ Max retries (${maxRetries}) reached for ${this.props.feature}`)
      return
    }

    console.log(`🔄 Retrying ${this.props.feature} (attempt ${this.state.retryCount + 1}/${maxRetries})`)
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))

    // Add a small delay to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      this.forceUpdate()
    }, 500)
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries
      
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          feature={this.props.feature}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          retryCount={this.state.retryCount}
          maxRetries={maxRetries}
          canRetry={canRetry}
        />
      )
    }

    return this.props.children
  }
}

// ==================== ERROR FALLBACK COMPONENTS ====================

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  feature,
  onRetry,
  onGoHome,
  retryCount,
  maxRetries,
  canRetry
}) => (
  <div className="min-h-64 flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            {feature ? `${feature} Error` : 'Something went wrong'}
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        {canRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again ({retryCount}/{maxRetries})</span>
          </button>
        )}
        
        <button
          onClick={onGoHome}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Go Home</span>
        </button>
      </div>
    </div>
  </div>
)

// Feature-specific fallback components
export const ChatErrorFallback: React.FC<ErrorFallbackProps> = (props) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            Chat System Error
          </h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            The chat feature encountered an issue. You can try reloading or switch to document view.
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        {props.canRetry && (
          <button onClick={props.onRetry} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Chat
          </button>
        )}
        
        <button onClick={props.onGoHome} className="btn-secondary">
          <FileText className="h-4 w-4 mr-2" />
          View Documents
        </button>
      </div>
    </div>
  </div>
)

export const SearchErrorFallback: React.FC<ErrorFallbackProps> = (props) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Search className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        <div>
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            Search Error
          </h3>
          <p className="text-purple-600 dark:text-purple-400 text-sm">
            The search functionality is temporarily unavailable. Try browsing documents instead.
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        {props.canRetry && (
          <button onClick={props.onRetry} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Search
          </button>
        )}
        
        <button onClick={props.onGoHome} className="btn-secondary">
          <FileText className="h-4 w-4 mr-2" />
          Browse Documents
        </button>
      </div>
    </div>
  </div>
)

export const UploadErrorFallback: React.FC<ErrorFallbackProps> = (props) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Upload className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        <div>
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
            Upload Error
          </h3>
          <p className="text-orange-600 dark:text-orange-400 text-sm">
            File upload failed. Check your file size and format, then try again.
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        {props.canRetry && (
          <button onClick={props.onRetry} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Upload Again
          </button>
        )}
        
        <button onClick={props.onGoHome} className="btn-secondary">
          <FileText className="h-4 w-4 mr-2" />
          View Existing Files
        </button>
      </div>
    </div>
  </div>
)

// ==================== CONVENIENCE WRAPPERS ====================

export const FeatureErrorBoundary: React.FC<{
  children: ReactNode
  feature: string
  fallback?: ComponentType<ErrorFallbackProps> | undefined
}> = ({ children, feature, fallback }) => (
  <EnhancedErrorBoundary 
    feature={feature} 
    fallback={fallback || undefined}
    maxRetries={3}
    showDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </EnhancedErrorBoundary>
)

export const ChatErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Chat" fallback={ChatErrorFallback}>
    {children}
  </FeatureErrorBoundary>
)

export const SearchErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Search" fallback={SearchErrorFallback}>
    {children}
  </FeatureErrorBoundary>
)

export const UploadErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Upload" fallback={UploadErrorFallback}>
    {children}
  </FeatureErrorBoundary>
)

// ==================== ERROR REPORTING HOOK ====================

export function useErrorReporter() {
  return React.useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('🚨 Manual Error Report:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
    
    // In a real app, send to error tracking service
    // window.errorTracker?.captureException(error, context)
  }, [])
}
