import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variantClasses = {
  primary: 'border-primary text-primary hover:bg-primary hover:text-bg-primary',
  secondary: 'border-border text-primary hover:bg-bg-hover hover:border-primary',
  accent: 'border-accent text-accent hover:bg-accent hover:text-bg-primary',
  danger: 'border-danger text-danger hover:bg-danger hover:text-bg-primary',
  ghost: 'border-transparent text-primary hover:bg-bg-hover',
  success: 'border-success text-success hover:bg-success hover:text-bg-primary',
  warning: 'border-warning text-warning hover:bg-warning hover:text-bg-primary',
}

const sizeClasses = {
  sm: 'px-md py-xs text-sm',
  md: 'px-base py-sm text-base',
  lg: 'px-lg py-md text-md',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  // Map legacy variants for backward compatibility
  const normalizedVariant = variant === 'error' ? 'danger' : variant === 'default' ? 'primary' : variant

  const baseClasses = [
    'border-2',
    'bg-transparent',
    'font-mono',
    'font-bold',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    'inline-flex',
    'items-center',
    'gap-sm',
    'justify-center',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    variantClasses[normalizedVariant as keyof typeof variantClasses],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
