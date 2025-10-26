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
    <div className="flex items-center justify-between pb-base border-b border-border gap-base flex-wrap">
      <div className="flex items-center gap-md flex-1">
        {icon && <div className="flex items-center">{icon}</div>}
        <div>
          <Heading level={1} variant={variant} className={subtitle ? 'mb-sm' : ''}>
            {title}
          </Heading>
          {subtitle && (
            <Text variant="dim" size="base">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-sm flex-wrap">{actions}</div>
      )}
    </div>
  )
}

