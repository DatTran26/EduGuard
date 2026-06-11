# EduGuard — Danh sách API (apiList)

> **Mục đích:** Registry toàn bộ REST endpoint + SignalR hub — tick khi đã implement và test.  
> **Liên quan:** `05_API_FRONTEND_INTEGRATION.md` (Axios, JWT, luồng FE) · [`features.md`](features.md) · [`../Todo List.md`](../Todo%20List.md)  
> **Cập nhật:** 2026-06-11 · **Branch:** `release` @ `749f7ed`

---

## Quy ước

### Base URL

| Môi trường | REST | SignalR |
|------------|------|---------|
| Local (HTTPS) | `https://localhost:7168/api` | `https://localhost:7168/hubs` |
| Local (HTTP) | `http://localhost:5157/api` | `http://localhost:5157/hubs` |

Frontend `.env`: `VITE_API_BASE_URL`, `VITE_SIGNALR_URL` — xem `05_API_FRONTEND_INTEGRATION.md`.

### Auth header

```txt
Authorization: Bearer <accessToken>
```

SPA React dùng JWT Bearer — **không** dùng cookie Identity.

### Response envelope (đề xuất)

```json
{ "success": true, "message": "...", "data": { } }
```

Lỗi: `{ "success": false, "message": "...", "errors": [] }`

### Cột bảng

| Cột | Ý nghĩa |
|-----|---------|
| **Auth** | `No` · `Bearer` · `Bearer + Role` |
| **Role** | Ai được gọi (nếu có policy) |
| **MVP** | ✓ = ưu tiên MVP |
| **Feature** | ID trong `features.md` |

Tick `- [ ]` khi endpoint **có controller + Swagger + test cơ bản**.

---

## Tổng quan

| Nhóm | Số endpoint | Đã implement |
|------|-------------|--------------|
| System / Health | 2 | 2 |
| Auth | 5 | 5 |
| Users | 5 | 0 |
| Classrooms | 8 | 4 |
| Assignments | 8 | 0 |
| Exams | 11 | 0 |
| Exam Attempts | 6 | 0 |
| Anti-cheat | 4 | 0 |
| Notifications | 3 | 0 |
| Dashboard | 3 | 0 |
| SignalR Hubs | 2 | 0 |
| **Tổng** | **57** | **11** |

---

## 1. System / Health

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-SYS-01 | GET | `/WeatherForecast` | No | — | | — | Template ASP.NET (legacy, bỏ sau Phase 0) |
| API-SYS-02 | GET | `/api/test` | No | — | ✓ | F-000-07 | Smoke test FE ↔ BE |

- [x] API-SYS-01 GET `/WeatherForecast` *(template có sẵn)*
- [x] API-SYS-02 GET `/api/test`

---

## 2. Authentication

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-AUTH-01 | POST | `/api/auth/register` | No | All | ✓ | F-AUTH-05 | Đăng ký tài khoản |
| API-AUTH-02 | POST | `/api/auth/login` | No | All | ✓ | F-AUTH-06 | Đăng nhập → access + refresh token |
| API-AUTH-03 | POST | `/api/auth/refresh-token` | No* | All | ✓ | F-AUTH-07 | Làm mới access token (*body refresh token) |
| API-AUTH-04 | POST | `/api/auth/logout` | Bearer | All | ✓ | F-AUTH-08 | Thu hồi refresh token |
| API-AUTH-05 | GET | `/api/auth/me` | Bearer | All | ✓ | F-AUTH-09 | Profile + roles user hiện tại |

**Body mẫu — register**

```json
{ "fullName": "Nguyen Van A", "email": "student@gmail.com", "password": "12345678" }
```

**Body mẫu — login**

```json
{ "email": "student@gmail.com", "password": "12345678" }
```

- [x] API-AUTH-01 Register
- [x] API-AUTH-02 Login
- [x] API-AUTH-03 Refresh token
- [x] API-AUTH-04 Logout
- [x] API-AUTH-05 Me

---

## 3. Users (Admin / Profile)

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-USER-01 | GET | `/api/users` | Bearer | Admin | | F-USER-01 | Danh sách user (phân trang) |
| API-USER-02 | GET | `/api/users/{id}` | Bearer | Admin | | F-USER-02 | Chi tiết user |
| API-USER-03 | PUT | `/api/users/{id}` | Bearer | All† | | F-USER-03 | Cập nhật profile († owner hoặc Admin) |
| API-USER-04 | PATCH | `/api/users/{id}/lock` | Bearer | Admin | | F-USER-04 | Khóa tài khoản |
| API-USER-05 | PATCH | `/api/users/{id}/unlock` | Bearer | Admin | | F-USER-05 | Mở khóa tài khoản |

- [ ] API-USER-01 List users
- [ ] API-USER-02 Get user
- [ ] API-USER-03 Update user
- [ ] API-USER-04 Lock user
- [ ] API-USER-05 Unlock user

---

## 4. Classrooms

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-CLS-01 | GET | `/api/classrooms` | Bearer | All | ✓ | F-CLS-02 | Lớp của user (teacher/student) |
| API-CLS-02 | GET | `/api/classrooms/{id}` | Bearer | All | ✓ | F-CLS-03 | Chi tiết lớp |
| API-CLS-03 | POST | `/api/classrooms` | Bearer | Teacher | ✓ | F-CLS-01 | Tạo lớp (+ JoinCode) |
| API-CLS-04 | PUT | `/api/classrooms/{id}` | Bearer | Teacher | | F-CLS-04 | Sửa tên/mô tả |
| API-CLS-05 | DELETE | `/api/classrooms/{id}` | Bearer | Teacher | | F-CLS-05 | Xóa lớp |
| API-CLS-06 | POST | `/api/classrooms/join` | Bearer | Student | ✓ | F-CLS-07 | Tham gia bằng mã |
| API-CLS-07 | GET | `/api/classrooms/{id}/members` | Bearer | Teacher | ✓ | F-CLS-08 | Danh sách thành viên |
| API-CLS-08 | DELETE | `/api/classrooms/{id}/members/{studentId}` | Bearer | Teacher | | F-CLS-09 | Xóa học sinh khỏi lớp |

**Body join**

```json
{ "joinCode": "A1B2C3" }
```

- [x] API-CLS-01 List classrooms
- [ ] API-CLS-02 Get classroom *(deferred — chưa có action trong `ClassroomsController`)*
- [x] API-CLS-03 Create classroom
- [ ] API-CLS-04 Update classroom
- [ ] API-CLS-05 Delete classroom
- [x] API-CLS-06 Join classroom
- [x] API-CLS-07 List members
- [ ] API-CLS-08 Remove member

---

## 5. Assignments

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-ASG-01 | GET | `/api/classrooms/{classroomId}/assignments` | Bearer | All | | F-ASG-04 | Bài tập theo lớp |
| API-ASG-02 | GET | `/api/assignments/{id}` | Bearer | All | | F-ASG-05 | Chi tiết bài tập |
| API-ASG-03 | POST | `/api/classrooms/{classroomId}/assignments` | Bearer | Teacher | | F-ASG-03 | Tạo bài tập |
| API-ASG-04 | PUT | `/api/assignments/{id}` | Bearer | Teacher | | F-ASG-06 | Sửa bài tập |
| API-ASG-05 | DELETE | `/api/assignments/{id}` | Bearer | Teacher | | F-ASG-07 | Xóa bài tập |
| API-ASG-06 | POST | `/api/assignments/{id}/submit` | Bearer | Student | | F-ASG-09 | Nộp bài |
| API-ASG-07 | GET | `/api/assignments/{id}/submissions` | Bearer | Teacher | | F-ASG-10 | Danh sách bài nộp |
| API-ASG-08 | POST | `/api/submissions/{id}/grade` | Bearer | Teacher | | F-ASG-11 | Chấm điểm / nhận xét |

- [ ] API-ASG-01 List by classroom
- [ ] API-ASG-02 Get assignment
- [ ] API-ASG-03 Create assignment
- [ ] API-ASG-04 Update assignment
- [ ] API-ASG-05 Delete assignment
- [ ] API-ASG-06 Submit assignment
- [ ] API-ASG-07 List submissions
- [ ] API-ASG-08 Grade submission

---

## 6. Exams (CRUD & ngân hàng câu hỏi)

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-EXM-01 | GET | `/api/classrooms/{classroomId}/exams` | Bearer | All | ✓ | F-EXM-04 | Đề thi theo lớp |
| API-EXM-02 | GET | `/api/exams/{id}` | Bearer | All | ✓ | F-EXM-05 | Chi tiết đề |
| API-EXM-03 | POST | `/api/classrooms/{classroomId}/exams` | Bearer | Teacher | ✓ | F-EXM-03 | Tạo đề thi |
| API-EXM-04 | PUT | `/api/exams/{id}` | Bearer | Teacher | | F-EXM-06 | Sửa đề |
| API-EXM-05 | DELETE | `/api/exams/{id}` | Bearer | Teacher | | F-EXM-07 | Xóa đề |
| API-EXM-06 | POST | `/api/exams/{id}/publish` | Bearer | Teacher | ✓ | F-EXM-08 | Publish — học sinh làm được |
| API-EXM-07 | POST | `/api/exams/{id}/questions` | Bearer | Teacher | ✓ | F-EXM-09 | Thêm câu hỏi |
| API-EXM-08 | PUT | `/api/questions/{id}` | Bearer | Teacher | | F-EXM-10 | Sửa câu hỏi |
| API-EXM-09 | DELETE | `/api/questions/{id}` | Bearer | Teacher | | F-EXM-11 | Xóa câu hỏi |
| API-EXM-10 | POST | `/api/questions/{id}/answers` | Bearer | Teacher | ✓ | F-EXM-12 | Thêm đáp án |
| API-EXM-11 | PUT | `/api/answers/{id}` | Bearer | Teacher | | F-EXM-12 | Sửa đáp án *(mở rộng)* |

- [ ] API-EXM-01 List exams
- [ ] API-EXM-02 Get exam
- [ ] API-EXM-03 Create exam
- [ ] API-EXM-04 Update exam
- [ ] API-EXM-05 Delete exam
- [ ] API-EXM-06 Publish exam
- [ ] API-EXM-07 Add question
- [ ] API-EXM-08 Update question
- [ ] API-EXM-09 Delete question
- [ ] API-EXM-10 Add answer
- [ ] API-EXM-11 Update answer

---

## 7. Exam Attempts (làm bài online)

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-ATT-01 | POST | `/api/exams/{examId}/start` | Bearer | Student | ✓ | F-ATT-03 | Bắt đầu thi → attempt + đề random |
| API-ATT-02 | GET | `/api/attempts/{attemptId}` | Bearer | Student | ✓ | F-ATT-05 | Trạng thái lượt thi |
| API-ATT-03 | POST | `/api/attempts/{attemptId}/answers` | Bearer | Student | ✓ | F-ATT-06 | Lưu / cập nhật đáp án |
| API-ATT-04 | POST | `/api/attempts/{attemptId}/submit` | Bearer | Student | ✓ | F-ATT-07 | Nộp bài + chấm tự động |
| API-ATT-05 | GET | `/api/attempts/{attemptId}/result` | Bearer | Student | ✓ | F-ATT-09 | Kết quả sau nộp |
| API-ATT-06 | GET | `/api/exams/{examId}/attempts` | Bearer | Teacher | | F-ATT-10 | Tất cả lượt thi của đề |

- [ ] API-ATT-01 Start exam
- [ ] API-ATT-02 Get attempt
- [ ] API-ATT-03 Save answer
- [ ] API-ATT-04 Submit attempt
- [ ] API-ATT-05 Get result
- [ ] API-ATT-06 List attempts (teacher)

---

## 8. Anti-cheat

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-AC-01 | POST | `/api/anti-cheat/logs` | Bearer | Student | ✓ | F-AC-03 | Ghi log hành vi (tab, fullscreen, …) |
| API-AC-02 | GET | `/api/anti-cheat/attempts/{attemptId}/logs` | Bearer | Teacher | ✓ | F-AC-04 | Log theo lượt thi |
| API-AC-03 | GET | `/api/anti-cheat/attempts/{attemptId}/score` | Bearer | Teacher | ✓ | F-AC-05 | Suspicion score |
| API-AC-04 | GET | `/api/anti-cheat/exams/{examId}/summary` | Bearer | Teacher | | F-AC-06 | Tổng hợp theo đề thi |

**Body log mẫu**

```json
{
  "examAttemptId": 1,
  "type": "TAB_SWITCH",
  "description": "Học sinh chuyển tab trong khi làm bài"
}
```

- [ ] API-AC-01 Create log
- [ ] API-AC-02 Logs by attempt
- [ ] API-AC-03 Suspicion score
- [ ] API-AC-04 Exam summary

---

## 9. Notifications

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-NOT-01 | GET | `/api/notifications` | Bearer | All | | F-NOT-02 | Danh sách thông báo |
| API-NOT-02 | PATCH | `/api/notifications/{id}/read` | Bearer | All | | F-NOT-03 | Đánh dấu đã đọc |
| API-NOT-03 | PATCH | `/api/notifications/read-all` | Bearer | All | | F-NOT-04 | Đọc tất cả |

- [ ] API-NOT-01 List notifications
- [ ] API-NOT-02 Mark read
- [ ] API-NOT-03 Mark all read

---

## 10. Dashboard

| ID | Method | Path | Auth | Role | MVP | Feature | Mô tả |
|----|--------|------|------|------|-----|---------|-------|
| API-DASH-01 | GET | `/api/dashboard/admin` | Bearer | Admin | | F-DASH-01 | Thống kê hệ thống |
| API-DASH-02 | GET | `/api/dashboard/teacher` | Bearer | Teacher | | F-DASH-02 | Lớp, đề, điểm, cảnh báo |
| API-DASH-03 | GET | `/api/dashboard/student` | Bearer | Student | | F-DASH-03 | Bài tập, điểm, lịch thi |

- [ ] API-DASH-01 Admin dashboard
- [ ] API-DASH-02 Teacher dashboard
- [ ] API-DASH-03 Student dashboard

---

## 11. SignalR (Realtime)

Không phải REST — kết nối WebSocket qua `@microsoft/signalr`.

| ID | Hub path | Auth | Role | MVP | Feature | Events (server → client) |
|----|----------|------|------|-----|---------|--------------------------|
| API-SR-01 | `/hubs/notifications` | Bearer | All | | F-SR-01 | `ReceiveNotification` |
| API-SR-02 | `/hubs/exam-monitoring` | Bearer | Teacher | ✓ | F-SR-02 | `ReceiveAntiCheatWarning` |

- [ ] API-SR-01 NotificationHub
- [ ] API-SR-02 ExamMonitoringHub

---

## Controller map (dự kiến)

| Controller | Prefix | Endpoints | Trạng thái |
|------------|--------|-----------|------------|
| `TestController` | `/api/test` | SYS | ✓ |
| `AuthController` | `/api/auth` | AUTH | ✓ |
| `UsersController` | `/api/users` | USER | — |
| `ClassroomsController` | `/api/classrooms` | CLS (4/8) | một phần |
| `AssignmentsController` | `/api/assignments`, nested classroom | ASG | — |
| `ExamsController` | `/api/exams`, nested classroom | EXM, ATT (start) | — |
| `AttemptsController` | `/api/attempts` | ATT | — |
| `AntiCheatController` | `/api/anti-cheat` | AC | — |
| `NotificationsController` | `/api/notifications` | NOT | — |
| `DashboardController` | `/api/dashboard` | DASH | — |

---

## Thống kê tiến độ API

| Trạng thái | Số lượng |
|------------|----------|
| Tổng REST + Hub | 57 |
| Đã tick `[x]` | 11 |
| Còn lại | 46 |

*Backend: Auth + Classroom MVP (Phase 2–3). Frontend trên `release` dùng mock API — chưa nối các endpoint trên.*
