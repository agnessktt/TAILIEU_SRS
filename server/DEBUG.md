# Debug Guide - Server Refactoring

## Các vấn đề đã sửa:

### 1. ✅ Error Handling Middleware
- Thêm error handling middleware ở cuối `server.js` để catch tất cả lỗi chưa được xử lý
- Thêm 404 handler cho routes không tồn tại

### 2. ✅ Async Error Handling
- Thêm `asyncHandler` wrapper trong `routes/departmentsRoutes.js` để tự động catch lỗi từ async controllers
- Đảm bảo tất cả lỗi được chuyển đến error handling middleware

### 3. ✅ Enhanced Error Logging
- Cải thiện `handleError` trong `utils/errorHandler.js` với logging chi tiết hơn
- Thêm stack trace trong development mode
- Xử lý các loại Sequelize errors (ValidationError, UniqueConstraintError, ForeignKeyConstraintError)

### 4. ✅ Model Loading
- Đảm bảo models được load trước khi sync database trong `utils/initServer.js`
- Thêm debug logs để kiểm tra models có được load không

### 5. ✅ Request Logging
- Thêm debug logs trong controllers để track request flow
- Log chi tiết khi có lỗi xảy ra

## Cách debug:

1. **Kiểm tra console logs khi server khởi động:**
   - `[SERVER] Starting server initialization...`
   - `[DB] Loading models...`
   - `✅ [DB] Models loaded`
   - `✅ [DB] Database tables synced successfully`

2. **Kiểm tra khi gọi API:**
   - `[DEBUG] DepartmentsController loaded`
   - `[DEBUG] getAllDepartments called`
   - `[DEBUG] Found X departments`

3. **Nếu có lỗi:**
   - Kiểm tra `[ERROR]` logs trong console
   - Kiểm tra stack trace trong response (development mode)
   - Kiểm tra error name và message

## Các endpoint hiện có:

- `GET /api/health` - Health check
- `GET /api/departments` - Lấy danh sách departments
- `GET /api/departments/:id` - Lấy department theo ID
- `POST /api/departments` - Tạo department mới
- `PUT /api/departments/:id` - Cập nhật department
- `DELETE /api/departments/:id` - Xóa department

## Lưu ý:

- Tất cả routes khác chưa được migrate vẫn sẽ trả về 404
- Cần tạo controllers và routes cho các endpoints còn lại theo mẫu `departmentsController.js` và `departmentsRoutes.js`

