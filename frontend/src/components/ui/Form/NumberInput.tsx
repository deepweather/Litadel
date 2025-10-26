import React from 'react'
import { Input } from '../input'
import { cn } from '@/lib/utils'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const NumberInput: React.FC<NumberInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <Input
      type="number"
      className={cn('w-full font-mono', className)}
      {...props}
    />
  )
}

