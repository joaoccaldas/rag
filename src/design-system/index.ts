/**
 * Design System - Complete Export Index
 * Centralized access to all design system components and utilities
 */

// Theme and foundations
export * from './theme'

// Core components
export * from './components'

// Layout components  
export * from './layout'

// Accessibility components
export * from './accessibility'

// Utility functions
export { cn } from '../utils/cn'

// Component variants and utilities
export type { VariantProps } from 'class-variance-authority'

// Re-export commonly used types
export type {
  ButtonProps,
  InputProps,
  CardProps,
  BadgeProps,
  ProgressProps,
  SkeletonProps
} from './components'

export type {
  ContainerProps,
  GridProps,
  FlexProps,
  StackProps,
  SectionProps,
  SidebarLayoutProps
} from './layout'

export type {
  SkipLinkProps,
  ScreenReaderOnlyProps,
  LiveRegionProps,
  ModalProps,
  ButtonGroupProps,
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  FormFieldProps
} from './accessibility'

// Design tokens for easy access
export const tokens = {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    destructive: 'hsl(var(--destructive))',
    muted: 'hsl(var(--muted))',
    accent: 'hsl(var(--accent))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  }
}

// Preset component combinations for common patterns
export const presets = {
  cardWithHeader: {
    card: { variant: 'default' as const, padding: 'none' as const },
    header: { className: 'p-6 border-b' },
    content: { className: 'p-6' }
  },
  
  buttonGroup: {
    primary: { variant: 'default' as const, size: 'default' as const },
    secondary: { variant: 'outline' as const, size: 'default' as const },
    destructive: { variant: 'destructive' as const, size: 'default' as const }
  },
  
  formField: {
    input: { variant: 'default' as const, size: 'default' as const },
    error: { variant: 'error' as const, size: 'default' as const }
  }
}
