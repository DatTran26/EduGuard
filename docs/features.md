# EduGuard — Danh mục chức năng (Features)

> **Mục đích:** Liệt kê toàn bộ chức năng cần triển khai dưới dạng checklist có thể tick.  
> **Liên quan:** [`../Todo List.md`](../Todo%20List.md) · `06_DEVELOPMENT_ROADMAP.md` · `05_API_FRONTEND_INTEGRATION.md` · [`apiList.md`](apiList.md)  
> **Cập nhật:** 2026-06-10 · **Branch:** `devD`

---

## Cách dùng

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `- [ ]` | Chưa làm |
| `- [x]` | Đã hoàn thành |
| **MVP** | Ưu tiên bắt buộc cho demo / đồ án |
| **Role** | Admin · Teacher · Student · All · System |

**Lớp (layer):** `BE` backend · `FE` frontend · `DB` database/migration · `Infra` hạ tầng

Tick checkbox khi feature **đã chạy được end-to-end** (hoặc đủ tiêu chí module tương ứng). API REST map với ID trong [`apiList.md`](apiList.md).

---

## Tổng quan theo module

| # | Module | Số feature | MVP |
|---|--------|------------|-----|
| 0 | Khởi tạo & kết nối FE–BE | 8 | ✓ |
| 1 | Database & Entity nền | 12 | ✓ |
| 2 | Authentication & Authorization | 18 | ✓ |
| 3 | User Management | 10 | |
| 4 | Classroom Management | 14 | ✓ |
| 5 | Assignment Management | 16 | |
| 6 | Exam Management | 18 | ✓ |
| 7 | Online Testing / Exam Attempt | 16 | ✓ |
| 8 | Anti-cheat Monitoring | 14 | ✓ |
| 9 | Notification System | 8 | |
| 10 | Dashboard & Reporting | 10 | |
| 11 | SignalR Realtime | 8 | ✓ |
| 12 | Redis Cache | 6 | |
| 13 | Logging & Activity | 6 | |
| 14 | Docker & Deployment | 8 | |
| 15 | Ngoài MVP (tương lai) | 7 | |

---

## 0. Khởi tạo & kết nối FE–BE

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-000-01 | Repo + solution 4 project backend | Infra | System | ✓ |
| F-000-02 | Scaffold folder `frontend/` | Infra | System | ✓ |
| F-000-03 | Bộ tài liệu `docs/` | Infra | System | ✓ |
| F-000-04 | React Vite project + TailwindCSS | FE | System | ✓ |
| F-000-05 | Swagger / OpenAPI backend | BE | System | ✓ |
| F-000-06 | CORS cho `http://localhost:5173` | BE | System | ✓ |
| F-000-07 | `GET /api/test` — health / smoke test | BE | System | ✓ |
| F-000-08 | React gọi `/api/test` hiển thị JSON | FE | System | ✓ |

- [ ] F-000-04 React Vite + TailwindCSS
- [ ] F-000-05 Swagger hoàn thiện
- [ ] F-000-06 CORS
- [ ] F-000-07 TestController
- [ ] F-000-08 FE gọi API test

---

## 1. Database & Entity nền tảng

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-DB-01 | Entity `ApplicationUser` (`IdentityUser<int>`) | DB | System | ✓ |
| F-DB-02 | Entity `RefreshToken` | DB | System | ✓ |
| F-DB-03 | Entity `Classroom` | DB | System | ✓ |
| F-DB-04 | Entity `ClassroomMember` | DB | System | ✓ |
| F-DB-05 | `AppDbContext` : `IdentityDbContext<…>` | DB | System | ✓ |
| F-DB-06 | Fluent API: RefreshToken, Classroom, ClassroomMember | DB | System | ✓ |
| F-DB-07 | Seed roles: Admin, Teacher, Student | DB | System | ✓ |
| F-DB-08 | Connection string SQL Server (`DefaultConnection`) | Infra | System | ✓ |
| F-DB-09 | Migration `InitialIdentityAndClassroom` | DB | System | ✓ |
| F-DB-10 | `Update-Database` — DB dev (`EduGuardExam`) | DB | System | ✓ |
| F-DB-11 | Package Identity EF Core + Identity.Stores | Infra | System | ✓ |
| F-DB-12 | Map tên bảng Users/Roles (tuỳ chọn) | DB | System | |

- [ ] F-DB-01 ApplicationUser
- [ ] F-DB-02 RefreshToken
- [ ] F-DB-03 Classroom
- [ ] F-DB-04 ClassroomMember
- [ ] F-DB-05 AppDbContext Identity
- [ ] F-DB-06 Fluent API configs
- [ ] F-DB-07 Seed roles
- [ ] F-DB-08 Connection string
- [ ] F-DB-09 Migration
- [ ] F-DB-10 Update-Database
- [ ] F-DB-11 Packages
- [ ] F-DB-12 Table naming (optional)

---

## 2. Authentication & Authorization

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-AUTH-01 | `AddIdentity` + EF stores | BE | System | ✓ |
| F-AUTH-02 | `JwtTokenService` — access token | BE | System | ✓ |
| F-AUTH-03 | Refresh token — tạo / rotate / revoke | BE | All | ✓ |
| F-AUTH-04 | `AuthService` (UserManager, SignInManager) | BE | All | ✓ |
| F-AUTH-05 | `POST /api/auth/register` | BE | All | ✓ |
| F-AUTH-06 | `POST /api/auth/login` | BE | All | ✓ |
| F-AUTH-07 | `POST /api/auth/refresh-token` | BE | All | ✓ |
| F-AUTH-08 | `POST /api/auth/logout` | BE | All | ✓ |
| F-AUTH-09 | `GET /api/auth/me` | BE | All | ✓ |
| F-AUTH-10 | FluentValidation Register / Login | BE | All | ✓ |
| F-AUTH-11 | JwtBearer + Swagger Bearer | BE | System | ✓ |
| F-AUTH-12 | `[Authorize(Roles = …)]` Admin / Teacher / Student | BE | System | ✓ |
| F-AUTH-13 | Trang Register | FE | All | ✓ |
| F-AUTH-14 | Trang Login | FE | All | ✓ |
| F-AUTH-15 | Axios interceptor `Authorization: Bearer` | FE | All | ✓ |
| F-AUTH-16 | Lưu accessToken (+ refreshToken) | FE | All | ✓ |
| F-AUTH-17 | Protected routes theo role | FE | All | ✓ |
| F-AUTH-18 | Gán role mặc định khi đăng ký (Student) | BE | All | ✓ |

- [ ] F-AUTH-01 AddIdentity
- [ ] F-AUTH-02 JwtTokenService
- [ ] F-AUTH-03 Refresh token logic
- [ ] F-AUTH-04 AuthService
- [ ] F-AUTH-05 Register API
- [ ] F-AUTH-06 Login API
- [ ] F-AUTH-07 Refresh API
- [ ] F-AUTH-08 Logout API
- [ ] F-AUTH-09 Me API
- [ ] F-AUTH-10 Validation
- [ ] F-AUTH-11 JwtBearer + Swagger
- [ ] F-AUTH-12 Role policies
- [ ] F-AUTH-13 FE Register
- [ ] F-AUTH-14 FE Login
- [ ] F-AUTH-15 FE Axios interceptor
- [ ] F-AUTH-16 FE Token storage
- [ ] F-AUTH-17 FE Protected routes
- [ ] F-AUTH-18 Default role on register

---

## 3. User Management

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-USER-01 | `GET /api/users` — danh sách (Admin) | BE | Admin | |
| F-USER-02 | `GET /api/users/{id}` — chi tiết | BE | Admin | |
| F-USER-03 | `PUT /api/users/{id}` — cập nhật profile | BE | All | |
| F-USER-04 | `PATCH /api/users/{id}/lock` | BE | Admin | |
| F-USER-05 | `PATCH /api/users/{id}/unlock` | BE | Admin | |
| F-USER-06 | Gán / đổi role (Admin) | BE | Admin | |
| F-USER-07 | Trang quản lý user (Admin) | FE | Admin | |
| F-USER-08 | Trang profile cá nhân | FE | All | |
| F-USER-09 | Upload / cập nhật avatar | BE/FE | All | |
| F-USER-10 | Khóa tài khoản qua Identity lockout | BE | Admin | |

- [ ] F-USER-01 List users
- [ ] F-USER-02 User detail
- [ ] F-USER-03 Update profile
- [ ] F-USER-04 Lock user
- [ ] F-USER-05 Unlock user
- [ ] F-USER-06 Assign role
- [ ] F-USER-07 Admin user UI
- [ ] F-USER-08 Profile page
- [ ] F-USER-09 Avatar
- [ ] F-USER-10 Lockout

---

## 4. Classroom Management

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-CLS-01 | `POST /api/classrooms` — tạo lớp | BE | Teacher | ✓ |
| F-CLS-02 | `GET /api/classrooms` — danh sách lớp của user | BE | All | ✓ |
| F-CLS-03 | `GET /api/classrooms/{id}` — chi tiết lớp | BE | All | ✓ |
| F-CLS-04 | `PUT /api/classrooms/{id}` — sửa lớp | BE | Teacher | |
| F-CLS-05 | `DELETE /api/classrooms/{id}` — xóa lớp | BE | Teacher | |
| F-CLS-06 | Sinh mã `JoinCode` khi tạo lớp | BE | Teacher | ✓ |
| F-CLS-07 | `POST /api/classrooms/join` — tham gia bằng mã | BE | Student | ✓ |
| F-CLS-08 | `GET /api/classrooms/{id}/members` | BE | Teacher | ✓ |
| F-CLS-09 | `DELETE /api/classrooms/{id}/members/{studentId}` | BE | Teacher | |
| F-CLS-10 | Trang danh sách lớp | FE | All | ✓ |
| F-CLS-11 | Form tạo lớp | FE | Teacher | ✓ |
| F-CLS-12 | Form nhập mã tham gia | FE | Student | ✓ |
| F-CLS-13 | Trang chi tiết lớp + thành viên | FE | All | |
| F-CLS-14 | Đăng thông báo trong lớp (optional MVP+) | BE/FE | Teacher | |

- [ ] F-CLS-01 Create classroom
- [ ] F-CLS-02 List classrooms
- [ ] F-CLS-03 Classroom detail
- [ ] F-CLS-04 Update classroom
- [ ] F-CLS-05 Delete classroom
- [ ] F-CLS-06 JoinCode generation
- [ ] F-CLS-07 Join by code
- [ ] F-CLS-08 List members
- [ ] F-CLS-09 Remove member
- [ ] F-CLS-10 FE list page
- [ ] F-CLS-11 FE create form
- [ ] F-CLS-12 FE join form
- [ ] F-CLS-13 FE detail page
- [ ] F-CLS-14 Class announcement

---

## 5. Assignment Management

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-ASG-01 | Entity `Assignment`, `Submission`, `SubmissionFile` | DB | System | |
| F-ASG-02 | Migration assignment tables | DB | System | |
| F-ASG-03 | `POST /api/classrooms/{id}/assignments` — tạo bài tập | BE | Teacher | |
| F-ASG-04 | `GET /api/classrooms/{id}/assignments` | BE | All | |
| F-ASG-05 | `GET /api/assignments/{id}` | BE | All | |
| F-ASG-06 | `PUT /api/assignments/{id}` | BE | Teacher | |
| F-ASG-07 | `DELETE /api/assignments/{id}` | BE | Teacher | |
| F-ASG-08 | Đặt deadline bài tập | BE | Teacher | |
| F-ASG-09 | `POST /api/assignments/{id}/submit` — nộp bài | BE | Student | |
| F-ASG-10 | `GET /api/assignments/{id}/submissions` | BE | Teacher | |
| F-ASG-11 | `POST /api/submissions/{id}/grade` — chấm điểm | BE | Teacher | |
| F-ASG-12 | FE danh sách bài tập theo lớp | FE | All | |
| F-ASG-13 | FE form tạo bài tập | FE | Teacher | |
| F-ASG-14 | FE form nộp bài (+ file đính kèm) | FE | Student | |
| F-ASG-15 | FE form chấm điểm / nhận xét | FE | Teacher | |
| F-ASG-16 | FE xem điểm & feedback (Student) | FE | Student | |

- [ ] F-ASG-01 Entities
- [ ] F-ASG-02 Migration
- [ ] F-ASG-03 Create assignment
- [ ] F-ASG-04 List by classroom
- [ ] F-ASG-05 Assignment detail
- [ ] F-ASG-06 Update assignment
- [ ] F-ASG-07 Delete assignment
- [ ] F-ASG-08 Deadline
- [ ] F-ASG-09 Submit
- [ ] F-ASG-10 List submissions
- [ ] F-ASG-11 Grade
- [ ] F-ASG-12 FE list
- [ ] F-ASG-13 FE create
- [ ] F-ASG-14 FE submit
- [ ] F-ASG-15 FE grade
- [ ] F-ASG-16 FE view result

---

## 6. Exam Management

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-EXM-01 | Entity `Exam`, `ExamSetting`, `Question`, `Answer` | DB | System | ✓ |
| F-EXM-02 | Migration exam tables | DB | System | ✓ |
| F-EXM-03 | `POST /api/classrooms/{id}/exams` — tạo đề | BE | Teacher | ✓ |
| F-EXM-04 | `GET /api/classrooms/{id}/exams` | BE | All | ✓ |
| F-EXM-05 | `GET /api/exams/{id}` | BE | All | ✓ |
| F-EXM-06 | `PUT /api/exams/{id}` | BE | Teacher | |
| F-EXM-07 | `DELETE /api/exams/{id}` | BE | Teacher | |
| F-EXM-08 | `POST /api/exams/{id}/publish` | BE | Teacher | ✓ |
| F-EXM-09 | `POST /api/exams/{id}/questions` | BE | Teacher | ✓ |
| F-EXM-10 | `PUT /api/questions/{id}` | BE | Teacher | |
| F-EXM-11 | `DELETE /api/questions/{id}` | BE | Teacher | |
| F-EXM-12 | `POST /api/questions/{id}/answers` | BE | Teacher | ✓ |
| F-EXM-13 | Cấu hình thời gian làm bài / mở–đóng đề | BE | Teacher | ✓ |
| F-EXM-14 | Cấu hình random câu hỏi / đáp án | BE | Teacher | ✓ |
| F-EXM-15 | Loại câu hỏi: Single / Multiple / T-F / Short | BE | Teacher | |
| F-EXM-16 | Bật/tắt anti-cheat trên đề | BE | Teacher | ✓ |
| F-EXM-17 | FE UI tạo & quản lý đề thi | FE | Teacher | ✓ |
| F-EXM-18 | FE UI quản lý câu hỏi & đáp án | FE | Teacher | ✓ |

- [ ] F-EXM-01 Entities
- [ ] F-EXM-02 Migration
- [ ] F-EXM-03 Create exam
- [ ] F-EXM-04 List exams
- [ ] F-EXM-05 Exam detail
- [ ] F-EXM-06 Update exam
- [ ] F-EXM-07 Delete exam
- [ ] F-EXM-08 Publish
- [ ] F-EXM-09 Add question
- [ ] F-EXM-10 Update question
- [ ] F-EXM-11 Delete question
- [ ] F-EXM-12 Add answers
- [ ] F-EXM-13 Time settings
- [ ] F-EXM-14 Random settings
- [ ] F-EXM-15 Question types
- [ ] F-EXM-16 Anti-cheat toggle
- [ ] F-EXM-17 FE exam builder
- [ ] F-EXM-18 FE question editor

---

## 7. Online Testing / Exam Attempt

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-ATT-01 | Entity `ExamAttempt`, `StudentAnswer` | DB | System | ✓ |
| F-ATT-02 | Migration attempt tables | DB | System | ✓ |
| F-ATT-03 | `POST /api/exams/{id}/start` | BE | Student | ✓ |
| F-ATT-04 | Random câu hỏi / đáp án khi start | BE | System | ✓ |
| F-ATT-05 | `GET /api/attempts/{id}` | BE | Student | ✓ |
| F-ATT-06 | `POST /api/attempts/{id}/answers` — lưu từng câu | BE | Student | ✓ |
| F-ATT-07 | `POST /api/attempts/{id}/submit` | BE | Student | ✓ |
| F-ATT-08 | Chấm điểm tự động (trắc nghiệm) | BE | System | ✓ |
| F-ATT-09 | `GET /api/attempts/{id}/result` | BE | Student | ✓ |
| F-ATT-10 | `GET /api/exams/{id}/attempts` (Teacher) | BE | Teacher | |
| F-ATT-11 | Trạng thái: InProgress → Submitted | BE | System | ✓ |
| F-ATT-12 | FE màn hình làm bài | FE | Student | ✓ |
| F-ATT-13 | FE countdown timer | FE | Student | ✓ |
| F-ATT-14 | FE autosave đáp án | FE | Student | |
| F-ATT-15 | FE auto submit khi hết giờ | FE | Student | ✓ |
| F-ATT-16 | FE xem kết quả sau nộp | FE | Student | ✓ |

- [ ] F-ATT-01 Entities
- [ ] F-ATT-02 Migration
- [ ] F-ATT-03 Start exam
- [ ] F-ATT-04 Random on start
- [ ] F-ATT-05 Get attempt
- [ ] F-ATT-06 Save answer
- [ ] F-ATT-07 Submit
- [ ] F-ATT-08 Auto grading
- [ ] F-ATT-09 Result API
- [ ] F-ATT-10 List attempts (Teacher)
- [ ] F-ATT-11 Attempt status
- [ ] F-ATT-12 FE exam screen
- [ ] F-ATT-13 FE timer
- [ ] F-ATT-14 FE autosave
- [ ] F-ATT-15 FE auto submit
- [ ] F-ATT-16 FE result view

---

## 8. Anti-cheat Monitoring

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-AC-01 | Entity `CheatingLog` | DB | System | ✓ |
| F-AC-02 | Migration cheating tables | DB | System | ✓ |
| F-AC-03 | `POST /api/anti-cheat/logs` | BE | Student | ✓ |
| F-AC-04 | `GET /api/anti-cheat/attempts/{id}/logs` | BE | Teacher | ✓ |
| F-AC-05 | `GET /api/anti-cheat/attempts/{id}/score` — suspicion score | BE | Teacher | ✓ |
| F-AC-06 | `GET /api/anti-cheat/exams/{id}/summary` | BE | Teacher | |
| F-AC-07 | FE detect chuyển tab (`visibilitychange`) | FE | Student | ✓ |
| F-AC-08 | FE detect copy / paste | FE | Student | |
| F-AC-09 | FE detect thoát fullscreen | FE | Student | ✓ |
| F-AC-10 | FE detect reload / mất kết nối cơ bản | FE | Student | |
| F-AC-11 | Tính Suspicion Score từ log | BE | System | ✓ |
| F-AC-12 | FE dashboard anti-cheat (Teacher) | FE | Teacher | ✓ |
| F-AC-13 | Ghi log: TAB_SWITCH, FULLSCREEN_EXIT, … | BE | System | ✓ |
| F-AC-14 | Liên kết log với `ExamAttempt` | BE | System | ✓ |

- [ ] F-AC-01 CheatingLog entity
- [ ] F-AC-02 Migration
- [ ] F-AC-03 Create log API
- [ ] F-AC-04 Logs by attempt
- [ ] F-AC-05 Suspicion score API
- [ ] F-AC-06 Exam summary API
- [ ] F-AC-07 FE tab switch
- [ ] F-AC-08 FE copy/paste
- [ ] F-AC-09 FE fullscreen
- [ ] F-AC-10 FE reload/offline
- [ ] F-AC-11 Score calculation
- [ ] F-AC-12 FE teacher dashboard
- [ ] F-AC-13 Log types
- [ ] F-AC-14 Attempt linkage

---

## 9. Notification System

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-NOT-01 | Entity `Notification` | DB | System | |
| F-NOT-02 | `GET /api/notifications` | BE | All | |
| F-NOT-03 | `PATCH /api/notifications/{id}/read` | BE | All | |
| F-NOT-04 | `PATCH /api/notifications/read-all` | BE | All | |
| F-NOT-05 | Thông báo deadline bài tập | BE | Student | |
| F-NOT-06 | Thông báo điểm / kết quả thi | BE | Student | |
| F-NOT-07 | FE danh sách thông báo + badge unread | FE | All | |
| F-NOT-08 | FE toast / popup realtime (kết hợp SignalR) | FE | All | |

- [ ] F-NOT-01 Notification entity
- [ ] F-NOT-02 List notifications
- [ ] F-NOT-03 Mark read
- [ ] F-NOT-04 Mark all read
- [ ] F-NOT-05 Deadline notify
- [ ] F-NOT-06 Grade notify
- [ ] F-NOT-07 FE notification list
- [ ] F-NOT-08 FE realtime toast

---

## 10. Dashboard & Reporting

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-DASH-01 | `GET /api/dashboard/admin` | BE | Admin | |
| F-DASH-02 | `GET /api/dashboard/teacher` | BE | Teacher | |
| F-DASH-03 | `GET /api/dashboard/student` | BE | Student | |
| F-DASH-04 | Thống kê số lớp, học sinh, bài thi | BE | Teacher | |
| F-DASH-05 | Thống kê điểm / kết quả thi | BE | Teacher | |
| F-DASH-06 | Thống kê cheating / suspicion | BE | Teacher | ✓ |
| F-DASH-07 | FE dashboard Admin | FE | Admin | |
| F-DASH-08 | FE dashboard Teacher (+ biểu đồ) | FE | Teacher | |
| F-DASH-09 | FE dashboard Student | FE | Student | |
| F-DASH-10 | Export báo cáo cơ bản (CSV/PDF) — optional | BE/FE | Teacher | |

- [ ] F-DASH-01 Admin dashboard API
- [ ] F-DASH-02 Teacher dashboard API
- [ ] F-DASH-03 Student dashboard API
- [ ] F-DASH-04 Class/exam stats
- [ ] F-DASH-05 Score stats
- [ ] F-DASH-06 Cheating stats
- [ ] F-DASH-07 FE Admin
- [ ] F-DASH-08 FE Teacher
- [ ] F-DASH-09 FE Student
- [ ] F-DASH-10 Export report

---

## 11. SignalR Realtime

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-SR-01 | `NotificationHub` (`/hubs/notifications`) | BE | System | ✓ |
| F-SR-02 | `ExamMonitoringHub` (`/hubs/exam-monitoring`) | BE | System | ✓ |
| F-SR-03 | FE kết nối SignalR (notifications) | FE | All | |
| F-SR-04 | FE kết nối SignalR (exam monitoring) | FE | Teacher | ✓ |
| F-SR-05 | Push notification realtime | BE | System | |
| F-SR-06 | Push anti-cheat warning realtime | BE | Teacher | ✓ |
| F-SR-07 | Event `ReceiveNotification` | BE/FE | All | |
| F-SR-08 | Event `ReceiveAntiCheatWarning` | BE/FE | Teacher | ✓ |

- [ ] F-SR-01 NotificationHub
- [ ] F-SR-02 ExamMonitoringHub
- [ ] F-SR-03 FE notification connection
- [ ] F-SR-04 FE monitoring connection
- [ ] F-SR-05 Push notification
- [ ] F-SR-06 Push anti-cheat warning
- [ ] F-SR-07 ReceiveNotification
- [ ] F-SR-08 ReceiveAntiCheatWarning

---

## 12. Redis Cache

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-REDIS-01 | Cấu hình Redis connection | Infra | System | |
| F-REDIS-02 | `RedisCacheService` | BE | System | |
| F-REDIS-03 | Cache câu hỏi đề thi | BE | System | |
| F-REDIS-04 | Cache dashboard summary | BE | System | |
| F-REDIS-05 | Heartbeat / trạng thái attempt tạm | BE | System | |
| F-REDIS-06 | Invalidation khi publish / submit | BE | System | |

- [ ] F-REDIS-01 Connection
- [ ] F-REDIS-02 Cache service
- [ ] F-REDIS-03 Cache questions
- [ ] F-REDIS-04 Cache dashboard
- [ ] F-REDIS-05 Attempt heartbeat
- [ ] F-REDIS-06 Cache invalidation

---

## 13. Logging & Activity Tracking

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-LOG-01 | Entity `ActivityLog` | DB | System | |
| F-LOG-02 | Serilog — console + file | Infra | System | |
| F-LOG-03 | Ghi login / logout activity | BE | System | |
| F-LOG-04 | Ghi API activity quan trọng | BE | System | |
| F-LOG-05 | Admin xem activity log | BE/FE | Admin | |
| F-LOG-06 | Exception handling middleware | BE | System | |

- [ ] F-LOG-01 ActivityLog entity
- [ ] F-LOG-02 Serilog
- [ ] F-LOG-03 Auth activity
- [ ] F-LOG-04 API activity
- [ ] F-LOG-05 Admin activity UI
- [ ] F-LOG-06 Exception middleware

---

## 14. Docker & Deployment

| ID | Feature | Layer | Role | MVP |
|----|---------|-------|------|-----|
| F-DOCKER-01 | `Dockerfile` backend | Infra | System | |
| F-DOCKER-02 | `Dockerfile` frontend | Infra | System | |
| F-DOCKER-03 | `docker-compose.yml` | Infra | System | |
| F-DOCKER-04 | Container SQL Server | Infra | System | |
| F-DOCKER-05 | Container Redis | Infra | System | |
| F-DOCKER-06 | Container backend + frontend | Infra | System | |
| F-DOCKER-07 | `docker compose up` end-to-end | Infra | System | |
| F-DOCKER-08 | Env / secrets không commit (JWT key, connection) | Infra | System | |

- [ ] F-DOCKER-01 Backend Dockerfile
- [ ] F-DOCKER-02 Frontend Dockerfile
- [ ] F-DOCKER-03 docker-compose
- [ ] F-DOCKER-04 SQL Server container
- [ ] F-DOCKER-05 Redis container
- [ ] F-DOCKER-06 App containers
- [ ] F-DOCKER-07 E2E compose test
- [ ] F-DOCKER-08 Secrets hygiene

---

## 15. Ngoài MVP (hướng phát triển)

| ID | Feature | Ghi chú |
|----|---------|---------|
| F-FUT-01 | AI Proctoring | Camera / ML |
| F-FUT-02 | Facial Recognition | Nhận diện khuôn mặt |
| F-FUT-03 | AI Auto Grading | Tự luận / short answer |
| F-FUT-04 | Mobile App | React Native / Flutter |
| F-FUT-05 | Multi-school Management | Nhiều trường / tenant |
| F-FUT-06 | Advanced Learning Analytics | Học tập nâng cao |
| F-FUT-07 | Cloud Deployment | Azure / AWS / VPS |

- [ ] F-FUT-01 AI Proctoring
- [ ] F-FUT-02 Facial Recognition
- [ ] F-FUT-03 AI Auto Grading
- [ ] F-FUT-04 Mobile App
- [ ] F-FUT-05 Multi-school
- [ ] F-FUT-06 Analytics
- [ ] F-FUT-07 Cloud deploy

---

## Thứ tự triển khai đề xuất (MVP)

```txt
0 → 1 → 2 → 4 → 6 → 7 → 8 → 11 → 10 (anti-cheat dashboard) → 5 → 9 → 12 → 13 → 14
```

Chi tiết theo giai đoạn: xem [`../Todo List.md`](../Todo%20List.md).

---

## Thống kê tiến độ (cập nhật thủ công)

| Trạng thái | Số lượng |
|------------|----------|
| Tổng feature (MVP + mở rộng, không tính F-FUT) | ~168 |
| Đã hoàn thành `[x]` | 3 (F-000-01, 02, 03) |
| Đang làm | — |
| Chưa bắt đầu | ~165 |

*Cập nhật bảng trên khi tick checkbox trong file này.*
