# EduGuard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Status](https://img.shields.io/badge/status-early%20development-yellow)]()

**EduGuard** — Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận.

Nền tảng web hỗ trợ giáo viên và học sinh: tổ chức lớp học, giao bài tập, tạo đề thi, làm bài online, chấm điểm và giám sát hành vi thi theo thời gian thực.

> Learning Management System + Online Exam + Anti-cheat Monitoring + Realtime Notification

---

## Mục tiêu

EduGuard hướng tới mô hình kết hợp quản lý lớp học, thi trực tuyến và giám sát gian lận cơ bản — phù hợp môi trường giáo dục cần kiểm soát quá trình làm bài ngoài các chức năng CRUD thông thường.

**Vai trò người dùng:** Admin · Teacher · Student

---

## Tính năng (kế hoạch)

| Module | Mô tả |
|--------|--------|
| Authentication | Đăng ký, đăng nhập, ASP.NET Core Identity + JWT + Refresh Token, phân quyền theo vai trò |
| Classroom | Tạo lớp, mã tham gia, quản lý học sinh |
| Assignment | Giao bài, nộp bài, chấm điểm |
| Exam | Ngân hàng câu hỏi, tạo đề, cấu hình thời gian |
| Online testing | Làm bài thi, auto-save, nộp bài |
| Anti-cheat | Phát hiện chuyển tab, thoát fullscreen, cảnh báo realtime |
| Notification | Thông báo qua SignalR |
| Dashboard | Thống kê lớp, bài thi, cảnh báo gian lận |

Chi tiết chức năng: [`docs/01_PROJECT_OVERVIEW.md`](docs/01_PROJECT_OVERVIEW.md)

---

## Trạng thái dự án

**Giai đoạn 0 hoàn thành** (2026-06-10): frontend React gọi được backend API. Tiếp theo: **Giai đoạn 1** (Database + Identity). Chi tiết: [`Todo List.md`](Todo%20List.md).

| Thành phần | Trạng thái |
|------------|------------|
| Backend scaffold (4 project .NET 8) | ✅ |
| Swagger (dev) | ✅ |
| Frontend React + Vite + axios | ✅ |
| CORS + smoke test `GET /api/Test` | ✅ |
| Database / EF Core | ⬜ Chưa bắt đầu |
| Auth, API modules, SignalR, Redis | ⬜ Chưa bắt đầu |
| Docker Compose | ⬜ Chưa bắt đầu |

API smoke test: `GET /api/Test` → `{ "message": "EduGuard API is running" }`.

---

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 8 Web API |
| Frontend | React, Vite, Tailwind CSS *(dự kiến)* |
| Database | SQL Server, Entity Framework Core *(dự kiến)* |
| Auth | ASP.NET Core Identity + JWT Bearer *(dự kiến)* |
| Realtime | SignalR *(dự kiến)* |
| Cache | Redis *(dự kiến)* |
| Logging | Serilog *(dự kiến)* |
| API docs | Swagger / OpenAPI |
| Dev tooling | Husky, conventional commits |

Kiến trúc backend: `Controller → Service → Repository → DbContext` — xem [`docs/03_BACKEND_ARCHITECTURE.md`](docs/03_BACKEND_ARCHITECTURE.md).

---

## Yêu cầu

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 18+ (Husky hooks)
- [Git](https://git-scm.com/)
- Visual Studio 2022 hoặc VS Code *(khuyến nghị)*

*SQL Server, Redis, Docker — cần khi triển khai các phase tiếp theo.*

---

## Cài đặt

```bash
git clone git@github.com:DatTran26/EduGuard.git
cd EduGuard
npm install
```

### Chạy backend

```bash
cd backend/EduGuard.Api
dotnet run
```

| URL | Môi trường |
|-----|------------|
| https://localhost:7168/swagger | HTTPS (profile mặc định) |
| http://localhost:5157/swagger | HTTP |

Hoặc mở solution trong Visual Studio:

```txt
backend/EduGuard.slnx
```

### Chạy test

```bash
npm test
```

Chạy `dotnet test` trên `backend/EduGuard.Api/EduGuard.Api.slnx` (được gọi qua Husky pre-commit).

### Frontend

Thư mục `frontend/` hiện là scaffold. Hướng dẫn khởi tạo Vite + Tailwind: [`docs/02_SETUP_AND_PROJECT_STRUCTURE.md`](docs/02_SETUP_AND_PROJECT_STRUCTURE.md).

---

## Cấu trúc thư mục

```txt
EduGuard/
├── backend/
│   ├── EduGuard.slnx
│   ├── EduGuard.Api/           # Controllers, Program.cs, Swagger
│   ├── EduGuard.Application/   # Services, DTOs, Validators
│   ├── EduGuard.Domain/        # Entities, Enums
│   └── EduGuard.Infrastructure/  # DbContext, Repositories, Redis
├── frontend/                   # React scaffold (chưa khởi tạo Vite)
├── docs/                       # Tài liệu thiết kế & vận hành
├── .husky/                     # Git hooks (pre-commit, pre-push, commit-msg)
├── Todo List.md                # Checklist tiến độ theo giai đoạn
├── AGENTS.md                   # Quy tắc cho AI agent / contributor
└── package.json                # Husky + npm test script
```

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

Format [Conventional Commits](https://www.conventionalcommits.org/):

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
| Lưu code lên remote | [`docs/07_DEVELOPMENT_RULES.md`](docs/07_DEVELOPMENT_RULES.md) — push code |
| Release / ship | [`docs/08_DEPLOY_WORKFLOW.md`](docs/08_DEPLOY_WORKFLOW.md) |

Quy tắc đầy đủ: [`docs/07_DEVELOPMENT_RULES.md`](docs/07_DEVELOPMENT_RULES.md)

---

## Tài liệu

| File | Nội dung |
|------|----------|
| [`docs/README.md`](docs/README.md) | Mục lục toàn bộ docs |
| [`docs/01_PROJECT_OVERVIEW.md`](docs/01_PROJECT_OVERVIEW.md) | Tổng quan hệ thống |
| [`docs/02_SETUP_AND_PROJECT_STRUCTURE.md`](docs/02_SETUP_AND_PROJECT_STRUCTURE.md) | Cấu hình & cấu trúc |
| [`docs/06_DEVELOPMENT_ROADMAP.md`](docs/06_DEVELOPMENT_ROADMAP.md) | Lộ trình MVP |
| [`docs/07_DEVELOPMENT_RULES.md`](docs/07_DEVELOPMENT_RULES.md) | Quy tắc Git & workflow |
| [`docs/project-changelog.md`](docs/project-changelog.md) | Lịch sử thay đổi theo feature |

> Tài liệu `01`–`06` mô tả **thiết kế mục tiêu**. Trạng thái implementation thực tế xem [`Todo List.md`](Todo%20List.md).

---

## Lộ trình

```txt
Phase 0  Khởi tạo project          🟡 đang làm
Phase 1  Database + Entity         ⬜
Phase 2  Auth & Authorization      ⬜
Phase 3–7  Lớp, bài tập, thi, anti-cheat  ⬜
Phase 8–11  SignalR, Redis, Docker ⬜
```

Nguyên tắc triển khai: **Chạy được → Đăng nhập được → Quản lý lớp → Tạo bài thi → Làm bài → Giám sát → Tối ưu**

---

## Đóng góp

1. Fork repository và tạo nhánh từ `devD` (hoặc `devH` / `devB`).
2. Đọc [`docs/07_DEVELOPMENT_RULES.md`](docs/07_DEVELOPMENT_RULES.md) trước khi commit.
3. Cập nhật [`Todo List.md`](Todo%20List.md) khi hoàn thành task liên quan.
4. Ghi changelog feature tại [`docs/project-changelog.md`](docs/project-changelog.md) nếu thay đổi có ý nghĩa.
5. Mở Pull Request vào `release` hoặc nhánh dev tương ứng — không vào `main` trực tiếp.

Báo lỗi hoặc đề xuất: [GitHub Issues](https://github.com/DatTran26/EduGuard/issues)

---

## License

Dự án phát hành theo [MIT License](LICENSE).

Copyright (c) 2026 Tran Tan Dat

---

## Liên hệ

- Repository: [github.com/DatTran26/EduGuard](https://github.com/DatTran26/EduGuard)
- Maintainer: Tran Tan Dat
