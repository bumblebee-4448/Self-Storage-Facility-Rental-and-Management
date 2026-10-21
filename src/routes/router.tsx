import { createBrowserRouter, Outlet } from 'react-router-dom'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { InternalLoginLayout } from '@/layouts/InternalLoginLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import {
  RequireAuth,
  RoleDashboard,
  RoleHomeRedirect,
} from '@/components/shared/RouteGuards'
import { internalRoles } from '@/config/roles'
import { LandingPage } from '@/pages/LandingPage'
import {
  AccountHomeRoute,
  ChangePasswordRoute,
  ForgotPasswordRoute,
  FacilitiesRoute,
  FacilityDetailRoute,
  InternalLoginRoute,
  LoginRoute,
  ProfileRoute,
  RegisterRoute,
  ResetPasswordRoute,
  StorageDiscoveryRoute,
  NewReservationRoute,
  ReservationReviewRoute,
  MyReservationsRoute,
  ReservationDetailsRoute,
} from '@/routes/LazyPages'
import type { RouteObject } from 'react-router-dom'

export const routeObjects: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/facilities', element: <FacilitiesRoute /> },
      { path: '/facilities/:facilityId', element: <FacilityDetailRoute /> },
      { path: '/storage-units', element: <StorageDiscoveryRoute /> },
      { path: '/reservations/new', element: <RequireAuth allowedRoles={['CUSTOMER']}><NewReservationRoute /></RequireAuth> },
      { path: '/reservations/review', element: <RequireAuth allowedRoles={['CUSTOMER']}><ReservationReviewRoute /></RequireAuth> },
      { path: '/auth/login', element: <LoginRoute /> },
      { path: '/auth/register', element: <RegisterRoute /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordRoute /> },
      { path: '/auth/reset-password', element: <ResetPasswordRoute /> },
    ],
  },
  {
    path: '/account',
    element: (
      <RequireAuth allowedRoles={['CUSTOMER']}>
        <CustomerLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AccountHomeRoute /> },
      { path: 'profile', element: <ProfileRoute /> },
      { path: 'change-password', element: <ChangePasswordRoute /> },
      { path: 'reservations', element: <MyReservationsRoute /> },
      { path: 'reservations/:reservationId', element: <ReservationDetailsRoute /> },
      { path: '*', element: <PlaceholderPage title="Khu vực khách hàng" /> },
    ],
  },
  {
    path: '/portal/login',
    element: (
      <InternalLoginLayout>
        <Outlet />
      </InternalLoginLayout>
    ),
    children: [{ index: true, element: <InternalLoginRoute /> }],
  },
  {
    path: '/portal',
    element: (
      <RequireAuth allowedRoles={internalRoles}>
        <PortalLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      {
        path: 'admin/*',
        element: (
          <RequireAuth allowedRoles={['SYSTEM_ADMIN']}>
            <RoleDashboard
              role="SYSTEM_ADMIN"
              title="Quản trị hệ thống"
              description="Không gian quản trị hệ thống. Các công cụ chỉ hiển thị sau khi API và quyền truy cập tương ứng được xác nhận."
            />
          </RequireAuth>
        ),
      },
      {
        path: 'ops/*',
        element: (
          <RequireAuth allowedRoles={['BUSINESS_OPS_MANAGER']}>
            <RoleDashboard
              role="BUSINESS_OPS_MANAGER"
              title="Vận hành doanh nghiệp"
              description="Không gian dành cho quản lý vận hành. Chưa hiển thị KPI hoặc dữ liệu giả."
            />
          </RequireAuth>
        ),
      },
      {
        path: 'manager/*',
        element: (
          <RequireAuth allowedRoles={['FACILITY_MANAGER']}>
            <RoleDashboard
              role="FACILITY_MANAGER"
              title="Quản lý cơ sở"
              description="Không gian dành cho quản lý cơ sở. Các nghiệp vụ sẽ được tích hợp theo API và phân quyền đã xác nhận."
            />
          </RequireAuth>
        ),
      },
      {
        path: 'staff/*',
        element: (
          <RequireAuth allowedRoles={['FACILITY_STAFF']}>
            <RoleDashboard
              role="FACILITY_STAFF"
              title="Nhân viên cơ sở"
              description="Không gian dành cho nhân viên cơ sở. Các nghiệp vụ sẽ được tích hợp theo API và phân quyền đã xác nhận."
            />
          </RequireAuth>
        ),
      },
      { path: '*', element: <PlaceholderPage title="Không tìm thấy trang" /> },
    ],
  },
  { path: '*', element: <PlaceholderPage title="Không tìm thấy trang" /> },
]

export const router = createBrowserRouter(routeObjects)
