# 04. Thiết kế Entity và Database cho EduGuard

## 1. Mục tiêu tài liệu

Tài liệu này mô tả các entity chính trong hệ thống EduGuard, cách nhóm entity theo chức năng và các quan hệ dữ liệu quan trọng.

Trong hệ thống này:

```txt
Entity = Model ánh xạ với bảng trong database
```

Ví dụ:

```txt
User entity → Users table
Classroom entity → Classrooms table
Exam entity → Exams table
CheatingLog entity → CheatingLogs table
```

## 2. Nhóm entity tổng quan

Hệ thống có thể chia entity thành các nhóm:

```txt
1. Auth / User
2. Classroom
3. Assignment
4. Exam
5. Exam Attempt
6. Anti-cheat
7. Notification
8. Activity / Logging
```

## 3. Nhóm Auth / User

### 3.1. User

Đại diện cho tài khoản người dùng.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| FullName | string | Họ tên |
| Email | string | Email đăng nhập |
| PasswordHash | string | Mật khẩu đã mã hóa |
| AvatarUrl | string? | Ảnh đại diện |
| IsActive | bool | Trạng thái tài khoản |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

Ghi chú:

- Không bao giờ trả `PasswordHash` về frontend.
- Frontend chỉ nhận `UserDto`.

### 3.2. Role

Đại diện cho vai trò người dùng.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| Name | string | Tên role: Admin, Teacher, Student |
| Description | string? | Mô tả |

### 3.3. UserRole

Bảng trung gian giữa User và Role.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| UserId | int | FK đến Users |
| RoleId | int | FK đến Roles |

Quan hệ:

```txt
User 1-n UserRole n-1 Role
```

### 3.4. RefreshToken

Dùng để làm mới JWT token.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| UserId | int | FK đến Users |
| Token | string | Refresh token |
| ExpiresAt | DateTime | Thời gian hết hạn |
| CreatedAt | DateTime | Ngày tạo |
| RevokedAt | DateTime? | Ngày bị thu hồi |
| IsRevoked | bool | Đã bị thu hồi chưa |

## 4. Nhóm Classroom

### 4.1. Classroom

Đại diện cho lớp học.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| Name | string | Tên lớp |
| Description | string? | Mô tả lớp học |
| JoinCode | string | Mã tham gia lớp |
| TeacherId | int | Giáo viên tạo lớp |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

Quan hệ:

```txt
Teacher/User 1-n Classroom
Classroom 1-n ClassroomMember
Classroom 1-n Assignment
Classroom 1-n Exam
```

### 4.2. ClassroomMember

Đại diện cho thành viên trong lớp.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ClassroomId | int | FK đến Classroom |
| StudentId | int | FK đến User |
| JoinedAt | DateTime | Ngày tham gia |
| Status | string | Active / Removed |

Quan hệ:

```txt
Classroom 1-n ClassroomMember
User 1-n ClassroomMember
```

## 5. Nhóm Assignment

### 5.1. Assignment

Đại diện cho bài tập được giáo viên giao.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ClassroomId | int | Lớp nhận bài tập |
| TeacherId | int | Giáo viên tạo |
| Title | string | Tiêu đề bài tập |
| Description | string? | Mô tả |
| Deadline | DateTime? | Hạn nộp |
| MaxScore | decimal | Điểm tối đa |
| CreatedAt | DateTime | Ngày tạo |

Quan hệ:

```txt
Classroom 1-n Assignment
Assignment 1-n Submission
```

### 5.2. Submission

Đại diện cho bài nộp của học sinh.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| AssignmentId | int | FK đến Assignment |
| StudentId | int | Người nộp |
| Content | string? | Nội dung bài nộp |
| Score | decimal? | Điểm |
| Feedback | string? | Nhận xét giáo viên |
| SubmittedAt | DateTime | Thời gian nộp |
| GradedAt | DateTime? | Thời gian chấm |

### 5.3. SubmissionFile

Nếu bài nộp có file.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| SubmissionId | int | FK đến Submission |
| FileName | string | Tên file |
| FileUrl | string | Đường dẫn file |
| FileType | string? | Loại file |
| UploadedAt | DateTime | Ngày upload |

## 6. Nhóm Exam

### 6.1. Exam

Đại diện cho đề thi.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ClassroomId | int | Lớp áp dụng |
| TeacherId | int | Người tạo đề |
| Title | string | Tên đề thi |
| Description | string? | Mô tả |
| DurationMinutes | int | Thời gian làm bài |
| StartTime | DateTime? | Thời gian mở đề |
| EndTime | DateTime? | Thời gian đóng đề |
| IsPublished | bool | Đã công bố chưa |
| EnableAntiCheat | bool | Bật anti-cheat hay không |
| CreatedAt | DateTime | Ngày tạo |

Quan hệ:

```txt
Classroom 1-n Exam
Exam 1-n Question
Exam 1-n ExamAttempt
```

### 6.2. ExamSetting

Nếu muốn tách cấu hình đề thi ra riêng.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ExamId | int | FK đến Exam |
| ShuffleQuestions | bool | Random câu hỏi |
| ShuffleAnswers | bool | Random đáp án |
| MaxAttempts | int | Số lần làm tối đa |
| ShowResultAfterSubmit | bool | Hiển thị kết quả sau khi nộp |
| RequireFullscreen | bool | Yêu cầu fullscreen |

### 6.3. Question

Đại diện cho câu hỏi trong đề thi.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ExamId | int | FK đến Exam |
| Content | string | Nội dung câu hỏi |
| QuestionType | string | SingleChoice / MultipleChoice / TrueFalse / ShortAnswer |
| Score | decimal | Điểm của câu |
| OrderIndex | int | Thứ tự |
| CreatedAt | DateTime | Ngày tạo |

Quan hệ:

```txt
Exam 1-n Question
Question 1-n Answer
```

### 6.4. Answer

Đại diện cho đáp án của câu hỏi.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| QuestionId | int | FK đến Question |
| Content | string | Nội dung đáp án |
| IsCorrect | bool | Có đúng không |
| OrderIndex | int | Thứ tự |

## 7. Nhóm Exam Attempt

### 7.1. ExamAttempt

Đại diện cho một lượt làm bài của học sinh.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ExamId | int | FK đến Exam |
| StudentId | int | Học sinh làm bài |
| StartedAt | DateTime | Thời gian bắt đầu |
| SubmittedAt | DateTime? | Thời gian nộp |
| Score | decimal? | Điểm đạt được |
| SuspicionScore | int | Điểm nghi ngờ gian lận |
| Status | string | InProgress / Submitted / AutoSubmitted / Cancelled |

Quan hệ:

```txt
Exam 1-n ExamAttempt
User 1-n ExamAttempt
ExamAttempt 1-n StudentAnswer
ExamAttempt 1-n CheatingLog
```

### 7.2. StudentAnswer

Đại diện cho câu trả lời của học sinh.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ExamAttemptId | int | FK đến ExamAttempt |
| QuestionId | int | FK đến Question |
| AnswerId | int? | FK đến Answer nếu trắc nghiệm |
| TextAnswer | string? | Câu trả lời tự luận |
| IsCorrect | bool? | Đúng/sai sau khi chấm |
| Score | decimal? | Điểm đạt được |
| AnsweredAt | DateTime | Thời gian trả lời |

## 8. Nhóm Anti-cheat

### 8.1. CheatingLog

Ghi nhận hành vi bất thường trong quá trình làm bài.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| ExamAttemptId | int | FK đến ExamAttempt |
| Type | string | Loại hành vi |
| Description | string | Mô tả |
| SuspicionPoint | int | Điểm nghi ngờ cộng thêm |
| Metadata | string? | Dữ liệu JSON bổ sung |
| OccurredAt | DateTime | Thời điểm xảy ra |

Ví dụ Type:

```txt
TAB_SWITCH
EXIT_FULLSCREEN
COPY_PASTE
PAGE_RELOAD
DISCONNECTED
WEBCAM_OFF
WINDOW_BLUR
```

## 9. Nhóm Notification

### 9.1. Notification

Thông báo gửi đến người dùng.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| UserId | int | Người nhận |
| Title | string | Tiêu đề |
| Message | string | Nội dung |
| Type | string | Loại thông báo |
| IsRead | bool | Đã đọc chưa |
| CreatedAt | DateTime | Ngày tạo |

## 10. Nhóm Activity / Logging

### 10.1. ActivityLog

Ghi lại hoạt động quan trọng.

Field đề xuất:

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| Id | int | Khóa chính |
| UserId | int? | Người thực hiện |
| Action | string | Hành động |
| Description | string | Mô tả |
| IpAddress | string? | IP |
| UserAgent | string? | Trình duyệt |
| CreatedAt | DateTime | Thời gian |

## 11. Sơ đồ quan hệ tổng quan dạng text

```txt
User
├── UserRole ── Role
├── ClassroomMember ── Classroom
├── Assignment Submission
├── ExamAttempt ── Exam
├── Notification
└── ActivityLog

Classroom
├── ClassroomMember
├── Assignment
└── Exam

Exam
├── ExamSetting
├── Question ── Answer
└── ExamAttempt ── StudentAnswer
                 └── CheatingLog
```

## 12. Thứ tự tạo entity nên triển khai

Nên tạo theo thứ tự:

```txt
1. User, Role, UserRole, RefreshToken
2. Classroom, ClassroomMember
3. Assignment, Submission
4. Exam, Question, Answer, ExamSetting
5. ExamAttempt, StudentAnswer
6. CheatingLog
7. Notification
8. ActivityLog
```

## 13. Gợi ý DbSet trong AppDbContext

```csharp
public DbSet<User> Users { get; set; }
public DbSet<Role> Roles { get; set; }
public DbSet<UserRole> UserRoles { get; set; }
public DbSet<RefreshToken> RefreshTokens { get; set; }

public DbSet<Classroom> Classrooms { get; set; }
public DbSet<ClassroomMember> ClassroomMembers { get; set; }

public DbSet<Assignment> Assignments { get; set; }
public DbSet<Submission> Submissions { get; set; }
public DbSet<SubmissionFile> SubmissionFiles { get; set; }

public DbSet<Exam> Exams { get; set; }
public DbSet<ExamSetting> ExamSettings { get; set; }
public DbSet<Question> Questions { get; set; }
public DbSet<Answer> Answers { get; set; }

public DbSet<ExamAttempt> ExamAttempts { get; set; }
public DbSet<StudentAnswer> StudentAnswers { get; set; }

public DbSet<CheatingLog> CheatingLogs { get; set; }
public DbSet<Notification> Notifications { get; set; }
public DbSet<ActivityLog> ActivityLogs { get; set; }
```

