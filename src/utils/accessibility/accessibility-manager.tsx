/**
 * ♿ PRIORITY 10: COMPREHENSIVE ACCESSIBILITY ENHANCEMENTS
 * 
 * Modular accessibility utilities and components for WCAG 2.1 AA compliance
 * Includes ARIA labels, keyboard navigation, color contrast, and screen reader support
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

// ==================== ACCESSIBILITY INTERFACES ====================

export interface AccessibilityOptions {
  highContrast?: boolean
  reducedMotion?: boolean
  textScale?: number
  focusVisible?: boolean
  screenReader?: boolean
  keyboardNavigation?: boolean
}

export interface AriaAttributes {
  label?: string
  labelledby?: string
  describedby?: string
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  busy?: boolean
  controls?: string
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  level?: number
  orientation?: 'horizontal' | 'vertical'
  placeholder?: string
  readonly?: boolean
  required?: boolean
  role?: string
  tabindex?: number
}

export interface FocusManagementOptions {
  trapFocus?: boolean
  restoreFocus?: boolean
  initialFocus?: string | HTMLElement
  allowTabToEscape?: boolean
}

// ==================== ACCESSIBILITY MANAGER ====================

export class AccessibilityManager {
  private static instance: AccessibilityManager
  private options: AccessibilityOptions = {}
  private focusHistory: HTMLElement[] = []
  private currentFocusTrap: HTMLElement | null = null

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  initialize(options: AccessibilityOptions = {}) {
    this.options = { ...this.options, ...options }
    
    if (typeof window !== 'undefined') {
      this.detectUserPreferences()
      this.setupGlobalAccessibilityFeatures()
      this.setupKeyboardNavigation()
    }
  }

  private detectUserPreferences() {
    // Detect user preferences from system settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    
    this.options.reducedMotion = this.options.reducedMotion ?? prefersReducedMotion
    this.options.highContrast = this.options.highContrast ?? prefersHighContrast
    
    // Apply CSS classes based on preferences
    if (this.options.reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    }
    
    if (this.options.highContrast) {
      document.documentElement.classList.add('high-contrast')
    }
  }

  private setupGlobalAccessibilityFeatures() {
    // Add CSS for accessibility features
    const style = document.createElement('style')
    style.textContent = `
      .reduce-motion * {
        animation-duration: 0.01s !important;
        transition-duration: 0.01s !important;
      }
      
      .high-contrast {
        filter: contrast(150%) !important;
      }
      
      .focus-visible:focus-visible {
        outline: 3px solid #4F46E5 !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 6px;
      }
      
      [aria-expanded="true"] + .collapsible {
        display: block;
      }
      
      [aria-expanded="false"] + .collapsible {
        display: none;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01s !important;
          transition-duration: 0.01s !important;
        }
      }
    `
    document.head.appendChild(style)

    // Add skip link
    this.addSkipLink()
  }

  private addSkipLink() {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.className = 'skip-link'
    skipLink.textContent = 'Skip to main content'
    skipLink.setAttribute('aria-label', 'Skip to main content')
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC key handling for modals/dialogs
      if (e.key === 'Escape') {
        this.handleEscapeKey()
      }
      
      // Tab trap handling
      if (e.key === 'Tab' && this.currentFocusTrap) {
        this.handleTabInTrap(e)
      }
    })

    // Show focus indicators only for keyboard navigation
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse')
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.remove('using-mouse')
      }
    })
  }

  // ==================== FOCUS MANAGEMENT ====================

  trapFocus(container: HTMLElement, options: FocusManagementOptions = {}) {
    this.currentFocusTrap = container
    
    if (options.restoreFocus && document.activeElement) {
      this.focusHistory.push(document.activeElement as HTMLElement)
    }

    // Set initial focus
    if (options.initialFocus) {
      const initialElement = typeof options.initialFocus === 'string' 
        ? container.querySelector(options.initialFocus) as HTMLElement
        : options.initialFocus
      
      if (initialElement) {
        initialElement.focus()
      }
    } else {
      // Focus first focusable element
      const firstFocusable = this.getFocusableElements(container)[0]
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }

  releaseFocusTrap() {
    this.currentFocusTrap = null
    
    // Restore focus to previous element
    const previousElement = this.focusHistory.pop()
    if (previousElement) {
      previousElement.focus()
    }
  }

  private handleTabInTrap(e: KeyboardEvent) {
    if (!this.currentFocusTrap) return

    const focusableElements = this.getFocusableElements(this.currentFocusTrap)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ]

    return Array.from(
      container.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[]
  }

  private handleEscapeKey() {
    // Find and close the topmost modal/dialog
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
    const topModal = modals[modals.length - 1] as HTMLElement
    
    if (topModal) {
      // Trigger close event
      const closeEvent = new CustomEvent('accessibilityClose', {
        bubbles: true,
        detail: { trigger: 'escape' }
      })
      topModal.dispatchEvent(closeEvent)
    }
  }

  // ==================== ARIA UTILITIES ====================

  setAriaAttributes(element: HTMLElement, attributes: AriaAttributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(`aria-${key}`, String(value))
      }
    })
  }

  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // ==================== COLOR CONTRAST UTILITIES ====================

  validateColorContrast(foreground: string, background: string): {
    ratio: number
    aaCompliant: boolean
    aaaCompliant: boolean
  } {
    const fgLuminance = this.getLuminance(foreground)
    const bgLuminance = this.getLuminance(background)
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05)

    return {
      ratio,
      aaCompliant: ratio >= 4.5,
      aaaCompliant: ratio >= 7
    }
  }

  private getLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Apply gamma correction
    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
}

// ==================== REACT HOOKS ====================

export function useAccessibility(options: AccessibilityOptions = {}) {
  const manager = AccessibilityManager.getInstance()
  
  useEffect(() => {
    manager.initialize(options)
  }, [options])

  return {
    trapFocus: manager.trapFocus.bind(manager),
    releaseFocusTrap: manager.releaseFocusTrap.bind(manager),
    announceToScreenReader: manager.announceToScreenReader.bind(manager),
    validateColorContrast: manager.validateColorContrast.bind(manager),
    setAriaAttributes: manager.setAriaAttributes.bind(manager)
  }
}

export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, options: FocusManagementOptions = {}) {
  const manager = AccessibilityManager.getInstance()

  useEffect(() => {
    if (containerRef.current) {
      manager.trapFocus(containerRef.current, options)
      
      return () => {
        manager.releaseFocusTrap()
      }
    }
  }, [containerRef, options])
}

export function useScreenReaderAnnouncements() {
  const manager = AccessibilityManager.getInstance()
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    manager.announceToScreenReader(message, priority)
  }, [manager])

  return { announce }
}

// ==================== REACT COMPONENTS ====================

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  ariaLabel?: string
  ariaDescribedBy?: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'focus-visible px-4 py-2 rounded-lg font-medium transition-colors'
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:bg-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="sr-only">Loading...</span>
      )}
      {children}
    </button>
  )
}

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`

  useFocusTrap(modalRef, {
    restoreFocus: true,
    initialFocus: 'button, [tabindex="0"]'
  })

  useEffect(() => {
    const handleEscapeClose = (e: CustomEvent) => {
      if (e.detail.trigger === 'escape') {
        onClose()
      }
    }

    if (modalRef.current) {
      modalRef.current.addEventListener('accessibilityClose', handleEscapeClose as EventListener)
      
      return () => {
        modalRef.current?.removeEventListener('accessibilityClose', handleEscapeClose as EventListener)
      }
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full m-4 ${className}`}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {title}
          </h2>
          {children}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 focus-visible"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

interface AccessibleTabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTab,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const tabListRef = useRef<HTMLDivElement>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    const newTab = tabs[newIndex]
    handleTabChange(newTab.id)

    // Focus the new tab
    const tabButton = tabListRef.current?.children[newIndex] as HTMLButtonElement
    tabButton?.focus()
  }

  return (
    <div>
      <div
        ref={tabListRef}
        role="tablist"
        className="flex border-b border-gray-200 dark:border-gray-700"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`px-4 py-2 font-medium focus-visible ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="py-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance()
