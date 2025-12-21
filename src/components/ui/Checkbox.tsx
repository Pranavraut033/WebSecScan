import React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <input
            id={checkboxId}
            type="checkbox"
            className={cn(
              'mt-0.5 h-5 w-5 rounded border-cyber-gray-300 dark:border-cyber-gray-700 bg-white dark:bg-cyber-darker',
              'text-cyber-blue focus:ring-2 focus:ring-cyber-blue focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-cyber-black',
              'transition-all duration-200 cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-severity-critical',
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm text-cyber-gray-700 dark:text-cyber-gray-300 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-severity-critical ml-8">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
