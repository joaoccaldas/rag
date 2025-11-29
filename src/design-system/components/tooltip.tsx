import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/utils/cn'

interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined)

export interface TooltipProps {
  children: React.ReactNode
  delayDuration?: number
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  children: React.ReactNode
}

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

export interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

export function Tooltip({ children, delayDuration = 700 }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ 
  children, 
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props 
}: TooltipTriggerProps) {
  const context = useContext(TooltipContext)
  if (!context) throw new Error('TooltipTrigger must be used within a Tooltip')

  let timeoutId: NodeJS.Timeout

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    timeoutId = setTimeout(() => context.setOpen(true), 700)
    onMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    clearTimeout(timeoutId)
    context.setOpen(false)
    onMouseLeave?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    context.setOpen(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    context.setOpen(false)
    onBlur?.(e)
  }

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </div>
  )
}

export function TooltipContent({ 
  children, 
  side = 'top',
  align = 'center',
  className,
  ...props 
}: TooltipContentProps) {
  const context = useContext(TooltipContext)
  if (!context) throw new Error('TooltipContent must be used within a Tooltip')

  if (!context.open) return null

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2'
  }

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0 translate-x-0' : 'top-0 translate-y-0',
    center: '',
    end: side === 'top' || side === 'bottom' ? 'right-0 translate-x-0' : 'bottom-0 translate-y-0'
  }

  return (
    <div
      className={cn(
        'absolute z-50 px-3 py-1.5 text-sm text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900',
        'rounded-md shadow-md animate-in fade-in-0 zoom-in-95',
        sideClasses[side],
        align !== 'center' && alignClasses[align],
        className
      )}
      role="tooltip"
      {...props}
    >
      {children}
    </div>
  )
}
