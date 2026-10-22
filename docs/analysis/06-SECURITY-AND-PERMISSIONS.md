# 06 — Security and Permissions

## Rủi ro nghiêm trọng
`src/app.ts` không mount auth middleware toàn cục. OpenAPI có 6 operations với `security` metadata trong tổng 149. Nhiều controller ghi rõ `@Security('bearerAuth')`/cookie auth đang comment tạm thời và còn `TODO: Role authorization`. Vì vậy không được xem API là đã bảo vệ chỉ vì service có scope.

Các helper controller dùng fallback `x-user-id`/`x-user-role` (có nơi `x-facility-id`) khi Security tạm tắt. Header do client gửi không phải danh tính đáng tin; service scoping có ích nhưng không thay xác thực JWT. `auth.middleware.ts`/`auth.tsoa.ts` có logic verify JWT/load user nhưng áp dụng phụ thuộc route wiring; kiểm tra status inactive/deleted ngoài banned.

`POST /notifications/test` là test route cần giới hạn môi trường/quyền. Batch process-expired/overdue cần job/admin auth và idempotency. CORS/cookie/proxy config cần kiểm tra theo deployment. Middleware FE chỉ điều hướng dựa JWT payload, không xác thực chữ ký.

## Trước rollout
1. Explicit allowlist public routes, bật auth cho mọi private endpoint.
2. Chỉ dùng identity từ token/session đã verify; bỏ fallback role headers ngoài test cô lập.
3. RBAC + ownership/facility scope cho mọi controller.
4. Hạn chế test/batch endpoints; kiểm thử truy cập trái quyền/cross-tenant.
5. Credentials Mongo/OAuth/SMTP/Brevo/Redis đã bị dán plaintext trong cuộc trò chuyện trước: rotate/revoke và rà soát lịch sử truy cập.
