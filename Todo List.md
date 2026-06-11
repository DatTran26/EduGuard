# EduGuard — Todo List

> Lộ trình: `docs/06_DEVELOPMENT_ROADMAP.md` · Quy tắc: `docs/07_DEVELOPMENT_RULES.md`  
> Nguyên tắc: **Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được**

**Branch làm việc:** `devH`  
**Cập nhật:** 2026-06-11 (đã nối frontend auth với backend thật cho register/login/me/logout; đã đồng bộ role từ backend session sang route guard và mock dashboard khi user đổi quyền trong DB; đã thay layout dùng chung của mọi vai trò theo header workspace mới, bỏ brand navbar cũ, thêm dropdown người dùng và tối giản sidebar; đã tinh chỉnh header theo UI mới với logo thật, bỏ cờ Việt Nam, đưa đăng xuất vào dropdown cá nhân, bỏ nút 3 gạch cạnh logo, thêm dấu `v` cho khối thông tin cá nhân, dùng logo nền trong suốt và phóng lớn logo top bar; đã dọn menu Admin theo nhãn mới và tách thống kê giảng viên/sinh viên trên dashboard Admin; đã thêm upload avatar ở hồ sơ cá nhân và giữ lại profile cục bộ sau khi tải lại trang; đã thêm bộ lọc/tìm kiếm cho danh sách lớp học của Admin và bỏ overview card trên màn này; đã thiết kế lại khu xác thực với login 2 cột navy-trắng theo phong cách tối giản hiện đại, logo lớn hơn và thông điệp tách thành 2 dòng chữ rõ ràng)  
**Quy tắc:** `docs/07_DEVELOPMENT_RULES.md`

---

## Trạng thái tổng quan

| Giai đoạn | Tên | Trạng thái |
|-----------|-----|------------|
| 0 | Khởi tạo project | ✅ Hoàn thành |
| 1 | Database + Entity nền tảng | ✅ Hoàn thành |
| 2 | Authentication & Authorization | 🟡 Backend xong, FE auth thật xong — các màn khác còn mock |
| 3 | Classroom Management | 🟡 Backend xong, FE mock xong — chưa nối thật |
| 4 | Assignment Management | ⬜ Chưa bắt đầu |
| 5 | Exam Management | 🟡 Đang làm |
| 6 | Online Testing / Exam Attempt | ⬜ Chưa bắt đầu |
| 7 | Anti-cheat Monitoring | ⬜ Chưa bắt đầu |
| 8 | SignalR Realtime | ⬜ Chưa bắt đầu |
| 9 | Redis | ⬜ Chưa bắt đầu |
| 10 | Dashboard & Reporting | 🟡 Đang làm |
| 11 | Docker Compose | ⬜ Chưa bắt đầu |

---

## Giai đoạn 0 — Khởi tạo project

**Mục tiêu:** Frontend gọi được backend thành công.

- [x] Tạo repo EduGuard
- [x] Tạo folder `backend/`
- [x] Tạo solution `EduGuard.slnx`
- [x] Tạo 4 project backend (Api, Application, Domain, Infrastructure)
- [x] Tạo cấu trúc folder `frontend/` (scaffold)
- [x] Thêm bộ tài liệu `docs/`
- [x] Tạo React Vite project trong `frontend/`
- [x] Cấu hình TailwindCSS (deps + `@import "tailwindcss"` trong `index.css`)
- [x] Cấu hình Swagger (mặc định ASP.NET Core, dev)
- [x] Cấu hình CORS cho React dev server (`http://localhost:5173`)
- [x] Tạo `TestController` → `GET /api/Test`
- [x] React gọi thử `GET /api/test` và hiển thị kết quả JSON

**Tiêu chí hoàn thành:** ✅ Mở React → gọi API → nhận response JSON từ backend (đã verify 2026-06-10).

---

## Giai đoạn 1 — Database + Entity nền tảng

**Mục tiêu:** SQL Server có database và các bảng cơ bản.

### Domain — Entity

- [x] `ApplicationUser` (kế thừa `IdentityUser<int>`)
- [x] `RefreshToken` (custom — rotate/revoke JWT)
- [x] `Classroom`
- [x] `ClassroomMember`
- [x] Package Domain: `Microsoft.Extensions.Identity.Stores`

### Infrastructure

- [x] `AppDbContext` kế thừa `IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`
- [x] Map tên bảng: `Users`, `Roles`, `UserRoles` (tuỳ chọn)
- [x] Seed roles: Admin, Teacher, Student
- [x] EF Fluent API: RefreshToken, Classroom, ClassroomMember
- [x] Package: `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
- [x] Connection string SQL Server (`appsettings.json` → `EduGuardExam`)
- [x] `Add-Migration InitialIdentityAndClassroom`
- [x] `Update-Database`

**Tiêu chí hoàn thành:** ✅ Database `EduGuardExam` có schema Identity + `RefreshTokens` + `Classrooms` + `ClassroomMembers`; 3 role seed (đã verify 2026-06-10).

---

## Giai đoạn 2 — Authentication & Authorization

**Mục tiêu:** User đăng ký/đăng nhập được và nhận JWT token.

### Backend

- [x] `AddIdentity` + `AddEntityFrameworkStores<AppDbContext>`
- [x] `IJwtTokenService` + `JwtTokenService` (access token)
- [x] `IRefreshTokenService` hoặc logic refresh trong `AuthService`
- [x] `IAuthService` + `AuthService` (`UserManager`, `SignInManager`, `RoleManager`)
- [x] DTOs: `RegisterRequest`, `LoginRequest`, `LoginResponse`, `UserDto`
- [x] FluentValidation cho Register/Login
- [x] `AuthController`: register, login, refresh, logout, me
- [x] JwtBearer trong `AddInfrastructure` + Swagger Bearer
- [x] `[Authorize(Roles = "...")]` — `GET /api/Test/teacher-only`
- [x] Test qua Swagger (manual) — đã verify 2026-06-10

*(Không dùng `IUserRepository` / hash password thủ công cho auth.)*

### Frontend

- [x] Trang Login / Register *(đã gọi backend thật theo `POST /api/auth/register` và `POST /api/auth/login`; đã thiết kế lại layout xác thực theo bố cục 2 cột, thêm checkbox ghi nhớ đăng nhập và link quên mật khẩu dạng UI placeholder, tăng logo và tách thông điệp hero thành 2 dòng chữ không xuống hàng)*
- [x] Axios client + interceptor gắn `Authorization` *(đã gắn Bearer token thật cho request protected)*
- [x] Lưu `accessToken` *(đã lưu access token và refresh token backend theo shape JWT flow)*
- [x] Protected routes theo role *(đã tách route riêng cho Admin / Teacher / Student)*
- [x] Trang hồ sơ cá nhân và cập nhật thông tin *(phiên đăng nhập lấy từ `GET /api/auth/me`; màn hồ sơ hiện vẫn dùng mock users API; đã hỗ trợ upload avatar từ máy và preview trước khi lưu)*
- [x] Popup toast toàn app cho thông báo thao tác/lỗi *(góc trên bên phải, tự ẩn sau 3 giây, đã thêm thông báo đăng nhập/đăng xuất thành công)*
- [x] Đồng bộ session backend vào app mock hiện tại *(user đăng nhập backend thật vẫn dùng tiếp được classroom/dashboard/exam đang còn mock)*
- [x] Layout dùng chung cho khu đăng nhập theo vai trò *(đã bỏ navbar trên cùng cũ, đưa header workspace mới lên trên, thêm dropdown người dùng, dùng logo nền trong suốt `public/logo-transparent.png`, bỏ cờ Việt Nam, bỏ nút 3 gạch cạnh logo, thêm dấu `v` cho card cá nhân, phóng logo top bar ngang chiều cao chữ, dọn menu/sidebar Admin và rút sidebar còn điều hướng)*

**Tiêu chí hoàn thành:** Đăng ký → đăng nhập → nhận JWT → gọi API được bảo vệ.

---

## Giai đoạn 3 — Classroom Management

**Mục tiêu:** Teacher tạo lớp, Student tham gia bằng mã lớp.

### Backend

- [x] `ClassroomRepository` + `ClassroomService`
- [x] DTOs: `CreateClassroomRequest`, `ClassroomDto`, `JoinClassroomRequest`, `ClassroomMemberDto`
- [x] `POST /api/classrooms` — tạo lớp
- [x] `GET /api/classrooms` — danh sách lớp
- [x] `POST /api/classrooms/join` — tham gia bằng mã
- [x] `GET /api/classrooms/{id}/members` — danh sách thành viên

### Frontend

- [x] Trang danh sách lớp *(đã đọc dữ liệu theo role từ mock API/localStorage)*
- [x] Form tạo lớp (Teacher) *(có tên lớp, mô tả, mã lớp và nút random mã; hiện mở qua button `Tạo lớp học` thay vì hiện sẵn)*
- [x] CRUD lớp học cho Teacher *(tạo ở list page, sửa/xóa ở detail page)*
- [x] Form nhập mã lớp (Student) *(đã join thật vào mock database bằng join code)*
- [x] Trang chi tiết lớp + thành viên *(đã đọc detail + members theo quyền hiện tại)*
- [x] Route admin xem người dùng và lớp học tổng quan *(mức mock frontend, chưa có backend thật; danh sách lớp đã có tìm kiếm theo tên lớp/tên giảng viên và sắp xếp theo tên hoặc số thành viên)*

**Tiêu chí hoàn thành:** Teacher tạo được lớp, Student tham gia được lớp.

---

## Giai đoạn 4 — Assignment Management

**Mục tiêu:** Luồng giao bài tập → nộp bài → chấm điểm.

### Backend

- [ ] Entity `Assignment`, `Submission`
- [ ] Migration
- [ ] `AssignmentController` + Service + Repository
- [ ] API tạo bài tập
- [ ] API xem bài tập theo lớp
- [ ] API nộp bài
- [ ] API chấm điểm

### Frontend

- [ ] Danh sách bài tập theo lớp
- [ ] Form tạo bài tập (Teacher)
- [ ] Form nộp bài (Student)
- [ ] Form chấm điểm (Teacher)

**Tiêu chí hoàn thành:** Luồng giao bài tập và nộp bài chạy được.

---

## Giai đoạn 5 — Exam Management

**Mục tiêu:** Teacher tạo đề thi hoàn chỉnh.

### Backend

- [ ] Entity `Exam`, `ExamSetting`, `Question`, `Answer`
- [ ] Migration
- [ ] `ExamController` + Service + Repository
- [ ] API tạo đề thi
- [ ] API thêm câu hỏi
- [ ] API thêm đáp án
- [ ] API publish đề thi

### Frontend

- [x] UI danh sách bài kiểm tra theo role *(Admin / Teacher / Student)*
- [x] UI tạo đề thi *(Teacher, mock API + localStorage)*
- [x] UI xem chi tiết đề thi *(mọi role theo quyền truy cập)*
- [x] UI cập nhật / xóa đề thi *(Teacher, có xác nhận xóa 2 bước)*
- [x] UI cấu hình đề thi *(thời gian mở-đóng, anti-cheat, fullscreen, random, max attempts, show result)*
- [x] UI quản lý câu hỏi & đáp án *(Teacher thêm/sửa/xóa câu hỏi, quản lý đáp án ngay trong exam detail; Admin xem được question bank; Student không thấy đáp án ở trang detail)*

**Tiêu chí hoàn thành:** Teacher tạo được đề thi hoàn chỉnh.

---

## Giai đoạn 6 — Online Testing / Exam Attempt

**Mục tiêu:** Student làm bài thi online và nhận kết quả.

### Backend

- [ ] Entity `ExamAttempt`, `StudentAnswer`
- [ ] `POST /api/exams/{id}/start`
- [ ] Random câu hỏi / đáp án
- [ ] API lưu đáp án từng câu
- [ ] `POST /api/exams/{id}/submit`
- [ ] Logic chấm điểm tự động
- [ ] Tính tổng điểm, lưu trạng thái `Submitted`

### Frontend

- [ ] Màn hình làm bài
- [ ] Countdown timer
- [ ] Auto submit khi hết giờ

**Tiêu chí hoàn thành:** Student làm bài thi online và nhận kết quả.

---

## Giai đoạn 7 — Anti-cheat Monitoring

**Mục tiêu:** Ghi nhận hành vi bất thường và tính suspicion score.

### Backend

- [ ] Entity `CheatingLog`
- [ ] `AntiCheatController` + Service + Repository
- [ ] API ghi log anti-cheat
- [ ] API xem log theo attempt
- [ ] API xem suspicion score

### Frontend

- [ ] Bắt sự kiện chuyển tab
- [ ] Bắt sự kiện copy/paste
- [ ] Bắt sự kiện fullscreen
- [ ] Bắt reload / mất kết nối cơ bản
- [ ] Dashboard anti-cheat cho Teacher

**Tiêu chí hoàn thành:** Hệ thống ghi nhận hành vi bất thường và tính điểm nghi ngờ.

---

## Giai đoạn 8 — SignalR Realtime

**Mục tiêu:** Teacher nhận cảnh báo ngay khi student có hành vi bất thường.

- [ ] `NotificationHub`
- [ ] `ExamMonitoringHub`
- [ ] Frontend kết nối SignalR
- [ ] Backend gửi notification
- [ ] Backend gửi anti-cheat warning
- [ ] Teacher dashboard nhận cảnh báo realtime

**Tiêu chí hoàn thành:** Cảnh báo realtime hiển thị trên dashboard Teacher.

---

## Giai đoạn 9 — Redis

**Mục tiêu:** Cache và trạng thái phiên thi tạm thời.

- [ ] Cấu hình Redis connection string
- [ ] `RedisCacheService`
- [ ] Cache exam questions
- [ ] Cache dashboard summary
- [ ] Lưu heartbeat attempt

**Tiêu chí hoàn thành:** Redis được dùng đúng mục đích, không chỉ thêm cho có.

---

## Giai đoạn 10 — Dashboard & Reporting

**Mục tiêu:** Trang tổng quan cho Admin, Teacher, Student.

- [ ] API dashboard Admin
- [ ] API dashboard Teacher
- [ ] API dashboard Student
- [ ] Thống kê số lớp, học sinh, bài tập, điểm thi
- [ ] Thống kê cheating score
- [x] Frontend dashboard Admin *(đã có mock API + UI tổng quan người dùng, lớp học, activity, anti-cheat; đã tách số liệu giảng viên và sinh viên thành thống kê riêng)*
- [x] Frontend dashboard Teacher *(đã có mock API + UI lớp quản lý, nộp bài, lịch thi, sinh viên rủi ro cao; đã bỏ mục điểm trung bình khỏi dashboard tổng quan)*
- [x] Frontend dashboard Student *(đã có mock API + UI tiến độ lớp, việc sắp tới, kết quả, thông báo; đã bỏ mục điểm trung bình khỏi dashboard tổng quan)*
- [x] Frontend biểu đồ dashboard *(mức cơ bản bằng stat card + progress bars, chưa dùng chart library)*

**Tiêu chí hoàn thành:** Người dùng có trang tổng quan dữ liệu theo role.

---

## Giai đoạn 11 — Docker Compose

**Mục tiêu:** Chạy toàn hệ thống bằng `docker compose up`.

- [ ] `Dockerfile` backend
- [ ] `Dockerfile` frontend
- [ ] `docker-compose.yml`
- [ ] Container SQL Server
- [ ] Container Redis
- [ ] Container backend
- [ ] Container frontend
- [ ] Test `docker compose up`

**Tiêu chí hoàn thành:** Hệ thống chạy được hoàn toàn trong Docker.

---

## Thứ tự ưu tiên MVP (thời gian gấp)

```txt
1. Hoàn thiện Giai đoạn 0 (FE ↔ BE kết nối)
2. Auth Identity + JWT
3. Classroom
4. Exam CRUD
5. Start Exam → Submit Exam
6. Anti-cheat log
7. Dashboard anti-cheat cơ bản
8. SignalR warning
9. Redis cache
10. Docker Compose
```

> Assignment (Giai đoạn 4) có thể làm song song hoặc sau Classroom.

---

## Hướng phát triển (ngoài MVP)

- AI Proctoring
- Facial Recognition
- AI Auto Grading
- Mobile App
- Multi-school Management
- Advanced Learning Analytics
- Cloud Deployment
