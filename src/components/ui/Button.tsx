import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-black disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-cyber-blue hover:bg-cyber-blue-light text-white shadow-glow-blue hover:shadow-cyber focus:ring-cyber-blue',
      secondary: 'bg-cyber-purple hover:bg-cyber-purple-light text-white shadow-glow-purple hover:shadow-cyber focus:ring-cyber-purple',
      danger: 'bg-severity-critical hover:bg-cyber-red-dark text-white shadow-glow-red hover:shadow-cyber focus:ring-severity-critical',
      success: 'bg-status-safe hover:bg-cyber-green-dark text-cyber-black shadow-glow-green hover:shadow-cyber focus:ring-status-safe',
      ghost: 'bg-transparent hover:bg-cyber-dark text-cyber-blue-light border border-cyber-blue/30 hover:border-cyber-blue focus:ring-cyber-blue',
      outline: 'bg-transparent hover:bg-cyber-darker text-foreground border border-cyber-gray-700 hover:border-cyber-blue focus:ring-cyber-blue',
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5 rounded-md gap-1.5',
      md: 'text-base px-4 py-2 rounded-lg gap-2',
      lg: 'text-lg px-6 py-3 rounded-lg gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : leftIcon ? (
          <span className="inline-flex">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && (
          <span className="inline-flex">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
