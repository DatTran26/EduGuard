# EduGuard Proctoring AI Service

FastAPI service for YOLO-based proctoring detection. The ASP.NET API proxies frame uploads to `POST /detect`.

## Run locally

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service

# Lần đầu: tạo venv + cài package
C:\Users\tinti\AppData\Local\Programs\Python\Python311\python.exe -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt

# Mỗi lần chạy (chọn một)
.\run.ps1
# hoặc:
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
```

> Nếu `python` không có trong PATH, dùng đường dẫn đầy đủ tới `python.exe` như trên, hoặc script `run.ps1`.

Default base URL in `ProctoringAiSettings.AiServiceBaseUrl`: `http://127.0.0.1:8800`.

## Model weights (.env)

Copy `.env.example` to `.env` in this folder. `python-dotenv` loads it on startup.

```env
PROCTORING_MODEL=yolo11n.pt
```

Admin UI (`/admin/proctoring-ai`) configures **service URL and thresholds only**, not the `.pt` file.

## Production (Docker)

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
docker compose up -d --build
curl http://127.0.0.1:8800/health
```

Environment:

| Variable | Default | Mô tả |
|----------|---------|--------|
| `PROCTORING_MODEL` | `yolo11n.pt` | Ultralytics weights (tải lần đầu vào volume) |
| `PROCTORING_HOST` | `0.0.0.0` | Bind host |
| `PROCTORING_PORT` | `8800` | Port |
| `PROCTORING_LOG_LEVEL` | `INFO` | Mức log (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `PROCTORING_DETECT_CONF` | `0.25` | Ngưỡng confidence YOLO |
| `PROCTORING_DETECT_IMGSZ` | `640` | Kích thước ảnh inference |

Point the API admin AI settings (or DB `ProctoringAiSettings`) at the service URL reachable from the backend (same VPC, not public internet unless secured).

## WebRTC / NAT

Live video uses WebRTC (not this service). For TURN/STUN across NAT see `docs/proctoring/proctoring-webrtc-nat.md`.

## Response contract

```json
{
  "detectionType": "PhoneVisible",
  "confidence": 0.72,
  "labels": ["cell phone"],
  "message": "optional",
  "boxes": []
}
```

Detection types: `PhoneVisible`, `BookVisible`, `MultipleFaces`, `PersonNotVisible`, `Normal`, `UnsupportedMedia`.
