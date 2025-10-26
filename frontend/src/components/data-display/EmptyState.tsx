import React from 'react'

interface EmptyStateProps {
  icon: React.ReactNode | string
  title: string
  description: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-3xl px-xl font-mono">
      <div className="mb-lg text-3xl">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <h3 className="text-xl font-bold text-primary mb-md">
        {title}
      </h3>
      <p className="text-subdued text-base max-w-2xl mx-auto mb-xl">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

