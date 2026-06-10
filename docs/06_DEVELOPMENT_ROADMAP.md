# 06. Lộ trình triển khai EduGuard

## 1. Mục tiêu tài liệu

Tài liệu này đề xuất lộ trình triển khai hệ thống EduGuard theo từng giai đoạn, giúp tránh bị quá tải khi bắt đầu code.

Hệ thống có nhiều chức năng, vì vậy không nên làm tất cả cùng lúc. Nên chia thành các giai đoạn MVP.

## 2. Nguyên tắc triển khai

Nên triển khai theo thứ tự:

```txt
Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được
```

Không nên bắt đầu ngay bằng Redis, SignalR, Docker hoặc anti-cheat phức tạp khi Auth và CRUD cơ bản chưa ổn.

## 3. Giai đoạn 0: Khởi tạo project

Mục tiêu:

- Tạo repo.
- Tạo backend bằng Visual Studio.
- Tạo frontend bằng Vite React.
- Cấu hình kết nối frontend/backend.
- Chạy thử API test.

**Trạng thái:** ✅ Hoàn thành (2026-06-10) — React `localhost:5173` gọi `GET /api/Test` trên backend HTTPS `7168`, hiển thị JSON.

Checklist:

```txt
[x] Tạo repo EduGuard
[x] Tạo folder backend
[x] Tạo solution EduGuard.slnx
[x] Tạo 4 project backend
[x] Tạo folder frontend
[x] Tạo React Vite project
[x] Cấu hình TailwindCSS (deps + index.css)
[x] Cấu hình Swagger
[x] Cấu hình CORS
[x] Tạo TestController
[x] React gọi thử GET /api/test
```

Kết quả cần đạt:

```txt
Frontend gọi được backend thành công. — Đạt.
```

## 4. Giai đoạn 1: Database + Entity nền tảng

Mục tiêu:

- Tạo entity cơ bản.
- Tạo AppDbContext.
- Tạo migration.
- Tạo database (dev: `EduGuardExam` trên SQL Server local).

Entity nên làm trước:

```txt
ApplicationUser (IdentityUser<int>)
RefreshToken
Classroom
ClassroomMember
```

Checklist:

```txt
[x] Tạo ApplicationUser kế thừa IdentityUser<int>
[x] Tạo entity RefreshToken
[x] Tạo entity Classroom
[x] Tạo entity ClassroomMember
[x] AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
[x] Seed roles Admin, Teacher, Student
[x] Cấu hình SQL Server connection string (DefaultConnection)
[x] Add-Migration InitialIdentityAndClassroom
[x] Update-Database
```

Kết quả cần đạt:

```txt
SQL Server có database và các bảng cơ bản. — Đạt (2026-06-10, DB EduGuardExam).
```

## 5. Giai đoạn 2: Authentication & Authorization

Mục tiêu:

- Đăng ký / đăng nhập qua ASP.NET Core Identity.
- JWT Bearer cho SPA React.
- Role-based Authorization.

Checklist:

```txt
[ ] AddIdentity + AddEntityFrameworkStores
[ ] JwtTokenService (IJwtTokenService)
[ ] AuthService (UserManager, SignInManager)
[ ] AuthController: register, login, refresh, me
[ ] RegisterRequest, LoginRequest, LoginResponse, UserDto
[ ] FluentValidation Register/Login
[ ] JwtBearer + Swagger Bearer
[ ] Test Swagger đăng ký / đăng nhập
[ ] React login gọi API thành công
[ ] Lưu accessToken ở frontend
[ ] Bảo vệ route frontend
```

*(Không dùng UserRepository hay hash password thủ công.)*

Kết quả cần đạt:

```txt
User đăng ký/đăng nhập được và nhận JWT token.
```

## 6. Giai đoạn 3: Classroom Management

Mục tiêu:

- Teacher tạo lớp.
- Student tham gia lớp.
- Xem danh sách lớp.
- Xem thành viên lớp.

Checklist:

```txt
[ ] Tạo ClassroomController
[ ] Tạo ClassroomService
[ ] Tạo ClassroomRepository
[ ] Tạo CreateClassroomRequest
[ ] Tạo ClassroomDto
[ ] API tạo lớp
[ ] API lấy danh sách lớp
[ ] API join lớp bằng mã
[ ] API xem thành viên lớp
[ ] Frontend trang danh sách lớp
[ ] Frontend form tạo lớp
[ ] Frontend form nhập mã lớp
```

Kết quả cần đạt:

```txt
Teacher tạo được lớp, Student tham gia được lớp.
```

## 7. Giai đoạn 4: Assignment Management

Mục tiêu:

- Teacher tạo bài tập.
- Student nộp bài.
- Teacher chấm điểm.

Checklist:

```txt
[ ] Tạo Assignment entity
[ ] Tạo Submission entity
[ ] Tạo AssignmentController
[ ] Tạo AssignmentService
[ ] Tạo AssignmentRepository
[ ] API tạo bài tập
[ ] API xem bài tập theo lớp
[ ] API nộp bài
[ ] API chấm điểm
[ ] Frontend danh sách bài tập
[ ] Frontend tạo bài tập
[ ] Frontend nộp bài
[ ] Frontend chấm bài
```

Kết quả cần đạt:

```txt
Luồng giao bài tập và nộp bài chạy được.
```

## 8. Giai đoạn 5: Exam Management

Mục tiêu:

- Teacher tạo đề thi.
- Thêm câu hỏi.
- Thêm đáp án.
- Cấu hình thời gian.
- Cấu hình random.

Entity cần có:

```txt
Exam
ExamSetting
Question
Answer
```

Checklist:

```txt
[ ] Tạo Exam entity
[ ] Tạo ExamSetting entity
[ ] Tạo Question entity
[ ] Tạo Answer entity
[ ] Tạo ExamController
[ ] Tạo ExamService
[ ] Tạo ExamRepository
[ ] API tạo đề thi
[ ] API thêm câu hỏi
[ ] API thêm đáp án
[ ] API publish đề thi
[ ] Frontend tạo đề thi
[ ] Frontend quản lý câu hỏi
```

Kết quả cần đạt:

```txt
Teacher tạo được đề thi hoàn chỉnh.
```

## 9. Giai đoạn 6: Online Testing / Exam Attempt

Mục tiêu:

- Student bắt đầu thi.
- Backend random câu hỏi/đáp án.
- Frontend hiển thị đề.
- Lưu câu trả lời.
- Nộp bài.
- Chấm điểm tự động.

Entity cần có:

```txt
ExamAttempt
StudentAnswer
```

Checklist:

```txt
[ ] API start exam
[ ] API lấy câu hỏi đã random
[ ] API lưu đáp án
[ ] API submit bài
[ ] Logic chấm điểm tự động
[ ] Tính tổng điểm
[ ] Lưu trạng thái Submitted
[ ] Frontend màn hình làm bài
[ ] Frontend countdown timer
[ ] Frontend auto submit khi hết giờ
```

Kết quả cần đạt:

```txt
Student làm bài thi online và nhận kết quả.
```

## 10. Giai đoạn 7: Anti-cheat Monitoring

Mục tiêu:

- Frontend phát hiện hành vi bất thường.
- Backend ghi log.
- Tính Suspicion Score.
- Teacher xem dashboard anti-cheat.

Entity cần có:

```txt
CheatingLog
```

Checklist:

```txt
[ ] Tạo CheatingLog entity
[ ] Tạo AntiCheatController
[ ] Tạo AntiCheatService
[ ] Tạo CheatingLogRepository
[ ] API ghi log anti-cheat
[ ] API xem log theo attempt
[ ] API xem suspicion score
[ ] Frontend bắt sự kiện chuyển tab
[ ] Frontend bắt sự kiện copy/paste
[ ] Frontend bắt sự kiện fullscreen
[ ] Frontend bắt reload/mất kết nối cơ bản
[ ] Dashboard anti-cheat cho teacher
```

Kết quả cần đạt:

```txt
Hệ thống ghi nhận hành vi bất thường và tính điểm nghi ngờ.
```

## 11. Giai đoạn 8: SignalR Realtime

Mục tiêu:

- Realtime notification.
- Realtime anti-cheat warning.
- Live activity monitoring.

Checklist:

```txt
[ ] Tạo NotificationHub
[ ] Tạo ExamMonitoringHub
[ ] Frontend kết nối SignalR
[ ] Backend gửi notification
[ ] Backend gửi anti-cheat warning
[ ] Teacher dashboard nhận cảnh báo realtime
```

Kết quả cần đạt:

```txt
Khi student có hành vi bất thường, teacher thấy cảnh báo ngay.
```

## 12. Giai đoạn 9: Redis

Mục tiêu:

- Cache dữ liệu cần thiết.
- Hỗ trợ performance.
- Hỗ trợ trạng thái thi tạm thời.

Use case Redis:

```txt
Cache đề thi
Cache dashboard
Heartbeat anti-cheat
Lưu trạng thái phiên thi tạm thời
SignalR backplane nếu scale nhiều instance
```

Checklist:

```txt
[ ] Cài StackExchange.Redis
[ ] Cấu hình Redis connection string
[ ] Tạo RedisCacheService
[ ] Cache exam questions
[ ] Cache dashboard summary
[ ] Lưu heartbeat attempt
```

Kết quả cần đạt:

```txt
Redis được sử dụng đúng mục đích, không chỉ đưa vào cho có.
```

## 13. Giai đoạn 10: Dashboard & Reporting

Mục tiêu:

- Dashboard cho Admin.
- Dashboard cho Teacher.
- Dashboard cho Student.

Checklist:

```txt
[ ] API dashboard admin
[ ] API dashboard teacher
[ ] API dashboard student
[ ] Thống kê số lớp
[ ] Thống kê số học sinh
[ ] Thống kê bài tập
[ ] Thống kê điểm thi
[ ] Thống kê cheating score
[ ] Frontend biểu đồ dashboard
```

Kết quả cần đạt:

```txt
Người dùng có trang tổng quan dữ liệu.
```

## 14. Giai đoạn 11: Docker Compose

Mục tiêu:

- Containerize toàn bộ hệ thống.

Checklist:

```txt
[ ] Dockerfile backend
[ ] Dockerfile frontend
[ ] docker-compose.yml
[ ] Container SQL Server
[ ] Container Redis
[ ] Container backend
[ ] Container frontend
[ ] Test chạy bằng docker compose up
```

Kết quả cần đạt:

```txt
Hệ thống có thể chạy bằng Docker Compose.
```

## 15. Thứ tự ưu tiên MVP ngắn gọn

Nếu thời gian gấp, làm theo thứ tự:

```txt
1. Auth Identity + JWT
2. Classroom
3. Exam CRUD
4. Start Exam
5. Submit Exam
6. Anti-cheat log
7. Dashboard anti-cheat cơ bản
8. SignalR warning
9. Redis cache
10. Docker Compose
```

## 16. Những phần có thể để hướng phát triển

Nếu chưa đủ thời gian, có thể đưa vào hướng phát triển:

```txt
AI Proctoring
Facial Recognition
AI Auto Grading
Mobile App
Multi-school Management
Advanced Learning Analytics
Cloud Deployment
```

## 17. Kết luận

EduGuard nên được triển khai theo hướng tăng dần:

```txt
Core system → Exam system → Anti-cheat system → Realtime → Optimization → Deployment
```

Cách này giúp dự án dễ hoàn thành, dễ kiểm thử và dễ trình bày trong báo cáo.

