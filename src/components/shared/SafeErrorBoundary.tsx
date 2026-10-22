import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface SafeErrorBoundaryProps {
  children: ReactNode
}

interface SafeErrorBoundaryState {
  hasError: boolean
}

export class SafeErrorBoundary extends Component<
  SafeErrorBoundaryProps,
  SafeErrorBoundaryState
> {
  override state: SafeErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SafeErrorBoundaryState {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="border-destructive/25 bg-card rounded-2xl border p-7"
        >
          <h1 className="text-lg font-semibold">
            Không thể hiển thị trang này
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Hãy quay lại khu vực làm việc hoặc thử mở lại trang.
          </p>
          <Link
            to="/portal"
            className="bg-primary text-primary-foreground mt-4 inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium"
          >
            Về cổng nội bộ
          </Link>
        </section>
      )
    }

    return this.props.children
  }
}
