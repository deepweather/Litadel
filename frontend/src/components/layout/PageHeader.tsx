import React from 'react'
import { Heading } from '../../design-system/Typography/Heading'
import { Text } from '../../design-system/Typography/Text'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  variant?: 'default' | 'primary' | 'accent'
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  variant = 'primary',
}) => {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-border gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="flex items-center">{icon}</div>}
        <div>
          <Heading level={1} variant={variant} className={subtitle ? 'mb-1' : ''}>
            {title}
          </Heading>
          {subtitle && (
            <Text variant="subdued" size="sm">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  )
}

