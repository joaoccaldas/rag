/**
 * Design System Core - Centralized design tokens and utilities
 * This file provides the foundation for consistent UI across the application
 */

// Color Palette
export const colors = {
  // Primary brand colors
  primary: {
    50: 'hsl(216, 87%, 97%)',
    100: 'hsl(216, 87%, 94%)',
    200: 'hsl(216, 87%, 87%)',
    300: 'hsl(216, 87%, 80%)',
    400: 'hsl(216, 87%, 67%)',
    500: 'hsl(216, 87%, 59%)', // Main brand color
    600: 'hsl(216, 87%, 52%)',
    700: 'hsl(216, 87%, 45%)',
    800: 'hsl(216, 87%, 38%)',
    900: 'hsl(216, 87%, 31%)',
  },
  
  // Miele brand colors
  miele: {
    50: 'hsl(350, 80%, 97%)',
    100: 'hsl(350, 80%, 93%)',
    200: 'hsl(350, 80%, 86%)',
    300: 'hsl(350, 80%, 76%)',
    400: 'hsl(350, 80%, 63%)',
    500: 'hsl(350, 80%, 50%)', // Miele red
    600: 'hsl(350, 80%, 42%)',
    700: 'hsl(350, 80%, 35%)',
    800: 'hsl(350, 80%, 28%)',
    900: 'hsl(350, 80%, 21%)',
    // Additional Miele colors
    silver: 'hsl(210, 8%, 78%)',
    charcoal: 'hsl(218, 15%, 25%)',
    cream: 'hsl(45, 45%, 95%)',
    warm: 'hsl(30, 25%, 88%)',
  },
  
  // Semantic colors
  success: {
    DEFAULT: 'hsl(142, 76%, 36%)',
    light: 'hsl(142, 76%, 46%)',
    dark: 'hsl(142, 76%, 26%)',
  },
  
  warning: {
    DEFAULT: 'hsl(38, 92%, 50%)',
    light: 'hsl(38, 92%, 60%)',
    dark: 'hsl(38, 92%, 40%)',
  },
  
  error: {
    DEFAULT: 'hsl(0, 84%, 60%)',
    light: 'hsl(0, 84%, 70%)',
    dark: 'hsl(0, 84%, 50%)',
  },
  
  info: {
    DEFAULT: 'hsl(217, 91%, 60%)',
    light: 'hsl(217, 91%, 70%)',
    dark: 'hsl(217, 91%, 50%)',
  },
  
  // Neutral colors
  gray: {
    50: 'hsl(210, 40%, 98%)',
    100: 'hsl(210, 40%, 96%)',
    200: 'hsl(214, 32%, 91%)',
    300: 'hsl(213, 27%, 84%)',
    400: 'hsl(215, 20%, 65%)',
    500: 'hsl(215, 16%, 47%)',
    600: 'hsl(215, 19%, 35%)',
    700: 'hsl(215, 25%, 27%)',
    800: 'hsl(217, 33%, 17%)',
    900: 'hsl(222, 84%, 5%)',
  }
} as const

// Typography Scale
export const typography = {
  // Font families
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    mono: ['var(--font-roboto-mono)', 'Consolas', 'monospace'],
  },
  
  // Font sizes with line heights
  fontSize: {
    'body-small': ['0.75rem', { lineHeight: '1rem' }],      // 12px
    'body-base': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    'body-large': ['1rem', { lineHeight: '1.5rem' }],       // 16px
    'headline-small': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    'headline-base': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    'headline-large': ['1.5rem', { lineHeight: '2rem' }],      // 24px
    'display-small': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
    'display-base': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
    'display-large': ['3rem', { lineHeight: '1' }],            // 48px
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
} as const

// Spacing Scale
export const spacing = {
  'space-xs': '0.25rem',    // 4px
  'space-sm': '0.5rem',     // 8px
  'space-md': '1rem',       // 16px
  'space-lg': '1.5rem',     // 24px
  'space-xl': '2rem',       // 32px
  'space-2xl': '3rem',      // 48px
  'space-3xl': '4rem',      // 64px
  'space-4xl': '5rem',      // 80px
} as const

// Border Radius
export const borderRadius = {
  'radius-xs': '0.125rem',  // 2px
  'radius-sm': '0.25rem',   // 4px
  'radius-md': '0.375rem',  // 6px
  'radius-lg': '0.5rem',    // 8px
  'radius-xl': '0.75rem',   // 12px
  'radius-2xl': '1rem',     // 16px
  'radius-full': '9999px',  // Full border radius
} as const

// Shadows
export const shadows = {
  'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'shadow-base': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

// Animations
export const animations = {
  'animate-fade-in': 'fadeIn 0.5s ease-in-out',
  'animate-slide-up': 'slideUp 0.3s ease-out',
  'animate-slide-down': 'slideDown 0.3s ease-out',
  'animate-scale-in': 'scaleIn 0.2s ease-out',
} as const

// Component Variants
export const componentVariants = {
  button: {
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
    variant: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-700 hover:bg-gray-100',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    }
  },
  
  card: {
    variant: {
      default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
      elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
      outlined: 'bg-white border-2 border-gray-300 rounded-lg',
    }
  },
  
  input: {
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    },
    variant: {
      default: 'border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      error: 'border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500',
    }
  }
} as const

// Utility functions
export const getSpacing = (key: keyof typeof spacing) => spacing[key]
export const getColor = (path: string): string => {
  const keys = path.split('.')
  let result: Record<string, unknown> = colors as Record<string, unknown>
  for (const key of keys) {
    result = result[key] as Record<string, unknown>
  }
  return result as unknown as string
}

// Export all design tokens
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  componentVariants,
} as const

export type DesignTokens = typeof designTokens
export type ColorPath = keyof typeof colors
export type SpacingKey = keyof typeof spacing
export type BorderRadiusKey = keyof typeof borderRadius
export type ShadowKey = keyof typeof shadows
