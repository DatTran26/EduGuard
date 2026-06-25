# EduGuard Proctoring AI Service

FastAPI stub for YOLO-based proctoring detection. The ASP.NET API proxies frame uploads to `POST /detect`.

## Run locally

```powershell
Set-Location D:\Projects\EduGuard\ai-services\proctoring-ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
```

Default base URL configured in `ProctoringAiSettings.AiServiceBaseUrl`: `http://127.0.0.1:8800`.

## Response contract

```json
{
  "detectionType": "PhoneVisible",
  "confidence": 0.72,
  "labels": ["cell phone"],
  "message": "optional"
}
```

Detection types used by the API gateway: `PhoneVisible`, `BookVisible`, `MultipleFaces`, `Normal`.
