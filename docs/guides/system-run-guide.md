# Hướng dẫn chạy hệ thống EduGuard — đủ các cách

> **Mục đích:** Tài liệu tổng hợp mọi cách khởi động và vận hành EduGuard trên máy dev — từ làm bài cơ bản đến giám sát live đa camera, AI phát hiện gian lận, và các chế độ mạng (LAN / Tailscale / Tunnel).  
> **Nhánh tham chiếu:** `devD` · **Ngày:** 2026-06-26  
> **Nền tảng:** Windows + PowerShell 5.x (lệnh dùng `;` thay `&&`)

---

## Mục lục

1. [Tổng quan thành phần](#1-tổng-quan-thành-phần)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Setup lần đầu (bắt buộc)](#3-setup-lần-đầu-bắt-buộc)
4. [Bảng chọn nhanh — chạy gì?](#4-bảng-chọn-nhanh--chạy-gì)
5. [Cách 1 — Dev cơ bản (localhost)](#5-cách-1--dev-cơ-bản-localhost)
6. [Cách 2 — Backend qua Visual Studio / IIS Express](#6-cách-2--backend-qua-visual-studio--iis-express)
7. [Cách 3 — Redis](#7-cách-3--redis)
8. [Cách 4 — Frontend production preview](#8-cách-4--frontend-production-preview)
9. [Cách 5 — LiveKit SFU (giám sát đa camera)](#9-cách-5--livekit-sfu-giám-sát-đa-camera)
10. [Cách 6 — AI Proctoring (YOLO)](#10-cách-6--ai-proctoring-yolo)
11. [Cách 7 — Chế độ mạng giám sát](#11-cách-7--chế-độ-mạng-giám-sát)
12. [Cách 8 — Chạy đủ stack (full proctoring)](#12-cách-8--chạy-đủ-stack-full-proctoring)
13. [Chạy test & kiểm tra sức khỏe](#13-chạy-test--kiểm-tra-sức-khỏe)
14. [URL & cổng mặc định](#14-url--cổng-mặc-định)
15. [Troubleshooting](#15-troubleshooting)
16. [Tài liệu liên quan](#16-tài-liệu-liên-quan)

---

## 1. Tổng quan thành phần

| Thành phần | Công nghệ | Cổng mặc định | Bắt buộc? |
|------------|-----------|---------------|-----------|
| **Backend API** | ASP.NET Core 8 | `5157` (HTTP), `7168` (HTTPS) | **Có** |
| **Frontend** | React 19 + Vite 8 | `5173` | **Có** |
| **Database** | SQL Server + EF Core | instance riêng | **Có** |
| **SignalR** | WebSocket hubs | qua API `/hubs/*` | Tự động khi API + FE chạy |
| **Redis** | Cache, presence, watch-lock | `6379` | Khuyến nghị (có thể tắt) |
| **LiveKit SFU** | Docker | `7880` WS, `50000-50100` UDP | Chỉ khi giám sát live đa camera |
| **coturn (TURN)** | Docker | `3478` UDP/TCP | Chỉ khi GV/SV khác mạng internet |
| **AI Proctoring** | FastAPI + YOLO | `8800` | Tùy chọn |

```txt
┌─────────────┐     /api, /hubs     ┌──────────────────┐
│  Frontend   │ ◄─────────────────► │  EduGuard.Api    │
│  :5173      │                     │  :5157           │
└─────────────┘                     └────────┬─────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────┐
              ▼                              ▼                      ▼
        SQL Server                      Redis (opt)           LiveKit :7880 (opt)
                                                                    │
                                                              AI Service :8800 (opt)
```

---

## 2. Yêu cầu hệ thống

| Công cụ | Phiên bản | Kiểm tra |
|---------|-----------|----------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.x | `dotnet --version` |
| [Node.js](https://nodejs.org/) | 18+ | `node --version` |
| [Git](https://git-scm.com/) | mới | `git --version` |
| **SQL Server** | Express / LocalDB | SSMS hoặc `sqlcmd -L` |
| **EF Core CLI** | global tool | `dotnet ef --version` |
| **Docker Desktop** | WSL2 backend (Windows) | `docker version` |
| **Python 3.11** | cho AI local | `python --version` |

Cài EF tool nếu chưa có:

```powershell
dotnet tool install --global dotnet-ef
```

---

## 3. Setup lần đầu (bắt buộc)

Chỉ cần làm **một lần** sau khi clone repo.

### 3.1 Clone và cài dependency

```powershell
Set-Location D:\Projects\EduGuard
git checkout devD
npm install
Set-Location frontend
npm install
Set-Location ..
```

### 3.2 SQL Server

1. Tạo database (ví dụ `EduGuardExam`).
2. Sửa `ConnectionStrings:DefaultConnection` trong `backend/EduGuard.Api/appsettings.json`.
3. Tạo override local:

```powershell
Copy-Item backend\EduGuard.Api\appsettings.Development.example.json backend\EduGuard.Api\appsettings.Development.json
```

4. Chỉnh lại connection string trong `appsettings.Development.json`.

Ví dụ:

```json
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=EduGuardExam;Trusted_Connection=True;TrustServerCertificate=True;"
```

### 3.3 Migration database

```powershell
Set-Location D:\Projects\EduGuard\backend
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

### 3.4 Seed tài khoản dev

```powershell
Set-Location D:\Projects\EduGuard
dotnet run --project backend\scripts\SeedDevUsers
```

Tài khoản test: [`dev-login-accounts.md`](dev-login-accounts.md) — mật khẩu chung `Test@12345`.

### 3.5 File env frontend

```powershell
Copy-Item frontend\.env.example frontend\.env
```

---

## 4. Bảng chọn nhanh — chạy gì?

| Mục đích | Cần chạy |
|----------|----------|
| Làm bài thi, lớp học, chấm điểm | API + Frontend + SQL |
| Thông báo realtime, anti-cheat push | + đăng nhập JWT (SignalR tự qua proxy) |
| Cache đề thi, presence online | + Redis |
| Giám sát live 1 SV (P2P) | API + FE + Redis khuyến nghị |
| Giám sát live nhiều SV (SFU) | + LiveKit Docker + `LiveKit:Enabled=true` |
| Phát hiện điện thoại/sách (AI) | + Python/Docker AI service `:8800` |
| GV/SV cùng Wi‑Fi, URL IP | + script `use-lan.cmd` |
| GV/SV cùng Wi‑Fi, **domain HTTPS đẹp** | + `use-tunnel.cmd` **(Admin)** — gồm `.env`, `livekit.yaml`, firewall LAN |
| GV xem từ nhà (không mở port) | + Tailscale + `use-tailscale.cmd` |
| Production internet (domain) | + Cloudflare tunnel + `use-tunnel.cmd` + TURN |

---

## 5. Cách 1 — Dev cơ bản (localhost)

**Phù hợp:** Làm bài thi, quản lý lớp, anti-cheat log cơ bản, SignalR thông báo.

### Terminal 1 — Backend (profile HTTP, khớp Vite proxy)

```powershell
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http
```

Hoặc không chỉ định profile (mặc định HTTPS + HTTP):

```powershell
dotnet run
```

### Terminal 2 — Frontend

```powershell
Set-Location D:\Projects\EduGuard\frontend
npm run dev
```

### Truy cập

| URL | Mục đích |
|-----|----------|
| http://localhost:5173/login | Ứng dụng web |
| http://localhost:5157/swagger | API docs |
| http://localhost:5157/api/Test | Smoke test → `{ "message": "EduGuard API is running" }` |

Đăng nhập: `teacher1@eduguard.test` / `Test@12345`

### Ghi chú proxy Vite

- `/api` và `/hubs` được proxy tới `http://127.0.0.1:5157` (xem `frontend/vite.config.js`).
- Override backend URL: `$env:VITE_DEV_API_TARGET="http://127.0.0.1:5157"` trước `npm run dev`.
- **Khuyến nghị:** Dùng profile **http** `:5157` để khớp proxy; tránh gọi trực tiếp `https://localhost:7168` khi frontend dev qua proxy HTTP.

---

## 6. Cách 2 — Backend qua Visual Studio / IIS Express

### Visual Studio 2022

1. Mở `backend/EduGuard.slnx`.
2. Set startup project: **EduGuard.Api**.
3. Chọn profile:
   - **http** → `http://localhost:5157` (khớp Vite)
   - **https** → `https://localhost:7168`
4. Nhấn F5 hoặc Run.

Nếu dùng profile HTTPS, cập nhật `frontend/.env`:

```env
VITE_API_BASE_URL=https://localhost:7168/api
```

và bật CORS cho origin frontend trong backend.

### IIS Express

Profile **IIS Express** trong `launchSettings.json`:

- HTTP: `http://localhost:29840`
- HTTPS: `https://localhost:44397`

Cần chỉnh `VITE_DEV_API_TARGET` hoặc `VITE_API_BASE_URL` cho khớp port IIS Express.

---

## 7. Cách 3 — Redis

Redis **không bắt buộc** cho làm bài cơ bản. Bật khi cần cache, presence, watch-lock proctoring P2P.

### Cách A — Redis local (Docker)

```powershell
docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine
```

Trong `backend/EduGuard.Api/appsettings.Development.json` hoặc `.env`:

```env
ConnectionStrings__Redis=localhost:6379
Redis__Enabled=true
```

### Cách B — Redis Cloud

Paste connection string vào `ConnectionStrings:Redis` (qua `appsettings.Development.json` hoặc `.env`).

### Cách C — Tắt Redis (dev đơn giản)

```json
"Redis": { "Enabled": false }
```

### Kiểm tra

```powershell
dotnet run --project backend\scripts\RedisPing
```

Log API khi start thành công: `Redis connection established.`

---

## 8. Cách 4 — Frontend production preview

Build static và preview như production (không có Vite proxy — cần CORS hoặc reverse proxy).

```powershell
Set-Location D:\Projects\EduGuard\frontend
npm run build
npm run preview
```

Preview mặc định tại `http://localhost:4173`. Set `VITE_API_BASE_URL` trỏ thẳng tới API production/staging khi build:

```powershell
$env:VITE_API_BASE_URL="https://api.example.com/api"
npm run build
```

---

## 9. Cách 5 — LiveKit SFU (giám sát đa camera)

**Phù hợp:** Giáo viên xem nhiều học sinh cùng lúc (Google Meet style).

### Bước 1 — Docker LiveKit (+ coturn nếu cần TURN)

> **Quan trọng:** Chạy từ `infra/livekit`, không phải `infra/`.

```powershell
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d
```

Kiểm tra:

```powershell
curl http://localhost:7880
docker ps
```

### Bước 2 — Bật LiveKit trên backend

**Cách 1:** `appsettings.Development.json`

```json
"LiveKit": {
  "Enabled": true,
  "Url": "ws://localhost:7880",
  "ApiKey": "devkey",
  "ApiSecret": "eduguard-dev-livekit-secret"
}
```

**Cách 2:** File `.env` (khuyến nghị khi đổi host thường xuyên)

```powershell
Copy-Item backend\EduGuard.Api\.env.example backend\EduGuard.Api\.env
```

### Bước 3 — Restart API

```powershell
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http
```

### Bước 4 — Xác nhận

`GET http://localhost:5157/api/proctoring/sfu-config` (cần Bearer token) → `enabled: true`, `url: ws://localhost:7880`.

### Tắt SFU (fallback P2P)

Đặt `LiveKit:Enabled: false` → client dùng WebRTC P2P qua SignalR (1 stream / 1 cặp GV–SV).

Chi tiết: [`../proctoring/proctoring-sfu-setup.md`](../proctoring/proctoring-sfu-setup.md)

---

## 10. Cách 6 — AI Proctoring (YOLO)

**Phù hợp:** Phát hiện điện thoại, sách, nhiều khuôn mặt qua frame upload.

### Cách A — Python local (venv)

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
Copy-Item .env.example .env
# Chỉnh PROCTORING_MODEL=yolo26s.pt (hoặc yolo26n.pt trên CPU yếu)
.\run.ps1
```

Lần đầu `run.ps1` tự tạo `.venv` và cài `requirements.txt`.

Hoặc thủ công:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
```

### Cách B — Docker

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
docker compose up -d --build
curl http://127.0.0.1:8800/health
```

### Cấu hình backend

URL mặc định sau migration: `http://127.0.0.1:8800`. Admin cấu hình thêm tại `/admin/proctoring-ai`.

Chi tiết: [`ai-services/proctoring-ai-service/README.md`](../../ai-services/proctoring-ai-service/README.md)

---

## 11. Cách 7 — Chế độ mạng giám sát

Khi học sinh/giáo viên **không** mở `localhost` — cần cấu hình IP/domain và firewall.

| Chế độ | Khi nào | Script | HS cần cài gì? |
|--------|---------|--------|----------------|
| **localhost** | Dev trên 1 máy | Không cần script | Không |
| **LAN** | Cùng Wi‑Fi trường | `scripts\proctoring-network\use-lan.cmd` | Không |
| **LAN + domain đẹp** | Cùng Wi‑Fi, HS mở URL HTTPS | `use-tunnel.cmd` **(Admin)** | Không |
| **Tailscale** | Khác mạng, cùng tailnet | `scripts\proctoring-network\use-tailscale.cmd` | Tailscale |
| **Tunnel** | Domain production | `scripts\proctoring-network\use-tunnel.cmd` | Không |

### Script tự động cấu hình `.env`

Các script ghi `frontend/.env`, `backend/EduGuard.Api/.env`, và `infra/livekit/livekit.yaml` (khi có LiveKit):

```powershell
# LAN — tự detect IP Wi-Fi/Ethernet (không tự mở firewall)
scripts\proctoring-network\use-lan.cmd

# Tailscale — cần tailscale up trước (không tự mở firewall)
scripts\proctoring-network\use-tailscale.cmd

# Tunnel hybrid — wss://livekit.wpcteam.homes + TURN + firewall LAN (nếu Admin)
scripts\proctoring-network\use-tunnel.cmd
```

Sau khi chạy script: **restart Vite + API**.

| Script | Tự mở firewall LAN? | Ghi chú |
|--------|---------------------|---------|
| `use-lan.cmd` | Không | Chạy thêm `open-lan-firewall.cmd` (Admin) |
| `use-tailscale.cmd` | Không | Tailscale không cần mở port router |
| `use-tunnel.cmd` | **Có** (khi chạy Admin) | Một lệnh: `.env` + `livekit.yaml` + firewall + restart LiveKit |

### LAN — thêm bước firewall

Chế độ **LAN thuần** (`use-lan.cmd`) **không** tự mở firewall. Chạy **Run as administrator**:

```powershell
scripts\proctoring-network\open-lan-firewall.cmd
```

Nếu đã chạy `use-tunnel.cmd` **as Administrator** và thấy `[OK] Firewall: ...` — **không cần** chạy lại `open-lan-firewall.cmd`.

HS/GV mở: `http://<IP-LAN>:5173` (ví dụ `http://10.20.4.154:5173`).

Lấy IP:

```powershell
Get-NetIPAddress -InterfaceAlias Wi-Fi -AddressFamily IPv4
```

### LAN nhưng muốn domain đẹp (hybrid — khuyến nghị trong trường)

**Mục tiêu:** HS mở `https://class.wpcteam.homes` (hoặc domain riêng) thay vì `http://10.x.x.x:5173`, vẫn cùng Wi‑Fi, camera UDP ổn định.

**Cách hoạt động:**

| Luồng | Đi đâu |
|-------|--------|
| Web + API (HTTPS) | Cloudflare Tunnel → `localhost:5173` / proxy `/api` |
| LiveKit signaling | `wss://livekit.wpcteam.homes` → tunnel → `localhost:7880` |
| Media camera (UDP) | Trực tiếp trên LAN khi đã mở firewall UDP `50000-50100` |

> **Không** trộn `https://` web với `ws://` LiveKit IP — trình duyệt chặn mixed content. Chế độ hybrid dùng **cả hai qua HTTPS/WSS** (tunnel).

**Bước làm:**

1. Cấu hình Cloudflare Zero Trust — Public Hostname:

   | Hostname | Service URL |
   |----------|-------------|
   | `class.wpcteam.homes` | `http://localhost:5173` |
   | `livekit.wpcteam.homes` | `http://localhost:7880` |

2. Một lệnh cấu hình hybrid (chuột phải **Run as administrator**):

   ```cmd
   scripts\proctoring-network\use-tunnel.cmd
   ```

   Script tự: ghi `.env` (tunnel + TURN), `livekit.yaml` (`node_ip` = IP Wi‑Fi), mở firewall LAN (TCP `5173`/`5157`/`7880`, UDP `50000–50100`), bật Redis local nếu cần, restart LiveKit.

   Nếu **không** chạy Admin và script báo `[WARN] Firewall LAN: can quyen Administrator`, chạy thêm:

   ```cmd
   scripts\proctoring-network\open-lan-firewall.cmd
   ```

3. Khởi động stack → restart `Cloudflared` → kiểm tra:

   ```cmd
   scripts\proctoring-network\check-tunnel.cmd
   ```

4. HS/GV mở: **`https://class.wpcteam.homes`**

**Lưu ý:** Cần máy chủ chạy **cloudflared** (connector) và internet để tunnel hoạt động; traffic media vẫn ưu tiên LAN khi HS cùng Wi‑Fi. Chi tiết: [`../proctoring/proctoring-network-modes.md`](../proctoring/proctoring-network-modes.md) mục 3.

### LAN + domain nội bộ (không Cloudflare)

Nếu trường có **DNS nội bộ** (không cần internet/tunnel):

1. IT thêm bản ghi A: `thi.truong.edu.vn` → `10.20.4.154` (IP máy chủ Wi‑Fi).
2. Chạy `use-lan.cmd`, rồi sửa `.env` thay IP bằng hostname:

   **`frontend/.env`**

   ```env
   VITE_LIVEKIT_URL=ws://thi.truong.edu.vn:7880
   ```

   **`backend/EduGuard.Api/.env`**

   ```env
   LiveKit__Url=ws://thi.truong.edu.vn:7880
   Cors__AllowedOrigins__1=http://thi.truong.edu.vn:5173
   ```

3. Thêm hostname vào `frontend/vite.config.js` → `server.allowedHosts`.
4. `open-lan-firewall.cmd` (Admin).
5. HS mở: `http://thi.truong.edu.vn:5173` (HTTP — chưa có HTTPS nội bộ trừ khi IT cấp chứng chỉ).

| Cách | Domain | HTTPS | Cần internet | Cần sửa từng máy HS |
|------|--------|-------|--------------|---------------------|
| Hybrid tunnel + LAN | `class.wpcteam.homes` | Có | Có (tunnel) | Không |
| DNS nội bộ | `thi.truong.edu.vn` | Không* | Không | Không (nếu dùng DNS trường) |
| File `hosts` | tùy chọn | Không | Không | **Có** — không khuyến nghị cho lớp lớn |
| Tailscale MagicDNS | `maychu.tailscale.net` | Không | Có | Cài Tailscale |

\* HTTPS nội bộ: dùng `mkcert` hoặc chứng chỉ AD — ngoài phạm vi mặc định repo.

### Tunnel — thứ tự khởi động

```powershell
# 1. LiveKit + coturn
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d

# 2. API
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http

# 3. Frontend
Set-Location D:\Projects\EduGuard\frontend
npm run dev

# 4. Kiểm tra tunnel
scripts\proctoring-network\check-tunnel.cmd
```

### Kết thúc buổi LAN

```powershell
# Admin
scripts\proctoring-network\close-lan.cmd
```

Chi tiết: [`../proctoring/proctoring-network-modes.md`](../proctoring/proctoring-network-modes.md)

---

## 12. Cách 8 — Chạy đủ stack (full proctoring)

**Phù hợp:** Test E2E giám sát live + AI + Redis trên mạng LAN.

### Thứ tự khuyến nghị

```powershell
# 1. Redis (nếu chưa chạy)
docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine

# 2. LiveKit + coturn
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d

# 3. Cấu hình mạng (chọn một)
Set-Location D:\Projects\EduGuard
scripts\proctoring-network\use-lan.cmd
# hoặc: use-tailscale.cmd / use-tunnel.cmd

# 4. AI service (terminal riêng)
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
.\run.ps1

# 5. API (terminal riêng)
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http

# 6. Frontend (terminal riêng)
Set-Location D:\Projects\EduGuard\frontend
npm run dev
```

### Luồng test nghiệp vụ

1. Đăng nhập GV → tạo đề có **live proctoring**.
2. SV đăng nhập → bắt đầu attempt → bật camera.
3. GV mở `/teacher/exams/{examId}/proctoring`.
4. Admin kiểm tra `/admin/proctoring-ai` nếu test AI.

Chi tiết E2E: [`../proctoring/dev-test-proctoring-e2e.md`](../proctoring/dev-test-proctoring-e2e.md)

---

## 13. Chạy test & kiểm tra sức khỏe

### Test backend (toàn repo)

```powershell
Set-Location D:\Projects\EduGuard
npm test
```

Tương đương:

```powershell
dotnet test backend\EduGuard.Api\EduGuard.Api.slnx
```

Husky pre-commit cũng chạy `npm test` trước mỗi commit.

### Lint frontend

```powershell
Set-Location D:\Projects\EduGuard\frontend
npm run lint
```

### Smoke checklist

| Kiểm tra | Lệnh / URL |
|----------|------------|
| API sống | `curl http://localhost:5157/api/Test` |
| Swagger | http://localhost:5157/swagger |
| Frontend | http://localhost:5173 |
| Redis | `dotnet run --project backend\scripts\RedisPing` |
| LiveKit | `curl http://localhost:7880` |
| AI service | `curl http://127.0.0.1:8800/health` |
| SFU config | `GET /api/proctoring/sfu-config` (Bearer) |
| SignalR | DevTools → WS `/hubs/notifications` → status 101 |

---

## 14. URL & cổng mặc định

| Dịch vụ | URL / Cổng |
|---------|------------|
| Frontend dev | http://localhost:5173 |
| Frontend preview | http://localhost:4173 |
| API HTTP | http://localhost:5157 |
| API HTTPS | https://localhost:7168 |
| Swagger | http://localhost:5157/swagger |
| SignalR notifications | ws://localhost:5157/hubs/notifications |
| SignalR exam-monitoring | ws://localhost:5157/hubs/exam-monitoring |
| LiveKit WS | ws://localhost:7880 |
| LiveKit media | UDP 50000–50100 |
| coturn TURN | UDP/TCP 3478 |
| Redis | localhost:6379 |
| AI Proctoring | http://127.0.0.1:8800 |
| IIS Express HTTP | http://localhost:29840 |

---

## 15. Troubleshooting

### `no configuration file provided: not found` (Docker)

Chạy `docker compose` từ `infra/livekit/`, không phải `infra/`.

### Docker Desktop không chạy

Mở Docker Desktop, đợi engine ready. SFU/Redis container cần Docker; làm bài cơ bản không cần.

### API build fail — file locked

Dừng process cũ:

```powershell
Get-Process EduGuard.Api -ErrorAction SilentlyContinue | Stop-Process -Force
```

### SQL connection failed

Kiểm tra SQL Server service, tên instance, TCP/IP, database đã tạo.

### Frontend API 502 / ECONNREFUSED

- API chưa chạy hoặc sai port — dùng profile **http** `:5157`.
- Hoặc set `VITE_DEV_API_TARGET` khớp port API.

### `sfu-config` → `enabled: false`

- `LiveKit:Enabled=true` trong Development hoặc `.env`.
- Restart API sau khi sửa config.

### LiveKit WS failed / không có video

- `docker ps` có container livekit.
- Firewall UDP `50000-50100`.
- SV đã bật camera và attempt in-progress.

### Redis connection failed

Sửa `ConnectionStrings:Redis` hoặc `Redis:Enabled: false` trong Development.

### AI detect không hoạt động

- `curl http://127.0.0.1:8800/health`
- Admin `/admin/proctoring-ai`: bật YOLO, URL đúng.
- Lần đầu tải model `.pt` có thể mất vài phút.

Checklist đầy đủ hơn: [`../development/local-dev-setup-checklist.md`](../development/local-dev-setup-checklist.md)

---

## 16. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`../../README.md`](../../README.md) | Quick start repo |
| [`../development/local-dev-setup-checklist.md`](../development/local-dev-setup-checklist.md) | Checklist setup máy mới |
| [`../proctoring/proctoring-sfu-setup.md`](../proctoring/proctoring-sfu-setup.md) | LiveKit SFU chi tiết |
| [`../proctoring/proctoring-network-modes.md`](../proctoring/proctoring-network-modes.md) | LAN / Tailscale / Tunnel |
| [`dev-login-accounts.md`](dev-login-accounts.md) | Tài khoản test |
| [`../proctoring/dev-test-proctoring-e2e.md`](../proctoring/dev-test-proctoring-e2e.md) | Test E2E proctoring |
| [`../architecture/setup-and-project-structure.md`](../architecture/setup-and-project-structure.md) | Cấu trúc dự án |
| [`../development/deploy-workflow.md`](../development/deploy-workflow.md) | Deploy staging/production |
| [`../../backend/README.md`](../../backend/README.md) | Backend chi tiết |
| [`../../frontend/README.md`](../../frontend/README.md) | Frontend chi tiết |
| [`../../ai-services/proctoring-ai-service/README.md`](../../ai-services/proctoring-ai-service/README.md) | AI service |

---

## Checklist in nhanh

- [ ] .NET 8 + Node + SQL Server + `dotnet-ef`
- [ ] `npm install` (root + frontend)
- [ ] Connection string + `appsettings.Development.json`
- [ ] `dotnet ef database update`
- [ ] `dotnet run --project backend\scripts\SeedDevUsers`
- [ ] `Copy-Item frontend\.env.example frontend\.env`
- [ ] API `:5157` + frontend `:5173` — login OK
- [ ] *(Redis)* local / cloud / hoặc `Enabled: false`
- [ ] *(SFU)* Docker LiveKit + `LiveKit:Enabled: true`
- [ ] *(AI)* Python/Docker `:8800`
- [ ] *(Mạng)* `use-lan.cmd` / `use-tailscale.cmd` / `use-tunnel.cmd` (tunnel: **Admin**; LAN thuần: thêm `open-lan-firewall.cmd`)
