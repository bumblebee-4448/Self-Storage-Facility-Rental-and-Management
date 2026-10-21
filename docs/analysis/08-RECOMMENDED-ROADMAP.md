# 08 — Recommended Roadmap

### Phase 0 — Scope and API contract
Lấy backlog FE-01..FE-41/FE-19B đầy đủ; chốt web/mobile, roles, locale, release one. Chọn source of truth DTO và xác định các tính năng chưa có BE.

### Phase 1 — Security/environment (blocking)
Bật JWT/cookie auth cho private routes; RBAC và resource scope; bỏ identity headers không tin cậy; khóa test/batch endpoints. Tạo dev Mongo/Redis cô lập và cấu hình sandbox OAuth/mail/payment.

### Phase 2 — Align API
Chốt reservation creation: chọn unit vật lý/time slot theo BE hiện tại hay đổi contract có chủ đích. Map FE actions sang state transitions hiện có; quyết định edit/retry-payment có triển khai không. So khớp mọi DTO/schema/response; thêm contract tests.

### Phase 3 — Build FE mới
Tạo role/navigation matrix, auth/session và API states trước. Triển khai browse → reservation → payment → contract; sau đó manager/staff, business ops/admin theo ưu tiên đã chốt. Bao gồm loading/empty/error/expired/unauthorized và responsive/a11y.

### Phase 4 — Verify/release
Integration tests cho lifecycle, authorization, refunds/idempotency/cross-tenant; chạy FE lint/type/build và BE lint/type/build; smoke web/mobile trên môi trường dev cô lập; xác minh secrets/CORS/cookie trước deploy.

Không có implementation trong lượt này.
