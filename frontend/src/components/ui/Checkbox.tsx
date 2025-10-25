import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer font-mono ${className}`}>
      <input
        type="checkbox"
        className="
          w-4 h-4
          border border-terminal-border
          bg-terminal-highlight
          text-terminal-fg
          focus:ring-0
          focus:ring-offset-0
          cursor-pointer
        "
        {...props}
      />
      <span className="text-terminal-fg text-sm select-none">{label}</span>
    </label>
  )
}
