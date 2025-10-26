import React from 'react'

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const DateInput: React.FC<DateInputProps> = ({
  className = '',
  style,
  ...props
}) => {
  return (
    <input
      type="date"
      className={className}
      style={{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#1a2a3a',
        border: '1px solid #4da6ff',
        color: '#fff',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.875rem',
        ...style,
      }}
      {...props}
    />
  )
}

