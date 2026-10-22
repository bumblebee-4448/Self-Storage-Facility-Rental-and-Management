import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  pending = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Hủy
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Đang xử lý…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
