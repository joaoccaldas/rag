/**
 * Accessibility-focused components and utilities
 * Ensures WCAG compliance and keyboard navigation
 */

import React, { 
  useEffect, 
  useRef, 
  useState, 
  useId,
  createContext,
  useContext
} from 'react'
import { cn } from '../utils/cn'

// Focus Management Hook
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])
  
  return containerRef
}

// Skip Link Component
export interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      {children}
    </a>
  )
}

// Screen Reader Only Text
export interface ScreenReaderOnlyProps {
  children: React.ReactNode
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return <span className="sr-only">{children}</span>
}

// Live Region for Announcements
export interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
}

const LiveRegion: React.FC<LiveRegionProps> = ({ 
  children, 
  politeness = 'polite', 
  atomic = false 
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Modal/Dialog Component with A11y
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md'
}) => {
  const titleId = useId()
  const descriptionId = useId()
  const trapRef = useFocusTrap(isOpen)
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'relative bg-background rounded-lg shadow-lg w-full',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {description && (
              <p id={descriptionId} className="text-sm text-muted-foreground mb-4">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Accessible Button Group
export interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  label: string
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  orientation = 'horizontal',
  label 
}) => {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col'
      )}
    >
      {children}
    </div>
  )
}

// Accessible Tabs
interface TabsContextType {
  activeTab: string
  setActiveTab: (tabId: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

export interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
}

const Tabs: React.FC<TabsProps> = ({ 
  defaultValue, 
  children, 
  orientation = 'horizontal' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-col' : 'flex-row'
      )}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  children: React.ReactNode
  'aria-label': string
}

const TabsList: React.FC<TabsListProps> = ({ children, 'aria-label': ariaLabel }) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex border-b"
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, disabled }) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  const { activeTab, setActiveTab } = context
  const isSelected = activeTab === value
  
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        isSelected 
          ? 'border-primary text-primary' 
          : 'border-transparent hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps {
  value: string
  children: React.ReactNode
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  const { activeTab } = context
  const isSelected = activeTab === value
  
  if (!isSelected) return null
  
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className="p-4"
    >
      {children}
    </div>
  )
}

// Form Field with Accessibility
export interface FormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  description?: string
  required?: boolean
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  children, 
  error, 
  description, 
  required 
}) => {
  const fieldId = useId()
  const errorId = useId()
  const descriptionId = useId()
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-invalid': !!error,
          'aria-describedby': [
            description && descriptionId,
            error && errorId
          ].filter(Boolean).join(' ')
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export {
  SkipLink,
  ScreenReaderOnly,
  LiveRegion,
  Modal,
  ButtonGroup,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FormField
}
