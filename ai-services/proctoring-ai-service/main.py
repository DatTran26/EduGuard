from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="EduGuard Proctoring AI Service", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)) -> JSONResponse:
    # Stub response for integration testing. Replace with YOLO inference in production.
    content_type = file.content_type or ""
    detection_type = "Normal"
    confidence = 0.12

    if "image" not in content_type:
        detection_type = "UnsupportedMedia"
        confidence = 0.0

    return JSONResponse(
        {
            "detectionType": detection_type,
            "confidence": confidence,
            "labels": [],
            "message": "Stub detector — wire Ultralytics YOLO for production.",
        }
    )
