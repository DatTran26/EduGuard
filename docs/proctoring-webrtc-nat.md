# WebRTC qua NAT — cấu hình STUN/TURN cho Live Proctoring

> **Mục đích:** Hướng dẫn E2E WebRTC khi giáo viên và sinh viên không cùng mạng LAN (NAT/firewall).  
> **API:** `GET /api/proctoring/webrtc-config` trả `iceServers` từ `appsettings.json` → `WebRtc:IceServers`.

## 1. Khi nào cần TURN

| Kịch bản | STUN đủ? | Ghi chú |
|----------|----------|---------|
| Dev local (cùng máy / LAN) | Thường đủ | Mặc định `stun:stun.l.google.com:19302` |
| Sinh viên + GV khác mạng, symmetric NAT | **Cần TURN** | Relay media qua server |
| Production qua HTTPS + tunnel | **Nên có TURN** | Tránh ICE failed ngẫu nhiên |

## 2. Cấu hình backend

Thêm vào `backend/EduGuard.Api/appsettings.json` (hoặc biến môi trường / secret store production):

```json
"WebRtc": {
  "IceServers": [
    {
      "Urls": [ "stun:stun.l.google.com:19302" ]
    },
    {
      "Urls": [ "turn:turn.example.com:3478", "turns:turn.example.com:5349" ],
      "Username": "eduguard",
      "Credential": "REPLACE_WITH_TURN_SECRET"
    }
  ]
}
```

- `Username` / `Credential` chỉ gửi khi có giá trị (API không trả key null).
- Không commit secret TURN vào repo — dùng User Secrets hoặc env trên server.

## 3. Gợi ý triển khai TURN (coturn)

```bash
# Ví dụ Docker coturn (thay domain + secret)
docker run -d --name coturn -p 3478:3478/udp -p 5349:5349 \
  -e TURN_REALM=eduguard.local \
  instrumentisto/coturn
```

Hoặc dịch vụ managed: Twilio TURN, Metered, Cloudflare Calls (nếu dùng stack tương thích).

## 4. Kiểm tra E2E

1. Backend + frontend chạy; Redis bật nếu dùng watch lock.
2. Sinh viên: lobby → device check → làm bài (camera bật).
3. Giáo viên: `/teacher/exams/{examId}/proctoring` → bật tile live.
4. DevTools → tab **WebRTC internals** (Chrome): xác nhận candidate `relay` khi qua TURN.
5. Nếu ICE failed: kiểm tra firewall UDP 3478, credential TURN, và HTTPS mixed content.

## 5. AI service (YOLO) qua NAT

Detection không dùng WebRTC — client gửi frame tới `POST /api/attempts/{id}/proctoring/detect` (backend proxy).

Production:

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
docker compose up -d --build
```

Cập nhật `ProctoringAiSettings.AiServiceBaseUrl` (admin UI hoặc DB) trỏ tới URL nội bộ/VPN của container (vd. `http://proctoring-ai:8800`).

## 6. Checklist sau merge devB/devD

- [ ] `dotnet ef database update` (migration `AddLiveProctoringEntities`)
- [ ] `WebRtc` + TURN trên staging
- [ ] AI service Docker trên cùng VPC với API
- [ ] E2E: matrix `create-exam` → bật proctoring → lobby → control room
