# 01. Mô tả tổng quan hệ thống EduGuard

## 1. Tên đề tài

**EduGuard – Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận**

## 2. Mục tiêu hệ thống

EduGuard là một nền tảng web hỗ trợ giáo viên và học sinh trong việc tổ chức học tập, giao bài tập, tạo đề thi trực tuyến, làm bài thi, chấm điểm và giám sát quá trình làm bài.

Điểm nổi bật của hệ thống không chỉ nằm ở các chức năng CRUD cơ bản, mà còn ở phần **giám sát chống gian lận** trong quá trình thi trực tuyến.

Hệ thống hướng đến mô hình:

```txt
Learning Management System
+ Online Exam System
+ Anti-cheat Monitoring
+ Realtime Notification
```

Có thể hình dung EduGuard giống sự kết hợp giữa:

```txt
Google Classroom + Azota + Online Exam Proctoring cơ bản
```

## 3. Công nghệ chính

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core Web API |
| Frontend | ReactJS |
| UI Styling | TailwindCSS |
| Database | SQL Server |
| ORM | Entity Framework Core |
| Authentication | ASP.NET Core Identity + JWT Bearer + Refresh Token |
| Authorization | Role-based Authorization |
| Realtime | SignalR |
| Cache / Session / Performance | Redis |
| API Documentation | Swagger |
| Logging | Serilog |
| Deployment | Docker Compose |

## 4. Nhóm người dùng trong hệ thống

Hệ thống có 3 nhóm người dùng chính:

```txt
Admin
Teacher
Student
```

### 4.1. Admin

Admin là người quản trị toàn hệ thống.

Chức năng chính:

- Quản lý tài khoản người dùng.
- Quản lý vai trò người dùng.
- Khóa hoặc mở khóa tài khoản.
- Theo dõi hoạt động hệ thống.
- Xem thống kê tổng quan.
- Quản lý log hệ thống.

### 4.2. Teacher

Teacher là giáo viên sử dụng hệ thống để tổ chức lớp học và bài thi.

Chức năng chính:

- Tạo lớp học.
- Quản lý danh sách học sinh trong lớp.
- Tạo bài tập.
- Chấm bài tập.
- Tạo đề thi.
- Quản lý câu hỏi và đáp án.
- Theo dõi kết quả thi.
- Xem cảnh báo anti-cheat.
- Xem dashboard thống kê.

### 4.3. Student

Student là học sinh tham gia lớp học, làm bài tập và bài thi.

Chức năng chính:

- Đăng ký / đăng nhập.
- Tham gia lớp học bằng mã lớp.
- Xem danh sách bài tập.
- Nộp bài tập.
- Làm bài thi online.
- Xem kết quả thi.
- Nhận thông báo realtime.

## 5. Các cụm chức năng chính

Hệ thống được chia thành các cụm chức năng sau:

```txt
1. Authentication & Authorization
2. User Management
3. Classroom Management
4. Assignment Management
5. Exam Management
6. Exam Attempt / Online Testing
7. Anti-cheat Monitoring
8. Notification System
9. Dashboard & Statistics
10. Logging & Activity Tracking
11. Redis Cache / Realtime Support
```

---

# 6. Chi tiết các cụm chức năng

## 6.1. Authentication & Authorization

Đây là cụm chức năng xác thực và phân quyền người dùng (Identity + JWT cho SPA).

Chức năng gồm:

- Đăng ký tài khoản (`UserManager`).
- Đăng nhập (`SignInManager` + JWT access token).
- Sinh Refresh Token (bảng custom).
- Làm mới token.
- Đăng xuất (revoke refresh token).
- Phân quyền theo vai trò (`[Authorize(Roles = "...")]`).
- Khóa tài khoản (Identity lockout).

Luồng đăng nhập:

```txt
User nhập email/password
        ↓
Frontend gửi POST /api/auth/login
        ↓
AuthService: SignInManager kiểm tra mật khẩu
        ↓
JwtTokenService sinh accessToken + refreshToken
        ↓
Frontend lưu token (localStorage — dev/đồ án)
        ↓
Mọi API protected: Authorization: Bearer <accessToken>
```

## 6.2. User Management

Quản lý người dùng trong hệ thống.

Chức năng gồm:

- Xem danh sách người dùng.
- Xem chi tiết người dùng.
- Cập nhật thông tin cá nhân.
- Khóa / mở khóa tài khoản.
- Gán vai trò.
- Theo dõi hoạt động người dùng.

Entity liên quan:

```txt
ApplicationUser (Identity)
IdentityRole / AspNetUserRoles
RefreshToken
ActivityLog
```

## 6.3. Classroom Management

Quản lý lớp học online.

Chức năng gồm:

- Giáo viên tạo lớp học.
- Sinh mã tham gia lớp.
- Học sinh nhập mã để tham gia lớp.
- Giáo viên xem danh sách thành viên.
- Giáo viên xóa học sinh khỏi lớp.
- Giáo viên đăng thông báo trong lớp.

Luồng tạo lớp học:

```txt
Teacher tạo lớp
        ↓
Backend tạo Classroom
        ↓
Backend sinh JoinCode
        ↓
Lưu vào SQL Server
        ↓
Trả thông tin lớp về frontend
```

Entity liên quan:

```txt
Classroom
ClassroomMember
User
Notification
```

## 6.4. Assignment Management

Quản lý bài tập thường ngày.

Chức năng gồm:

- Giáo viên tạo bài tập.
- Đặt deadline.
- Đính kèm mô tả hoặc file.
- Học sinh nộp bài.
- Giáo viên chấm điểm.
- Giáo viên nhận xét bài làm.
- Học sinh xem điểm và nhận xét.

Entity liên quan:

```txt
Assignment
Submission
SubmissionFile
Classroom
User
```

## 6.5. Exam Management

Quản lý đề thi trực tuyến.

Chức năng gồm:

- Giáo viên tạo đề thi.
- Cấu hình thời gian làm bài.
- Cấu hình thời gian mở / đóng đề.
- Cấu hình random câu hỏi.
- Cấu hình random đáp án.
- Thêm câu hỏi.
- Thêm đáp án.
- Cấu hình điểm cho từng câu.
- Bật / tắt anti-cheat.

Các loại câu hỏi nên hỗ trợ trong MVP:

```txt
Single Choice
Multiple Choice
True / False
Short Answer
```

Entity liên quan:

```txt
Exam
Question
Answer
ExamSetting
Classroom
```

## 6.6. Exam Attempt / Online Testing

Đây là cụm chức năng xử lý quá trình học sinh làm bài thi.

Chức năng gồm:

- Học sinh bắt đầu thi.
- Backend tạo lượt làm bài `ExamAttempt`.
- Backend trả câu hỏi đã random.
- Frontend hiển thị timer.
- Tự động lưu đáp án định kỳ.
- Tự động nộp bài khi hết giờ.
- Chấm điểm tự động.
- Lưu kết quả.

Luồng làm bài:

```txt
Student bấm Bắt đầu thi
        ↓
POST /api/exams/{examId}/start
        ↓
Backend tạo ExamAttempt
        ↓
Backend random câu hỏi/đáp án
        ↓
Frontend hiển thị bài thi và countdown
        ↓
Student chọn đáp án
        ↓
Frontend autosave đáp án
        ↓
Hết giờ hoặc student bấm nộp bài
        ↓
Backend chấm điểm và lưu kết quả
```

Entity liên quan:

```txt
ExamAttempt
StudentAnswer
Exam
Question
Answer
CheatingLog
```

## 6.7. Anti-cheat Monitoring

Đây là cụm chức năng tạo điểm khác biệt cho hệ thống.

Mục tiêu không phải khẳng định chặn gian lận tuyệt đối, mà là:

> Ghi nhận các hành vi bất thường trong quá trình làm bài, tính điểm nghi ngờ và cung cấp dữ liệu để giáo viên đánh giá.

Các hành vi có thể theo dõi:

```txt
Chuyển tab trình duyệt
Thoát fullscreen
Copy/Paste nội dung
Reload trang
Mất kết nối
Rời khỏi cửa sổ làm bài
Webcam không hoạt động
```

Ví dụ điểm nghi ngờ:

| Hành vi | Điểm nghi ngờ |
|---|---:|
| Chuyển tab | +10 |
| Thoát fullscreen | +15 |
| Copy/Paste | +20 |
| Reload trang | +30 |
| Mất kết nối | +10 |
| Webcam không hoạt động | +25 |

Phân mức nghi ngờ:

| Tổng điểm | Mức đánh giá |
|---:|---|
| 0 - 20 | Bình thường |
| 21 - 50 | Nghi ngờ nhẹ |
| 51 - 80 | Nghi ngờ cao |
| > 80 | Cần xem xét |

Luồng anti-cheat:

```txt
Frontend phát hiện hành vi bất thường
        ↓
Gửi event về backend
        ↓
Backend lưu CheatingLog
        ↓
Backend cộng Suspicion Score
        ↓
SignalR gửi cảnh báo realtime cho giáo viên
        ↓
Teacher xem dashboard anti-cheat
```

Entity liên quan:

```txt
CheatingLog
ExamAttempt
User
Notification
ActivityLog
```

## 6.8. Notification System

Thông báo realtime cho người dùng.

Chức năng gồm:

- Thông báo lớp học.
- Nhắc deadline bài tập.
- Nhắc thời gian thi.
- Cảnh báo anti-cheat cho giáo viên.
- Thông báo kết quả thi.

Công nghệ sử dụng:

```txt
SignalR
SQL Server
Redis nếu cần scale realtime
```

Entity liên quan:

```txt
Notification
User
Classroom
```

## 6.9. Dashboard & Statistics

Dashboard giúp giáo viên và admin theo dõi dữ liệu.

Dashboard giáo viên:

- Số lớp đang quản lý.
- Số học sinh.
- Số bài tập đã giao.
- Tỷ lệ nộp bài.
- Điểm trung bình bài thi.
- Danh sách học sinh có điểm nghi ngờ cao.

Dashboard admin:

- Tổng số người dùng.
- Tổng số lớp học.
- Tổng số bài thi.
- Tổng số lượt làm bài.
- Hoạt động gần đây.
- Log lỗi hệ thống.

Entity liên quan:

```txt
User
Classroom
Assignment
Submission
Exam
ExamAttempt
CheatingLog
ActivityLog
```

## 6.10. Logging & Activity Tracking

Ghi lại hoạt động quan trọng của hệ thống.

Các loại log:

- Login log.
- API log.
- Error log.
- Activity log.
- Anti-cheat log.

Có thể dùng:

```txt
Serilog
ActivityLogs table
CheatingLogs table
```

---

# 7. Tổng quan entity trong hệ thống

Các entity chính gồm:

```txt
ApplicationUser
RefreshToken
Classroom
ClassroomMember
Assignment
Submission
SubmissionFile
Exam
ExamSetting
Question
Answer
ExamAttempt
StudentAnswer
CheatingLog
Notification
ActivityLog
```

Có thể chia thành các nhóm:

## 7.1. Nhóm User / Auth

```txt
ApplicationUser (IdentityUser<int>)
IdentityRole<int> + AspNetUserRoles (Identity)
RefreshToken
```

## 7.2. Nhóm Classroom

```txt
Classroom
ClassroomMember
```

## 7.3. Nhóm Assignment

```txt
Assignment
Submission
SubmissionFile
```

## 7.4. Nhóm Exam

```txt
Exam
ExamSetting
Question
Answer
ExamAttempt
StudentAnswer
```

## 7.5. Nhóm Anti-cheat

```txt
CheatingLog
ActivityLog
```

## 7.6. Nhóm Notification

```txt
Notification
```

---

# 8. Định vị hệ thống trong báo cáo

Có thể mô tả EduGuard như sau:

> EduGuard là hệ thống quản lý học tập và thi trực tuyến được xây dựng trên nền tảng ASP.NET Core Web API và ReactJS. Hệ thống hỗ trợ giáo viên trong việc tổ chức lớp học, giao bài tập, tạo đề thi, quản lý quá trình làm bài và theo dõi kết quả học tập của học sinh. Ngoài ra, hệ thống tích hợp cơ chế giám sát chống gian lận bằng cách ghi nhận các hành vi bất thường trong quá trình làm bài như chuyển tab, thoát fullscreen, copy/paste, reload trang hoặc mất kết nối. Các sự kiện này được lưu trữ, tính điểm nghi ngờ và hiển thị trên dashboard giám sát, giúp giáo viên có thêm cơ sở đánh giá tính minh bạch của bài thi.

