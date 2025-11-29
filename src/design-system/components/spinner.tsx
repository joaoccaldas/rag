/**
 * Spinner Component - Professional Design System
 * Loading indicators with multiple variants
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "border-2 border-gray-300 border-t-primary rounded-full",
        dots: "flex space-x-1",
        pulse: "bg-primary rounded-full animate-pulse",
        bars: "flex space-x-1",
      },
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    if (variant === "dots") {
      return (
        <div ref={ref} className={cn("flex space-x-1", className)} {...props}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-primary rounded-full animate-bounce",
                size === "sm" && "w-1 h-1",
                size === "default" && "w-2 h-2", 
                size === "lg" && "w-3 h-3",
                size === "xl" && "w-4 h-4"
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
          {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
        </div>
      )
    }

    if (variant === "bars") {
      return (
        <div ref={ref} className={cn("flex space-x-1", className)} {...props}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-primary animate-pulse",
                size === "sm" && "w-1 h-3",
                size === "default" && "w-1 h-4",
                size === "lg" && "w-2 h-6", 
                size === "xl" && "w-2 h-8"
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
          {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2">
        <div
          ref={ref}
          className={cn(spinnerVariants({ variant, size, className }))}
          {...props}
        />
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </div>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
