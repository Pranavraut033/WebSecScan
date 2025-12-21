import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-cyber-gray-700 dark:text-cyber-gray-300 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-gray-400 dark:text-cyber-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'w-full px-4 py-2.5 bg-white dark:bg-cyber-darker border border-cyber-gray-300 dark:border-cyber-gray-700 rounded-lg',
              'text-cyber-gray-900 dark:text-cyber-gray-50 placeholder:text-cyber-gray-400 dark:placeholder:text-cyber-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-transparent',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-severity-critical focus:ring-severity-critical',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-gray-400 dark:text-cyber-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-severity-critical">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
