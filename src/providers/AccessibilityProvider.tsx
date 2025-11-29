'use client'

/**
 * Accessibility Provider Component
 * Initializes the AccessibilityManager for the entire application
 */

import { useEffect } from 'react'
import { AccessibilityManager } from '@/utils/accessibility/accessibility-manager'

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize accessibility manager with default settings
    const manager = AccessibilityManager.getInstance()
    manager.initialize({
      focusVisible: true,
      keyboardNavigation: true,
      screenReader: true,
      // User preferences (reducedMotion, highContrast) are auto-detected from system
    })

    // Cleanup on unmount
    return () => {
      manager.releaseFocusTrap()
    }
  }, [])

  return <>{children}</>
}
