# EduGuard — Todo List

> Lộ trình: `docs/06_DEVELOPMENT_ROADMAP.md` · Quy tắc: `docs/07_DEVELOPMENT_RULES.md`  
> Nguyên tắc: **Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được**

**Branch làm việc:** `devD`  
**Cập nhật:** 2026-06-09  
**Quy tắc:** `docs/07_DEVELOPMENT_RULES.md`

---

## Trạng thái tổng quan

| Giai đoạn | Tên | Trạng thái |
|-----------|-----|------------|
| 0 | Khởi tạo project | 🟡 Đang làm dở |
| 1 | Database + Entity nền tảng | ⬜ Chưa bắt đầu |
| 2 | Authentication & Authorization | ⬜ Chưa bắt đầu |
| 3 | Classroom Management | ⬜ Chưa bắt đầu |
| 4 | Assignment Management | ⬜ Chưa bắt đầu |
| 5 | Exam Management | ⬜ Chưa bắt đầu |
| 6 | Online Testing / Exam Attempt | ⬜ Chưa bắt đầu |
| 7 | Anti-cheat Monitoring | ⬜ Chưa bắt đầu |
| 8 | SignalR Realtime | ⬜ Chưa bắt đầu |
| 9 | Redis | ⬜ Chưa bắt đầu |
| 10 | Dashboard & Reporting | ⬜ Chưa bắt đầu |
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
- [ ] Tạo React Vite project trong `frontend/`
- [ ] Cấu hình TailwindCSS
- [ ] Cấu hình Swagger (kiểm tra & hoàn thiện)
- [ ] Cấu hình CORS cho React dev server
- [ ] Tạo `TestController` → `GET /api/test`
- [ ] React gọi thử `GET /api/test` và hiển thị kết quả

**Tiêu chí hoàn thành:** Mở React → gọi API → nhận response JSON từ backend.

---

## Giai đoạn 1 — Database + Entity nền tảng

**Mục tiêu:** SQL Server có database và các bảng cơ bản.

### Domain — Entity

- [ ] `User`
- [ ] `Role`
- [ ] `UserRole`
- [ ] `RefreshToken`
- [ ] `Classroom`
- [ ] `ClassroomMember`

### Infrastructure

- [ ] `AppDbContext`
- [ ] EF Core Fluent API configurations
- [ ] Connection string SQL Server (`appsettings.Development.json`)
- [ ] `Add-Migration InitialCreate`
- [ ] `Update-Database`

**Tiêu chí hoàn thành:** Database `EduGuardDb` có đủ 6 bảng trên.

---

## Giai đoạn 2 — Authentication & Authorization

**Mục tiêu:** User đăng ký/đăng nhập được và nhận JWT token.

### Backend

- [ ] `IUserRepository` + `UserRepository`
- [ ] `AuthService` (register, login, refresh)
- [ ] DTOs: `RegisterRequest`, `LoginRequest`, `LoginResponse`
- [ ] Hash password
- [ ] JWT access token + refresh token
- [ ] `AuthController` (`register`, `login`, `refresh`)
- [ ] Cấu hình `[Authorize]` + role policies (Admin, Teacher, Student)
- [ ] Test qua Swagger

### Frontend

- [ ] Trang Login / Register
- [ ] Axios client + interceptor gắn `Authorization`
- [ ] Lưu `accessToken`
- [ ] Protected routes theo role

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

- [ ] Trang danh sách lớp
- [ ] Form tạo lớp (Teacher)
- [ ] Form nhập mã lớp (Student)

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

- [ ] UI tạo đề thi
- [ ] UI quản lý câu hỏi & đáp án

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
- [ ] Frontend biểu đồ dashboard

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
2. Auth JWT
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
