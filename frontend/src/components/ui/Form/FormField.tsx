import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: '#4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
          fontWeight: 'bold',
        }}
      >
        {label}
        {required && <span style={{ color: '#ff0000', marginLeft: '0.25rem' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

