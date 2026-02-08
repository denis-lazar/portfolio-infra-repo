# MenuSync Application

This directory contains the core source code for the MenuSync platform, including the frontend, backend, and reverse proxy configurations.

## 📸 Screenshots

### 🖥️ User Interface
|           Login / Register           |        Restaurants Discovery         |                                              Restaurant Menu                                               |
| :----------------------------------: | :----------------------------------: | :--------------------------------------------------------------------------------------------------------: |
| ![Login](docs/images/Pasted%20image%2020260208012825.png) | ![Search](docs/images/Pasted%20image%2020260208012909.png) | ![Menu](docs/images/Pasted%20image%2020260208012929.png) |
| ![Register](docs/images/Pasted%20image%2020260208012839.png) |                                      |                                                                                                            |

### 📊 Observability (Monitoring & Logging)
|               Grafana Metrics                |             Kibana Logs              |
| :------------------------------------------: | :----------------------------------: |
| ![Grafana](docs/images/Screenshot%20from%202026-02-04%2004-59-47.png) | ![Kibana](docs/images/Pasted%20image%2020260208011908.png) |
| ![Metrics](docs/images/Pasted%20image%2020260208012644.png) |                                      |

### 🚀 CI/CD Pipeline & GitOps
|        Jenkins Pipeline Flow         |       ArgoCD Application Tiles       |
| :----------------------------------: | :----------------------------------: |
| ![Jenkins](docs/images/Pasted%20image%2020260208010302.png) | ![ArgoCD](docs/images/Argocd%20Apps.png) |

|      Pipeline Alerts (Success/Failure)       |          ArgoCD Sync Status          |
| :------------------------------------------: | :----------------------------------: |
| ![Success](docs/images/Screenshot%20from%202026-02-04%2021-53-10.png) | ![ArgoCD Sync](https://via.placeholder.com/450x250?text=ArgoCD+Sync+Status) |
| ![Failure](docs/images/Screenshot%20from%202026-02-04%2021-53-21.png) |                                      |

### 🔔 Notifications & Alerts
|            Telegram Notifications            |                                                Slack Notifications                                                 |
| :------------------------------------------: | :----------------------------------------------------------------------------------------------------------------: |
| ![Telegram](docs/images/Screenshot%20from%202026-02-08%2001-23-40.png) | ![Slack](docs/images/Screenshot%20from%202026-02-08%2001-23-28.png) |
| ![Alerts](docs/images/Screenshot%20from%202026-02-08%2001-24-25.png) | ![Notifications](docs/images/Screenshot%20from%202026-02-08%2001-24-19.png) |

## 📦 Components

- [**Frontend**](./Frontend): A modern React single-page application built with TypeScript and Vite.
- [**Backend**](./Backend): A high-performance FastAPI service handling REST APIs and WebSocket connections.
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
├── backend             # FastAPI backend service
│   ├── app             # Main application logic
│   ├── pytest.ini      # Test configuration
│   ├── README.md       # Backend documentation
│   ├── requirements.txt # Python dependencies
│   ├── seed.py         # DB seeding script
│   ├── tests           # Integration tests
│   └── tests.Dockerfile # Test environment container
├── docker-compose.yml  # Local dev orchestration
├── Dockerfile          # Multi-stage production build
├── frontend            # React frontend application
│   ├── components      # Reusable UI elements
│   ├── public          # Static assets
│   ├── README.md       # Frontend documentation
│   ├── services        # API/WebSocket logic
│   └── vite.config.ts  # Build tool configuration
├── Jenkinsfile         # CI/CD pipeline definition
├── Jenkins-key-pair.pem # Deployment SSH key
└── nginx               # Reverse proxy config
    ├── Dockerfile      # Nginx container
    └── nginx.conf      # Routing & proxy rules
```

## 📂 Sub-Directories

- [**frontend/**](./Frontend): React + TypeScript + Vite.
- [**backend/**](./Backend): FastAPI + MongoDB + Redis.
- [**nginx/**](./nginx): Nginx proxy configurations.