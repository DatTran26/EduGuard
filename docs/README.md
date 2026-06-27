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

## Cấu trúc thư mục

```txt
docs/
├── README.md                 # Mục lục (file này)
├── architecture/             # Tổng quan, setup, kiến trúc, database, API contract
├── development/              # Lộ trình, quy tắc Git, deploy, checklist setup máy mới
├── guides/                   # Hướng dẫn chạy hệ thống, tài khoản dev, cấu hình GPT
├── proctoring/               # LiveKit SFU, WebRTC, chế độ mạng, test E2E giám sát
├── question-bank/            # Chuẩn import ngân hàng câu hỏi & file mẫu
├── design/                   # Design system, UI tech spec, token preview
├── api/                      # Checklist API, features, hướng dẫn test Swagger
├── changelog/                # Lịch sử chi tiết theo feature
├── testing/                  # Test checklists theo module hệ thống
├── sql/                      # Script SQL tiện ích (gán role, v.v.)
└── assets/                   # Hình minh họa (deploy flow, v.v.)
```

**Quy ước tên file:** kebab-case (`development-rules.md`), không prefix số, không `SCREAMING_SNAKE_CASE`.

---

## README vs tài liệu tiến độ

| Loại | File | Mục đích |
|------|------|----------|
| **Giới thiệu hệ thống** | [`../README.md`](../README.md), [`../frontend/README.md`](../frontend/README.md), [`../backend/README.md`](../backend/README.md) | Hệ thống làm gì, cấu trúc, cách chạy — **không** ghi % phase |
| **Checklist tiến độ** | [`../Todo List.md`](../Todo%20List.md) | Trạng thái implementation theo giai đoạn |
| **Checklist API / feature** | [`api/api-list.md`](api/api-list.md), [`api/features.md`](api/features.md) | Tick endpoint và chức năng khi hoàn thành |
| **Thiết kế & kiến trúc** | [`architecture/`](architecture/) | Spec mục tiêu, có thể đi trước code |
| **Changelog chính** | [`../CHANGELOG.md`](../CHANGELOG.md) | Changelog release và thay đổi user-facing |
| **Lịch sử chi tiết** | [`changelog/project-changelog.md`](changelog/project-changelog.md) | Thay đổi theo feature đã ship |

---

## Danh sách tài liệu theo nhóm

### Kiến trúc (`architecture/`)

| File | Nội dung |
|------|----------|
| [`project-overview.md`](architecture/project-overview.md) | Mô tả hệ thống, mục tiêu, chức năng, người dùng, module |
| [`setup-and-project-structure.md`](architecture/setup-and-project-structure.md) | Cấu hình ban đầu, cấu trúc folder, Visual Studio / VS Code |
| [`backend-architecture.md`](architecture/backend-architecture.md) | Kiến trúc backend Controller → Service → Repository |
| [`database-entities.md`](architecture/database-entities.md) | Thiết kế entity/database, nhóm bảng, quan hệ |
| [`api-frontend-integration.md`](architecture/api-frontend-integration.md) | Quy ước API, Axios, JWT, SignalR |

### Phát triển (`development/`)

| File | Nội dung |
|------|----------|
| [`development-roadmap.md`](development/development-roadmap.md) | Lộ trình triển khai MVP theo giai đoạn |
| [`development-rules.md`](development/development-rules.md) | **Bắt buộc đọc** — quy tắc Git, push/ship workflow |
| [`deploy-workflow.md`](development/deploy-workflow.md) | Flow deploy Local → Staging → Prod |
| [`local-dev-setup-checklist.md`](development/local-dev-setup-checklist.md) | Checklist cấu hình máy mới (fresh clone) |

### Hướng dẫn (`guides/`)

| File | Nội dung |
|------|----------|
| [`system-run-guide.md`](guides/system-run-guide.md) | **Hướng dẫn chạy** — mọi cách khởi động hệ thống |
| [`dev-login-accounts.md`](guides/dev-login-accounts.md) | Tài khoản test dev |
| [`gpt-api-configuration.md`](guides/gpt-api-configuration.md) | Cấu hình GPT API |

### Giám sát thi (`proctoring/`)

| File | Nội dung |
|------|----------|
| [`proctoring-sfu-setup.md`](proctoring/proctoring-sfu-setup.md) | LiveKit Docker, TURN/STUN, luồng teacher/student |
| [`proctoring-network-modes.md`](proctoring/proctoring-network-modes.md) | LAN / Tailscale / Tunnel |
| [`proctoring-webrtc-nat.md`](proctoring/proctoring-webrtc-nat.md) | STUN/TURN qua NAT |
| [`proctoring-devb-integration.md`](proctoring/proctoring-devb-integration.md) | Merge nhánh proctoring devB |
| [`dev-test-proctoring-e2e.md`](proctoring/dev-test-proctoring-e2e.md) | Test E2E proctoring |

### Ngân hàng câu hỏi (`question-bank/`)

| File | Nội dung |
|------|----------|
| [`question-bank-file-import-standard.md`](question-bank/question-bank-file-import-standard.md) | Định chuẩn import file |
| [`question-bank-import-templates.md`](question-bank/question-bank-import-templates.md) | Bộ file mẫu 4 loại × 5 định dạng |
| [`question-import-template-usage.md`](question-bank/question-import-template-usage.md) | Hướng dẫn giáo viên dùng file mẫu |

### Thiết kế UI (`design/`)

| File | Nội dung |
|------|----------|
| [`design-guidelines.md`](design/design-guidelines.md) | **Bắt buộc cho UI** — design system, checklist merge |
| [`ui-tech.md`](design/ui-tech.md) | Spec UI/UX khu vực Teacher |
| [`eduguard-design-tokens-preview.html`](design/eduguard-design-tokens-preview.html) | Preview token màu |

### API & checklist (`api/`)

| File | Nội dung |
|------|----------|
| [`api-list.md`](api/api-list.md) | **Checklist** REST endpoint + SignalR hub |
| [`features.md`](api/features.md) | **Checklist** chức năng theo module (BE/FE/DB) |
| [`swagger-api-testing-guide.md`](api/swagger-api-testing-guide.md) | Hướng dẫn test API qua Swagger |

### Khác

| File | Nội dung |
|------|----------|
| [`changelog/project-changelog.md`](changelog/project-changelog.md) | Lịch sử chi tiết theo feature |
| [`testing/test-checklists/`](testing/test-checklists/) | Checklist test theo module hệ thống |
| [`sql/assign-role-teacher.sql`](sql/assign-role-teacher.sql) | Gán role Teacher qua SQL |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Changelog chính theo release |

---

## Bắt buộc đọc (agent & developer)

Trước khi commit, push, hoặc làm feature mới:

1. [`development/development-rules.md`](development/development-rules.md) — quy tắc làm việc, workflow Git
2. [`../Todo List.md`](../Todo%20List.md) — checklist tiến độ hiện tại
3. [`../AGENTS.md`](../AGENTS.md) — chính sách Husky, commit, changelog

Trước khi làm **frontend UI/UX**:

1. [`design/design-guidelines.md`](design/design-guidelines.md) — chuẩn giao diện bắt buộc
2. [`../design.md`](../design.md) — token gốc (colors, typography, components)

---

## Cách đọc nhanh

### Dev mới — chạy được trong 30 phút

1. [`../README.md`](../README.md) — tổng quan + lệnh chạy BE/FE
2. [`architecture/setup-and-project-structure.md`](architecture/setup-and-project-structure.md) — connection string, migration, CORS
3. [`architecture/api-frontend-integration.md`](architecture/api-frontend-integration.md) — nếu làm frontend
4. [`development/development-rules.md`](development/development-rules.md) — trước khi commit

### Đọc sâu — kiến trúc & nghiệp vụ

1. [`architecture/project-overview.md`](architecture/project-overview.md) — use case, vai trò user, module
2. [`architecture/backend-architecture.md`](architecture/backend-architecture.md) — layer, service, repository
3. [`architecture/database-entities.md`](architecture/database-entities.md) — schema & quan hệ
4. [`architecture/api-frontend-integration.md`](architecture/api-frontend-integration.md) — contract API + SignalR
5. [`../backend/README.md`](../backend/README.md) / [`../frontend/README.md`](../frontend/README.md) — cấu trúc code từng phía

### Theo dõi tiến độ (không đọc để hiểu sản phẩm)

1. [`../Todo List.md`](../Todo%20List.md) — phase đang làm
2. [`api/api-list.md`](api/api-list.md) / [`api/features.md`](api/features.md) — tick API & chức năng
3. [`development/development-roadmap.md`](development/development-roadmap.md) — lộ trình MVP (thiết kế)
4. [`../CHANGELOG.md`](../CHANGELOG.md) — changelog chính
5. [`changelog/project-changelog.md`](changelog/project-changelog.md) — thay đổi chi tiết theo feature
