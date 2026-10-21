import { createBrowserRouter } from 'react-router-dom'
import { CustomerLayout } from '@/app/layouts/CustomerLayout'
import { InternalLoginLayout } from '@/app/layouts/InternalLoginLayout'
import { PortalLayout } from '@/app/layouts/PortalLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { LandingPage } from '@/features/landing/LandingPage'
import type { RouteObject } from 'react-router-dom'

export const routeObjects: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        path: '/facilities',
        element: <PlaceholderPage title="Khám phá kho" />,
      },
      {
        path: '/auth/login',
        element: <PlaceholderPage title="Đăng nhập khách hàng" />,
      },
      {
        path: '/auth/register',
        element: <PlaceholderPage title="Tạo tài khoản khách hàng" />,
      },
    ],
  },
  {
    path: '/account',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <PlaceholderPage title="Tài khoản khách hàng" />,
      },
      { path: '*', element: <PlaceholderPage title="Khu vực khách hàng" /> },
    ],
  },
  {
    path: '/portal/login',
    element: (
      <InternalLoginLayout>
        <PlaceholderPage title="Đăng nhập nội bộ" />
      </InternalLoginLayout>
    ),
  },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Không gian làm việc" /> },
      {
        path: 'admin/*',
        element: <PlaceholderPage title="Quản trị hệ thống" />,
      },
      {
        path: 'ops/*',
        element: <PlaceholderPage title="Vận hành doanh nghiệp" />,
      },
      { path: 'manager/*', element: <PlaceholderPage title="Quản lý cơ sở" /> },
      { path: 'staff/*', element: <PlaceholderPage title="Nhân viên cơ sở" /> },
    ],
  },
]

export const router = createBrowserRouter(routeObjects)
