/**
 * Design System Foundation
 * Provides consistent typography, colors, spacing, and component variants
 */

export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    semantic: {
      success: {
        50: '#ecfdf5',
        500: '#10b981',
        700: '#047857'
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        700: '#b45309'
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        700: '#c53030'
      },
      info: {
        50: '#eff6ff',
        500: '#3b82f6',
        700: '#1d4ed8'
      }
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem'     // 128px
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms'
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const

// Type helpers for theme usage
export type ThemeColors = typeof theme.colors
export type ThemeSpacing = typeof theme.spacing
export type ThemeTypography = typeof theme.typography

// Utility functions for accessing theme values
export const getColor = (path: string) => {
  const keys = path.split('.')
  let value: unknown = theme.colors
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  
  return typeof value === 'string' ? value : path
}

export const getSpacing = (size: keyof typeof theme.spacing) => {
  return theme.spacing[size]
}

export const getFontSize = (size: keyof typeof theme.typography.fontSize) => {
  return theme.typography.fontSize[size]
}

// CSS custom properties for runtime theme switching
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {}
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    variables[`--color-primary-${key}`] = value
  })
  
  Object.entries(theme.colors.gray).forEach(([key, value]) => {
    variables[`--color-gray-${key}`] = value
  })
  
  Object.entries(theme.colors.semantic).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([key, value]) => {
      variables[`--color-${colorName}-${key}`] = value
    })
  })
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value
  })
  
  return variables
}
