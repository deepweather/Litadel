import React from 'react'

interface ActionGroupProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  gap?: 'sm' | 'base' | 'lg'
}

const alignClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

const gapClasses = {
  sm: 'gap-sm',
  base: 'gap-base',
  lg: 'gap-lg',
}

export const ActionGroup: React.FC<ActionGroupProps> = ({
  children,
  className = '',
  align = 'left',
  gap = 'base',
}) => {
  const classes = `flex items-center ${alignClasses[align]} ${gapClasses[gap]} ${className}`.trim()

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

