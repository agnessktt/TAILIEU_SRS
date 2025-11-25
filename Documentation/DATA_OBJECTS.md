<!--
	DATA_OBJECTS.md
	Complete data object specification for Training Management System.
	Sources: database/word.md (DOx sections), src/services/mockData.js (mock examples), server/config/database.js (Sequelize/SQLite config).
	Generated: 2025-11-20
-->

# Đối tượng dữ liệu (Data Objects) — Training Management System

Mục tiêu: tài liệu đặc tả kỹ thuật cho backend, frontend và QA. Bao gồm tổng quan mô hình dữ liệu, chi tiết từng entity (fields, types, constraints), quy ước đặt tên, và phần mô hình/hệ thống tính học phí.

Tài liệu trích xuất từ:
- `database/word.md` — văn bản đặc tả nghiệp vụ / DOx (nguồn chính)
- `src/services/mockData.js` — dữ liệu mẫu (các trường dùng trong UI)
- `server/config/database.js` — cấu hình SQLite + Sequelize

Ghi chú chung:
- DB chính: SQLite file `database/training.sqlite` (dev). Thực tế có thể chuyển sang MySQL/Postgres.
- API front/back sử dụng chuẩn JSON: `{ success: boolean, data: any }` (xem `src/services/api.js`).

---

**1. Tổng quan mô hình dữ liệu**

- Danh sách chính các bảng / models (tên hiển thị):
	- OrganizationUnit
	- UserAccount (Employee)
	- Role, RoleAssignment, AuditLog
	- EducationManagement (CTĐT / Program)
	- ProgramBlock / StandardKnowledgeModule / ModuleCourse
	- Course, CourseCategory, CourseSession
	- CourseFee, TuitionUnit, TuitionLog
	- StudentTuition, TuitionCalculationLog
	- Enrollment
	- Position

- Quan hệ chính (tóm tắt):
	- OrganizationUnit 1 — n UserAccount (một khoa có nhiều nhân sự)
	- OrganizationUnit 1 — n EducationManagement (một khoa quản lý nhiều CTĐT)
	- EducationManagement 1 — n ProgramBlock / StandardKnowledgeModule (CTĐT gồm nhiều khối)
	- ProgramBlock n — n Course (qua ModuleCourse)
	- Course 1 — n CourseFee (một học phần có thể có nhiều bản ghi học phí theo năm/CTĐT)
	- TuitionUnit 1 — n CourseFee (đơn giá/tín chỉ theo CTĐT/năm) — CourseFee trỏ tới TuitionUnit/năm áp dụng
	- UserAccount 1 — n Enrollment (người học đăng ký nhiều session)
	- CourseSession 1 — n Enrollment
	- EducationManagement 1 — n StudentTuition (tổng học phí theo CTĐT + học kỳ)
	- TuitionCalculationLog lưu các lần chạy tính học phí (UserAccount reference)

- Kiểm tra toàn vẹn dữ liệu (data integrity):
	- Sử dụng ràng buộc PK/UNIQUE và FK ở tầng DB / ORM.
	- Thiết lập PRAGMA SQLite: `foreign_keys = ON`, `journal_mode = WAL`, `synchronous = NORMAL` (đã bật trong `server/config/database.js`).
	- Quy tắc xóa: khuyến nghị `ON DELETE RESTRICT` cho entities chính (không tự động xóa CTĐT khi có Course) hoặc `SET NULL` tùy use-case.

---

**2. Chi tiết từng đối tượng dữ liệu**

Lưu ý: các kiểu dữ liệu bên dưới là khuyến nghị để mapping sang Sequelize/SQLite/Postgres. Giữ tên trường theo chuẩn camelCase cho JSON/JS (phần 3 có mapping tên hiện tại → chuẩn).

---

### OrganizationUnit
- Mục đích: lưu thông tin các đơn vị (Khoa, Phòng ban)
- Table: `OrganizationUnit`

| Field | Type | PK | FK | Unique | Not Null | Default | Description |
|---|---:|:--:|:--:|:--:|:--:|:--:|---|
| organizationUnitId | STRING(10) | PK |  | Y | Y |  | Mã đơn vị (OrgID) |
| name | STRING(150) |  |  |  | Y |  | Tên đơn vị |
| type | STRING(50) |  |  |  |  | NULL | Loại đơn vị (Khoa, Phòng...) |
| parentUnitId | STRING(10) |  | FK->OrganizationUnit(organizationUnitId) |  |  | NULL | Mã đơn vị cha |
| description | TEXT |  |  |  |  | NULL | Mô tả |
| active | BOOLEAN |  |  |  | Y | true | Trạng thái hoạt động |
| createdAt | DATETIME |  |  |  |  | CURRENT_TIMESTAMP | Thời gian tạo |
| updatedAt | DATETIME |  |  |  |  | CURRENT_TIMESTAMP | Thời gian cập nhật |

Source example fields: `department_code`, `department_name`, `manager_id` in `src/services/mockData.js`.

---

### UserAccount (Employee)
- Mục đích: thông tin nhân sự, giảng viên, sinh viên (thu hẹp scope: nhân sự)
- Table: `UserAccount`

| Field | Type | PK | FK | Unique | Not Null | Default | Description |
|---|---:|:--:|:--:|:--:|:--:|:--:|---|
| userId | STRING(20) | PK |  | Y | Y |  | Mã người dùng / mã nhân viên (employee_code) |
| firstName | STRING(100) |  |  |  | Y |  | Họ |
| lastName | STRING(100) |  |  |  | Y |  | Tên |
| fullName | STRING(200) |  |  |  | Y |  | Họ và tên đầy đủ |
| email | STRING(150) |  |  | Y | Y |  | Email liên hệ |
| phone | STRING(20) |  |  |  |  | NULL | Số điện thoại |
| idCard | STRING(50) |  |  |  |  | NULL | Số CMND/CCCD |
| gender | STRING(10) |  |  |  |  | NULL | Giới tính |
| departmentId | STRING(10) |  | FK->OrganizationUnit |  |  | NULL | Đơn vị quản lý |
| positionId | STRING(20) |  | FK->Position |  |  | NULL | Vị trí công tác |
| managerId | STRING(20) |  | FK->UserAccount |  |  | NULL | Mã quản lý trực tiếp |
| hireDate | DATE |  |  |  |  | NULL | Ngày tuyển dụng |
| salary | INTEGER |  |  |  |  | NULL | Lương cơ bản |
| status | STRING(50) |  |  |  |  | 'Active' | Trạng thái |
| createdAt | DATETIME |  |  |  |  | CURRENT_TIMESTAMP | |
| updatedAt | DATETIME |  |  |  |  | CURRENT_TIMESTAMP | |

Mock examples available in `src/services/mockData.js` under `mockEmployees`.

---

### Role, RoleAssignment, AuditLog
- Purpose: quyền truy cập và lịch sử thao tác

Role: `Role`
| roleId | STRING | PK |
| name | STRING |  |
| description | TEXT |  |

RoleAssignment: `RoleAssignment`
| id | INTEGER | PK |
| userId | STRING | FK->UserAccount |
| roleId | STRING | FK->Role |
| assignedAt | DATETIME |  |

AuditLog: `AuditLog`
| logId | STRING | PK |
| userId | STRING | FK->UserAccount |
| action | STRING |  |
| target | STRING |  |
| details | JSON/TEXT |  |
| createdAt | DATETIME |  |

---

### EducationManagement (CTĐT / Program)
- Table: `EducationManagement`

| Field | Type | PK | FK | Unique | Not Null | Default | Description |
|---|---:|:--:|:--:|:--:|:--:|:--:|---|
| educationManagementId | STRING(10) | PK |  | Y | Y |  | Mã chương trình đào tạo (CTĐT)
| name | STRING(150) |  |  |  | Y |  | Tên CTĐT
| degreeLevel | STRING(50) |  |  |  |  | NULL | Trình độ (Đại học, Cao học...)
| organizationUnitId | STRING(10) |  | FK->OrganizationUnit |  |  | NULL | Khoa quản lý
| totalCredits | INTEGER |  |  |  |  | NULL | Tổng tín chỉ chương trình
| active | BOOLEAN |  |  |  | Y | true | Trạng thái

---

### ProgramBlock / StandardKnowledgeModule / ModuleCourse
- Purpose: mô tả khối kiến thức trong CTĐT và link tới học phần

ProgramBlock: `ProgramBlock` (blockId, educationManagementId, name, totalCredits)
StandardKnowledgeModule: `StandardKnowledgeModule` (moduleId, name, type)
ModuleCourse: linking table `ModuleCourse` (moduleId, courseId, credit)

---

### Course
- Table: `Course`

| Field | Type | PK | FK | Unique | Not Null | Description |
|---|---:|:--:|:--:|:--:|:--:|---|
| courseId | STRING(20) | PK |  | Y | Y | Mã học phần (course_code)
| name | STRING(150) |  |  |  | Y | Tên học phần
| description | TEXT |  |  |  |  | Mô tả
| categoryId | INTEGER |  | FK->CourseCategory |  |  | Loại học phần
| credits | INTEGER |  |  |  | Y | Số tín chỉ
| durationHours | INTEGER |  |  |  |  | Số giờ
| level | STRING(50) |  |  |  |  | Trình độ khóa học
| prerequisites | TEXT |  |  |  |  | Điều kiện tiền quyết

Mock examples: `mockCourses` in `src/services/mockData.js`.

---

### CourseCategory
| categoryId | INTEGER | PK |
| code | STRING |  |
| name | STRING |  |

---

### CourseSession (phiên/khóa học)
| sessionId | INTEGER | PK |
| sessionCode | STRING |  |
| courseId | STRING | FK->Course |
| instructorId | STRING | FK->UserAccount |
| startDate | DATE |  |
| endDate | DATE |  |
| maxStudents | INTEGER |  |
| currentStudents | INTEGER |  |
| status | STRING |  |

Mock: `mockCourseSessions`.

---

### Enrollment
| id | INTEGER | PK |
| employeeId | STRING | FK->UserAccount |
| courseSessionId | INTEGER | FK->CourseSession |
| enrollmentDate | DATETIME |  |
| status | STRING |  |
| finalScore | DECIMAL |  |

Mock: `mockEnrollments`.

---

### Tuition-related entities (chi tiết quan trọng)

#### TuitionUnit (DO7 / DO8.3)
- Table: `TuitionUnit`

| Field | Type | PK | FK | Unique | Not Null | Default | Description |
|---|---:|:--:|:--:|:--:|:--:|:--:|---|
| tuitionUnitId | STRING(10) | PK |  | Y | Y |  | Mã đơn vị học phí
| educationManagementId | STRING(10) |  | FK->EducationManagement |  | Y |  | CTĐT áp dụng
| organizationUnitId | STRING(10) |  | FK->OrganizationUnit |  |  | NULL | Khoa/đơn vị áp dụng
| yearApplied | INTEGER |  |  |  | Y |  | Năm áp dụng
| feePerCredit | DECIMAL(12,2) |  |  |  | Y |  | Mức thu trên mỗi tín chỉ
| currency | STRING(10) |  |  |  | Y | 'VND' | Đơn vị tiền tệ
| active | BOOLEAN |  |  |  | Y | true | Đang áp dụng
| effectiveDate | DATE |  |  |  |  | NULL | Ngày bắt đầu
| expiredDate | DATE |  |  |  |  | NULL | Ngày kết thúc
| note | STRING(255) |  |  |  |  | NULL | Ghi chú

#### TuitionLog (DO7.3)
| tuitionLogId | STRING(10) | PK |
| tuitionUnitId | STRING(10) | FK->TuitionUnit |
| action | STRING(20) |  | (Add/Edit/Delete) |
| editedBy | STRING(100) | FK->UserAccount |
| editedDate | DATETIME |  |
| oldValue | DECIMAL |  |
| newValue | DECIMAL |  |
| note | STRING(255) |  |

#### CourseFee (DO8.1)
- Table: `CourseFee`
| courseFeeId | STRING(10) | PK |
| courseId | STRING(20) | FK->Course |
| educationManagementId | STRING(10) | FK->EducationManagement |
| credit | INTEGER |  |
| unitPrice | DECIMAL(12,2) |  | Đơn giá/tín chỉ
| totalAmount | DECIMAL(14,2) |  | Credit × UnitPrice
| yearApplied | INTEGER |  |

#### StudentTuition (DO8.2)
| studentTuitionId | STRING(10) | PK |
| userAccountId | STRING(20) | FK->UserAccount |
| educationManagementId | STRING(10) | FK->EducationManagement |
| semester | STRING(20) |  |
| totalCredits | INTEGER |  |
| totalFee | DECIMAL(14,2) |  |
| paymentActive | STRING(20) |  | (Chưa nộp/Đã nộp/Miễn giảm)
| note | STRING(255) |  |

#### TuitionCalculationLog (DO8.5)
| tuitionCalculationId | STRING(10) | PK |
| educationManagementId | STRING(10) | FK->EducationManagement |
| calculationDate | DATETIME |  |
| userId | STRING(50) | FK->UserAccount |
| totalTuition | DECIMAL(14,2) |  |
| note | STRING(255) |  |

---

**3. Chuẩn hóa tên biến (naming convention)**

Hiện trạng (từ mockData.js và file spec):
- `department_code`, `department_name`, `manager_id`, `created_at`, `updated_at`, `is_active`
- `employee_code`, `first_name`, `last_name`, `full_name`, `date_of_birth`, `id_card`
- `course_code`, `course_name`, `duration_hours`, `credits`

Đề xuất chuẩn: sử dụng camelCase cho JSON/JS và database column names (consistent) — ví dụ:

| Hiện tại | Đề xuất (camelCase) | Ghi chú |
|---|---|---|
| department_code | departmentCode | string |
| department_name | departmentName | string |
| created_at | createdAt | datetime |
| updated_at | updatedAt | datetime |
| is_active | isActive | boolean |
| employee_code | employeeCode (userId) | string |
| first_name | firstName | string |
| last_name | lastName | string |
| full_name | fullName | string |
| date_of_birth | dateOfBirth | date |
| course_code | courseCode (courseId) | string |
| course_name | courseName | string |
| duration_hours | durationHours | integer |
| total_tuition | totalTuition | decimal |

Quy ước áp dụng toàn bộ dự án:
- JSON / frontend: camelCase (e.g., `tuitionCalculationId`).
- DB columns: snake_case OR camelCase (chọn 1). Khuyến nghị: camelCase to match code, or snake_case if DB tools prefer. Vì repo hiện dùng JS/Sequelize, chọn camelCase is acceptable.
- Sequelize model attribute names: camelCase, map to DB column bằng `field` nếu cần backward-compat.

---

**4. Mô hình dữ liệu cho học phí (chi tiết)**

Yêu cầu: hỗ trợ tính học phí theo CTĐT, đơn giá/tín chỉ theo năm, lưu lịch sử 5 năm.

- Bảng chính:
	- `EducationManagement` (CTĐT) — định danh CTĐT, tổng tín chỉ
	- `TuitionUnit` — đơn giá/tín chỉ theo CTĐT & năm áp dụng (yearApplied)
	- `CourseFee` — đơn giá/tín chỉ / học phần (credit × unitPrice)
	- `StudentTuition` — kết quả tính cho từng sinh viên/học kỳ
	- `TuitionCalculationLog` — log các lần tính
	- `TuitionLog` — lịch sử thay đổi đơn giá

- Lịch sử 5 năm: các bản ghi `TuitionUnit` theo `yearApplied` cho một `educationManagementId` — truy vấn `ORDER BY yearApplied DESC LIMIT 5`.

Ràng buộc quan trọng:
- Với (educationManagementId, yearApplied) chỉ tồn tại 0..1 TuitionUnit active (unique constraint: educationManagementId + yearApplied + active=true).
- CourseFee liên kết tới Course và EducationManagement; StudentTuition là kết quả tổng hợp các CourseFee dựa trên Enrollment.

---

**5. Bản đồ dữ liệu tính học phí (calculation data map)**

- Input (minimal):
	- totalCredits (integer)
	- creditPrice (decimal) — đơn giá/tín chỉ (lấy từ TuitionUnit hoặc CourseFee)
	- year (integer)
	- educationManagementId / programCode (string)
	- optional: discounts (decimal percentage), scholarshipAmount (absolute), roundingRule

- Output (minimal):
	- tuitionFee (decimal) = totalCredits × creditPrice − discounts
	- breakdown: list of { courseId, credits, unitPrice, amount }
	- summaryByYear: list of { year, unitPrice, totalFee }
	- last5YearsTuition: array of historical tuition totals or unitPrices

Pseudo-code (server-side):

```js
function calculateTuition({ educationManagementId, totalCredits, year, discounts = 0 }) {
	// 1. resolve creditPrice
	const tuitionUnit = findTuitionUnit(educationManagementId, year) || findLatestTuitionUnit(educationManagementId)
	const creditPrice = tuitionUnit?.feePerCredit || 0

	// 2. base calculation
	let raw = totalCredits * creditPrice

	// 3. apply discounts (percentage or absolute)
	let discounted = raw - discounts

	// 4. rounding (school rule) — example: round to nearest 1000 VND
	const tuitionFee = Math.round(discounted / 1000) * 1000

	return { tuitionFee, creditPrice, raw, discounted }
}
```

Example input JSON:

```json
{
	"educationManagementId": "PRG001",
	"totalCredits": 120,
	"year": 2025,
	"discounts": 0
}
```

Example output JSON:

```json
{
	"tuitionFee": 36000000,
	"creditPrice": 300000,
	"raw": 36000000,
	"discounted": 36000000
}
```

Notes for student-level calculation (StudentTuition):
- When calculating for a student, derive totalCredits from `Enrollment` (sum of course credits for the semester), use CourseFee/unitPrice precedence: CourseFee (per course/year) -> TuitionUnit (program/year) -> fallback latest TuitionUnit.
- Log every calculation in `TuitionCalculationLog` with `userId` and timestamp to allow auditing and reproduction.

---

**6. API / Integration notes (practical)**

- API response pattern: `{ success: boolean, data: any, message?: string }` (see `src/services/api.js`).
- Backend server default port: 8000 (see `server/server.js`). Frontend assumes API base `/api` proxied to backend in dev.
- When adding models in Sequelize, enable `foreignKeys` pragma (already set in `server/config/database.js`).

---

**7. Kết luận & next steps**

- Tôi đã chuẩn hoá tên biến hướng camelCase và tóm tắt các bảng/fields quan trọng, với focus vào học phí.
- Bạn muốn tôi tiếp tục theo các lựa chọn sau không?
	1. Mở rộng mọi DOx từ `database/word.md` thành bảng chi tiết (verbos) trong file này.
	2. Xuất file CSV/JSON chứa schema cho mỗi table.
	3. Tạo Sequelize model stubs (`server/models/`) và migration/seed minimal cho các bảng học phí.

Hãy chọn 1/2/3 hoặc yêu cầu chỉnh sửa chi tiết (ví dụ: đổi naming convention sang snake_case, hoặc include sample SQL DDL). Tôi sẽ tiếp tục và cập nhật todo list.



