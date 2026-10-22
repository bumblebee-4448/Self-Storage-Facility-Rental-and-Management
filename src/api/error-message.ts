import type { NormalizedApiError } from '@/api/errors'

export function getPublicErrorMessage(error: NormalizedApiError): string {
  if (error.kind === 'network')
    return 'Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.'
  if (error.kind === 'timeout')
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
  if (error.kind !== 'http') return 'Đã xảy ra lỗi. Vui lòng thử lại.'
  if (error.status === 401)
    return 'Thông tin đăng nhập không chính xác hoặc phiên đã hết hạn.'
  if (error.status === 403)
    return 'Tài khoản hiện không được phép thực hiện thao tác này.'
  if (error.status === 429)
    return 'Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.'
  if (error.status >= 500)
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  return error.message || 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.'
}

export function getFieldErrors(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (
      typeof item === 'object' &&
      item !== null &&
      'message' in item &&
      typeof item.message === 'string'
    )
      return [item.message]
    return []
  })
}
