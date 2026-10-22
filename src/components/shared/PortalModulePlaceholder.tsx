import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Role } from '@/models/auth'

const roleTitles: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  BUSINESS_OPS_MANAGER: 'Vận hành doanh nghiệp',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  FACILITY_STAFF: 'Nhân viên cơ sở',
}

export function PortalModulePlaceholder({
  role,
  title,
  description,
}: {
  role: Role
  title: string
  description: string
}) {
  return (
    <section>
      <PageHeader
        eyebrow={roleTitles[role]}
        title={title}
        description={description}
      />
      <div className="border-border bg-card rounded-2xl border border-dashed p-8 sm:p-10">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="bg-secondary text-secondary-foreground grid size-10 shrink-0 place-items-center rounded-xl">
            <Construction aria-hidden="true" size={19} />
          </span>
          <div>
            <h2 className="text-foreground font-medium">
              Đang chuẩn bị tích hợp
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Trang này là khung điều hướng cho đợt migration sau. Chưa có dữ
              liệu nghiệp vụ nào được tải hoặc giả lập. Endpoint và quyền truy
              cập sẽ được xác nhận trước khi triển khai module.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
