import React from 'react'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const NumberInput: React.FC<NumberInputProps> = ({
  className = '',
  style,
  ...props
}) => {
  return (
    <input
      type="number"
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

