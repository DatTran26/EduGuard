# EduGuard Documentation

Bộ tài liệu này mô tả tổng thể hệ thống **EduGuard – Hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận**.

Hệ thống được thiết kế theo kiến trúc **Client - Server**, sử dụng:

- **Backend:** ASP.NET Core Web API
- **Frontend:** ReactJS + TailwindCSS
- **Database:** SQL Server
- **Cache / Realtime support:** Redis
- **Realtime:** SignalR
- **Authentication:** JWT + Role-based Authorization

## Danh sách tài liệu

| File | Nội dung |
|---|---|
| `01_PROJECT_OVERVIEW.md` | Mô tả hệ thống, mục tiêu, chức năng, người dùng, module và entity tổng quan |
| `02_SETUP_AND_PROJECT_STRUCTURE.md` | Cấu hình ban đầu, cấu trúc folder frontend/backend, cách chạy bằng Visual Studio và VS Code |
| `03_BACKEND_ARCHITECTURE.md` | Kiến trúc backend theo mô hình Controller → Service → Repository → DbContext |
| `04_DATABASE_ENTITIES.md` | Thiết kế entity/database, nhóm bảng, quan hệ dữ liệu chính |
| `05_API_FRONTEND_INTEGRATION.md` | Quy ước API, cách React gọi backend, JWT, Axios, SignalR |
| `06_DEVELOPMENT_ROADMAP.md` | Lộ trình triển khai MVP theo từng giai đoạn |
| `07_REPORT_NOTES.md` | Gợi ý nội dung đưa vào báo cáo đồ án |

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
│   ├── 06_DEVELOPMENT_ROADMAP.md
│   └── 07_REPORT_NOTES.md
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
6. `06_DEVELOPMENT_ROADMAP.md`

