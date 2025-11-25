# Ứng dụng Web Quản lý Đào tạo

## Tổng quan

Ứng dụng web quản lý đào tạo được xây dựng bằng React JS với Vite, có giao diện tương tự như ảnh mẫu với thanh điều hướng bên trái và nội dung chính bên phải.

## Tính năng chính

- ✅ **Dashboard**: Tổng quan hệ thống với thống kê và biểu đồ
- ✅ **Quản lý cơ cấu tổ chức**: Quản lý phòng ban và chức vụ
- ✅ **Quản lý nhân viên**: Quản lý thông tin nhân viên đầy đủ
- ✅ **Quản lý học phần**: Quản lý học phần và khóa học
- ✅ **Giao diện responsive**: Tương thích với mọi thiết bị
- ✅ **Tìm kiếm và lọc**: Tìm kiếm và lọc dữ liệu nâng cao

## Công nghệ sử dụng

- **Frontend**: React 18, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

## Cài đặt và chạy ứng dụng

### 1. Yêu cầu hệ thống

- Node.js >= 16.0.0
- npm >= 8.0.0 hoặc yarn >= 1.22.0

### 2. Cài đặt dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

### 3. Chạy ứng dụng

```bash
# Chạy development server
npm run dev

# Hoặc
yarn dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 4. Build cho production

```bash
# Build ứng dụng
npm run build

# Hoặc
yarn build
```

### 5. Preview build

```bash
# Xem trước build
npm run preview

# Hoặc
yarn preview
```

## Cấu trúc thư mục

```
src/
├── components/
│   └── Layout/
│       ├── Layout.jsx          # Layout chính
│       ├── Sidebar.jsx         # Thanh điều hướng bên trái
│       └── Header.jsx          # Header với search và user profile
├── pages/
│   ├── Dashboard.jsx           # Trang dashboard chính
│   ├── DepartmentManagement.jsx # Quản lý cơ cấu tổ chức
│   ├── EmployeeManagement.jsx  # Quản lý nhân viên
│   └── CourseManagement.jsx    # Quản lý học phần
├── services/
│   ├── api.js                  # API service
│   └── mockData.js             # Dữ liệu mẫu
├── App.jsx                     # Component chính
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

## Hướng dẫn sử dụng

### 1. Dashboard

- Xem tổng quan hệ thống
- Thống kê số liệu quan trọng
- Truy cập các chức năng nhanh
- Xem tin tức và thông báo

### 2. Quản lý cơ cấu tổ chức

#### Phòng ban
- **Xem danh sách**: Hiển thị tất cả phòng ban
- **Thêm mới**: Tạo phòng ban mới với thông tin đầy đủ
- **Chỉnh sửa**: Cập nhật thông tin phòng ban
- **Xóa**: Xóa phòng ban (soft delete)
- **Tìm kiếm**: Tìm kiếm theo tên hoặc mã phòng ban

#### Chức vụ
- **Xem danh sách**: Hiển thị tất cả chức vụ theo phòng ban
- **Thêm mới**: Tạo chức vụ mới với cấp bậc
- **Chỉnh sửa**: Cập nhật thông tin chức vụ
- **Xóa**: Xóa chức vụ
- **Lọc**: Lọc theo phòng ban

### 3. Quản lý nhân viên

- **Xem danh sách**: Hiển thị tất cả nhân viên với thông tin chi tiết
- **Thêm mới**: Tạo nhân viên mới với đầy đủ thông tin
- **Chỉnh sửa**: Cập nhật thông tin nhân viên
- **Xóa**: Xóa nhân viên
- **Tìm kiếm**: Tìm kiếm theo tên, mã nhân viên, email
- **Lọc**: Lọc theo trạng thái, phòng ban
- **Thống kê**: Xem thống kê nhân viên theo trạng thái

### 4. Quản lý học phần

#### Học phần
- **Xem danh sách**: Hiển thị tất cả học phần
- **Thêm mới**: Tạo học phần mới với thông tin chi tiết
- **Chỉnh sửa**: Cập nhật thông tin học phần
- **Xóa**: Xóa học phần
- **Tìm kiếm**: Tìm kiếm theo tên, mã học phần
- **Lọc**: Lọc theo danh mục, cấp độ

#### Khóa học
- **Xem danh sách**: Hiển thị tất cả khóa học
- **Thêm mới**: Tạo khóa học mới với giảng viên và lịch học
- **Chỉnh sửa**: Cập nhật thông tin khóa học
- **Xóa**: Xóa khóa học
- **Theo dõi**: Theo dõi số lượng học viên đăng ký
- **Lọc**: Lọc theo trạng thái

## Tích hợp với Database

### 1. Cấu hình API

Chỉnh sửa file `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000/api' // URL của backend API
```

### 2. Kết nối Database

1. Chạy file `database_schema.sql` để tạo cấu trúc database
2. Chạy file `migrations.sql` để tạo stored procedures
3. Cấu hình backend API để kết nối với database
4. Cập nhật API endpoints trong `src/services/api.js`

### 3. Sử dụng Mock Data

Hiện tại ứng dụng sử dụng mock data trong `src/services/mockData.js`. Để chuyển sang sử dụng API thật:

1. Thay thế các hàm mock bằng API calls
2. Xử lý loading states và error handling
3. Cập nhật state management

## Customization

### 1. Thay đổi theme

Chỉnh sửa file `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Thay đổi màu chính
      }
    }
  }
}
```

### 2. Thêm trang mới

1. Tạo component trong `src/pages/`
2. Thêm route trong `src/App.jsx`
3. Thêm menu item trong `src/components/Layout/Sidebar.jsx`

### 3. Thêm chức năng mới

1. Tạo API functions trong `src/services/api.js`
2. Cập nhật mock data nếu cần
3. Tạo UI components

## Troubleshooting

### 1. Lỗi cài đặt dependencies

```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### 2. Lỗi build

```bash
# Kiểm tra lỗi linting
npm run lint

# Fix lỗi tự động
npm run lint -- --fix
```

### 3. Lỗi kết nối API

- Kiểm tra URL API trong `src/services/api.js`
- Đảm bảo backend server đang chạy
- Kiểm tra CORS settings

## Performance

### 1. Tối ưu hóa

- Sử dụng React.memo cho components
- Lazy loading cho các trang
- Virtual scrolling cho danh sách lớn
- Debounce cho search input

### 2. Bundle size

```bash
# Phân tích bundle size
npm run build
npx vite-bundle-analyzer dist
```

## Security

### 1. Authentication

- Thêm JWT authentication
- Protected routes
- Role-based access control

### 2. Data validation

- Client-side validation với React Hook Form
- Server-side validation
- Input sanitization

## Deployment

### 1. Build cho production

```bash
npm run build
```

### 2. Deploy lên server

- Upload thư mục `dist` lên web server
- Cấu hình reverse proxy cho API
- Thiết lập HTTPS

### 3. Environment variables

Tạo file `.env`:

```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Training Management System
```

## Support

Để được hỗ trợ:

- Email: support@company.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

## License

Copyright © 2024. All rights reserved.
