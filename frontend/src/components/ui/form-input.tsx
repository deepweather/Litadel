import * as React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { cn } from "@/lib/utils"

interface FormInputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
}

export function FormInput({ label, error, className, id, ...props }: FormInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={inputId}>
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        className={cn(error && "border-destructive", className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <span className="text-destructive text-xs font-mono">
          {error}
        </span>
      )}
    </div>
  )
}

