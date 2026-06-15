# EduGuard Documentation

Bộ tài liệu này mô tả tổng thể hệ thống **EduGuard – Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận**.

Hệ thống được thiết kế theo kiến trúc **Client - Server**, sử dụng:

- **Backend:** ASP.NET Core Web API
- **Frontend:** ReactJS + TailwindCSS
- **Database:** SQL Server
- **Cache / Realtime support:** Redis
- **Realtime:** SignalR
- **Authentication:** ASP.NET Core Identity + JWT Bearer + Role-based Authorization

## Danh sách tài liệu

| File | Nội dung |
|---|---|
| `01_PROJECT_OVERVIEW.md` | Mô tả hệ thống, mục tiêu, chức năng, người dùng, module và entity tổng quan |
| `02_SETUP_AND_PROJECT_STRUCTURE.md` | Cấu hình ban đầu, cấu trúc folder frontend/backend, cách chạy bằng Visual Studio và VS Code |
| `03_BACKEND_ARCHITECTURE.md` | Kiến trúc backend theo mô hình Controller → Service → Repository → DbContext |
| `04_DATABASE_ENTITIES.md` | Thiết kế entity/database, nhóm bảng, quan hệ dữ liệu chính |
| `05_API_FRONTEND_INTEGRATION.md` | Quy ước API, cách React gọi backend, JWT, Axios, SignalR |
| `apiList.md` | **Checklist** — danh sách REST endpoint + SignalR hub (tick khi implement) |
| `features.md` | **Checklist** — toàn bộ chức năng theo module (BE/FE/DB) |
| `06_DEVELOPMENT_ROADMAP.md` | Lộ trình triển khai MVP theo từng giai đoạn |
| `07_DEVELOPMENT_RULES.md` | **Bắt buộc đọc** — quy tắc Git, push/ship workflow, cập nhật Todo List |
| `08_DEPLOY_WORKFLOW.md` | Flow overview deploy (ASCII + SVG), Local → Staging → Prod |
| `design-guidelines.md` | **Bắt buộc cho UI** — design system Apple-inspired, tokens, component, checklist merge |
| `project-changelog.md` | Lịch sử thay đổi theo feature |

## Bắt buộc đọc (agent & developer)

Trước khi commit, push, hoặc làm feature mới:

1. `07_DEVELOPMENT_RULES.md` — quy tắc làm việc, workflow Git
2. `Todo List.md` (root) — checklist tiến độ hiện tại
3. `AGENTS.md` (root) — chính sách Husky, commit, changelog

Trước khi làm **frontend UI/UX**:

1. `design-guidelines.md` — chuẩn giao diện bắt buộc
2. `design.md` (root) — token gốc (colors, typography, components)

## Cách sử dụng

Khuyến nghị đặt toàn bộ thư mục này vào repo như sau:

```txt
EduGuard/
├── backend/
├── frontend/
├── docs/
│   ├── README.md
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_SETUP_AND_PROJECT_STRUCTURE.md
│   ├── 03_BACKEND_ARCHITECTURE.md
│   ├── 04_DATABASE_ENTITIES.md
│   ├── 05_API_FRONTEND_INTEGRATION.md
│   ├── apiList.md
│   ├── features.md
│   ├── 06_DEVELOPMENT_ROADMAP.md
│   ├── 07_DEVELOPMENT_RULES.md
│   ├── 08_DEPLOY_WORKFLOW.md
│   ├── design-guidelines.md
│   ├── assets/deploy-flow-overview.png
│   ├── assets/deploy-flow-overview.svg
│   ├── project-changelog.md
├── Todo List.md
├── AGENTS.md
├── docker-compose.yml
└── README.md
```

## Cách đọc nhanh

Nếu mới bắt đầu, nên đọc theo thứ tự:

1. `01_PROJECT_OVERVIEW.md`
2. `02_SETUP_AND_PROJECT_STRUCTURE.md`
3. `03_BACKEND_ARCHITECTURE.md`
4. `04_DATABASE_ENTITIES.md`
5. `05_API_FRONTEND_INTEGRATION.md`
6. `apiList.md` / `features.md` — tick tiến độ API & chức năng
7. `06_DEVELOPMENT_ROADMAP.md`
8. `07_DEVELOPMENT_RULES.md` (trước khi commit/push)


