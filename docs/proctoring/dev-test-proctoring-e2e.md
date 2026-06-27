# Hướng dẫn test E2E: Bài thi → Giám sát → Live camera

> Tài khoản dev seed: chạy `dotnet run --project backend/scripts/SeedDevUsers`  
> Mật khẩu chung: **Test@12345**

## 1. Tài khoản test

| Role | Email | Mật khẩu |
|------|-------|----------|
| Admin | admin@eduguard.test | Test@12345 |
| Teacher | teacher1@eduguard.test | Test@12345 |
| Teacher | teacher2@eduguard.test | Test@12345 |
| Student | student1@eduguard.test | Test@12345 |
| Student | student2@eduguard.test | Test@12345 |
| Student | student3@eduguard.test | Test@12345 |

## 2. Cấu hình model YOLO

**Hai lớp cấu hình (khác nhau):**

| Lớp | File / UI | Nội dung |
|-----|-----------|----------|
| **Model weights** | `ai-services/proctoring-ai-service/.env` → `PROCTORING_MODEL=yolo26s.pt` | File `.pt` Ultralytics (detection) |
| **URL + ngưỡng** | Admin → `/admin/proctoring-ai` hoặc DB `ProctoringAiSettings` | `AiServiceBaseUrl`, confidence, interval |

1. Copy env: `Copy-Item ai-services/proctoring-ai-service/.env.example ai-services/proctoring-ai-service/.env`
2. Chỉnh `PROCTORING_MODEL` (khuyến nghị `yolo26s.pt` hoặc `yolo26n.pt` trên CPU).
3. Đăng nhập **admin@eduguard.test** → **Cấu hình AI giám sát** → URL `http://127.0.0.1:8800`, bật YOLO, lưu.

## 3. Dịch vụ cần chạy

```powershell
# Terminal 1 — Redis (nếu chưa chạy)
docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine

# Terminal 2 — API
cd backend\EduGuard.Api
dotnet run

# Terminal 3 — Frontend
cd frontend
npm run dev

# Terminal 4 — AI YOLO (load .env qua shell hoặc set thủ công)
cd ai-services\proctoring-ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# PowerShell: đọc .env
Get-Content .env | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() } }
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
```

Kiểm tra: `curl http://127.0.0.1:8800/health` → `"yolo":"enabled"`.

`appsettings.Development.json` (API): `Redis: localhost:6379`, `Redis.Enabled: true`.

## 4. Chuẩn bị dữ liệu (Teacher1)

Đăng nhập **teacher1@eduguard.test**.

### 4.1. Tạo lớp

1. **Lớp học** → Tạo lớp (vd. `Lop Thi Thu`).
2. Ghi **mã tham gia** (join code).

### 4.2. Cho 3 sinh viên vào lớp

Mở 3 cửa sổ ẩn danh (hoặc 3 trình duyệt):

- `student1@`, `student2@`, `student3@` → **Tham gia lớp** bằng mã.

### 4.3. Tạo đề thi có giám sát live

1. Vào lớp → **Tạo đề thi** / **Đề thi** → tạo đề trong lớp đó.
2. Thêm ít nhất 1 câu hỏi trắc nghiệm.
3. Trong form **Giám sát**, bật:
   - **Bật anti-cheat**
   - **Yêu cầu camera**
   - **Bật phòng giám sát live**
   - (Tuỳ chọn) **Giám sát camera trong lúc thi**
   - (Tuỳ chọn) **Phát hiện dấu hiệu thiết bị ngoài (AI)** — cần AI service chạy
4. Đặt **Thời gian mở đề** = vài phút sau (để test **phòng chờ lobby**), **Thời gian đóng** = sau 1–2 giờ.
5. **Publish** đề.

## 5. Luồng test E2E

### Bước A — Phòng chờ (Student)

1. Student đăng nhập → **Đề thi** → mở đề vừa publish.
2. Nếu chưa tới giờ mở: hệ thống chuyển **Phòng chờ** (`/student/exams/{id}/lobby`).
3. Cho phép **camera** trình duyệt → xem preview → chấp nhận quy tắc.
4. Đợi đến giờ mở hoặc teacher chỉnh `StartTime` đã qua → **Kiểm tra thiết bị** → **Làm bài**.

### Bước B — Làm bài + heartbeat (Student)

1. Trang làm bài: camera chạy nền (nếu bật proctoring).
2. Heartbeat Redis ~30s (key `eduguard:attempt:{id}:presence` trong Redis Insight).
3. (Test anti-cheat) Chuyển tab / thoát fullscreen → log + cảnh báo teacher.

### Bước C — Phòng giám sát live (Teacher)

1. **teacher1** → chi tiết đề → **Mở phòng giám sát** hoặc `/teacher/exams/{examId}/proctoring`.
2. Thấy tile 3 sinh viên đang làm bài.
3. Bật **xem live** trên từng tile (WebRTC — cùng máy/LAN thường dùng STUN mặc định).
4. Thử: **Cảnh báo**, **Tạm dừng** (student → trang Paused), **Tiếp tục**.

### Bước D — AI detection (tuỳ chọn)

1. Admin đã cấu hình URL AI + bật detection trên đề.
2. Student cầm điện thoại trước camera → sau vài giây teacher nhận cảnh báo YOLO.

### Bước E — Admin

- `/admin/monitoring` — tổng quan anti-cheat.
- `/admin/proctoring-ai` — URL service + ngưỡng confidence.

## 6. Redis Insight — key cần thấy

| Key pattern | Khi nào |
|-------------|---------|
| `eduguard:exam:{id}:questions` | Teacher mở ngân hàng câu hỏi đề |
| `eduguard:exam:{id}:anticheat:summary` | Teacher xem tổng hợp gian lận |
| `eduguard:attempt:{id}:presence` | Student đang làm bài |
| `eduguard:exam:{id}:lobby:*` | Student trong phòng chờ |
| `eduguard:proctoring:watch-lock:{attemptId}` | Teacher xem live 1 attempt |

## 7. Xử lý sự cố

| Triệu chứng | Gợi ý |
|-------------|--------|
| Không vào lobby | `StartTime` trong tương lai + chưa bật `requireCamera` / `enableLiveProctoring` |
| Không thấy live video | Cho phép camera; thử cùng máy 2 profile; xem WebRTC console |
| AI luôn Normal | `curl :8800/health`; Admin URL đúng; bật `enableExternalDeviceDetection` |
| Redis không có key | `Redis.Enabled=true`, server chạy, connection string đúng |
| 403 proctoring | User phải là owner đề (`teacher1` tạo đề) hoặc Admin |

## 8. Seed lại tài khoản

```powershell
dotnet run --project backend\scripts\SeedDevUsers
```

Script idempotent: user đã tồn tại thì chỉ cập nhật role/profile, không reset mật khẩu.
