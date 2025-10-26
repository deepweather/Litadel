import React from 'react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="p-xl text-center text-dim font-mono">
      {message}
    </div>
  )
}

