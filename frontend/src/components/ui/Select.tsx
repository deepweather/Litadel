import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label
          style={{
            marginBottom: '1rem',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            display: 'block',
          }}
        >
          {label}
        </label>
      )}
      <select
        className={`
          bg-terminal-highlight
          border border-terminal-border
          text-terminal-fg
          px-3 py-2
          font-mono
          outline-none
          focus:border-terminal-fg
          focus:shadow-[0_0_5px_rgba(0,255,0,0.3)]
          transition-all
          cursor-pointer
          ${error ? 'border-terminal-error' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-terminal-highlight text-terminal-fg"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-terminal-error text-xs font-mono">{error}</span>}
    </div>
  )
}
