import React from 'react'
import { cn } from '@/lib/utils'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4',
    }

    const variants = {
      primary: 'border-cyber-blue border-t-transparent',
      secondary: 'border-cyber-purple border-t-transparent',
      white: 'border-white border-t-transparent',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-block rounded-full animate-spin',
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

export default Spinner
