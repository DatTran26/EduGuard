from __future__ import annotations

import io
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

app = FastAPI(title="EduGuard Proctoring AI Service", version="0.2.0")

try:
    from ultralytics import YOLO

    MODEL = YOLO("yolo11n.pt")
    HAS_YOLO = True
except Exception:
    MODEL = None
    HAS_YOLO = False

PHONE_LABELS = {"cell phone", "phone", "mobile phone"}
BOOK_LABELS = {"book"}
PERSON_LABEL = "person"


def _classify(labels: list[str], confidences: list[float]) -> dict[str, Any]:
    if not labels:
        return {
            "detectionType": "PersonNotVisible",
            "confidence": 0.75,
            "labels": [],
            "message": "Không thấy người trong khung hình.",
        }

    label_set = {label.lower() for label in labels}
    max_conf = max(confidences) if confidences else 0.0

    if label_set.intersection(PHONE_LABELS):
        return {
            "detectionType": "PhoneVisible",
            "confidence": round(max_conf, 4),
            "labels": labels,
            "message": "Có dấu hiệu thiết bị cầm tay.",
        }

    if label_set.intersection(BOOK_LABELS):
        return {
            "detectionType": "BookVisible",
            "confidence": round(max_conf, 4),
            "labels": labels,
            "message": "Có dấu hiệu tài liệu trong khung hình.",
        }

    person_count = sum(1 for label in labels if label.lower() == PERSON_LABEL)
    if person_count > 1:
        return {
            "detectionType": "MultipleFaces",
            "confidence": round(max_conf, 4),
            "labels": labels,
            "message": "Có nhiều người trong khung hình.",
        }

    return {
        "detectionType": "Normal",
        "confidence": round(max_conf, 4),
        "labels": labels,
        "message": "Không phát hiện dấu hiệu vượt ngưỡng.",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "yolo": "enabled" if HAS_YOLO else "stub"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)) -> JSONResponse:
    content_type = file.content_type or ""
    if "image" not in content_type:
        return JSONResponse(
            {
                "detectionType": "UnsupportedMedia",
                "confidence": 0.0,
                "labels": [],
                "message": "Chỉ hỗ trợ ảnh.",
            }
        )

    raw = await file.read()
    if not HAS_YOLO:
        return JSONResponse(
            {
                "detectionType": "Normal",
                "confidence": 0.12,
                "labels": [],
                "message": "YOLO chưa cài — trả stub Normal.",
            }
        )

    image = Image.open(io.BytesIO(raw)).convert("RGB")
    results = MODEL.predict(image, verbose=False)
    labels: list[str] = []
    confidences: list[float] = []
    boxes: list[dict[str, Any]] = []

    for result in results:
        names = result.names or {}
        for box in result.boxes or []:
            class_id = int(box.cls[0])
            label = str(names.get(class_id, class_id))
            confidence = float(box.conf[0])
            labels.append(label)
            confidences.append(confidence)
            xyxy = box.xyxy[0].tolist()
            boxes.append(
                {
                    "label": label,
                    "confidence": round(confidence, 4),
                    "x1": round(xyxy[0], 2),
                    "y1": round(xyxy[1], 2),
                    "x2": round(xyxy[2], 2),
                    "y2": round(xyxy[3], 2),
                }
            )

    payload = _classify(labels, confidences)
    payload["boxes"] = boxes
    return JSONResponse(payload)
