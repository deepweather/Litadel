import React from 'react'

interface FormErrorProps {
  children: React.ReactNode
  className?: string
}

export const FormError: React.FC<FormErrorProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`text-danger text-sm mt-xs font-mono ${className}`.trim()}>
      {children}
    </div>
  )
}

