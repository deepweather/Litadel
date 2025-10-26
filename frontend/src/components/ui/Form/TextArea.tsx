import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  className = '',
  style,
  ...props
}) => {
  return (
    <textarea
      className={className}
      style={{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#1a2a3a',
        border: '1px solid #4da6ff',
        color: '#fff',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.875rem',
        resize: 'vertical',
        ...style,
      }}
      {...props}
    />
  )
}

