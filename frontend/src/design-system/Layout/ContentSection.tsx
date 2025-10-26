import React from 'react'
import { Heading } from '../Typography/Heading'

interface ContentSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
  headerActions?: React.ReactNode
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  children,
  className = '',
  headerActions,
}) => {
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-base">
          <Heading level={2}>{title}</Heading>
          {headerActions}
        </div>
      )}
      {children}
    </div>
  )
}

