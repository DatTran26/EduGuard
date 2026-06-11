# EduGuard — Todo List

> Lộ trình: `docs/06_DEVELOPMENT_ROADMAP.md` · Quy tắc: `docs/07_DEVELOPMENT_RULES.md`  
> Nguyên tắc: **Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được**

**Branch làm việc:** `devH`  
**Cập nhật:** 2026-06-10 (đã thêm mock API theo hướng DB thật cho auth, classroom, dashboard, CRUD bài kiểm tra và quản lý câu hỏi/đáp án; đã hỗ trợ mock Google auth, avatar mặc định capybara, brand navbar và popup toast xanh dịu có thông báo login/logout; chưa nối backend thật)  
**Quy tắc:** `docs/07_DEVELOPMENT_RULES.md`

---

## Trạng thái tổng quan

| Giai đoạn | Tên | Trạng thái |
|-----------|-----|------------|
| 0 | Khởi tạo project | ✅ Hoàn thành |
| 1 | Database + Entity nền tảng | 🟡 Sắp bắt đầu |
| 2 | Authentication & Authorization | 🟡 Đang làm |
| 3 | Classroom Management | 🟡 Đang làm |
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

- [ ] `ApplicationUser` (kế thừa `IdentityUser<int>`)
- [ ] `RefreshToken` (custom — rotate/revoke JWT)
- [ ] `Classroom`
- [ ] `ClassroomMember`
- [ ] Package Domain: `Microsoft.Extensions.Identity.Stores`

### Infrastructure

- [ ] `AppDbContext` kế thừa `IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`
- [ ] Map tên bảng: `Users`, `Roles`, `UserRoles` (tuỳ chọn)
- [ ] Seed roles: Admin, Teacher, Student
- [ ] EF Fluent API: RefreshToken, Classroom, ClassroomMember
- [ ] Package: `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
- [ ] Connection string SQL Server (`appsettings.Development.json`)
- [ ] `Add-Migration InitialIdentityAndClassroom`
- [ ] `Update-Database`

**Tiêu chí hoàn thành:** Database có schema Identity + `RefreshTokens` + `Classrooms` + `ClassroomMembers`; 3 role seed. (Dev có thể dùng tên DB `EduGuardExam` thay `EduGuardDb`.)

---

## Giai đoạn 2 — Authentication & Authorization

**Mục tiêu:** User đăng ký/đăng nhập được và nhận JWT token.

### Backend

- [ ] `AddIdentity` + `AddEntityFrameworkStores<AppDbContext>`
- [ ] `IJwtTokenService` + `JwtTokenService` (access token)
- [ ] `IRefreshTokenService` hoặc logic refresh trong `AuthService`
- [ ] `IAuthService` + `AuthService` (`UserManager`, `SignInManager`, `RoleManager`)
- [ ] DTOs: `RegisterRequest`, `LoginRequest`, `LoginResponse`, `UserDto`
- [ ] FluentValidation cho Register/Login
- [ ] `AuthController`: register, login, refresh, me
- [ ] JwtBearer trong `Program.cs` + Swagger Bearer
- [ ] `[Authorize(Roles = "...")]` — Admin, Teacher, Student
- [ ] Test qua Swagger

*(Không dùng `IUserRepository` / hash password thủ công cho auth.)*

### Frontend

- [x] Trang Login / Register *(đã chuyển sang mock API theo flow auth thật, có tài khoản seed Admin/Teacher/Student, hỗ trợ thêm nút Google mock)*
- [x] Axios client + interceptor gắn `Authorization` *(đã có bộ khung; hiện mock API chưa dùng request HTTP thật)*
- [x] Lưu `accessToken` *(đã lưu session local theo shape gần giống JWT flow)*
- [x] Protected routes theo role *(đã tách route riêng cho Admin / Teacher / Student)*
- [x] Trang hồ sơ cá nhân và cập nhật thông tin *(mock API `users/me` + update profile, có preview avatar hiện tại)*
- [x] Popup toast toàn app cho thông báo thao tác/lỗi *(góc trên bên phải, tự ẩn sau 3 giây, đã thêm thông báo đăng nhập/đăng xuất thành công)*
- [x] Avatar mặc định và avatar social *(đăng ký thường dùng capybara mặc định, Google mock dùng ảnh profile Google demo)*

**Tiêu chí hoàn thành:** Đăng ký → đăng nhập → nhận JWT → gọi API được bảo vệ.

---

## Giai đoạn 3 — Classroom Management

**Mục tiêu:** Teacher tạo lớp, Student tham gia bằng mã lớp.

### Backend

- [ ] `ClassroomRepository` + `ClassroomService`
- [ ] DTOs: `CreateClassroomRequest`, `ClassroomDto`
- [ ] `POST /api/classrooms` — tạo lớp
- [ ] `GET /api/classrooms` — danh sách lớp
- [ ] `POST /api/classrooms/join` — tham gia bằng mã
- [ ] `GET /api/classrooms/{id}/members` — danh sách thành viên

### Frontend

- [x] Trang danh sách lớp *(đã đọc dữ liệu theo role từ mock API/localStorage)*
- [x] Form tạo lớp (Teacher) *(có tên lớp, mô tả, mã lớp và nút random mã; hiện mở qua button `Tạo lớp học` thay vì hiện sẵn)*
- [x] CRUD lớp học cho Teacher *(tạo ở list page, sửa/xóa ở detail page)*
- [x] Form nhập mã lớp (Student) *(đã join thật vào mock database bằng join code)*
- [x] Trang chi tiết lớp + thành viên *(đã đọc detail + members theo quyền hiện tại)*
- [x] Route admin xem người dùng và lớp học tổng quan *(mức mock frontend, chưa có backend thật)*

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
- [x] Frontend dashboard Admin *(đã có mock API + UI tổng quan người dùng, lớp học, activity, anti-cheat)*
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
