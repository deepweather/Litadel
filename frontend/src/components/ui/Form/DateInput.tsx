import React from 'react'
import { Input } from '../input'
import { cn } from '@/lib/utils'

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const DateInput: React.FC<DateInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <Input
      type="date"
      className={cn('w-full font-mono', className)}
      {...props}
    />
  )
}

