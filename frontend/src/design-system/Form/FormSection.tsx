import React from 'react'
import { Heading } from '../Typography/Heading'
import { Text } from '../Typography/Text'

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`border border-border p-xl flex flex-col gap-lg ${className}`.trim()}>
      <div>
        <Heading level={3}>{title}</Heading>
        {description && (
          <Text variant="subdued" size="base" className="mt-sm">
            {description}
          </Text>
        )}
      </div>
      {children}
    </div>
  )
}

