import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleUserRound,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { changePassword as changePasswordApi } from '@/api/auth-service'
import { normalizeApiError, type NormalizedApiError } from '@/api/errors'
import { getFieldErrors, getPublicErrorMessage } from '@/api/error-message'
import { getMyProfile, updateMyProfile } from '@/api/profile-service'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import type {
  Gender,
  ProfileResponse,
  UpdateProfileRequest,
} from '@/models/profile'
import { useAuthStore } from '@/stores/auth-store'

function ErrorNotice({ error }: { error: NormalizedApiError }) {
  const detail = error.kind === 'http' ? getFieldErrors(error.errors) : []
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p>{getPublicErrorMessage(error)}</p>
      {detail.map((message, index) => (
        <p key={`${index}-${message}`} className="mt-1">
          {message}
        </p>
      ))}
    </div>
  )
}

export function AccountHomePage() {
  const user = useAuthStore((state) => state.user)
  const role = user?.roles[0].toLowerCase().replaceAll('_', ' ')
  return (
    <section className="rounded-3xl border border-[#e5e9e2] bg-white p-7 sm:p-10">
      <div className="text-primary grid size-12 place-items-center rounded-2xl bg-[#edf3ed]">
        <CircleUserRound />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-[#849087] uppercase">
        Khu vực khách hàng
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        Xin chào{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">{user?.email}</p>
      <p className="text-muted-foreground mt-1 text-sm capitalize">
        Vai trò tài khoản: {role}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/account/profile"
          className="rounded-2xl border border-[#e5e9e2] p-5 transition hover:border-[#9caf9e] hover:bg-[#f9faf7]"
        >
          <UserRound className="text-primary" />
          <h2 className="mt-3 font-semibold">Thông tin cá nhân</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Xem và cập nhật hồ sơ được hỗ trợ.
          </p>
        </Link>
        <Link
          to="/account/change-password"
          className="rounded-2xl border border-[#e5e9e2] p-5 transition hover:border-[#9caf9e] hover:bg-[#f9faf7]"
        >
          <LockKeyhole className="text-primary" />
          <h2 className="mt-3 font-semibold">Đổi mật khẩu</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Bảo vệ tài khoản bằng mật khẩu mới.
          </p>
        </Link>
      </div>
    </section>
  )
}

const profileSchema = z.object({
  avatarUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || z.url().safeParse(value).success,
      'Nhập URL ảnh hợp lệ.',
    ),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (!Number.isNaN(Date.parse(value)) && new Date(value) <= new Date()),
      'Ngày sinh không hợp lệ hoặc nằm trong tương lai.',
    ),
  address: z.string().max(200, 'Địa chỉ tối đa 200 ký tự.'),
  gender: z.enum(['', 'male', 'female', 'other']),
})
type ProfileValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loadError, setLoadError] = useState<NormalizedApiError | null>(null)
  const [saveError, setSaveError] = useState<NormalizedApiError | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { avatarUrl: '', dateOfBirth: '', address: '', gender: '' },
  })

  const loadProfile = useCallback(async () => {
    setLoadError(null)
    try {
      const result = await getMyProfile()
      setProfile(result)
      form.reset({
        avatarUrl: result.avatarUrl ?? '',
        dateOfBirth: result.dateOfBirth?.slice(0, 10) ?? '',
        address: result.address ?? '',
        gender: result.gender ?? '',
      })
    } catch (cause) {
      setLoadError(normalizeApiError(cause))
    } finally {
      setLoading(false)
    }
  }, [form])
  useEffect(() => {
    let active = true
    void getMyProfile()
      .then((result) => {
        if (!active) return
        setProfile(result)
        form.reset({
          avatarUrl: result.avatarUrl ?? '',
          dateOfBirth: result.dateOfBirth?.slice(0, 10) ?? '',
          address: result.address ?? '',
          gender: result.gender ?? '',
        })
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(normalizeApiError(cause))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [form])

  async function onSubmit(values: ProfileValues) {
    setSaveError(null)
    setSaved(false)
    const payload: UpdateProfileRequest = {
      ...(values.avatarUrl?.trim()
        ? { avatarUrl: values.avatarUrl.trim() }
        : {}),
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      address: values.address,
      ...(values.gender ? { gender: values.gender as Gender } : {}),
    }
    try {
      const updated = await updateMyProfile(payload)
      setProfile(updated)
      setSaved(true)
    } catch (cause) {
      setSaveError(normalizeApiError(cause))
    }
  }

  return (
    <section className="rounded-3xl border border-[#e5e9e2] bg-white p-6 sm:p-10">
      <Link
        to="/account"
        className="text-primary text-sm font-medium hover:underline"
      >
        ← Tài khoản
      </Link>
      <h1 className="mt-5 text-3xl font-semibold">Thông tin cá nhân</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Thông tin nhận dạng tài khoản do hệ thống quản lý; biểu mẫu chỉ cập nhật
        các trường hồ sơ BE hỗ trợ.
      </p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#f9faf7] p-4">
          <p className="text-muted-foreground text-xs">Họ và tên</p>
          <p className="mt-1 font-medium">{user?.name ?? 'Chưa cập nhật'}</p>
        </div>
        <div className="rounded-2xl bg-[#f9faf7] p-4">
          <p className="text-muted-foreground text-xs">Email</p>
          <p className="mt-1 font-medium">{user?.email}</p>
        </div>
        <div className="rounded-2xl bg-[#f9faf7] p-4">
          <p className="text-muted-foreground text-xs">Số điện thoại</p>
          <p className="mt-1 font-medium">
            {user?.phoneNumber ?? 'Chưa cập nhật'}
          </p>
        </div>
      </div>
      {loading ? (
        <p
          role="status"
          className="text-muted-foreground mt-8 flex items-center gap-2 text-sm"
        >
          <LoaderCircle className="animate-spin" size={17} /> Đang tải hồ sơ…
        </p>
      ) : loadError ? (
        <div className="mt-8 space-y-4">
          <ErrorNotice error={loadError} />
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true)
              void loadProfile()
            }}
          >
            Thử tải lại
          </Button>
        </div>
      ) : (
        profile && (
          <form
            noValidate
            className="mt-8 space-y-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {saveError && <ErrorNotice error={saveError} />}
            {saved && (
              <p
                role="status"
                className="text-primary rounded-xl bg-[#edf3ed] p-3 text-sm"
              >
                Hồ sơ đã được máy chủ cập nhật.
              </p>
            )}
            <FormField
              label="URL ảnh đại diện"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              {...form.register('avatarUrl')}
              error={form.formState.errors.avatarUrl?.message}
            />
            <FormField
              label="Ngày sinh"
              type="date"
              {...form.register('dateOfBirth')}
              error={form.formState.errors.dateOfBirth?.message}
            />
            <FormField
              label="Địa chỉ"
              autoComplete="street-address"
              placeholder="Địa chỉ liên hệ"
              {...form.register('address')}
              error={form.formState.errors.address?.message}
            />
            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-[#344239]"
              >
                Giới tính
              </label>
              <select
                id="gender"
                className="border-input min-h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none focus:border-[#66816e]"
                {...form.register('gender')}
              >
                <option value="">Chưa chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <LoaderCircle size={17} className="animate-spin" />
              )}
              Lưu hồ sơ
            </Button>
          </form>
        )
      )}
    </section>
  )
}

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'Mật khẩu hiện tại cần ít nhất 6 ký tự.')
      .max(100),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới cần ít nhất 6 ký tự.')
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  })
type PasswordValues = z.infer<typeof passwordSchema>

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const invalidateSession = useAuthStore((state) => state.invalidateSession)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  async function onSubmit(values: PasswordValues) {
    setError(null)
    try {
      await changePasswordApi({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      invalidateSession()
      navigate('/auth/login', {
        replace: true,
        state: {
          message:
            'Mật khẩu đã đổi thành công. Phiên hiện tại đã kết thúc; vui lòng đăng nhập lại.',
        },
      })
    } catch (cause) {
      setError(normalizeApiError(cause))
    }
  }
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-[#e5e9e2] bg-white p-6 sm:p-10">
      <Link
        to="/account"
        className="text-primary text-sm font-medium hover:underline"
      >
        ← Tài khoản
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="text-primary grid size-11 place-items-center rounded-2xl bg-[#edf3ed]">
          <LockKeyhole />
        </span>
        <h1 className="text-3xl font-semibold">Đổi mật khẩu</h1>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Sau khi đổi, backend thu hồi các phiên đăng nhập và bạn cần đăng nhập
        lại.
      </p>
      <form
        noValidate
        className="mt-7 space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {error && <ErrorNotice error={error} />}
        <FormField
          label="Mật khẩu hiện tại"
          type="password"
          autoComplete="current-password"
          {...form.register('currentPassword')}
          error={form.formState.errors.currentPassword?.message}
        />
        <FormField
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          {...form.register('newPassword')}
          error={form.formState.errors.newPassword?.message}
        />
        <FormField
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          className="rounded-xl"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <LoaderCircle className="animate-spin" size={17} />
          )}
          Cập nhật mật khẩu
        </Button>
      </form>
    </section>
  )
}
