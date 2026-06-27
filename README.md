# EduGuard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)

**EduGuard** — Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận.

Nền tảng web cho giáo viên và học sinh: tổ chức lớp học, giao bài tập, tạo đề thi, làm bài online, chấm điểm và giám sát hành vi thi theo thời gian thực.

```txt
Learning Management System + Online Exam + Anti-cheat Monitoring + Realtime Notification
```

**Vai trò:** Admin · Teacher · Student

> Tiến độ triển khai từng giai đoạn: [`Todo List.md`](Todo%20List.md) · Changelog chính: [`CHANGELOG.md`](CHANGELOG.md) · Lịch sử chi tiết theo feature: [`docs/changelog/project-changelog.md`](docs/changelog/project-changelog.md)

---

## Điểm nổi bật

| Khía cạnh | Mô tả |
|-----------|--------|
| **Kiến trúc backend** | Clean Architecture 4 lớp — Api, Application, Domain, Infrastructure; luồng `Controller → Service → Repository → DbContext` |
| **Xác thực & phân quyền** | ASP.NET Core Identity + JWT Bearer + refresh token; authorization theo vai trò Admin / Teacher / Student |
| **Thi trực tuyến** | Tạo đề, ngân hàng câu hỏi, publish đề, làm bài với timer, auto-save câu trả lời, auto-submit khi hết giờ |
| **Giám sát gian lận** | Ghi nhận chuyển tab, thoát fullscreen, rời cửa sổ; chấm điểm rủi ro; giáo viên theo dõi attempt |
| **Realtime** | SignalR — thông báo theo user/role; cảnh báo anti-cheat đẩy tới giáo viên đang giám sát đề |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4; routing theo role; tích hợp API và SignalR qua proxy dev |
| **Chất lượng repo** | Husky (test trước commit, conventional commits), `dotnet test` trong pre-commit |

Chi tiết nghiệp vụ và use case: [`docs/architecture/project-overview.md`](docs/architecture/project-overview.md)

---

## Tính năng hệ thống

| Module | Mô tả |
|--------|--------|
| **Authentication** | Đăng ký, đăng nhập, refresh token, logout, session theo JWT |
| **Classroom** | Tạo lớp, mã tham gia, quản lý học sinh, phân công trong lớp |
| **Assignment** | Giao bài, nộp bài, chấm điểm |
| **Exam** | Ngân hàng câu hỏi (trắc nghiệm), cấu hình thời gian mở/đóng, publish đề |
| **Exam attempt** | Bắt đầu / tiếp tục làm bài, lưu đáp án, nộp bài, xem kết quả |
| **Anti-cheat** | Log hành vi nghi ngờ, tổng hợp rủi ro theo attempt và theo đề |
| **Notification** | REST + push realtime qua SignalR (`/hubs/notifications`) |
| **Exam monitoring** | Hub giám sát đề (`/hubs/exam-monitoring`) cho giáo viên |
| **Dashboard** | Tổng quan theo vai trò (một số metric phụ thuộc API đang mở rộng) |

Danh sách API và checklist chức năng: [`docs/api/api-list.md`](docs/api/api-list.md), [`docs/api/features.md`](docs/api/features.md)

---

## Kiến trúc tóm tắt

```txt
┌─────────────┐     HTTPS/WS      ┌──────────────────────────────────────┐
│   React     │ ◄──────────────► │  EduGuard.Api                         │
│   (Vite)    │   /api, /hubs    │  Controllers · Hubs · Middleware      │
└─────────────┘                  └──────────────┬───────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
           EduGuard.Application          EduGuard.Domain            EduGuard.Infrastructure
           Services · DTOs ·              Entities · Enums           EF Core · Repositories
           Validators · Interfaces                                  Identity · Redis (sắp tới)
                    │                           │
                    └───────────────────────────┴──────────► SQL Server
```

Tài liệu sâu: [`docs/architecture/backend-architecture.md`](docs/architecture/backend-architecture.md) · [`docs/architecture/api-frontend-integration.md`](docs/architecture/api-frontend-integration.md)

---

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 8 Web API |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| Database | SQL Server, Entity Framework Core |
| Auth | ASP.NET Core Identity + JWT Bearer + refresh token |
| Realtime | SignalR (`@microsoft/signalr` trên frontend) |
| Cache | Redis — connection string đã chuẩn bị; dịch vụ cache đang triển khai (Phase 9) |
| Logging | Serilog (console + file) |
| API docs | Swagger / OpenAPI |
| Dev tooling | Husky, conventional commits, ESLint (frontend) |

---

## Yêu cầu

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 18+ (frontend + Husky)
- [Git](https://git-scm.com/)
- **SQL Server** (LocalDB / Express / instance riêng) — tạo `backend/EduGuard.Api/appsettings.Development.json` từ file mẫu rồi chỉnh `ConnectionStrings:DefaultConnection` cho máy local
- Visual Studio 2022 hoặc VS Code *(khuyến nghị)*

*Redis và Docker Compose — tùy chọn cho cache và triển khai tập trung; xem [`docs/architecture/setup-and-project-structure.md`](docs/architecture/setup-and-project-structure.md).*

**Chạy đủ các cách (dev, SFU, AI, LAN/Tailscale/Tunnel):** [`docs/guides/system-run-guide.md`](docs/guides/system-run-guide.md)

---

## Cài đặt & chạy local

### Clone và cài dependency

```bash
git clone git@github.com:DatTran26/EduGuard.git
cd EduGuard
npm install
cd frontend
npm install
cd ..
```

### Database

1. Tạo database (ví dụ `EduGuardExam`) trên SQL Server.
2. Cập nhật connection string trong `backend/EduGuard.Api/appsettings.json`.
3. Áp dụng migration (từ thư mục `backend/`):

```bash
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

*(Nếu chưa cài `dotnet-ef`: `dotnet tool install --global dotnet-ef`.)*

### Chạy backend

```bash
cd backend/EduGuard.Api
dotnet run
```

| URL | Ghi chú |
|-----|---------|
| https://localhost:7168/swagger | HTTPS (profile mặc định) |
| http://localhost:5157/swagger | HTTP |

Hoặc mở `backend/EduGuard.slnx` trong Visual Studio.

Smoke test: `GET /api/Test` → `{ "message": "EduGuard API is running" }`.

### Chạy frontend

```bash
cd frontend
npm run dev
```

Ứng dụng chạy tại **http://localhost:5173**. Vite proxy `/api` và `/hubs` mặc định tới `http://127.0.0.1:5157` (cấu hình trong `frontend/vite.config.js`). Có thể override bằng `VITE_DEV_API_TARGET` nếu cần chạy backend profile HTTPS.

### Chạy test

```bash
npm test
```

Gọi `dotnet test` trên `backend/EduGuard.Api/EduGuard.Api.slnx` (Husky pre-commit cũng chạy lệnh này).

---

## Cấu trúc thư mục

```txt
EduGuard/
├── backend/
│   ├── EduGuard.slnx
│   ├── EduGuard.Api/              # Controllers, Hubs, Program.cs, Swagger
│   ├── EduGuard.Application/      # Services, DTOs, validators, interfaces
│   ├── EduGuard.Domain/           # Entities, enums
│   └── EduGuard.Infrastructure/   # DbContext, repositories, Identity, Redis
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios clients (auth, classroom, exam, …)
│   │   ├── features/              # auth, classrooms, exams, exam-attempts, anti-cheat, …
│   │   ├── signalr/               # Kết nối notification & exam monitoring
│   │   ├── routes/                # App routing theo role
│   │   ├── components/            # Layout, form, dashboard UI
│   │   └── hooks/                 # useAuth, useTheme, useToast
│   ├── vite.config.js             # Proxy API + SignalR
│   └── package.json
├── docs/                          # Thiết kế, kiến trúc, quy trình
├── .husky/                        # pre-commit, pre-push, commit-msg
├── Todo List.md                   # Checklist tiến độ (không nhân bản trong README)
├── AGENTS.md                      # Quy tắc cho contributor / AI agent
└── package.json                   # Husky + npm test
```

Hướng dẫn chi tiết: [`docs/architecture/setup-and-project-structure.md`](docs/architecture/setup-and-project-structure.md)

---

## Phát triển

### Nhánh Git

| Nhánh | Vai trò |
|-------|---------|
| `devD`, `devH`, `devB` | Phát triển tính năng |
| `release` | Tích hợp trước production |
| `main` | Production — **chỉ merge qua PR** |

Không push trực tiếp lên `main` (bị Husky chặn).

### Commit message

[Conventional Commits](https://www.conventionalcommits.org/):

```txt
feat(auth): add login endpoint
fix(api): handle missing classroom id
docs: update setup guide
```

Cho phép: `feat`, `fix`, `build`, `ci`, `perf`, `refactor`, `test`, `style`, `docs`, `revert`  
Không dùng: `chore:` · Không gắn tham chiếu AI/tool trong message.

### Workflow

| Mục đích | Tài liệu |
|----------|----------|
| Push code lên remote | [`docs/development/development-rules.md`](docs/development/development-rules.md) |
| Release / ship | [`docs/development/deploy-workflow.md`](docs/development/deploy-workflow.md) |

---

## Tài liệu

| File | Nội dung |
|------|----------|
| [`docs/README.md`](docs/README.md) | Mục lục toàn bộ docs |
| [`frontend/README.md`](frontend/README.md) | Giới thiệu SPA, cấu trúc `src/`, chạy dev |
| [`backend/README.md`](backend/README.md) | Solution 4 lớp, module API, migration |
| [`docs/architecture/project-overview.md`](docs/architecture/project-overview.md) | Tổng quan hệ thống & nghiệp vụ |
| [`docs/architecture/setup-and-project-structure.md`](docs/architecture/setup-and-project-structure.md) | Cấu hình, cấu trúc, Docker |
| [`docs/architecture/backend-architecture.md`](docs/architecture/backend-architecture.md) | Kiến trúc backend |
| [`docs/architecture/api-frontend-integration.md`](docs/architecture/api-frontend-integration.md) | Tích hợp API & SignalR |
| [`docs/development/development-roadmap.md`](docs/development/development-roadmap.md) | Lộ trình MVP (thiết kế) |
| [`docs/development/development-rules.md`](docs/development/development-rules.md) | Quy tắc Git & workflow |
| [`Todo List.md`](Todo%20List.md) | **Trạng thái implementation** theo giai đoạn |
| [`CHANGELOG.md`](CHANGELOG.md) | Changelog chính theo release và thay đổi user-facing |
| [`docs/changelog/project-changelog.md`](docs/changelog/project-changelog.md) | Lịch sử chi tiết theo feature |

---

## Đóng góp

1. Fork repository và tạo nhánh từ `devD` (hoặc `devH` / `devB`).
2. Đọc [`docs/development/development-rules.md`](docs/development/development-rules.md) trước khi commit.
3. Cập nhật [`Todo List.md`](Todo%20List.md) khi hoàn thành task liên quan.
4. Ghi changelog tại [`CHANGELOG.md`](CHANGELOG.md) cho thay đổi chính và [`docs/changelog/project-changelog.md`](docs/changelog/project-changelog.md) cho chi tiết theo feature.
5. Mở Pull Request vào `release` hoặc nhánh dev — không vào `main` trực tiếp.

Báo lỗi hoặc đề xuất: [GitHub Issues](https://github.com/DatTran26/EduGuard/issues)

---

## License

Dự án phát hành theo [MIT License](LICENSE).

Copyright (c) 2026 Tran Tan Dat

---

## Liên hệ

- Repository: [github.com/DatTran26/EduGuard](https://github.com/DatTran26/EduGuard)
- Maintainer: Tran Tan Dat
