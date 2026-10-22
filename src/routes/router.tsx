import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { InternalLoginLayout } from '@/layouts/InternalLoginLayout'
import { InternalPortalShell } from '@/layouts/InternalPortalShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { PortalModulePlaceholder } from '@/components/shared/PortalModulePlaceholder'
import { RequireAuth, RoleHomeRedirect } from '@/components/shared/RouteGuards'
import { internalRoles } from '@/config/roles'
import type { Role } from '@/models/auth'
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

function roleRoutes(
  path: string,
  role: Role,
  defaultPath: string,
  pages: { path: string; title: string; description: string }[],
): RouteObject {
  return {
    id: `portal-${path}`,
    path,
    element: <RequireAuth allowedRoles={[role]} />,
    children: [
      { index: true, element: <Navigate to={defaultPath} replace /> },
      ...pages.map(({ path: pagePath, title, description }) => ({
        id: `portal-${path}-${pagePath.replaceAll('/', '-')}`,
        path: pagePath,
        element: (
          <PortalModulePlaceholder
            role={role}
            title={title}
            description={description}
          />
        ),
      })),
      { path: '*', element: <PlaceholderPage title="Không tìm thấy trang" /> },
    ],
  }
}

const moduleDescription =
  'Khung trang đã được chuẩn bị. API và hành vi nghiệp vụ sẽ được xác nhận trong task migration riêng.'

export const routeObjects: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/facilities', element: <FacilitiesRoute /> },
      { path: '/facilities/:facilityId', element: <FacilityDetailRoute /> },
      { path: '/storage-units', element: <StorageDiscoveryRoute /> },
      {
        path: '/reservations/new',
        element: (
          <RequireAuth allowedRoles={['CUSTOMER']}>
            <NewReservationRoute />
          </RequireAuth>
        ),
      },
      {
        path: '/reservations/review',
        element: (
          <RequireAuth allowedRoles={['CUSTOMER']}>
            <ReservationReviewRoute />
          </RequireAuth>
        ),
      },
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
      {
        path: 'reservations/:reservationId',
        element: <ReservationDetailsRoute />,
      },
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
    id: 'portal-root',
    element: (
      <RequireAuth
        allowedRoles={internalRoles}
        keepAuthenticatedShellDuringCheck
      >
        <InternalPortalShell />
      </RequireAuth>
    ),
    children: [
      { id: 'portal-home', index: true, element: <RoleHomeRedirect /> },
      roleRoutes('admin', 'SYSTEM_ADMIN', 'users', [
        { path: 'users', title: 'Người dùng', description: moduleDescription },
        {
          path: 'audit-logs',
          title: 'Nhật ký hệ thống',
          description: moduleDescription,
        },
      ]),
      roleRoutes('ops', 'BUSINESS_OPS_MANAGER', 'facilities', [
        { path: 'facilities', title: 'Cơ sở', description: moduleDescription },
        {
          path: 'unit-types',
          title: 'Loại kho',
          description: moduleDescription,
        },
        {
          path: 'amenities',
          title: 'Tiện ích',
          description: moduleDescription,
        },
        {
          path: 'offerings',
          title: 'Gói dịch vụ',
          description: moduleDescription,
        },
        {
          path: 'facility-amenities',
          title: 'Tiện ích cơ sở',
          description: moduleDescription,
        },
        {
          path: 'approvals',
          title: 'Duyệt yêu cầu',
          description: moduleDescription,
        },
      ]),
      roleRoutes('manager', 'FACILITY_MANAGER', 'storage-units', [
        {
          path: 'storage-units',
          title: 'Phòng kho',
          description: moduleDescription,
        },
        {
          path: 'reservations',
          title: 'Đặt chỗ',
          description: moduleDescription,
        },
        {
          path: 'contracts',
          title: 'Hợp đồng',
          description: moduleDescription,
        },
        {
          path: 'contracts/:id',
          title: 'Chi tiết hợp đồng',
          description: moduleDescription,
        },
        { path: 'requests', title: 'Yêu cầu', description: moduleDescription },
      ]),
      roleRoutes('staff', 'FACILITY_STAFF', 'contracts', [
        {
          path: 'contracts',
          title: 'Hợp đồng',
          description: moduleDescription,
        },
        {
          path: 'contracts/:id',
          title: 'Chi tiết hợp đồng',
          description: moduleDescription,
        },
        {
          path: 'storage-units',
          title: 'Phòng kho',
          description: moduleDescription,
        },
      ]),
      { path: '*', element: <PlaceholderPage title="Không tìm thấy trang" /> },
    ],
  },
  { path: '*', element: <PlaceholderPage title="Không tìm thấy trang" /> },
]

export const router = createBrowserRouter(routeObjects)
