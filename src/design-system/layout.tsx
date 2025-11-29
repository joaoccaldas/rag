/**
 * Responsive Layout Components
 * Provides consistent layout patterns across the application
 */

import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

// Container Component
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  center?: boolean
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', center = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'w-full px-4 sm:px-6 lg:px-8',
          sizeClasses[size],
          center && 'mx-auto',
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

// Grid Component
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  }
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive, ...props }, ref) => {
    const colsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12'
    }
    
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }
    
    const responsiveClasses = responsive ? [
      responsive.sm && `sm:grid-cols-${responsive.sm}`,
      responsive.md && `md:grid-cols-${responsive.md}`,
      responsive.lg && `lg:grid-cols-${responsive.lg}`,
      responsive.xl && `xl:grid-cols-${responsive.xl}`
    ].filter(Boolean).join(' ') : ''
    
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          colsClasses[cols],
          gapClasses[gap],
          responsiveClasses,
          className
        )}
        {...props}
      />
    )
  }
)
Grid.displayName = "Grid"

// Flex Component
export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = 'row', 
    wrap = 'nowrap', 
    justify = 'start', 
    align = 'start', 
    gap = 'none',
    ...props 
  }, ref) => {
    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse'
    }
    
    const wrapClasses = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse'
    }
    
    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    }
    
    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch'
    }
    
    const gapClasses = {
      none: '',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          wrapClasses[wrap],
          justifyClasses[justify],
          alignClasses[align],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)
Flex.displayName = "Flex"

// Stack Component (Simplified Flex for common use cases)
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing = 'md', align = 'stretch', ...props }, ref) => {
    const spacingClasses = {
      none: 'space-y-0',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8'
    }
    
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      />
    )
  }
)
Stack.displayName = "Stack"

// Section Component for Page Layout
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'muted'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-background',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      muted: 'bg-muted'
    }
    
    const sizeClasses = {
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
      xl: 'py-20'
    }
    
    return (
      <section
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Section.displayName = "Section"

// Sidebar Layout
export interface SidebarLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  sidebarWidth?: 'sm' | 'md' | 'lg'
  collapsible?: boolean
  collapsed?: boolean
  onToggle?: () => void
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  sidebar,
  children,
  sidebarWidth = 'md',
  collapsible = false,
  collapsed = false,
  onToggle
}) => {
  const widthClasses = {
    sm: collapsed ? 'w-16' : 'w-48',
    md: collapsed ? 'w-16' : 'w-64',
    lg: collapsed ? 'w-16' : 'w-80'
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        'flex-shrink-0 border-r bg-card transition-all duration-300 ease-in-out',
        widthClasses[sidebarWidth]
      )}>
        {collapsible && (
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h2 className={cn(
              'font-semibold transition-opacity duration-200',
              collapsed && 'opacity-0'
            )}>
              Menu
            </h2>
            <button
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-accent"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        )}
        <div className="h-full overflow-y-auto">
          {sidebar}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export {
  Container,
  Grid,
  Flex,
  Stack,
  Section,
  SidebarLayout
}
