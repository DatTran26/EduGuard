FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

ENV PROCTORING_MODEL=yolo11n.pt
ENV PROCTORING_HOST=0.0.0.0
ENV PROCTORING_PORT=8800

EXPOSE 8800

CMD ["sh", "-c", "uvicorn main:app --host ${PROCTORING_HOST} --port ${PROCTORING_PORT}"]
