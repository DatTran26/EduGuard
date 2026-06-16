# EduGuard Backend

ASP.NET Core 8 Web API — tầng server của **EduGuard**: xác thực, quản lý lớp/bài tập/đề thi, làm bài online, anti-cheat, và push realtime qua SignalR.

> Giới thiệu tổng thể repo: [`../README.md`](../README.md) · Tiến độ triển khai: [`../Todo List.md`](../Todo%20List.md)

---

## Solution — 4 project

| Project | Vai trò |
|---------|---------|
| **EduGuard.Api** | HTTP entrypoint: Controllers, SignalR Hubs, Swagger, CORS, middleware |
| **EduGuard.Application** | Contracts: DTOs, service interfaces, FluentValidation validators |
| **EduGuard.Domain** | Entities, enums — không phụ thuộc framework |
| **EduGuard.Infrastructure** | EF Core `AppDbContext`, repositories, triển khai service, Identity, migrations |

Mở solution: `backend/EduGuard.slnx`

---

## Luồng xử lý request

```txt
HTTP Request
    │
    ▼
Controller          (EduGuard.Api/Controllers)
    │
    ▼
Service             (EduGuard.Infrastructure — implement Application interfaces)
    │
    ▼
Repository          (EduGuard.Infrastructure/Repositories)
    │
    ▼
AppDbContext        (SQL Server)
```

SignalR: Hub (Api) → `IExamMonitoringNotifier` / `INotificationNotifier` (Application) → implementation realtime (Api/Realtime) → client.

Chi tiết: [`../docs/03_BACKEND_ARCHITECTURE.md`](../docs/03_BACKEND_ARCHITECTURE.md)

---

## Module chính

| Module | Controller | Service | Ghi chú |
|--------|------------|---------|---------|
| Auth | `auth-controller` | `AuthService`, `JwtTokenService` | Identity + JWT + refresh token |
| Classroom | `classrooms-controller` | `ClassroomService` | Lớp, mã tham gia, thành viên |
| Assignment | `assignments-controller` | `AssignmentService` | Giao bài, nộp, chấm |
| Exam | `exams-controller` | `ExamService` | Đề, câu hỏi, publish, cấu hình thời gian |
| Exam attempt | `exam-attempts-controller` | `ExamAttemptService` | Start/resume, lưu đáp án, submit, điểm |
| Anti-cheat | `anti-cheat-controller` | `AntiCheatService` | Log hành vi, điểm rủi ro |
| Realtime | Hubs | Notifiers | Xem bảng Hub bên dưới |

---

## SignalR Hubs

| Hub | Route | Mục đích |
|-----|-------|----------|
| `NotificationHub` | `/hubs/notifications` | Push thông báo theo user / role |
| `ExamMonitoringHub` | `/hubs/exam-monitoring` | Cảnh báo anti-cheat tới giáo viên đang giám sát đề |

Đăng ký trong `Program.cs`: `MapHub<...>`.

---

## Cấu trúc thư mục (tóm tắt)

```txt
backend/
├── EduGuard.Api/
│   ├── Controllers/
│   ├── Hubs/
│   ├── Realtime/              # SignalR notifier implementations
│   ├── Authorization/
│   ├── Swagger/
│   └── Program.cs
├── EduGuard.Application/
│   ├── DTOs/
│   ├── Services/Interfaces/
│   └── Validators/
├── EduGuard.Domain/
│   └── Entities/
└── EduGuard.Infrastructure/
    ├── Auth/
    ├── Classrooms/
    ├── Assignments/
    ├── Exams/
    ├── AntiCheat/
    ├── Repositories/
    ├── Data/
    │   ├── app-db-context.cs
    │   ├── Configurations/
    │   └── Migrations/
    ├── Redis/                 # Sẵn sàng cho cache (Phase 9)
    └── dependency-injection.cs
```

---

## Cấu hình

File: `EduGuard.Api/appsettings.json`

| Key | Mô tả |
|-----|--------|
| `ConnectionStrings:DefaultConnection` | SQL Server (ví dụ `EduGuardExam`) |
| `ConnectionStrings:Redis` | Redis `localhost:6379` — dùng khi bật cache |
| `Jwt:*` | Secret, issuer, audience, thời hạn token |
| `Cors:AllowedOrigins` | Mặc định `http://localhost:5173` (Vite) |

`appsettings.Development.json` có thể override cho máy local.

---

## Chạy local

### Yêu cầu

- .NET 8 SDK
- SQL Server
- (Tùy chọn) Redis — cho Phase 9 cache

### Database migration

Từ thư mục `backend/`:

```bash
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

Tạo migration mới:

```bash
dotnet ef migrations add <TenMigration> --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

### Chạy API

```bash
cd EduGuard.Api
dotnet run
```

| URL | Profile |
|-----|---------|
| https://localhost:7168/swagger | HTTPS (khuyến nghị — khớp proxy frontend) |
| http://localhost:5157/swagger | HTTP |

Smoke test: `GET /api/Test`

### Test

Từ root repo:

```bash
npm test
```

Hoặc:

```bash
dotnet test EduGuard.Api/EduGuard.Api.slnx
```

---

## Validation & API

- FluentValidation — validators trong Application; đăng ký qua `AddValidatorsFromAssemblyContaining`
- Swagger Bearer JWT — nút Authorize trên Swagger UI
- JSON: hỗ trợ optional fields qua `OptionalJsonConverterFactory`

Hướng dẫn test API: [`../docs/swagger-api-testing-guide.md`](../docs/swagger-api-testing-guide.md)

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`../docs/02_SETUP_AND_PROJECT_STRUCTURE.md`](../docs/02_SETUP_AND_PROJECT_STRUCTURE.md) | Setup chi tiết, Docker, CORS |
| [`../docs/03_BACKEND_ARCHITECTURE.md`](../docs/03_BACKEND_ARCHITECTURE.md) | Kiến trúc & patterns |
| [`../docs/04_DATABASE_ENTITIES.md`](../docs/04_DATABASE_ENTITIES.md) | Entity & quan hệ |
| [`../docs/apiList.md`](../docs/apiList.md) | Checklist REST endpoint |
