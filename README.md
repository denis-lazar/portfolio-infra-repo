# MenuSync Application

This directory contains the core source code for the MenuSync platform, including the frontend, backend, and reverse proxy configurations.

![Application Screenshots](https://via.placeholder.com/800x300?text=MenuSync+App+Interface+Screenshots)

## 📦 Components

- [**Frontend**](./frontend): A modern React single-page application built with TypeScript and Vite.
- [**Backend**](./backend): A high-performance FastAPI service handling REST APIs and WebSocket connections.
- [**NGINX**](./nginx): Custom Ingress and proxy configurations for local and production routing.

---

## 🛠️ Local Development

The easiest way to run MenuSync locally is using Docker Compose. This starts the Frontend, Backend, MongoDB, and Redis in a single network.

### Prerequisites
- Docker
- Docker Compose

### Quick Start
1. Navigate to this directory:
   ```bash
   cd Application
   ```
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000`
   - **API Docs (Swagger):** `http://localhost:8000/docs`

---

## 🐳 Dockerization

The application is fully containerized for consistent deployment across environments.

### Dockerfiles
- `backend/Dockerfile`: Multi-stage build for the Python service.
- `frontend/Dockerfile`: (Optional, often served via Nginx)
- `nginx/Dockerfile`: Custom Nginx image for the Ingress controller.

### Docker Compose Services
- `db`: MongoDB 7.0 (Persistent data).
- `redis`: Redis 7.4 (WebSocket Pub/Sub).
- `backend`: FastAPI service (Port 8000).
- `frontend`: React dev server (Port 3000).

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pip install -r requirements.txt
pytest
```

### Frontend Tests
```bash
cd frontend
npm install
npm test
```

---

## 📡 Real-Time Sync Logic

1. **Manager Update:** A restaurant manager toggles an ingredient status in the React UI.
2. **API Request:** The Frontend sends a `PUT` request to the FastAPI backend.
3. **Database Update:** Backend updates the MongoDB document.
4. **Redis Pub:** Backend publishes a message to a Redis channel.
5. **WebSocket Push:** All connected clients (customers) receive the update instantly through an open WebSocket connection.

---

## 📂 Sub-Directories

- [**frontend/**](./frontend): React + TypeScript + Vite.
- [**backend/**](./backend): FastAPI + MongoDB + Redis.
- [**nginx/**](./nginx): Nginx proxy configurations.
