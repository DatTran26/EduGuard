from __future__ import annotations

import io
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

SERVICE_ROOT = Path(__file__).resolve().parent
SHARED_MODELS_DIR = SERVICE_ROOT.parent / "models"
LOG = logging.getLogger("proctoring_ai")


def configure_logging() -> None:
    level_name = os.environ.get("PROCTORING_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )
    logging.getLogger("uvicorn.access").setLevel(level)


configure_logging()


def resolve_model_path(raw: str) -> str:
    path = Path(raw)
    if path.is_file():
        return str(path.resolve())

    candidates = (
        SERVICE_ROOT / raw,
        SHARED_MODELS_DIR / raw,
        SHARED_MODELS_DIR / path.name,
    )
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate.resolve())

    return raw


MODEL_PATH = resolve_model_path(os.environ.get("PROCTORING_MODEL", "yolo11n.pt"))
DETECT_CONF = float(os.environ.get("PROCTORING_DETECT_CONF", "0.25"))
DETECT_IMGSZ = int(os.environ.get("PROCTORING_DETECT_IMGSZ", "640"))

try:
    from ultralytics import YOLO

    MODEL = YOLO(MODEL_PATH)
    HAS_YOLO = True
    _YOLO_LOAD_ERROR: str | None = None
except Exception as exc:
    MODEL = None
    HAS_YOLO = False
    _YOLO_LOAD_ERROR = str(exc)

PHONE_LABELS = {"cell phone", "phone", "mobile phone"}
BOOK_LABELS = {"book"}
PERSON_LABEL = "person"


def _person_confidences(labels: list[str], confidences: list[float]) -> list[float]:
    return [
        confidences[index]
        for index, label in enumerate(labels)
        if label.lower() == PERSON_LABEL
    ]


def _classify(labels: list[str], confidences: list[float]) -> dict[str, Any]:
    person_confs = _person_confidences(labels, confidences)
    max_person_conf = max(person_confs) if person_confs else 0.0

    if not person_confs:
        return {
            "detectionType": "PersonNotVisible",
            "confidence": round(max(confidences) if confidences else 0.75, 4),
            "labels": labels,
            "message": "Không thấy người trong khung hình.",
        }

    label_set = {label.lower() for label in labels}
    max_conf = max(confidences) if confidences else max_person_conf

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

    if len(person_confs) > 1:
        return {
            "detectionType": "MultipleFaces",
            "confidence": round(max_person_conf, 4),
            "labels": labels,
            "message": "Có nhiều người trong khung hình.",
        }

    return {
        "detectionType": "Normal",
        "confidence": round(max_person_conf, 4),
        "labels": labels,
        "message": "Không phát hiện dấu hiệu vượt ngưỡng.",
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    LOG.info(
        "Starting proctoring AI service model=%s conf=%.2f imgsz=%d yolo=%s path=%s",
        Path(MODEL_PATH).name,
        DETECT_CONF,
        DETECT_IMGSZ,
        "enabled" if HAS_YOLO else "stub",
        MODEL_PATH,
    )
    if _YOLO_LOAD_ERROR:
        LOG.warning("YOLO model failed to load: %s", _YOLO_LOAD_ERROR)
    yield
    LOG.info("Shutting down proctoring AI service")


app = FastAPI(title="EduGuard Proctoring AI Service", version="0.3.1", lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path not in {"/detect", "/health"}:
        return await call_next(request)

    started = time.perf_counter()
    client = request.client.host if request.client else "unknown"
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    LOG.info(
        "%s %s client=%s status=%s elapsed_ms=%.1f",
        request.method,
        request.url.path,
        client,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "yolo": "enabled" if HAS_YOLO else "stub",
        "model": Path(MODEL_PATH).name if HAS_YOLO else "",
    }


@app.post("/detect")
async def detect(request: Request, file: UploadFile = File(...)) -> JSONResponse:
    filename = file.filename or "unknown"
    content_type = file.content_type or ""
    client = request.client.host if request.client else "unknown"

    if "image" not in content_type:
        LOG.warning(
            "Unsupported media client=%s filename=%s content_type=%s",
            client,
            filename,
            content_type or "missing",
        )
        return JSONResponse(
            {
                "detectionType": "UnsupportedMedia",
                "confidence": 0.0,
                "labels": [],
                "message": "Chỉ hỗ trợ ảnh.",
            }
        )

    raw = await file.read()
    LOG.debug(
        "Detect request client=%s filename=%s content_type=%s bytes=%d",
        client,
        filename,
        content_type,
        len(raw),
    )

    if not HAS_YOLO:
        LOG.warning(
            "YOLO unavailable — returning stub Normal client=%s filename=%s bytes=%d",
            client,
            filename,
            len(raw),
        )
        return JSONResponse(
            {
                "detectionType": "Normal",
                "confidence": 0.12,
                "labels": [],
                "message": "YOLO chưa cài — trả stub Normal.",
            }
        )

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        LOG.exception(
            "Failed to decode image client=%s filename=%s content_type=%s bytes=%d",
            client,
            filename,
            content_type,
            len(raw),
        )
        return JSONResponse(
            {
                "detectionType": "UnsupportedMedia",
                "confidence": 0.0,
                "labels": [],
                "message": "Không đọc được ảnh.",
            },
            status_code=400,
        )

    width, height = image.size
    inference_started = time.perf_counter()
    try:
        results = MODEL.predict(
            image,
            conf=DETECT_CONF,
            imgsz=DETECT_IMGSZ,
            verbose=False,
        )
    except Exception:
        LOG.exception(
            "YOLO inference failed client=%s filename=%s size=%dx%d",
            client,
            filename,
            width,
            height,
        )
        return JSONResponse(
            {
                "detectionType": "Normal",
                "confidence": 0.0,
                "labels": [],
                "message": "Lỗi inference — trả Normal an toàn.",
            },
            status_code=500,
        )

    inference_ms = (time.perf_counter() - inference_started) * 1000
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

    LOG.info(
        "Detect result client=%s filename=%s size=%dx%d bytes=%d "
        "type=%s confidence=%.4f labels=%s boxes=%d inference_ms=%.1f",
        client,
        filename,
        width,
        height,
        len(raw),
        payload["detectionType"],
        payload["confidence"],
        labels or [],
        len(boxes),
        inference_ms,
    )

    return JSONResponse(payload)
