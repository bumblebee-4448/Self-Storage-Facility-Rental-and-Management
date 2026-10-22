import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  sendRegistrationOtp,
  requestPasswordReset,
  resetPassword as submitPasswordReset,
} from '@/api/auth-service'
import { getFieldErrors, getPublicErrorMessage } from '@/api/error-message'
import { normalizeApiError, type NormalizedApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/shared/FormField'
import { roleHome } from '@/config/roles'
import type { Role } from '@/models/auth'
import { useAuthStore } from '@/stores/auth-store'
import type { RegisterRequest } from '@/models/backend-auth'

const loginSchema = z.object({
  email: z.email('Nhập email hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.').max(100),
})
type LoginValues = z.infer<typeof loginSchema>
const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Tên cần ít nhất 2 ký tự.')
      .max(50, 'Tên tối đa 50 ký tự.'),
    email: z.email('Nhập email hợp lệ.'),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (value) => !value || /^0(3|5|7|8|9)[0-9]{8}$/.test(value),
        'Số điện thoại Việt Nam chưa đúng định dạng.',
      ),
    otp: z.string().length(6, 'Mã OTP gồm đúng 6 ký tự.'),
    password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự.').max(100),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((value) => value, 'Bạn cần đồng ý với Điều khoản dịch vụ.'),
    privacy: z
      .boolean()
      .refine((value) => value, 'Bạn cần xác nhận Chính sách quyền riêng tư.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  })
type RegisterValues = z.infer<typeof registerSchema>
const emailSchema = z.object({ email: z.email('Nhập email hợp lệ.') })
type EmailValues = z.infer<typeof emailSchema>
const resetSchema = z
  .object({
    email: z.email('Nhập email hợp lệ.'),
    otp: z.string().length(6, 'Mã OTP gồm đúng 6 ký tự.'),
    newPassword: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự.').max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  })
type ResetValues = z.infer<typeof resetSchema>

function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[#e5e9e2] bg-white p-6 shadow-[0_24px_64px_-48px_rgba(30,50,35,.34)] sm:p-10">
      <div className="text-primary mb-7 grid size-12 place-items-center rounded-2xl bg-[#edf3ed]">
        <ShieldCheck size={22} />
      </div>
      <p className="text-xs font-semibold tracking-[0.16em] text-[#849087] uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </section>
  )
}
function ErrorFeedback({ error }: { error: NormalizedApiError | null }) {
  if (!error) return null
  const details = error.kind === 'http' ? getFieldErrors(error.errors) : []
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p>{getPublicErrorMessage(error)}</p>
      {details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {details.map((message, index) => (
            <li key={`${index}-${message}`}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
function usePasswordToggle() {
  const [visible, setVisible] = useState(false)
  return { visible, toggle: () => setVisible((value) => !value) }
}
function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      aria-pressed={visible}
      className="hover:text-primary absolute inset-y-0 right-3 grid w-9 place-items-center text-[#718078]"
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}

function safeDestination(candidate: unknown, role: Role): string {
  const fallback = roleHome[role]
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  )
    return fallback
  try {
    const url = new URL(candidate, window.location.origin)
    if (url.origin !== window.location.origin) return fallback
    const path = url.pathname
    if (role === 'CUSTOMER')
      return path === '/account' || path.startsWith('/account/')
        ? `${path}${url.search}`
        : fallback
    const allowedRoot: Record<Exclude<Role, 'CUSTOMER'>, string> = {
      SYSTEM_ADMIN: '/portal/admin',
      BUSINESS_OPS_MANAGER: '/portal/ops',
      FACILITY_MANAGER: '/portal/manager',
      FACILITY_STAFF: '/portal/staff',
    }
    const root = allowedRoot[role]
    return path === root || path.startsWith(`${root}/`)
      ? `${path}${url.search}`
      : fallback
  } catch {
    return fallback
  }
}

export function LoginPage({ internal = false }: { internal?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const signIn = useAuthStore((state) => state.signIn)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const password = usePasswordToggle()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  if (status === 'authenticated' && user)
    return <Navigate to={roleHome[user.roles[0]]} replace />
  const from = (location.state as { from?: unknown } | null)?.from
  const message = (location.state as { message?: unknown } | null)?.message
  async function onSubmit(values: LoginValues) {
    setError(null)
    const result = await signIn(values)
    if (!result.success) {
      setError(result.error)
      return
    }
    const role = result.value.roles[0]
    navigate(safeDestination(from, role), { replace: true })
  }
  return (
    <AuthCard
      eyebrow={internal ? 'Cổng thông tin nội bộ' : 'Chào mừng trở lại'}
      title={internal ? 'Đăng nhập nhân viên' : 'Đăng nhập tài khoản'}
      description={
        internal
          ? 'Đăng nhập bằng tài khoản được cấp cho nhân viên hệ thống.'
          : 'Đăng nhập để quản lý thông tin tài khoản và các dịch vụ của bạn.'
      }
    >
      <div className="space-y-5">
        <form
          noValidate
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {typeof message === 'string' && (
            <p
              className="text-primary rounded-xl bg-[#edf3ed] p-3 text-sm"
              role="status"
            >
              {message}
            </p>
          )}
          <ErrorFeedback error={error} />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="ten@email.com"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
          <FormField
            label="Mật khẩu"
            type={password.visible ? 'text' : 'password'}
            autoComplete={internal ? 'current-password' : 'current-password'}
            placeholder="Ít nhất 6 ký tự"
            {...form.register('password')}
            error={form.formState.errors.password?.message}
            trailing={
              <PasswordToggle
                visible={password.visible}
                onToggle={password.toggle}
              />
            }
          />
          {!internal && (
            <div className="-mt-2 text-right">
              <Link
                to="/auth/forgot-password"
                className="text-primary text-sm font-medium hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          )}
          <Button
            className="w-full rounded-xl"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <LoaderCircle className="animate-spin" size={17} />
            )}
            {form.formState.isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
        {internal ? (
          <p className="text-muted-foreground text-center text-sm">
            Tài khoản khách hàng?{' '}
            <Link
              to="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập khách hàng
            </Link>
          </p>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link
              to="/auth/register"
              className="text-primary font-medium hover:underline"
            >
              Tạo tài khoản
            </Link>
          </p>
        )}
      </div>
    </AuthCard>
  )
}

export function InternalLoginPage() {
  return <LoginPage internal />
}

export function RegisterPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((state) => state.signUp)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [otpMessage, setOtpMessage] = useState('')
  const [otpError, setOtpError] = useState<NormalizedApiError | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const password = usePasswordToggle()
  const form = useForm<z.input<typeof registerSchema>, unknown, RegisterValues>(
    {
      resolver: zodResolver(registerSchema),
      defaultValues: {
        name: '',
        email: '',
        phoneNumber: '',
        otp: '',
        password: '',
        confirmPassword: '',
        terms: false,
        privacy: false,
      },
    },
  )
  async function onSendOtp() {
    setOtpError(null)
    setOtpMessage('')
    const valid = await form.trigger('email')
    if (!valid) return
    setSendingOtp(true)
    try {
      setOtpMessage(await sendRegistrationOtp(form.getValues('email')))
    } catch (cause) {
      const normalized = normalizeApiError(cause)
      setOtpError(normalized)
    } finally {
      setSendingOtp(false)
    }
  }
  async function onSubmit(values: RegisterValues) {
    setError(null)
    const payload: RegisterRequest = {
      email: values.email,
      otp: values.otp,
      name: values.name.trim(),
      password: values.password,
      ...(values.phoneNumber?.trim()
        ? { phoneNumber: values.phoneNumber.trim() }
        : {}),
    }
    const result = await signUp(payload)
    if (!result.success) {
      setError(result.error)
      return
    }
    navigate(roleHome[result.value.roles[0]], { replace: true })
  }
  return (
    <AuthCard
      eyebrow="Tạo tài khoản"
      title="Bắt đầu với Haven"
      description="Xác minh email rồi tạo tài khoản lưu trữ của bạn."
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <ErrorFeedback error={error} />
        <FormField
          label="Họ và tên"
          autoComplete="name"
          placeholder="Nguyễn Văn An"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ten@email.com"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <FormField
          label="Số điện thoại (không bắt buộc)"
          type="tel"
          autoComplete="tel"
          placeholder="0912345678"
          {...form.register('phoneNumber')}
          error={form.formState.errors.phoneNumber?.message}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <FormField
            label="Mã OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 chữ số"
            {...form.register('otp')}
            error={form.formState.errors.otp?.message}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => void onSendOtp()}
            disabled={sendingOtp || form.formState.isSubmitting}
          >
            {sendingOtp && <LoaderCircle className="animate-spin" size={16} />}
            {sendingOtp ? 'Đang gửi…' : 'Gửi mã OTP'}
          </Button>
        </div>
        {otpMessage && (
          <p
            role="status"
            className="text-primary rounded-xl bg-[#edf3ed] p-3 text-sm"
          >
            {otpMessage}
          </p>
        )}
        <ErrorFeedback error={otpError} />
        <FormField
          label="Mật khẩu"
          type={password.visible ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Ít nhất 6 ký tự"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          trailing={
            <PasswordToggle
              visible={password.visible}
              onToggle={password.toggle}
            />
          }
        />
        <FormField
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
        />
        <label className="flex items-start gap-3 text-sm leading-5 text-[#59665d]">
          <input
            type="checkbox"
            className="mt-1 accent-[#244431]"
            {...form.register('terms')}
          />{' '}
          <span>
            Tôi đồng ý với{' '}
            <span className="text-primary font-medium">Điều khoản dịch vụ</span>
            .{' '}
            {form.formState.errors.terms?.message && (
              <span className="block text-red-700">
                {form.formState.errors.terms.message}
              </span>
            )}
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-5 text-[#59665d]">
          <input
            type="checkbox"
            className="mt-1 accent-[#244431]"
            {...form.register('privacy')}
          />{' '}
          <span>
            Tôi đã đọc{' '}
            <span className="text-primary font-medium">
              Chính sách quyền riêng tư
            </span>
            .{' '}
            {form.formState.errors.privacy?.message && (
              <span className="block text-red-700">
                {form.formState.errors.privacy.message}
              </span>
            )}
          </span>
        </label>
        <Button
          className="w-full rounded-xl"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <LoaderCircle className="animate-spin" size={17} />
          )}
          {form.formState.isSubmitting
            ? 'Đang tạo tài khoản…'
            : 'Tạo tài khoản'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Đã có tài khoản?{' '}
          <Link
            to="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  async function onSubmit(values: EmailValues) {
    setError(null)
    setSent(false)
    try {
      await requestPasswordReset(values)
      setEmail(values.email)
      setSent(true)
    } catch (cause) {
      const { normalizeApiError } = await import('@/api/errors')
      setError(normalizeApiError(cause))
    }
  }
  return (
    <AuthCard
      eyebrow="Khôi phục tài khoản"
      title="Đặt lại mật khẩu"
      description="Nhập email đã đăng ký để nhận mã xác minh đặt lại mật khẩu."
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <ErrorFeedback error={error} />
        {sent && (
          <div
            role="status"
            className="text-primary rounded-xl bg-[#edf3ed] p-4 text-sm"
          >
            Máy chủ đã xác nhận yêu cầu. Kiểm tra email để lấy OTP, sau đó tiếp
            tục đặt lại mật khẩu.
          </div>
        )}
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ten@email.com"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <Button
          className="w-full rounded-xl"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <LoaderCircle className="animate-spin" size={17} />
          )}
          {form.formState.isSubmitting ? 'Đang gửi…' : 'Gửi mã đặt lại'}
        </Button>
        {sent && (
          <Link
            className="text-primary block text-center text-sm font-medium underline"
            to={`/auth/reset-password?email=${encodeURIComponent(email)}`}
          >
            Tôi đã có mã OTP
          </Link>
        )}
        <Link
          className="text-muted-foreground hover:text-primary block text-center text-sm"
          to="/auth/login"
        >
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [success, setSuccess] = useState(false)
  const password = usePasswordToggle()
  const initialEmail = new URLSearchParams(location.search).get('email') ?? ''
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  async function onSubmit(values: ResetValues) {
    setError(null)
    try {
      await submitPasswordReset({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      })
      setSuccess(true)
    } catch (cause) {
      const { normalizeApiError } = await import('@/api/errors')
      setError(normalizeApiError(cause))
    }
  }
  return (
    <AuthCard
      eyebrow="Bảo mật tài khoản"
      title="Tạo mật khẩu mới"
      description="Mã OTP gồm 6 ký tự được gửi đến email của bạn."
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <ErrorFeedback error={error} />
        {success && (
          <p
            role="status"
            className="text-primary rounded-xl bg-[#edf3ed] p-4 text-sm"
          >
            Mật khẩu đã được máy chủ cập nhật. Hãy đăng nhập lại.
          </p>
        )}
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <FormField
          label="Mã OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...form.register('otp')}
          error={form.formState.errors.otp?.message}
        />
        <FormField
          label="Mật khẩu mới"
          type={password.visible ? 'text' : 'password'}
          autoComplete="new-password"
          {...form.register('newPassword')}
          error={form.formState.errors.newPassword?.message}
          trailing={
            <PasswordToggle
              visible={password.visible}
              onToggle={password.toggle}
            />
          }
        />
        <FormField
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
        />
        {success ? (
          <Button
            className="w-full rounded-xl"
            type="button"
            onClick={() =>
              navigate('/auth/login', {
                replace: true,
                state: { message: 'Mật khẩu đã đổi. Vui lòng đăng nhập.' },
              })
            }
          >
            Đến đăng nhập
          </Button>
        ) : (
          <Button
            className="w-full rounded-xl"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <LoaderCircle className="animate-spin" size={17} />
            )}
            {form.formState.isSubmitting
              ? 'Đang cập nhật…'
              : 'Đặt lại mật khẩu'}
          </Button>
        )}
        <Link
          className="text-muted-foreground hover:text-primary block text-center text-sm"
          to="/auth/login"
        >
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  )
}
