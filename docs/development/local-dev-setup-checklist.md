# Checklist cấu hình dev local — EduGuard

> **Mục đích:** Liệt kê mọi thứ cần cấu hình trên máy mới (fresh clone) để EduGuard chạy bình thường — từ làm bài cơ bản đến giám sát live đa camera (LiveKit SFU).  
> **Nhánh tham chiếu:** `devD` · **Ngày:** 2026-06-26

---

## Tóm tắt nhanh

| Mức độ | Cần gì |
|--------|--------|
| **Làm bài thi cơ bản** | .NET 8, Node 18+, SQL Server, connection string, migration, seed user, chạy API + frontend |
| **Thông báo / anti-cheat realtime** | SignalR (tự hoạt động qua Vite proxy `/hubs`) — cần đăng nhập JWT |
| **Cache / presence / watch-lock** | Redis (`Redis:Enabled=true`) — có thể tắt để dev đơn giản |
| **Giám sát live đa camera (SFU)** | Docker Desktop + LiveKit (`infra/livekit`) + `LiveKit:Enabled=true` |
| **AI phát hiện điện thoại/sách** | Python service tùy chọn (`ai-services/proctoring-ai-service`) |
| **GV–SV khác mạng (NAT)** | TURN (coturn) — **chưa bật** trong repo, chỉ STUN Google |

---

## 1. Prerequisites (cài trước khi clone)

| Công cụ | Phiên bản khuyến nghị | Bắt buộc? | Kiểm tra |
|---------|----------------------|-----------|----------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.x | **Có** | `dotnet --version` |
| [Node.js](https://nodejs.org/) | 18+ (repo dùng npm 11) | **Có** | `node --version` |
| [Git](https://git-scm.com/) | mới | **Có** | `git --version` |
| **SQL Server** | Express / LocalDB / instance riêng | **Có** | SSMS hoặc `sqlcmd -L` |
| **EF Core CLI** | global tool | **Có** (migration) | `dotnet ef --version` |
| **Docker Desktop** | mới, WSL2 backend (Windows) | Chỉ SFU / AI Docker | `docker version` |
| **Python 3.11** | cho AI service local | Tùy chọn | `python --version` |

Cài EF tool nếu chưa có:

```powershell
dotnet tool install --global dotnet-ef
```

---

## 2. Các bước setup (theo thứ tự)

### Bước 0 — Clone & dependency

```powershell
Set-Location D:\Projects\EduGuard
git checkout devD
npm install
Set-Location frontend
npm install
Set-Location ..
```

### Bước 1 — SQL Server & connection string

1. Tạo database (ví dụ `EduGuardExam`) trên SQL Server local.
2. Sửa `ConnectionStrings:DefaultConnection` trong **`backend/EduGuard.Api/appsettings.json`** cho đúng instance máy bạn.

   Ví dụ:

   ```json
   "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=EduGuardExam;Trusted_Connection=True;TrustServerCertificate=True;"
   ```

3. Tạo file override local (file này **không** được commit — đã có trong `.gitignore`):

   ```powershell
   Copy-Item backend\EduGuard.Api\appsettings.Development.example.json backend\EduGuard.Api\appsettings.Development.json
   ```

4. Mở `appsettings.Development.json` và chỉnh lại `DefaultConnection` (và Redis/LiveKit nếu cần — xem mẫu trong file example đã cập nhật).

### Bước 2 — Migration database

```powershell
Set-Location D:\Projects\EduGuard\backend
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

Migration quan trọng gần đây: `AddLiveProctoringEntities` (bảng proctoring, LiveKit, AI settings).

### Bước 3 — Seed tài khoản dev

```powershell
Set-Location D:\Projects\EduGuard
dotnet run --project backend\scripts\SeedDevUsers
```

Chi tiết tài khoản: [`docs/guides/dev-login-accounts.md`](dev-login-accounts.md) — mật khẩu chung `Test@12345`.

### Bước 4 — Redis (khuyến nghị, có thể bỏ qua tạm)

**Trạng thái trong repo:** `Redis:Enabled: true` mặc định; `appsettings.json` có connection string Redis Cloud của team (có thể không dùng được trên máy bạn).

**Chọn một trong ba:**

| Cách | Lệnh / cấu hình |
|------|-----------------|
| **A. Redis local (Docker)** | `docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine` → trong `appsettings.Development.json`: `"Redis": "localhost:6379"` |
| **B. Redis Cloud** | Tạo DB free, paste connection string vào `ConnectionStrings:Redis` |
| **C. Tắt Redis dev** | Trong `appsettings.Development.json`: `"Redis": { "Enabled": false }` — app vẫn chạy, mất cache + presence + watch-lock Redis |

Kiểm tra Redis (khi bật):

```powershell
dotnet run --project backend\scripts\RedisPing
```

Log API khi start: `Redis connection established.`

### Bước 5 — Frontend env

```powershell
Copy-Item frontend\.env.example frontend\.env
```

Mặc định đủ cho dev:

- `VITE_API_BASE_URL=/api` — Vite proxy tới `http://127.0.0.1:5157`
- `VITE_DEV_LOG=true` — log dev (tùy chọn tắt)
- `VITE_LIVEKIT_URL` — **tùy chọn**; khi host web từ máy khác, set `ws://IP_SERVER:7880` (hoặc `wss://` production). Bỏ trống → lấy từ API, fallback `ws://localhost:7880`.

**Backend `.env`** (tùy chọn, Redis + LiveKit URL phía API):

```powershell
Copy-Item backend\EduGuard.Api\.env.example backend\EduGuard.Api\.env
```

Không cần cấu hình LiveKit URL trên frontend nếu API đã trả URL đúng — `VITE_LIVEKIT_URL` chỉ override phía browser.

### Bước 6 — Chạy API + Frontend

**Terminal API** (profile HTTP khớp Vite proxy):

```powershell
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http
```

| URL | Mục đích |
|-----|----------|
| http://localhost:5157/swagger | API docs |
| GET http://localhost:5157/api/Test | Smoke test |

**Terminal Frontend:**

```powershell
Set-Location D:\Projects\EduGuard\frontend
npm run dev
```

Mở http://localhost:5173/login — đăng nhập `teacher1@eduguard.test` / `Test@12345`.

> **Lưu ý:** Nếu build API báo file bị lock (`EduGuard.Api.exe`), dừng process cũ (Task Manager / `Stop-Process`) hoặc đóng Visual Studio đang chạy debug.

### Bước 7 — LiveKit SFU (chỉ khi cần giám sát live đa camera)

**Docker bắt buộc** cho SFU. **Phải** chạy từ đúng thư mục:

```powershell
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d
```

Kiểm tra:

```powershell
curl http://localhost:7880
```

Backend (`appsettings.Development.json`):

```json
"LiveKit": {
  "Enabled": true,
  "Url": "ws://localhost:7880",
  "ApiKey": "devkey",
  "ApiSecret": "eduguard-dev-livekit-secret"
}
```

Khớp với `infra/livekit/livekit.yaml` (`keys: devkey: secret`).

Xác nhận: `GET http://localhost:5157/api/proctoring/sfu-config` (cần Bearer token) → `enabled: true`, `url: ws://localhost:7880`.

Chi tiết: [`docs/proctoring/proctoring-sfu-setup.md`](proctoring-sfu-setup.md)

### Bước 8 — AI Proctoring (tùy chọn)

Chỉ cần khi test phát hiện điện thoại/sách qua YOLO.

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
Copy-Item .env.example .env
# Chỉnh PROCTORING_MODEL=yolo26s.pt (hoặc yolo26n.pt trên CPU yếu)
.\run.ps1
```

URL mặc định trong DB sau migration: `http://127.0.0.1:8800`. Admin cấu hình thêm tại `/admin/proctoring-ai`.

---

## 3. Bảng thành phần

| Thành phần | Bắt buộc? | Trạng thái trong repo | Bạn phải cấu hình | Cách verify |
|------------|-----------|----------------------|-------------------|-------------|
| **SQL Server** | Có | Connection string mẫu `TRANDAT\SQLEXPRESS` (máy tác giả) | Instance + DB name của bạn | Migration OK, API start |
| **appsettings.Development.json** | Có | **Không commit** — chỉ có `.example` | Copy + sửa connection string | File tồn tại local |
| **EF migrations** | Có | 19 migration trong `Infrastructure/Data/Migrations` | Chạy `dotnet ef database update` | Bảng `AspNetUsers`, `ProctoringAiSettings` |
| **Seed dev users** | Có (để login) | Script `backend/scripts/SeedDevUsers` | Chạy một lần sau migration | Login `student1@eduguard.test` |
| **JWT** | Có | Có sẵn trong `appsettings.json` (dev key) | Không (dev) | Login trả accessToken |
| **CORS** | Có | `http://localhost:5173` | Không nếu dùng Vite proxy | Frontend gọi API OK |
| **Frontend `.env`** | Có | `.env.example` tracked; `.env` gitignore | `Copy-Item .env.example .env` | `npm run dev` OK |
| **Vite proxy** | Có | `/api` + `/hubs` → `127.0.0.1:5157` | Chạy API profile **http** `:5157` | Network tab `/api/...` 200 |
| **SignalR** | Có (realtime) | Hubs: `/hubs/notifications`, `/hubs/exam-monitoring` | Đăng nhập (JWT qua `accessTokenFactory`) | DevTools WS `/hubs/...` 101 |
| **Redis** | Khuyến nghị | `Enabled: true`; Cloud URL trong `appsettings.json` | Local Redis, Cloud riêng, hoặc `Enabled: false` | Log `Redis connection established` |
| **LiveKit Docker** | Chỉ SFU | `infra/livekit/`, coturn **comment** | `docker compose up -d` từ `infra/livekit` | `curl localhost:7880` |
| **LiveKit backend** | Chỉ SFU | `LiveKit:Enabled: false` (base), `true` (Development mẫu) | Bật trong `appsettings.Development.json` | `sfu-config` → `enabled: true` |
| **STUN** | SFU/P2P | Google STUN trong `WebRtc:IceServers` | Không (LAN dev) | WebRTC connect OK |
| **TURN (coturn)** | Chỉ khác mạng | **Chưa bật** — comment trong `docker-compose.yml` | Bỏ comment + secret + thêm ICE server | `chrome://webrtc-internals` → `relay` |
| **AI YOLO service** | Không | FastAPI port 8800, seed DB URL | Python venv + `.env` + `run.ps1` | `curl http://127.0.0.1:8800/health` |
| **Upload evidence** | Khi proctoring | `wwwroot/uploads/proctoring` | Tự tạo khi upload | POST evidence 200 |
| **Husky hooks** | Không (runtime) | `npm install` → `prepare` | `core.hooksPath=.husky/_` (tự set) | Chỉ ảnh hưởng commit/push |
| **Docker Desktop** | Chỉ SFU/Redis/AI Docker | — | Bật app trước `docker compose` | `docker ps` |

---

## 4. Hai chế độ sử dụng

### Chỉ cần làm bài thi cơ bản

1. SQL Server + migration + seed users  
2. `appsettings.Development.json` (connection string)  
3. `frontend/.env`  
4. `dotnet run` (API) + `npm run dev` (frontend)  
5. Redis: tắt (`Enabled: false`) hoặc local — **không bắt buộc** cho submit bài  
6. **Không** cần Docker, LiveKit, AI service  

Hoạt động: lớp học, đề thi, làm bài, chấm điểm, anti-cheat log cơ bản, thông báo SignalR.

### Cần giám sát live đa camera (SFU)

Thêm trên các bước trên:

1. **Docker Desktop** đang chạy  
2. `Set-Location infra\livekit` → `docker compose up -d`  
3. `LiveKit:Enabled: true` trong `appsettings.Development.json`  
4. Restart API  
5. Tạo đề có **live proctoring**, SV bật camera, GV mở `/teacher/exams/{examId}/proctoring`  
6. Redis khuyến nghị (watch-lock P2P fallback; SFU multi-tile ít phụ thuộc hơn)  
7. Khác mạng → cần TURN (xem [`docs/proctoring/proctoring-webrtc-nat.md`](proctoring-webrtc-nat.md))

Fallback: đặt `LiveKit:Enabled: false` → client dùng WebRTC P2P qua SignalR (1 stream / 1 GV–SV).

---

## 5. SignalR & auth

| Hub | URL | Auth |
|-----|-----|------|
| Notifications | `/hubs/notifications` | JWT Bearer (header hoặc query `access_token` cho WS) |
| Exam monitoring / proctoring | `/hubs/exam-monitoring` | JWT Bearer |

Frontend: token lấy từ localStorage sau login, gửi qua `accessTokenFactory` (`frontend/src/signalr/signalrConnection.js`).

Vite proxy WebSocket: `vite.config.js` → `/hubs` proxy tới backend (cùng target với `/api`).

Override backend URL (hiếm khi cần): `VITE_DEV_API_TARGET=http://127.0.0.1:5157` khi chạy `npm run dev`.

---

## 6. Redis — cần không? Tắt thì sao?

| Khi `Redis:Enabled: true` + connection OK | Khi tắt hoặc `NullCacheService` |
|-------------------------------------------|----------------------------------|
| Cache câu hỏi đề thi | Luôn đọc DB |
| Cache tổng hợp anti-cheat theo đề | Luôn tính từ DB |
| Presence attempt online | Danh sách online rỗng |
| **Watch-lock** 1 GV / 1 SV (P2P live) | Lock không hoạt động qua Redis (chỉ DB session) |

**Kết luận dev:** Có thể tắt Redis để chạy nhanh; bật lại khi test proctoring P2P watch-lock hoặc load cache.

---

## 7. Troubleshooting

### `no configuration file provided: not found` (Docker)

**Nguyên nhân:** Chạy `docker compose` từ `infra/` thay vì `infra/livekit/`.  
**Sửa:** `Set-Location D:\Projects\EduGuard\infra\livekit` rồi chạy lại.

### Docker Desktop không chạy

**Triệu chứng:** `error during connect: ... dockerDesktopLinuxEngine`.  
**Sửa:** Mở Docker Desktop, đợi engine ready. SFU và Redis container cần Docker; làm bài cơ bản không cần.

### API build fail — file locked

**Triệu chứng:** `Could not copy ... EduGuard.Api.exe ... being used by another process`.  
**Sửa:** Dừng `EduGuard.Api` / IIS Express / VS debug; `Get-Process EduGuard.Api | Stop-Process -Force`.

### SQL connection failed

**Triệu chứng:** `A network-related or instance-specific error...`  
**Sửa:** Kiểm tra SQL Server service, tên instance (`localhost\SQLEXPRESS`), TCP/IP bật, database đã tạo.

### Login 401 / không vào được

- Chạy lại seed: `dotnet run --project backend\scripts\SeedDevUsers`  
- Đúng email/password: xem [`dev-login-accounts.md`](dev-login-accounts.md)

### Frontend API 502 / ECONNREFUSED

- API chưa chạy hoặc sai port — dùng profile **http** port **5157**  
- Hoặc set `VITE_DEV_API_TARGET` khớp port API

### SignalR disconnect / 401

- Token hết hạn — đăng nhập lại  
- Không gọi hub trực tiếp HTTPS `:7168` khi Vite proxy HTTP `:5157` (dùng `/hubs` relative)

### `sfu-config` → `enabled: false`

- `LiveKit:Enabled` trong `appsettings.Development.json`  
- Restart API sau khi sửa config

### LiveKit WS failed / không có video tile

- `docker ps` có container `livekit`  
- Firewall UDP `50000-50100` (Windows có thể chặn)  
- SV đã bật camera + vào attempt in-progress

### Redis connection failed

- Sửa `ConnectionStrings:Redis` hoặc `Redis:Enabled: false` trong Development  
- Test: `dotnet run --project backend\scripts\RedisPing`

### AI detect không hoạt động

- Service chạy: `curl http://127.0.0.1:8800/health`  
- Admin `/admin/proctoring-ai`: bật YOLO, URL đúng  
- Lần đầu tải model `.pt` có thể mất vài phút

### Camera không hiện

- Trình duyệt cấp quyền camera (Chrome: `chrome://settings/content/camera`)  
- Dev local cần `localhost` (không file://)  
- HTTPS không bắt buộc trên localhost

---

## 8. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`../guides/dev-login-accounts.md`](../guides/dev-login-accounts.md) | Tài khoản test |
| [`../proctoring/proctoring-sfu-setup.md`](../proctoring/proctoring-sfu-setup.md) | LiveKit SFU chi tiết |
| [`../proctoring/proctoring-webrtc-nat.md`](../proctoring/proctoring-webrtc-nat.md) | STUN/TURN |
| [`../proctoring/dev-test-proctoring-e2e.md`](../proctoring/dev-test-proctoring-e2e.md) | Test E2E proctoring |
| [`../architecture/setup-and-project-structure.md`](../architecture/setup-and-project-structure.md) | Setup tổng quát |
| [`../../README.md`](../../README.md) | Quick start repo |

---

## 9. Checklist in nhanh (đánh dấu khi xong)

- [ ] .NET 8 + Node + SQL Server + `dotnet-ef`  
- [ ] `npm install` (root + frontend)  
- [ ] Sửa `DefaultConnection` trong `appsettings.json`  
- [ ] Tạo `appsettings.Development.json` từ example  
- [ ] `dotnet ef database update`  
- [ ] `dotnet run --project backend\scripts\SeedDevUsers`  
- [ ] `Copy-Item frontend\.env.example frontend\.env`  
- [ ] Redis: local / cloud / hoặc `Enabled: false`  
- [ ] API `:5157` + frontend `:5173` — login OK  
- [ ] *(SFU)* Docker LiveKit + `LiveKit:Enabled: true`  
- [ ] *(AI)* Python service `:8800` + admin AI settings  
