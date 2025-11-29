import React from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export function Textarea({
  variant = 'default',
  resize = 'vertical',
  className,
  ...props
}: TextareaProps) {
  const variantClasses = {
    default: 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500'
  }

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  }

  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 text-sm border rounded-md',
        'bg-white dark:bg-neutral-900',
        'text-neutral-900 dark:text-neutral-100',
        'placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        variantClasses[variant],
        resizeClasses[resize],
        className
      )}
      {...props}
    />
  )
}
