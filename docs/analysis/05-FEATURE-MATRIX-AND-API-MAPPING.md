# 05 — Feature Matrix and API Mapping
| Client feature | BE surface | Kết quả rà soát |
|---|---|---|
| Auth web/mobile | auth, profile | Route family tồn tại; kiểm tra cookie/token response khi tích hợp. |
| Browse facility | facilities/search/public detail, unit types, offerings, amenities | Endpoint tồn tại; DTO/query cần parity review. |
| Web catalog/facility admin | amenities, unit types, facilities, offerings, approvals | Coverage rộng; RBAC đang là blocker. |
| Manager storage units | my-facility, storage-units, offerings | Endpoint hiện diện; cần đối chiếu payload/scope. |
| Web reservation manager | reservations, available units, payment | Route/action mismatch; xem 02. |
| Mobile reservation | reservations/payments | Create payload mismatch; edit/retry routes không tồn tại. |
| Contracts | contracts/sign/check-in/out/renew/addendums | Route family có; request/role parity cần xác minh. |
| Audit/approvals | audit-logs/approval-requests | Có endpoints và UI feature. |
| Customer inventory | customer-skus/customer-inventories | BE có; chưa tìm thấy client API usage trong các feature đã rà. |
| Notification/socket | notifications + Socket.IO | Cần xác minh event/room/client integration. |
| Inspection/incidents/support/recurring billing | Không thấy module/route tương ứng trong OpenAPI | Chưa có bằng chứng BE; xác nhận scope. |

## FE-01..FE-41 và FE-19B
Không tìm thấy nội dung định nghĩa từng ID trong file yêu cầu/project files đã rà. Bảng này chỉ ánh xạ theo feature, không kết luận trạng thái từng ID. Cần backlog chi tiết để làm mapping ID-level.
