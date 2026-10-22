# 03 — Backend Business Rules
Nguồn ưu tiên là Zod schemas, services, models và controller docs.

## Reservation
Create kiểm tra customer active, facility active, check-in trong giới hạn ngày, time slot chưa qua, offering/unit hợp lệ và khả dụng. BE schema yêu cầu unit vật lý + check-in date/slot + duration. Tạo reservation `pending_payment`, đặt hold có expiration (default 15 phút theo config đã đọc), giữ unit. Có batch xử lý hết hạn và overdue/no-show; worker được khởi tạo ở app. Hủy áp dụng policy hoàn cọc theo mốc 24 giờ, kiểm tra trạng thái và contract liên kết. Reassign, confirm, assign staff, confirm refund là transitions riêng. Không có reservation `complete`; contract checkout là luồng kết thúc thuê.

Enum/status chính: reservation có pending_payment, payment_successful, confirmed, completed, cancelled, expired, overdue cùng các trạng thái trung gian trong enum; refund none/pending/refunded. Không coi danh sách rút gọn này là exhaustive.

## Payment
Reservation payment chỉ tạo cho `pending_payment` chưa hết hạn; contract deposit yêu cầu contract `draft`. Có pending/partially_paid/paid/expired/cancelled. Manual confirmation và SePay webhook; webhook lưu transaction, match payment code/amount, xử lý duplicate/late/partial, settle transactional. Batch expire endpoint tồn tại.

## Contract / approval / inventory
Contract lifecycle draft/active/overdue/completed/cancelled/terminated; hỗ trợ sign/check-in/out/renew/cancel/terminate/addenda. Checkout tính damage/overdue fee/refund (cần xem full công thức trước khi tái hiện ở FE). Approval service áp payload được duyệt vào entity đích và thông báo/audit. Inventory hỗ trợ in/out/move/adjust, movements, tree/locations/summary và role/facility scoping ở service.

Roles: customer, system_admin, facility_staff, facility_manager, business_ops_manager.
