/**
 * Component Architecture Improvements
 * 
 * This module provides modular component architecture improvements including:
 * - Proper component composition patterns
 * - Reusable UI components
 * - Consistent prop interfaces
 * - Better separation of concerns
 */

import React, { ReactNode } from 'react'

// Base interfaces for consistent component architecture
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  centered?: boolean
}

export interface CardProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  loading?: boolean
  error?: string | null
  variant?: 'default' | 'outlined' | 'elevated'
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export interface TabProps {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  badge?: string | number
}

export interface TabsProps extends BaseComponentProps {
  tabs: TabProps[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
}

// Container Component - Provides consistent layout structure
export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md',
  centered = false,
  'data-testid': testId,
  ...props
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  }

  const classes = [
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    centered ? 'mx-auto' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={classes} 
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Component - Reusable card layout
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
  loading = false,
  error = null,
  variant = 'default',
  'data-testid': testId,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    outlined: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700'
  }

  const classes = [
    'rounded-lg overflow-hidden',
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className={classes} data-testid={testId}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={classes} data-testid={testId}>
        <div className="p-6">
          <div className="text-red-600 dark:text-red-400">
            <h3 className="font-medium">Error</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={classes} data-testid={testId} {...props}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

// Button Component - Consistent button styling
export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left',
  'data-testid': testId,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    outline: 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const classes = [
    'inline-flex items-center justify-center font-medium border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      data-testid={testId}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

// Tabs Component - Reusable tab navigation
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const variantClasses = {
    default: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
    underline: 'border-b border-gray-200 dark:border-gray-700'
  }

  const tabClasses = {
    default: (isActive: boolean) => 
      `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive 
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
      }`,
    pills: (isActive: boolean) =>
      `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`,
    underline: (isActive: boolean) =>
      `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      }`
  }

  return (
    <div 
      className={`${variantClasses[variant]} ${className}`} 
      data-testid={testId}
      {...props}
    >
      <nav className={variant === 'pills' ? 'flex space-x-1' : 'flex space-x-1'}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${tabClasses[variant](activeTab === tab.id)} ${
              tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {tab.icon && (
              <span className="mr-2">{tab.icon}</span>
            )}
            {tab.label}
            {tab.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

// Loading Skeleton Component
export const LoadingSkeleton: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
)

// Error Boundary Component
export const ErrorFallback: React.FC<{
  error: Error
  resetError: () => void
}> = ({ error, resetError }) => (
  <Card variant="outlined" className="border-red-200 dark:border-red-800">
    <div className="text-center">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {error.message}
      </p>
      <Button onClick={resetError} variant="outline">
        Try again
      </Button>
    </div>
  </Card>
)
