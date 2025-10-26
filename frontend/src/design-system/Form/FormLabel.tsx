import React from 'react'

interface FormLabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block mb-sm text-base text-primary font-mono ${className}`.trim()}
    >
      {children}
      {required && ' *'}
    </label>
  )
}

