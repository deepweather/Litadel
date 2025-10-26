import React from 'react'

interface CodeProps {
  children: React.ReactNode
  block?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Code: React.FC<CodeProps> = ({
  children,
  block = false,
  className = '',
  style,
}) => {
  if (block) {
    return (
      <pre
        className={`font-mono text-sm text-primary bg-bg-secondary border border-border p-base overflow-auto ${className}`.trim()}
        style={style}
      >
        {children}
      </pre>
    )
  }

  return (
    <code
      className={`font-mono text-sm text-accent bg-bg-secondary px-sm py-xs ${className}`.trim()}
      style={style}
    >
      {children}
    </code>
  )
}

