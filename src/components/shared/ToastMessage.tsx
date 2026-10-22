import { cn } from '@/lib/utils'

export function ToastMessage({
  message,
  variant = 'success',
}: {
  message: string
  variant?: 'success' | 'error' | 'info'
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        variant === 'success' &&
          'border-primary/20 bg-secondary text-secondary-foreground',
        variant === 'error' &&
          'border-destructive/25 bg-destructive/5 text-destructive',
        variant === 'info' && 'border-border bg-muted text-foreground',
      )}
    >
      {message}
    </div>
  )
}
