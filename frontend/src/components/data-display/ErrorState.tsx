import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  error: Error | string
  retry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, retry }) => {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className="p-xl text-center border border-danger bg-danger/5">
      <p className={`text-danger font-mono ${retry ? 'mb-lg' : ''}`}>
        Error: {errorMessage}
      </p>
      {retry && (
        <Button onClick={retry} variant="destructive">
          Try Again
        </Button>
      )}
    </div>
  )
}

