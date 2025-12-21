import React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-cyber-gray-700 dark:text-cyber-gray-300 mb-2"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            'w-full px-4 py-2.5 bg-white dark:bg-cyber-darker border border-cyber-gray-300 dark:border-cyber-gray-700 rounded-lg',
            'text-cyber-gray-900 dark:text-cyber-gray-50',
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-transparent',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer',
            error && 'border-severity-critical focus:ring-severity-critical',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-severity-critical">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
