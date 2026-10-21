# 09 — Risks and Open Questions

## Risks
1. RBAC/auth coverage: 6/149 OpenAPI operations có security metadata; decorators bị comment, TODO role và fallback identity headers xuất hiện.
2. Reservation flows từ FE có routes/payload không được BE hỗ trợ; khả năng lỗi runtime cao.
3. Plaintext secrets từng được gửi trong chat; rotate/revoke và kiểm tra audit provider.
4. BE listen trước khi async Mongo/Redis/worker initialization kết thúc.
5. Runtime trước dùng remote Mongo/Redis config, không khẳng định đó là local isolated DB; tránh thao tác phá hủy.
6. README mô tả QR/inspection/incidents/forecasting nhưng API hiện rà không cho thấy đủ endpoints; docs là intent, không phải bằng chứng implementation.

## Câu hỏi mở
- Cung cấp định nghĩa FE-01..FE-41/FE-19B và tiêu chí nghiệm thu?
- FE mới thay web, mobile hay cả hai; role/platform/locale nào ưu tiên?
- Reservation tạo phải chỉ định unit vật lý và slot hay offering-only rồi gán sau?
- Semantics mong muốn của receive/assign-unit/reject/complete/edit/retry-payment?
- Route nào public; header fallback chỉ dành cho dev hay còn được dùng trong môi trường nào?
- Mongo transactions có bắt buộc và cluster có replica set không?
- SePay/Brevo/OAuth là sandbox hay tài khoản thật; credential đã rotate chưa?
- Socket event/room, background notifications, batch scheduler/idempotency và retention/restore mong muốn ra sao?

## Giới hạn
Static source/docs review cùng smoke responses từ lượt trước; không phải pentest, authenticated walkthrough, integration test hoặc build verification. Không thể gán trạng thái cụ thể cho FE IDs chưa có nội dung.
