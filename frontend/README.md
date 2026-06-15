# EduGuard Frontend

Single-page application (SPA) của **EduGuard** — giao diện web cho Admin, Teacher và Student: quản lý lớp, bài tập, đề thi, làm bài online, giám sát anti-cheat và nhận thông báo realtime.

> Giới thiệu tổng thể repo: [`../README.md`](../README.md) · Tiến độ triển khai: [`../Todo List.md`](../Todo%20List.md)

---

## Vai trò trong hệ thống

```txt
Browser (React SPA)  ──HTTP /api──►  ASP.NET Core API
                   └──WebSocket /hubs──►  SignalR (notification, exam monitoring)
```

Frontend không lưu business logic lõi — gọi REST API, lắng nghe SignalR, quản lý session JWT trên client và điều hướng theo role.

---

## Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| UI | React 19, JSX |
| Build | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| HTTP | Axios (`src/api/axiosClient.js`) |
| Realtime | `@microsoft/signalr` |
| Charts | Recharts (dashboard) |

---

## Cấu trúc `src/`

```txt
src/
├── api/                 # Client REST theo domain (auth, classroom, exam, attempt, anti-cheat…)
├── features/            # Màn hình & logic theo nghiệp vụ
│   ├── auth/            # Login, register
│   ├── classrooms/      # Danh sách, chi tiết, tham gia lớp
│   ├── assignments/     # Giao bài, nộp bài
│   ├── exams/           # Tạo/sửa đề, câu hỏi, publish
│   ├── exam-attempts/   # Làm bài, timer, auto-submit
│   ├── anti-cheat/      # Panel giám sát attempt (teacher)
│   ├── dashboard/       # Dashboard theo role
│   ├── notifications/   # Listener thông báo realtime
│   └── users/           # Profile, quản lý user (admin)
├── signalr/             # Kết nối hub notification & exam monitoring
├── routes/              # `AppRoutes`, `routeConfig`, path theo role
├── components/          # Layout (AppShell, Sidebar), form, dashboard UI
├── hooks/               # `useAuth`, `useTheme`, `useToast`
└── utils/               # Token storage, format date, helpers
```

Routing tách path theo role (`/admin/...`, `/teacher/...`, `/student/...`) — xem `routes/routeConfig.js`.

---

## Chạy local

### Yêu cầu

- Node.js 18+
- Backend EduGuard chạy HTTPS tại `https://localhost:7168` (profile mặc định)

### Cài đặt

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Mở **http://localhost:5173**.

Vite proxy (trong `vite.config.js`):

| Path | Target |
|------|--------|
| `/api/*` | `https://127.0.0.1:7168` |
| `/hubs/*` | `https://127.0.0.1:7168` (WebSocket) |

Axios mặc định dùng `baseURL = "/api"` — request đi qua proxy, không cần CORS thủ công khi dev.

### Build & preview

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Tích hợp API & auth

- Token lưu localStorage qua `utils/tokenStorage.js`
- Mọi request gắn `Authorization: Bearer {accessToken}` (interceptor trong `axiosClient.js`)
- 401 → xóa token và redirect `/login`
- Chi tiết contract API, refresh token, SignalR: [`../docs/05_API_FRONTEND_INTEGRATION.md`](../docs/05_API_FRONTEND_INTEGRATION.md)

Biến môi trường tùy chọn (file `.env` trong `frontend/`):

```env
# Mặc định "/api" — dùng Vite proxy khi dev
VITE_API_BASE_URL=/api
```

---

## SignalR

| Hub | File client | Mục đích |
|-----|-------------|----------|
| `/hubs/notifications` | `signalr/notificationConnection.js` | Thông báo theo user/role |
| `/hubs/exam-monitoring` | `signalr/examMonitoringConnection.js` | Cảnh báo anti-cheat realtime cho giáo viên |

Kết nối dùng access token; trong dev đi qua proxy `ws: true`.

---

## UI & design

- Design system và checklist UI: [`../docs/design-guidelines.md`](../docs/design-guidelines.md)
- Token màu / typography gốc: [`../design.md`](../design.md) (nếu có ở root)
- Theme sáng/tối: `hooks/useTheme.jsx`

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`../docs/05_API_FRONTEND_INTEGRATION.md`](../docs/05_API_FRONTEND_INTEGRATION.md) | Axios, JWT, SignalR, lỗi API |
| [`../docs/design-guidelines.md`](../docs/design-guidelines.md) | Chuẩn component & layout |
| [`../docs/apiList.md`](../docs/apiList.md) | Danh sách endpoint (checklist) |
| [`../docs/features.md`](../docs/features.md) | Checklist chức năng BE/FE |
