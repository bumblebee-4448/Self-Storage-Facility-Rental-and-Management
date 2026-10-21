import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  trailing?: ReactNode
}

export function FormField({
  id,
  label,
  error,
  trailing,
  className,
  ...props
}: FormFieldProps) {
  const inputId = id ?? props.name
  const errorId = error && inputId ? `${inputId}-error` : undefined
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-[#344239]">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#202521] transition outline-none placeholder:text-[#9aa49c] focus:border-[#66816e] focus:ring-4 focus:ring-[#66816e]/10 aria-[invalid=true]:border-[#b42318] ${trailing ? 'pr-12' : ''} ${className ?? ''}`}
          {...props}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  )
}
