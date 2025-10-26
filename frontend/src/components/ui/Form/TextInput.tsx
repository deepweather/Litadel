import React from 'react'
import { Input } from '../input'
import { cn } from '@/lib/utils'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const TextInput: React.FC<TextInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <Input
      type="text"
      className={cn('w-full font-mono', className)}
      {...props}
    />
  )
}

