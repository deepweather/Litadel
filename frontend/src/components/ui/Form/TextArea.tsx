import React from 'react'
import { Textarea } from '../textarea'
import { cn } from '@/lib/utils'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <Textarea
      className={cn('w-full font-mono resize-vertical', className)}
      {...props}
    />
  )
}

