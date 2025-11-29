import React from 'react'
import { cn } from '@/utils/cn'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Alert({
  variant = 'default',
  className,
  ...props
}: AlertProps) {
  const variantClasses = {
    default: 'bg-neutral-50 border-neutral-200 text-neutral-900 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-100',
    success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100'
  }

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variantClasses[variant],
        className
      )}
      role="alert"
      {...props}
    />
  )
}

export function AlertTitle({
  className,
  ...props
}: AlertTitleProps) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
}

export function AlertDescription({
  className,
  ...props
}: AlertDescriptionProps) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}
