import { z } from 'zod'

function vietnamToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
}

function isRealDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

export const reservationDraftSchema = z.object({
  facilityId: z.string().min(1, 'Vui lòng chọn cơ sở.'),
  storageUnitId: z.string().min(1, 'Vui lòng chọn phòng kho.'),
  facilityUnitTypeOfferingId: z.string().min(1, 'Chưa tìm thấy giá thuê cho phòng kho này.'),
  checkInDate: z.string().min(1, 'Vui lòng chọn ngày nhận kho.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ.').refine(isRealDate, 'Ngày không hợp lệ.').refine((value) => value >= vietnamToday(), 'Không thể chọn ngày đã qua.'),
  checkInTimeSlot: z.string().min(3, 'Vui lòng chọn khung giờ.'),
  rentalDuration: z.number().int().min(1, 'Thời lượng thuê tối thiểu là 1 ngày.'),
})

