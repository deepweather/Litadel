import React from 'react'
import { Heading } from '../../design-system/Typography/Heading'
import { Text } from '../../design-system/Typography/Text'

interface SectionHeaderProps {
  title: string
  count?: number
  icon?: React.ReactNode
  variant?: 'default' | 'accent' | 'primary'
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  icon,
  variant = 'primary',
}) => {
  return (
    <div className="flex items-center gap-sm mb-base pb-sm border-b border-border">
      {icon}
      <Heading level={2} variant={variant}>
        {title}
      </Heading>
      {count !== undefined && (
        <Text size="xs" variant="subdued" as="span">
          ({count})
        </Text>
      )}
    </div>
  )
}

