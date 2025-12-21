import React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, icon, children, ...props }, ref) => {
    const baseStyles = 'rounded-lg p-4 border'

    const variants = {
      info: 'bg-cyber-blue/10 border-cyber-blue/50 text-cyber-blue-light',
      success: 'bg-status-safe/10 border-status-safe/50 text-status-safe',
      warning: 'bg-severity-medium/10 border-severity-medium/50 text-severity-medium',
      danger: 'bg-severity-critical/10 border-severity-critical/50 text-severity-critical',
    }

    const defaultIcons = {
      info: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      success: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      danger: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        <div className="flex gap-3">
          <div className="shrink-0">
            {icon || defaultIcons[variant]}
          </div>
          <div className="flex-1">
            {title && (
              <h4 className="font-semibold mb-1">{title}</h4>
            )}
            <div className="text-sm opacity-90">{children}</div>
          </div>
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export default Alert
