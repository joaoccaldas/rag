import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = createContext<SelectContextType | undefined>(undefined)

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

export interface SelectValueProps {
  placeholder?: string
}

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value || '')

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{
      value: value || internalValue,
      onValueChange: handleValueChange,
      open,
      setOpen
    }}>
      <div className={cn('relative', disabled && 'opacity-50 pointer-events-none')}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className, ...props }: SelectTriggerProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within a Select')

  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 dark:border-neutral-600',
        'bg-white dark:bg-neutral-900 px-3 py-2 text-sm',
        'placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within a Select')

  return (
    <span className={cn(!context.value && 'text-neutral-500 dark:text-neutral-400')}>
      {context.value || placeholder}
    </span>
  )
}

export function SelectContent({ children, className, ...props }: SelectContentProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within a Select')

  if (!context.open) return null

  return (
    <div
      className={cn(
        'absolute top-full left-0 z-50 w-full mt-1',
        'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600',
        'rounded-md shadow-lg max-h-60 overflow-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SelectItem({ value, children, className, ...props }: SelectItemProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within a Select')

  const isSelected = context.value === value

  return (
    <div
      className={cn(
        'px-3 py-2 text-sm cursor-pointer',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:outline-none',
        isSelected && 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400',
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  )
}
