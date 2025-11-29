import React from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animated?: boolean
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animated = true,
  className,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-sm',
  }

  const defaultSizes = {
    text: { width: '100%', height: '1rem' },
    circular: { width: '2.5rem', height: '2.5rem' },
    rectangular: { width: '100%', height: '8rem' },
  }

  const finalWidth = width || defaultSizes[variant].width
  const finalHeight = height || defaultSizes[variant].height

  return (
    <div
      className={cn(
        'bg-neutral-200 dark:bg-neutral-700',
        variantClasses[variant],
        animated && 'animate-pulse',
        className
      )}
      style={{
        width: finalWidth,
        height: finalHeight,
      }}
      {...props}
    />
  )
}
