import React from 'react'
import { cn } from '@/utils/cn'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showValue?: boolean
  animated?: boolean
}

export function Progress({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  animated = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantClasses = {
    default: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className={cn('relative', className)} {...props}>
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'transition-all duration-300 ease-out rounded-full',
            sizeClasses[size],
            variantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 text-center">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}
