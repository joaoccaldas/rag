import React from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ 
  size = 'md', 
  className, 
  children, 
  ...props 
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AvatarImage({ 
  className,
  src,
  alt,
  width,
  height,
  ...props 
}: AvatarImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={typeof width === 'string' ? parseInt(width) : width || 40}
      height={typeof height === 'string' ? parseInt(height) : height || 40}
      className={cn('object-cover w-full h-full', className)}
      {...props}
    />
  )
}

export function AvatarFallback({ 
  className, 
  children, 
  ...props 
}: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
