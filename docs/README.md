# EduGuard Documentation

Bộ tài liệu mô tả hệ thống **EduGuard – Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận**.

Hệ thống theo kiến trúc **Client – Server**:

- **Backend:** ASP.NET Core 8 Web API (Clean Architecture 4 lớp)
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** SQL Server + Entity Framework Core
- **Realtime:** SignalR (notification, exam monitoring)
- **Cache:** Redis *(đang triển khai — connection string đã chuẩn bị)*
- **Auth:** ASP.NET Core Identity + JWT Bearer + refresh token

> Cổng vào repo (giới thiệu + chạy nhanh): [`../README.md`](../README.md)

---

## README vs tài liệu tiến độ

| Loại | File | Mục đích |
|------|------|----------|
| **Giới thiệu hệ thống** | [`../README.md`](../README.md), [`../frontend/README.md`](../frontend/README.md), [`../backend/README.md`](../backend/README.md) | Hệ thống làm gì, cấu trúc, cách chạy, điểm nổi bật — **không** ghi % phase |
| **Checklist tiến độ** | [`../Todo List.md`](../Todo%20List.md) | Trạng thái implementation theo giai đoạn |
| **Checklist API / feature** | `apiList.md`, `features.md` | Tick endpoint và chức năng khi hoàn thành |
| **Thiết kế & kiến trúc** | `01`–`05`, `03`, `04` | Spec mục tiêu, có thể đi trước code |
| **Changelog chính** | `../CHANGELOG.md` | Changelog release và thay đổi user-facing |
| **Lịch sử chi tiết** | `project-changelog.md` | Thay đổi theo feature đã ship |

---

## Điểm nổi bật hệ thống

- LMS + thi trực tuyến trong một nền tảng (lớp học, bài tập, đề thi, làm bài).
- Clean Architecture backend — tách Api / Application / Domain / Infrastructure.
- JWT + refresh token, phân quyền Admin / Teacher / Student.
- Exam attempt: timer, auto-save đáp án, auto-submit, chấm trắc nghiệm.
- Anti-cheat: chuyển tab, fullscreen, focus window — log + điểm rủi ro.
- SignalR realtime: thông báo và cảnh báo giám sát đề cho giáo viên.
- Frontend SPA theo role, proxy dev Vite → API + WebSocket hubs.
- Husky: test trước commit, conventional commits, chặn push lên `main`.

---

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
| `09_QUESTION_BANK_FILE_IMPORT_STANDARD.md` | Định chuẩn import file ngân hàng câu hỏi / tạo câu hỏi bài kiểm tra |
| `10_QUESTION_BANK_IMPORT_TEMPLATES.md` | Bộ file mẫu import theo 4 loại câu hỏi và 5 định dạng backend hỗ trợ |
| `11_QUESTION_IMPORT_TEMPLATE_USAGE.md` | Hướng dẫn giáo viên chọn, sửa và test file mẫu import đề |
| `design-guidelines.md` | **Bắt buộc cho UI** — design system Apple-inspired, tokens, component, checklist merge |
| `../CHANGELOG.md` | Changelog chính theo release và thay đổi user-facing |
| `project-changelog.md` | Lịch sử chi tiết theo feature |

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
│   ├── 09_QUESTION_BANK_FILE_IMPORT_STANDARD.md
│   ├── 10_QUESTION_BANK_IMPORT_TEMPLATES.md
│   ├── 11_QUESTION_IMPORT_TEMPLATE_USAGE.md
│   ├── design-guidelines.md
│   ├── assets/deploy-flow-overview.png
│   ├── assets/deploy-flow-overview.svg
│   ├── project-changelog.md
├── Todo List.md
├── CHANGELOG.md
├── AGENTS.md
├── docker-compose.yml
└── README.md
```

## Cách đọc nhanh

### Dev mới — chạy được trong 30 phút

1. [`../README.md`](../README.md) — tổng quan + lệnh chạy BE/FE
2. [`02_SETUP_AND_PROJECT_STRUCTURE.md`](02_SETUP_AND_PROJECT_STRUCTURE.md) — connection string, migration, CORS
3. [`05_API_FRONTEND_INTEGRATION.md`](05_API_FRONTEND_INTEGRATION.md) — nếu làm frontend
4. [`07_DEVELOPMENT_RULES.md`](07_DEVELOPMENT_RULES.md) — trước khi commit

### Đọc sâu — kiến trúc & nghiệp vụ

1. [`01_PROJECT_OVERVIEW.md`](01_PROJECT_OVERVIEW.md) — use case, vai trò user, module
2. [`03_BACKEND_ARCHITECTURE.md`](03_BACKEND_ARCHITECTURE.md) — layer, service, repository
3. [`04_DATABASE_ENTITIES.md`](04_DATABASE_ENTITIES.md) — schema & quan hệ
4. [`05_API_FRONTEND_INTEGRATION.md`](05_API_FRONTEND_INTEGRATION.md) — contract API + SignalR
5. [`../backend/README.md`](../backend/README.md) / [`../frontend/README.md`](../frontend/README.md) — cấu trúc code từng phía

### Theo dõi tiến độ (không đọc để hiểu sản phẩm)

1. [`../Todo List.md`](../Todo%20List.md) — phase đang làm
2. [`apiList.md`](apiList.md) / [`features.md`](features.md) — tick API & chức năng
3. [`06_DEVELOPMENT_ROADMAP.md`](06_DEVELOPMENT_ROADMAP.md) — lộ trình MVP (thiết kế)
4. [`../CHANGELOG.md`](../CHANGELOG.md) — changelog chính
5. [`project-changelog.md`](project-changelog.md) — thay đổi chi tiết theo feature

