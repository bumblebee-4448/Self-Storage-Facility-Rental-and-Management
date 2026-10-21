# 02 — Backend API Inventory

Nguồn: src/config/swagger.json; 149 operations trên 149 path. Cột metadata phản ánh spec, không chứng minh quyền thực tế.

| Method | Path | Tag | Security metadata | Query/path/body parameters | Success codes |
|---|---|---|---|---|---|
| GET | `/users` | Users | none | sort:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/users` | Users | none | body | 201 |
| GET | `/users/search` | Users | none | sort:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| GET | `/users/{id}` | Users | none | id:path | 200 |
| PATCH | `/users/{id}` | Users | none | id:path,body | 200 |
| DELETE | `/users/{id}` | Users | yes | id:path | 200 |
| POST | `/users/{id}/restore` | Users | none | id:path | 200 |
| POST | `/auth/send-otp` | Auth | none | body | 200 |
| POST | `/auth/register` | Auth | none | body | 201 |
| POST | `/auth/login` | Auth | none | body | 200 |
| POST | `/auth/refresh` | Auth | none | body | 200 |
| POST | `/auth/logout` | Auth | none | body | 200 |
| GET | `/auth/me` | Auth | yes |  | 200 |
| POST | `/auth/forgot-password` | Auth | none | body | 200 |
| POST | `/auth/reset-password` | Auth | none | body | 200 |
| PATCH | `/auth/change-password` | Auth | yes | body | 200 |
| GET | `/profile/me` | Profile | yes |  | 200 |
| PATCH | `/profile/me` | Profile | yes | body | 200 |
| GET | `/profile/{userId}` | Profile | yes | userId:path | 200 |
| GET | `/audit-logs` | AuditLogs | none | to:query,from:query,status:query,resourceId:query,resourceType:query,action:query,actorId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| GET | `/audit-logs/me` | AuditLogs | none | to:query,from:query,status:query,resourceId:query,resourceType:query,action:query,actorId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| GET | `/audit-logs/resource/{resourceType}/{resourceId}` | AuditLogs | none | resourceType:path,resourceId:path,to:query,from:query,status:query,resourceId:query,resourceType:query,action:query,actorId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| GET | `/audit-logs/{id}` | AuditLogs | none | id:path | 200 |
| POST | `/upload/signature` | Upload | none | body | 200 |
| GET | `/unit-types` | Unit Types | none | maxArea:query,minArea:query,category:query,status:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/unit-types` | Unit Types | none | body | 201 |
| GET | `/unit-types/{id}` | Unit Types | none | id:path | 200 |
| PATCH | `/unit-types/{id}` | Unit Types | none | id:path,body | 200 |
| DELETE | `/unit-types/{id}` | Unit Types | none | id:path | 200 |
| POST | `/unit-types/{id}/restore` | Unit Types | none | id:path | 200 |
| GET | `/storage-units` | Storage Units | none | unitNumber:query,zone:query,floor:query,status:query,unitTypeId:query,facilityId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| POST | `/storage-units` | Storage Units | none | body | 201 |
| GET | `/storage-units/facility/{facilityId}/available` | Storage Units | none | facilityId:path,zone:query,floor:query,unitTypeId:query | 200 |
| GET | `/storage-units/facility/{facilityId}/map-layout` | Storage Units | none | facilityId:path | 200 |
| GET | `/storage-units/{id}` | Storage Units | none | id:path | 200 |
| PATCH | `/storage-units/{id}` | Storage Units | none | id:path,body | 200 |
| DELETE | `/storage-units/{id}` | Storage Units | none | id:path | 200 |
| PATCH | `/storage-units/{id}/maintenance` | Storage Units | none | id:path,body | 200 |
| POST | `/storage-units/{id}/restore` | Storage Units | none | id:path | 200 |
| GET | `/storage-racks` | Storage Racks | none | rackCode:query,status:query,storageUnitId:query,facilityId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/storage-racks` | Storage Racks | none | body | 201 |
| GET | `/storage-racks/unit/{unitId}` | Storage Racks | none | unitId:path | 200 |
| GET | `/storage-racks/{id}` | Storage Racks | none | id:path | 200 |
| PATCH | `/storage-racks/{id}` | Storage Racks | none | id:path,body | 200 |
| DELETE | `/storage-racks/{id}` | Storage Racks | none | id:path | 200 |
| POST | `/storage-racks/unit/{unitId}/provision` | Storage Racks | none | unitId:path | 200 |
| PATCH | `/storage-racks/tiers/{id}` | Storage Racks | none | id:path,body | 200 |
| POST | `/storage-racks/{id}/restore` | Storage Racks | none | id:path | 200 |
| POST | `/reservations` | Reservations | none | body | 201 |
| GET | `/reservations` | Reservations | none | checkInDateTo:query,checkInDateFrom:query,startDateTo:query,startDateFrom:query,reservationCode:query,refundStatus:query,status:query,storageUnitId:query,facilityUnitTypeOfferingId:query,facilityId:query,customerId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/reservations/process-expired` | Reservations | none |  | 200 |
| POST | `/reservations/process-overdue` | Reservations | none |  | 200 |
| GET | `/reservations/{id}` | Reservations | none | id:path | 200 |
| POST | `/reservations/{id}/reassign-unit` | Reservations | none | id:path,body | 200 |
| POST | `/reservations/{id}/confirm` | Reservations | none | id:path,body | 200 |
| POST | `/reservations/{id}/cancel` | Reservations | none | id:path,body | 200 |
| POST | `/reservations/{id}/assign-staff` | Reservations | none | id:path,body | 200 |
| POST | `/reservations/{id}/confirm-refund` | Reservations | none | id:path,body | 200 |
| POST | `/payments/sepay/webhook` | Payments | none | body | 200 |
| POST | `/payments` | Payments | none | body | 201 |
| GET | `/payments` | Payments | none | createdAtTo:query,createdAtFrom:query,paymentCode:query,status:query,purpose:query,contractId:query,reservationId:query,facilityId:query,customerId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/payments/process-expired` | Payments | none |  | 200 |
| GET | `/payments/{id}` | Payments | none | id:path | 200 |
| POST | `/payments/{id}/cancel` | Payments | none | id:path,body | 200 |
| POST | `/payments/{id}/confirm-manual` | Payments | none | id:path,body | 200 |
| POST | `/notifications/test` | Notification | none | body | 200 |
| GET | `/notifications` | Notification | none | facilityId:query,priority:query,type:query,isRead:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| GET | `/notifications/unread-count` | Notification | none |  | 200 |
| PATCH | `/notifications/{id}/read` | Notification | none | id:path | 200 |
| PATCH | `/notifications/read-all` | Notification | none |  | 200 |
| DELETE | `/notifications/{id}` | Notification | none | id:path | 200 |
| GET | `/facility-unit-type-offerings` | Facility Unit Type Offerings | none | maxPrice:query,minPrice:query,status:query,billingUnit:query,unitTypeId:query,facilityId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/facility-unit-type-offerings` | Facility Unit Type Offerings | none | body | 201 |
| GET | `/facility-unit-type-offerings/{id}` | Facility Unit Type Offerings | none | id:path | 200 |
| PATCH | `/facility-unit-type-offerings/{id}` | Facility Unit Type Offerings | none | id:path,body | 200 |
| DELETE | `/facility-unit-type-offerings/{id}` | Facility Unit Type Offerings | none | id:path | 200 |
| GET | `/facility-unit-type-offerings/facility/{facilityId}/unit-type/{unitTypeId}` | Facility Unit Type Offerings | none | facilityId:path,unitTypeId:path | 200 |
| POST | `/facility-unit-type-offerings/{id}/restore` | Facility Unit Type Offerings | none | id:path | 200 |
| GET | `/facility-time-slots/facility/{facilityId}/available` | Facility Time Slots | none | facilityId:path,date:query | 200 |
| GET | `/facility-time-slots/facility/{facilityId}` | Facility Time Slots | none | facilityId:path | 200 |
| POST | `/facility-time-slots` | Facility Time Slots | none | body | 201 |
| PATCH | `/facility-time-slots/{id}` | Facility Time Slots | none | id:path,body | 200 |
| DELETE | `/facility-time-slots/{id}` | Facility Time Slots | none | id:path | 200 |
| GET | `/my-facility` | Facility Manager | none |  | 200 |
| GET | `/my-facility/dashboard` | Facility Manager | none |  | 200 |
| GET | `/my-facility/staffs` | Facility Manager | none | status:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/facility-amenity-offerings` | Facility Amenity Offerings | none | maxPrice:query,minPrice:query,status:query,billingUnit:query,amenityId:query,facilityId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| POST | `/facility-amenity-offerings` | Facility Amenity Offerings | none | body | 201 |
| GET | `/facility-amenity-offerings/facility/{facilityId}/available` | Facility Amenity Offerings | none | facilityId:path | 200 |
| GET | `/facility-amenity-offerings/facility/{facilityId}/amenity/{amenityId}` | Facility Amenity Offerings | none | facilityId:path,amenityId:path | 200 |
| GET | `/facility-amenity-offerings/{id}` | Facility Amenity Offerings | none | id:path | 200 |
| PATCH | `/facility-amenity-offerings/{id}` | Facility Amenity Offerings | none | id:path,body | 200 |
| DELETE | `/facility-amenity-offerings/{id}` | Facility Amenity Offerings | none | id:path | 200 |
| POST | `/facility-amenity-offerings/{id}/restore` | Facility Amenity Offerings | none | id:path | 200 |
| GET | `/facilities` | facilities | none | status:query,city:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/facilities` | facilities | none | body | 201 |
| GET | `/facilities/search-by-amenity` | facilities | none | search:query,city:query,sortOrder:query,sortBy:query,matchAll:query,amenityIds:query,limit:query,page:query | 200 |
| GET | `/facilities/{id}/public-detail` | facilities | none | id:path | 200 |
| GET | `/facilities/{id}` | facilities | none | id:path | 200 |
| PATCH | `/facilities/{id}` | facilities | none | id:path,body | 200 |
| DELETE | `/facilities/{id}` | facilities | none | id:path | 200 |
| PATCH | `/facilities/{id}/assign-manager` | facilities | none | id:path,body | 200 |
| POST | `/facilities/{id}/restore` | facilities | none | id:path | 200 |
| POST | `/customer-skus` | Customer SKU | none | body | 200 |
| GET | `/customer-skus` | Customer SKU | none | barcode:query,skuCode:query,search:query,category:query,status:query,customerId:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/customer-skus/barcode/{barcode}` | Customer SKU | none | barcode:path,customerId:query | 200 |
| GET | `/customer-skus/{id}` | Customer SKU | none | id:path | 200 |
| PATCH | `/customer-skus/{id}` | Customer SKU | none | id:path,body | 200 |
| DELETE | `/customer-skus/{id}` | Customer SKU | none | id:path | 200 |
| POST | `/customer-skus/{id}/restore` | Customer SKU | none | id:path | 200 |
| POST | `/customer-inventories/in` | Customer Inventories | none | body | 200 |
| POST | `/customer-inventories/out` | Customer Inventories | none | body | 200 |
| POST | `/customer-inventories/move` | Customer Inventories | none | body | 200 |
| POST | `/customer-inventories/adjust` | Customer Inventories | none | body | 200 |
| GET | `/customer-inventories/movements` | Customer Inventories | none | endDate:query,startDate:query,type:query,customerId:query,rackTierId:query,skuId:query,storageUnitId:query,facilityId:query,contractId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/customer-inventories` | Customer Inventories | none | minQuantity:query,customerId:query,skuId:query,rackTierId:query,storageRackId:query,storageUnitId:query,facilityId:query,contractId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/customer-inventories/unit/{storageUnitId}/tree` | Customer Inventories | none | storageUnitId:path | 200 |
| GET | `/customer-inventories/sku/{skuId}/locations` | Customer Inventories | none | skuId:path | 200 |
| GET | `/customer-inventories/barcode/{barcode}/locations` | Customer Inventories | none | barcode:path | 200 |
| GET | `/customer-inventories/summary` | Customer Inventories | none |  | 200 |
| GET | `/customer-inventories/{id}` | Customer Inventories | none | id:path | 200 |
| POST | `/contracts` | Contracts | none | body | 201 |
| GET | `/contracts` | Contracts | none | endDateTo:query,endDateFrom:query,startDateTo:query,startDateFrom:query,contractCode:query,source:query,status:query,facilityUnitTypeOfferingId:query,storageUnitId:query,facilityId:query,customerId:query,search:query,sortOrder:query,sortBy:query,limit:query,page:query | 200 |
| POST | `/contracts/process-overdue` | Contracts | none |  | 200 |
| GET | `/contracts/{id}` | Contracts | none | id:path | 200 |
| POST | `/contracts/{id}/customer-sign` | Contracts | none | id:path,body | 200 |
| POST | `/contracts/{id}/check-in` | Contracts | none | id:path,body | 200 |
| POST | `/contracts/{id}/cancel` | Contracts | none | id:path,body | 200 |
| POST | `/contracts/{id}/renew` | Contracts | none | id:path,body | 200 |
| POST | `/contracts/{id}/addendums` | Contracts | none | id:path,body | 201 |
| POST | `/contracts/{id}/addendums/{addendumId}/approve` | Contracts | none | id:path,addendumId:path,body | 200 |
| POST | `/contracts/{id}/addendums/{addendumId}/reject` | Contracts | none | id:path,addendumId:path,body | 200 |
| POST | `/contracts/{id}/addendums/{addendumId}/customer-sign` | Contracts | none | id:path,addendumId:path,body | 200 |
| POST | `/contracts/{id}/addendums/{addendumId}/staff-sign` | Contracts | none | id:path,addendumId:path,body | 200 |
| POST | `/contracts/{id}/addendums/{addendumId}/cancel` | Contracts | none | id:path,addendumId:path,body | 200 |
| POST | `/contracts/{id}/check-out` | Contracts | none | id:path,body | 200 |
| POST | `/contracts/{id}/terminate` | Contracts | none | id:path,body | 200 |
| POST | `/approval-requests` | Approval Requests | none | body | 200 |
| GET | `/approval-requests` | Approval Requests | none | status:query,targetType:query,facilityId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/approval-requests/my-requests` | Approval Requests | none | status:query,targetType:query,facilityId:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| GET | `/approval-requests/{id}` | Approval Requests | none | id:path | 200 |
| PATCH | `/approval-requests/{id}/cancel` | Approval Requests | none | id:path | 200 |
| PATCH | `/approval-requests/{id}/review` | Approval Requests | none | id:path,body | 200 |
| GET | `/amenities` | Amenities | none | status:query,type:query,search:query,sortBy:query,sortOrder:query,limit:query,page:query | 200 |
| POST | `/amenities` | Amenities | none | body | 201 |
| GET | `/amenities/{id}` | Amenities | none | id:path | 200 |
| PATCH | `/amenities/{id}` | Amenities | none | id:path,body | 200 |
| DELETE | `/amenities/{id}` | Amenities | none | id:path | 200 |
| POST | `/amenities/{id}/restore` | Amenities | none | id:path | 200 |
## Nhóm route
Auth/profile/users; audit/upload; facility/catalog (facilities, amenities, unit types, time slots, facility unit/amenity offerings); storage units/racks; reservations/payments; contracts/addendums; customer SKU/inventory; approvals; notifications; facility manager dashboard/staff.

## Đối chiếu mismatch đã xác minh
- BE không khai báo `POST /reservations/{id}/receive`, `/assign-unit`, `/reject`, `/complete` mà Web gọi. BE có `/confirm`, `/reassign-unit`, `/cancel`, `/assign-staff`, `/confirm-refund`; check-in/out là contract endpoints.
- Mobile gọi `PATCH /reservations/{id}` và `POST /reservations/{id}/retry-payment`, không có trong controller/OpenAPI.
- BE `createReservationSchema` bắt buộc `storageUnitId`, `checkInDate`, `checkInTimeSlot`, `rentalDuration`; mobile payload gửi `facilityId`, offering, `startDate`, duration, amenities, notes, thiếu các trường bắt buộc.
- BE confirm yêu cầu `assignedStaffId`; Web wrapper cho body optional và mặc định `{}`.
