import { Checkbox } from "./checkbox"
import { Label } from "./label"

interface FormCheckboxProps {
  label: string
  checked?: boolean
  onChange?: () => void
  onCheckedChange?: (checked: boolean) => void
  id?: string
  className?: string
  disabled?: boolean
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  onCheckedChange,
  className,
  id,
  disabled,
  ...props
}: FormCheckboxProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-')

  const handleChange = (checkedState: boolean) => {
    if (onCheckedChange) {
      onCheckedChange(checkedState)
    }
    if (onChange) {
      onChange()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className={className}
        {...props}
      />
      <Label
        htmlFor={checkboxId}
        className="text-sm font-mono cursor-pointer select-none"
      >
        {label}
      </Label>
    </div>
  )
}
