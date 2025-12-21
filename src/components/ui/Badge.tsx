import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200'

    const variants = {
      default: 'bg-cyber-gray-700 text-cyber-gray-200',
      critical: 'bg-severity-critical/20 text-severity-critical border border-severity-critical/50 shadow-glow-red',
      high: 'bg-orange-500/20 text-orange-400 border border-orange-500/50',
      medium: 'bg-severity-medium/20 text-severity-medium border border-severity-medium/50',
      low: 'bg-severity-low/20 text-severity-low border border-severity-low/50',
      info: 'bg-cyber-purple/20 text-cyber-purple-light border border-cyber-purple/50 shadow-glow-purple',
      success: 'bg-status-safe/20 text-status-safe border border-status-safe/50 shadow-glow-green',
    }

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
