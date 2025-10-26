import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '../Typography/Heading'
import { Text } from '../Typography/Text'

interface DetailPageHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
  actions?: React.ReactNode
  status?: React.ReactNode
  className?: string
}

export const DetailPageHeader: React.FC<DetailPageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  status,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-base pb-base mb-base border-b border-border ${className}`.trim()}>
      <Button onClick={onBack} size="sm" className="p-sm">
        <ArrowLeft size={18} />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-base mb-sm">
          <Heading level={1}>{title}</Heading>
          {status}
        </div>
        {subtitle && (
          <Text variant="subdued" size="base">
            {subtitle}
          </Text>
        )}
      </div>
      {actions && (
        <div className="flex gap-sm">
          {actions}
        </div>
      )}
    </div>
  )
}

