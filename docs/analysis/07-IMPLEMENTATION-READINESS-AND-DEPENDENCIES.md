# 07 — Implementation Readiness and Dependencies

## Bằng chứng runtime từ lượt chạy trước
BE dev từng kết nối MongoDB và Redis, bật reservation worker, phục vụ root/Swagger. Web `/vi` trả HTTP 200; `/auth/me` và `/auth/refresh` trả 401 khi chưa có session. Expo web phục vụ port 8081. Đây chỉ là smoke evidence; chưa xác thực end-to-end. Lượt phân tích này không chạy build/tests/install.

## Cấu hình
BE cần Mongo, Redis, cookie/JWT, OAuth, mail/Brevo, payment/SePay, URL/CORS. Báo cáo chỉ ghi tên biến, không chép giá trị. Web env dùng local API rewrite; thiếu env thì Next fallback hosted backend. Mobile env URL `localhost` không phù hợp khi chạy trên thiết bị thật; dùng IP/host reachable. Ghi chú setup yêu cầu Docker Compose Redis, nhưng prior run Docker không khả dụng và dùng Redis cấu hình sẵn.

FE có pnpm workspace scripts dev/build/lint/type-check; BE có npm scripts cho dev/build/tsoa. Không chạy các lệnh này trong lượt phân tích. Hai thư mục không có Git metadata sử dụng được theo kết quả `git status` trước đó; không thể chứng minh clean bằng diff. Không cố ý sửa source trong lượt này.

## Blockers
Contract reservation chưa thống nhất; security/RBAC chưa đủ; chưa có định nghĩa FE IDs; xác nhận isolated dev database, Mongo replica-set, mail/payment sandbox, callback URLs và mobile network endpoint.
