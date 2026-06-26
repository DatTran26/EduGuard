# Giám sát live — chọn chế độ mạng

| Chế độ | Khi nào dùng | Mở port router? | HS cần cài gì? |
|--------|----------------|-----------------|----------------|
| **LAN** | GV + HS cùng Wi‑Fi trường | Không | Không |
| **Tailscale** | GV/HS khác mạng nhưng cùng tailnet | Không | **Tailscale** (cùng tài khoản/org) |
| **Tunnel + TURN** | Production, internet công cộng | Có (router nhà / VPS) | Không |

Chi tiết SFU: `docs/PROCTORING_SFU_SETUP.md`

---

## 1. LAN (cùng Wi‑Fi) — đang dùng ở trường

GV và HS mở:

```
http://10.20.4.154:5173
```

(Lấy IP mới: `Get-NetIPAddress -InterfaceAlias Wi-Fi -AddressFamily IPv4`)

`.env` mẫu:

```env
VITE_LIVEKIT_URL=ws://10.20.4.154:7880
LiveKit__Url=ws://10.20.4.154:7880
Cors__AllowedOrigins__1=http://10.20.4.154:5173
```

> Không dùng `https://class.wpcteam.homes` khi LiveKit là `ws://` — mixed content.

**Kết thúc buổi (tắt LAN):** chuột phải **Run as administrator** → `scripts\proctoring-network\close-lan.cmd`  
→ tắt 4 firewall rule + `docker compose stop` LiveKit/coturn. API/Vite vẫn cần **Ctrl+C** trong terminal nếu đang chạy.

**Mở lại firewall lần sau:** `open-lan-firewall.cmd` (Admin) → `use-lan.cmd` → `docker compose up -d`.

---

## 2. Tailscale (không cần mở port router)

Máy chủ và máy client (GV, hoặc HS thử nghiệm) **cùng tailnet** Tailscale. Traffic đi qua mạng ảo `100.x.x.x`, không cần port forward.

### Bước A — Máy chủ (máy chạy Docker + API + Vite)

1. Cài [Tailscale](https://tailscale.com/download) và đăng nhập.
2. Lấy IP tailnet:

```powershell
tailscale ip -4
```

Ví dụ máy hiện tại: **`100.86.244.117`**

3. Bật trong Windows: **Allow incoming connections** (Tailscale tray → Preferences).

4. Firewall (cho phép qua Tailscale / Private):

```powershell
New-NetFirewallRule -DisplayName "EduGuard Vite 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName "EduGuard API 5157" -Direction Inbound -Protocol TCP -LocalPort 5157 -Action Allow
New-NetFirewallRule -DisplayName "LiveKit WS 7880" -Direction Inbound -Protocol TCP -LocalPort 7880 -Action Allow
New-NetFirewallRule -DisplayName "LiveKit Media UDP" -Direction Inbound -Protocol UDP -LocalPort 50000-50100 -Action Allow
```

### Bước B — Máy client (GV ở nhà, hoặc HS trong pilot)

1. Cài Tailscale, **cùng tailnet** (cùng email/org với máy chủ).
2. Mở trình duyệt:

```
http://100.86.244.117:5173
```

(Thay bằng `tailscale ip -4` của **máy chủ**, không phải máy client.)

### Bước C — `.env` (chế độ Tailscale)

Comment block **LAN**, bật block **Tailscale**:

**`frontend/.env`**

```env
VITE_LIVEKIT_URL=ws://100.86.244.117:7880
```

**`backend/EduGuard.Api/.env`**

```env
LiveKit__Url=ws://100.86.244.117:7880
Cors__AllowedOrigins__1=http://100.86.244.117:5173
```

Chỉ cần STUN (TURN tắt) — tailnet thường đủ cho WebRTC.

Restart Vite + API sau khi đổi.

### Bước D — Kiểm tra

```powershell
# Trên máy client (đã cài Tailscale)
ping 100.86.244.117
curl http://100.86.244.117:5157/api/Test
```

Vào phòng giám sát → DevTools → WS tới `ws://100.86.244.117:7880`.

### Hạn chế Tailscale

| Ưu | Nhược |
|----|--------|
| Không mở port router | Mỗi HS phải cài Tailscale (khó trong thi thật) |
| GV xem từ nhà được | Tailnet cần quản lý (org/policy) |
| IP `100.x` ổn định theo máy | Không thay thế production công cộng |

**Gợi ý:** Tailscale cho **dev + GV remote**; thi trong trường dùng **LAN**; production dùng **tunnel + TURN**.

### (Tuỳ chọn) MagicDNS

Nếu bật MagicDNS trong admin Tailscale, có thể dùng hostname thay IP:

```
http://<tên-máy-chủ>.tailscale.net:5173
VITE_LIVEKIT_URL=ws://<tên-máy-chủ>.tailscale.net:7880
```

---

## 3. Tunnel + firewall LAN (domain + camera trong trường)

Dùng khi muốn HS mở **`https://class.wpcteam.homes`** nhưng camera vẫn UDP trực tiếp trên Wi‑Fi.

### Cấu hình Cloudflare (Public Hostname)

Trong **Zero Trust → Networks → Tunnels → Published application** (không chọn Workers VPC):

| Public hostname | Service URL |
|-----------------|-------------|
| `class.wpcteam.homes` | `http://localhost:5173` |
| `livekit.wpcteam.homes` | `http://localhost:7880` |

> `http://localhost:...` trên Cloudflare **được** — không cần đổi `127.0.0.1` nếu chỉ còn **một connector** sống.

### `.env`, LiveKit media IP, và firewall

Một lệnh (tự lấy IP Wi‑Fi, ghi `livekit.yaml`, bật firewall LAN nếu chạy Admin, restart LiveKit):

```cmd
scripts\proctoring-network\use-tunnel.cmd
```

Script cập nhật:

| File | Nội dung |
|------|----------|
| `frontend/.env` | `VITE_LIVEKIT_URL=wss://livekit.wpcteam.homes` |
| `backend/EduGuard.Api/.env` | `LiveKit__Url`, CORS, TURN |
| `infra/livekit/livekit.yaml` | `use_external_ip: false`, `node_ip: <IP-Wi-Fi>` — UDP camera trên LAN |

Nếu firewall báo cần Admin, chạy thêm (chuột phải **Run as administrator**):

```cmd
scripts\proctoring-network\open-lan-firewall.cmd
```

### Thứ tự khởi động

```powershell
# 1. LiveKit + coturn
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d

# 2. API + Vite (giữ terminal mở)
Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http

Set-Location D:\Projects\EduGuard\frontend
npm run dev

# 3. Sau khi origin lên — restart tunnel (Admin PowerShell)
Restart-Service Cloudflared
```

### Kiểm tra nhanh

```cmd
scripts\proctoring-network\check-tunnel.cmd
```

### Sửa lỗi 502 Bad Gateway

**Hay gặp nhất:** local `http://localhost:5173` OK nhưng domain **lúc 502 lúc được** → nhiều **connector** trên cùng tunnel (máy cũ đã tắt vẫn đăng ký).

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels** → chọn tunnel
2. Tab **Connectors** → **xóa** connector máy khác / **Inactive**
3. Chỉ giữ connector máy đang chạy `npm run dev` + `docker compose`
4. `Restart-Service Cloudflared` (Admin PowerShell)

Chạy `scripts\proctoring-network\check-tunnel.cmd` — phải **6/6 OK** liên tiếp.

| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| Lúc 502 lúc 200 | Nhiều connector | Xóa connector cũ (bước trên) |
| Domain 502 liên tục, local OK | Connector cũ hoặc origin chưa lên | Xóa connector + khởi động stack trước tunnel |
| Domain 502, local FAIL | Vite/API/Docker chưa chạy | `docker compose up -d`, `dotnet run`, `npm run dev` |
| Web mở, đăng nhập lỗi | API `:5157` chưa chạy | `dotnet run` backend |
| Web OK, không camera | Thiếu firewall UDP | Chạy lại `use-tunnel.cmd` (Admin) hoặc `open-lan-firewall.cmd` |
| Vẫn lỗi sau khi xóa connector | Service SYSTEM không reach origin | Đổi Service URL → `http://<IP-WiFi>:5173` (vd `10.20.4.154`) |

---

## 4. Tunnel + router nhà (production internet)

1. `VITE_LIVEKIT_URL=wss://livekit.wpcteam.homes`
2. `LiveKit__Url=wss://livekit.wpcteam.homes`
3. Bật lại `WebRtc__IceServers__1__*` (TURN / coturn)
4. `Cors`: `https://class.wpcteam.homes`
5. Cloudflare Published app → `http://localhost:7880`
6. Router: forward UDP **3478**, UDP **50000–50100**

---

## Khởi động stack (chung)

```powershell
Set-Location D:\Projects\EduGuard\infra\livekit
docker compose up -d

Set-Location D:\Projects\EduGuard\backend\EduGuard.Api
dotnet run --launch-profile http

Set-Location D:\Projects\EduGuard\frontend
npm run dev
```

## Bảng chuyển chế độ nhanh

Chạy từ repo (double-click hoặc CMD):

```cmd
scripts\proctoring-network\use-lan.cmd
scripts\proctoring-network\use-tailscale.cmd
scripts\proctoring-network\use-tunnel.cmd              REM .env + livekit.yaml + firewall LAN (Admin)
scripts\proctoring-network\open-lan-firewall.cmd       REM chi can voi use-lan / use-tailscale, hoac use-tunnel khong Admin
scripts\proctoring-network\close-lan.cmd               REM tat firewall LAN + docker stop (Admin)
scripts\proctoring-network\check-tunnel.cmd            REM kiem tra tunnel + origin + 502
```

Script tự lấy IP Wi‑Fi / `tailscale ip -4` và ghi `frontend/.env` + `backend/EduGuard.Api/.env`.

| | LAN | Tailscale | Tunnel |
|--|-----|-----------|--------|
| Lệnh | `use-lan.cmd` | `use-tailscale.cmd` | `use-tunnel.cmd` |
| Tự cập nhật `livekit.yaml` | Có | Có | Có (IP Wi-Fi cho UDP LAN) |
| Tự mở firewall LAN (Admin) | Không | Không | **Có** |
| `VITE_LIVEKIT_URL` | `ws://<Wi-Fi-IP>:7880` | `ws://<100.x>:7880` | `wss://livekit.wpcteam.homes` |
| URL web | `http://<IP>:5173` | `http://<100.x>:5173` | `https://class.wpcteam.homes` |
| TURN | Tắt | Tắt | Bật |
