# EduGuard Proctoring AI Service

FastAPI service for YOLO-based proctoring detection. The ASP.NET API proxies frame uploads to `POST /detect`.

## Run locally

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
```

Default base URL in `ProctoringAiSettings.AiServiceBaseUrl`: `http://127.0.0.1:8800`.

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

Point the API admin AI settings (or DB `ProctoringAiSettings`) at the service URL reachable from the backend (same VPC, not public internet unless secured).

## WebRTC / NAT

Live video uses WebRTC (not this service). For TURN/STUN across NAT see `docs/proctoring-webrtc-nat.md`.

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
