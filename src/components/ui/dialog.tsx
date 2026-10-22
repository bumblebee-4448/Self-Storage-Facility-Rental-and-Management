import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClose={() => onOpenChange(false)}
      className="border-border bg-card text-card-foreground m-auto w-[min(92vw,34rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/45"
    >
      <div className="border-border flex items-start justify-between gap-4 border-b p-5 sm:p-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="text-muted-foreground mt-1 text-sm"
            >
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Đóng hộp thoại"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-9 shrink-0 place-items-center rounded-lg"
        >
          <X aria-hidden="true" size={17} />
        </button>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  )
}
