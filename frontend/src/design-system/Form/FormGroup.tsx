import React from 'react'
import { FormLabel } from './FormLabel'
import { FormError } from './FormError'

interface FormGroupProps {
  label: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  required = false,
  htmlFor,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      <FormLabel htmlFor={htmlFor} required={required}>
        {label}
      </FormLabel>
      {children}
      {error && <FormError>{error}</FormError>}
    </div>
  )
}

