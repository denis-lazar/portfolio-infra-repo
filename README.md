# MenuSync Application

This directory contains the core source code for the MenuSync platform, including the frontend, backend, and reverse proxy configurations.

## 📸 Screenshots

### 🖥️ User Interface
| Login / Register | Restaurants Discovery | Restaurant Menu |
| :---: | :---: | :---: |
| ![Auth Pages](https://via.placeholder.com/300x200?text=Login+and+Register) | ![Restaurants Page](https://via.placeholder.com/300x200?text=Restaurants+Page) | ![Menu View](https://via.placeholder.com/300x200?text=Restaurant+Menu) |

### 📊 Observability (Monitoring & Logging)
| Grafana Metrics | Kibana Logs |
| :---: | :---: |
| ![Grafana Dashboard](https://via.placeholder.com/450x250?text=Grafana+Monitoring) | ![Kibana Logs](https://via.placeholder.com/450x250?text=Kibana+Logging) |

### 🚀 CI/CD Pipeline & GitOps
| Jenkins Pipeline Flow | ArgoCD Application Tiles |
| :---: | :---: |
| ![Jenkins Pipeline](https://via.placeholder.com/450x250?text=Jenkins+Pipeline) | ![ArgoCD Apps](https://via.placeholder.com/450x250?text=ArgoCD+Applications) |

| Pipeline Alerts (Success/Failure) | ArgoCD Sync Status |
| :---: | :---: |
| ![Jenkins Alerts](https://via.placeholder.com/450x250?text=Success+and+Failure+Alerts) | ![ArgoCD Sync](https://via.placeholder.com/450x250?text=ArgoCD+Sync+Status) |

### 🔔 Notifications & Alerts
| Telegram Notifications | Slack Notifications |
| :---: | :---: |
| ![Telegram Alerts](https://via.placeholder.com/450x250?text=Telegram+Alerts) | ![Slack Alerts](https://via.placeholder.com/450x250?text=Slack+Alerts) |

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

### 🛡️ Security Scanning
We integrate security testing directly into our CI/CD workflow:
- **Bandit:** Scans the Python backend for security misconfigurations and insecure code patterns.
- **Trivy:** Scans container images and project dependencies for known vulnerabilities (CVEs).

---

## 📡 Real-Time Sync Logic

1. **Manager Update:** A restaurant manager toggles an ingredient status in the React UI.
2. **API Request:** The Frontend sends a `PUT` request to the FastAPI backend.
3. **Database Update:** Backend updates the MongoDB document.
4. **Redis Pub:** Backend publishes a message to a Redis channel.
5. **WebSocket Push:** All connected clients (customers) receive the update instantly through an open WebSocket connection.

---

## 📂 Project Structure

```text
Application/
├── backend
│   ├── app
│   ├── pytest.ini
│   ├── README.md
│   ├── requirements.txt
│   ├── seed.py
│   ├── tests
│   └── tests.Dockerfile
├── docker-compose.yml
├── Dockerfile
├── frontend
│   ├── App.tsx
│   ├── components
│   ├── constants.ts
│   ├── index.html
│   ├── index.tsx
│   ├── menusync
│   ├── metadata.json
│   ├── package.json
│   ├── package-lock.json
│   ├── public
│   ├── README.md
│   ├── reports
│   ├── services
│   ├── test-setup.ts
│   ├── tsconfig.json
│   ├── types.ts
│   ├── vite.config.ts
│   └── vitest.config.ts
├── Jenkinsfile
├── Jenkins-key-pair.pem
└── nginx
    ├── Dockerfile
    └── nginx.conf
```

## 📂 Sub-Directories

- [**frontend/**](./frontend): React + TypeScript + Vite.
- [**backend/**](./backend): FastAPI + MongoDB + Redis.
- [**nginx/**](./nginx): Nginx proxy configurations.
