import React from 'react'
import { Label } from '../label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <Label className="block mb-2 text-foreground font-mono text-sm font-bold">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

