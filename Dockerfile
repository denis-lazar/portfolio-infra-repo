# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app-frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_CDN_URL=/
ENV VITE_CDN_URL=$VITE_CDN_URL
RUN npm run build

# --- Stage 2: Final Monolith Image ---
FROM python:3.11-slim
WORKDIR /code

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./app/
COPY backend/seed.py .
COPY backend/pytest.ini .

# We copy to /code/static. 
# NOTE: For the volume to work in Compose, we must ensure this directory is 
# populated. In production/K8s, the container uses these files directly.
COPY --from=frontend-builder /app-frontend/dist ./static

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/code

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]