# Hướng dẫn sửa lỗi TypeScript ts(1149)

## Vấn đề
Lỗi `ts(1149)` xảy ra khi TypeScript phát hiện file `mockData.js` được import với các đường dẫn khác nhau, gây ra xung đột về case sensitivity hoặc đường dẫn.

## Giải pháp đã áp dụng

### 1. Cấu hình TypeScript và JavaScript
- ✅ Tạo `tsconfig.json` với cấu hình `forceConsistentCasingInFileNames: true`
- ✅ Tạo `jsconfig.json` cho JavaScript projects
- ✅ Cấu hình path mapping với alias `@` cho `src/`

### 2. Cấu hình Vite
- ✅ Cập nhật `vite.config.js` với path alias
- ✅ Cấu hình resolve paths để tránh xung đột

### 3. Cập nhật imports
- ✅ Thay đổi tất cả imports từ relative paths (`../services/mockData`) 
- ✅ Sử dụng absolute paths với alias (`@/services/mockData`)

### 4. Cấu hình VS Code
- ✅ Tạo `.vscode/settings.json` để cấu hình TypeScript
- ✅ Tạo `.vscode/extensions.json` với các extension cần thiết

### 5. Code formatting
- ✅ Thêm Prettier configuration
- ✅ Cập nhật ESLint rules
- ✅ Thêm scripts cho formatting và linting

## Cách chạy sau khi sửa

### 1. Cài đặt dependencies mới
```bash
npm install
```

### 2. Chạy linter để kiểm tra
```bash
npm run lint
```

### 3. Fix lỗi tự động (nếu có)
```bash
npm run lint:fix
```

### 4. Format code
```bash
npm run format
```

### 5. Chạy ứng dụng
```bash
npm run dev
```

## Files đã được cập nhật

### Cấu hình
- `tsconfig.json` - TypeScript configuration
- `jsconfig.json` - JavaScript configuration  
- `vite.config.js` - Vite configuration với path alias
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.vscode/settings.json` - VS Code settings
- `.vscode/extensions.json` - Recommended extensions

### Source code
- `src/App.jsx` - Updated imports to use @ alias
- `src/pages/Dashboard.jsx` - Updated mockData import
- `src/pages/DepartmentManagement.jsx` - Updated mockData import
- `src/pages/EmployeeManagement.jsx` - Updated mockData import
- `src/pages/CourseManagement.jsx` - Updated mockData import

## Lợi ích của giải pháp

1. **Consistent imports**: Tất cả imports sử dụng alias `@` thay vì relative paths
2. **Case sensitivity**: TypeScript được cấu hình để kiểm tra case sensitivity
3. **Path resolution**: Vite được cấu hình để resolve paths chính xác
4. **Code quality**: Prettier và ESLint đảm bảo code quality
5. **IDE support**: VS Code được cấu hình để hỗ trợ tốt hơn

## Troubleshooting

### Nếu vẫn còn lỗi:
1. Restart VS Code
2. Clear TypeScript cache: `npx tsc --build --clean`
3. Delete `node_modules` và reinstall: `rm -rf node_modules && npm install`
4. Restart development server: `npm run dev`

### Kiểm tra cấu hình:
```bash
# Kiểm tra TypeScript config
npx tsc --showConfig

# Kiểm tra Vite config
npx vite --config vite.config.js --help
```

## Kết quả mong đợi
Sau khi áp dụng các thay đổi trên, lỗi `ts(1149)` sẽ được giải quyết và ứng dụng sẽ chạy mượt mà mà không có lỗi TypeScript.
