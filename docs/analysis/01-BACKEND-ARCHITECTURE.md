# 01 — Backend Architecture
Rà soát chỉ đọc ngày 2026-10-21. BE tại `C:\Users\laptop\Downloads\self-storage-system-be-dev`.

## Kiến trúc
Node.js 22 + TypeScript ESM, Express 5, tsoa 7 alpha controllers, service/domain modules, Mongoose 9, MongoDB, Redis/ioredis, BullMQ, Socket.IO, Zod 4, Swagger UI. `src/app.ts` khởi tạo HTTP/Socket.IO, request context, JSON/cookie/Passport/CORS middleware, Swagger `/api-docs`, tsoa routes, auth routes bổ sung, 404 và error handler. Domain modules: amenity, approvalRequest, auditLog, auth, contract, customerInventory, customerSku, facility, facilityAmenityOffering, facilityManager, facilityTimeSlot, facilityUnitTypeOffering, notification, payment, profile, reservation, storageRack, storageUnit, unitType, upload, user.

Tầng controller xác thực input và đóng gói response; service chứa nghiệp vụ và truy cập model. `@Transactional()` dùng Mongo session, có fallback khi transaction không khả dụng. Mongo/Redis/worker init được gọi bất đồng bộ trước middleware, nhưng app vẫn gọi listen mà không chờ init hoàn tất — cần readiness/error handling. API response chuẩn có `success/statusCode/messageCode/message/data`; phân trang có items và metadata.

## Source map
`src/app.ts`; `src/modules/*`; `src/common/decorators/transactional.decorator.ts`; `src/config/{connect.config.ts,redis.config.ts,socket.config.ts,swagger.config.ts}`; `src/middlewares/*`; `src/config/swagger.json` (artifact đã sinh).

## Quan sát
149 operations từ OpenAPI. Không thể suy auth từ route existence: chỉ 6 operations mang security metadata trong generated spec; nhiều `@Security` bị comment, xem 06.
