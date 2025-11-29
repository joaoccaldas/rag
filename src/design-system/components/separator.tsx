import React from 'react'
import { cn } from '@/utils/cn'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'muted'
}

export function Separator({
  orientation = 'horizontal',
  variant = 'default',
  className,
  ...props
}: SeparatorProps) {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px'
  }

  const variantClasses = {
    default: 'bg-neutral-200 dark:bg-neutral-700',
    muted: 'bg-neutral-100 dark:bg-neutral-800'
  }

  return (
    <div
      className={cn(
        'shrink-0',
        orientationClasses[orientation],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
