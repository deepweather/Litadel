import React from 'react'

interface KeyValueRowProps {
  label: string
  value: React.ReactNode
  labelColor?: string
  valueColor?: string
  valueBold?: boolean
  divider?: boolean
  style?: React.CSSProperties
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({
  label,
  value,
  labelColor = '#5a6e7a',
  valueColor = '#4da6ff',
  valueBold = false,
  divider = true,
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: divider ? '1rem' : '0',
        borderBottom: divider ? '1px solid rgba(77, 166, 255, 0.2)' : 'none',
        ...style,
      }}
    >
      <span
        style={{
          color: labelColor,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: valueColor,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
          fontWeight: valueBold ? 'bold' : 'normal',
        }}
      >
        {value}
      </span>
    </div>
  )
}

