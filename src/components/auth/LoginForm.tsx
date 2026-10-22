import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import type { NormalizedApiError } from '@/api/errors'
import type { LoginEntryPoint } from '@/utils/login-destination'
import { getLoginDestination } from '@/utils/login-destination'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email.')
    .email('Vui lòng nhập địa chỉ email hợp lệ.'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự.'),
})

type LoginValues = z.infer<typeof loginSchema>

function getLoginErrorMessage(error: NormalizedApiError): string {
  if (error.kind === 'timeout') {
    return 'Yêu cầu đăng nhập đã quá thời gian chờ. Vui lòng thử lại.'
  }
  if (error.kind === 'network') {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
  }
  if (error.kind === 'unexpected') {
    return 'Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại.'
  }

  if (error.status === 400) {
    return 'Thông tin đăng nhập chưa hợp lệ. Vui lòng kiểm tra lại.'
  }
  if (error.status === 401) {
    return 'Email hoặc mật khẩu không chính xác.'
  }
  if (error.status === 403) {
    return 'Tài khoản chưa được phép truy cập hoặc đã bị khóa. Vui lòng liên hệ quản trị viên.'
  }
  if (error.status >= 500) {
    return 'Dịch vụ đăng nhập đang tạm thời gián đoạn. Vui lòng thử lại sau.'
  }
  return 'Không thể đăng nhập lúc này. Vui lòng thử lại.'
}

interface LoginFormProps {
  entryPoint: LoginEntryPoint
}

export function LoginForm({ entryPoint }: LoginFormProps) {
  const navigate = useNavigate()
  const authStatus = useAuthStore((state) => state.status)
  const authError = useAuthStore((state) => state.error)
  const user = useAuthStore((state) => state.user)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  if (authStatus === 'authenticated' && user) {
    const destination = getLoginDestination(user.roles)
    if (!destination) {
      return (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm leading-6"
        >
          Không thể xác định khu vực phù hợp cho tài khoản này. Vui lòng liên hệ
          bộ phận hỗ trợ.
        </div>
      )
    }

    return (
      <div className="rounded-2xl border border-[#dce7dd] bg-white p-5 shadow-[0_12px_36px_-28px_rgba(36,68,49,0.35)] sm:p-6">
        <p role="status" className="text-sm leading-6 text-[#53645a]">
          Bạn đã đăng nhập với tài khoản {user.email}. Tiếp tục đến{' '}
          {destination.label}.
        </p>
        <Button
          className="mt-5 w-full"
          type="button"
          onClick={() => navigate(destination.path, { replace: true })}
        >
          Tiếp tục đến {destination.label}
        </Button>
      </div>
    )
  }

  const onSubmit = async (credentials: LoginValues) => {
    if (isSubmitting || authStatus === 'checking') return
    setServerError(null)
    const result = await useAuthStore.getState().signIn(credentials)
    if (!result.success) {
      setServerError(getLoginErrorMessage(result.error))
      return
    }

    const destination = getLoginDestination(result.value.roles)
    if (!destination) {
      setServerError(
        'Không thể xác định khu vực phù hợp cho tài khoản này. Vui lòng liên hệ bộ phận hỗ trợ.',
      )
      return
    }

    const loginNotice =
      destination.entryPoint === entryPoint
        ? undefined
        : {
            message: `Tài khoản này thuộc ${destination.label}. Bạn đã được chuyển đến đúng khu vực.`,
          }
    navigate(destination.path, {
      replace: true,
      state: loginNotice ? { loginNotice } : null,
    })
  }

  const disabled = isSubmitting || authStatus === 'checking'
  const emailId = `${entryPoint}-login-email`
  const passwordId = `${entryPoint}-login-password`
  const sessionErrorMessage =
    authError?.kind === 'network'
      ? 'Không thể kết nối để kiểm tra phiên đăng nhập. Bạn có thể kiểm tra kết nối hoặc thử đăng nhập.'
      : authError?.kind === 'timeout'
        ? 'Yêu cầu kiểm tra phiên đăng nhập đã quá thời gian chờ. Bạn vẫn có thể thử đăng nhập.'
        : 'Chưa thể kiểm tra phiên đăng nhập. Bạn vẫn có thể thử đăng nhập.'

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-label={
        entryPoint === 'customer'
          ? 'Đăng nhập khách hàng'
          : 'Đăng nhập nhân viên'
      }
    >
      {authStatus === 'error' && !serverError && (
        <p className="rounded-xl bg-[#f4f6f2] px-4 py-3 text-sm leading-6 text-[#53645a]">
          {sessionErrorMessage}
        </p>
      )}
      {serverError && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm leading-6"
        >
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={emailId} className="text-sm font-medium text-[#34453a]">
          Email
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#829087]"
            size={17}
            strokeWidth={1.8}
          />
          <input
            {...register('email')}
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="ten@vidu.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-ring aria-invalid:border-destructive min-h-12 w-full rounded-xl border pr-4 pl-11 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            disabled={disabled}
          />
        </div>
        {errors.email && (
          <p
            id={`${emailId}-error`}
            className="text-destructive text-sm"
            role="alert"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={passwordId}
          className="text-sm font-medium text-[#34453a]"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#829087]"
            size={17}
            strokeWidth={1.8}
          />
          <input
            {...register('password')}
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? `${passwordId}-error` : undefined
            }
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-ring aria-invalid:border-destructive min-h-12 w-full rounded-xl border pr-16 pl-11 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            disabled={disabled}
          />
          <button
            type="button"
            className="hover:text-primary focus-visible:ring-ring absolute top-1/2 right-3 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-[#66736a] focus-visible:ring-2 focus-visible:outline-none"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={17} />
            ) : (
              <Eye aria-hidden="true" size={17} />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id={`${passwordId}-error`}
            className="text-destructive text-sm"
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <Button className="w-full" type="submit" size="lg" disabled={disabled}>
        {isSubmitting ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={17}
            />
            Đang đăng nhập…
          </>
        ) : entryPoint === 'customer' && authStatus === 'checking' ? (
          'Đang kiểm tra phiên…'
        ) : (
          'Đăng nhập'
        )}
      </Button>
    </form>
  )
}
