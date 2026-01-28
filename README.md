# MenuSync

**MenuSync** is a real-time restaurant menu availability platform. It empowers restaurant managers to instantly sync ingredient and hardware status with customers, providing transparent and reliable dining information. By bridging the gap between kitchen reality and customer expectations, MenuSync eliminates the frustration of ordering unavailable items.

## 🚀 Key Features

- **Real-time Synchronization:** Menu updates propagate from manager to customer in 3-5 seconds using WebSockets.
- **Smart Dependency Mapping:** Automatically marks dishes as "Unavailable" or "Warning" based on ingredient status (e.g., if "Basil" is out, "Margherita Pizza" shows a warning; if "Pizza Dough" is out, it's "Sold Out").
- **Premium Map Discovery:** Interactive map using Leaflet.js and CartoDB Dark Matter tiles for finding nearby restaurants.
- **Role-Based Access (RBAC):** Secure login for customers and restaurant managers via JWT.
- **Observability:** Integrated Prometheus metrics and structured JSON logging.
- **High Performance:** Nginx-backed static asset serving via shared Docker volumes.

├── Docker/                 # Docker configuration
│   ├── docker-compose.yml  # Container orchestration
│   ├── Dockerfile          # Unified build file for the application
│   └── nginx.conf          # Nginx production configuration
├── backend/                # FastAPI Monolith
│   ├── app/                # Application logic (Models, Schemas, API, Core)
│   ├── tests/              # Integration and E2E tests
│   ├── seed.py             # Data seeding script for MongoDB
│   ├── pytest.ini          # Pytest configuration
│   ├── requirements.txt    # Python dependencies
│   └── tests.Dockerfile    # Dockerfile for the integration testing container
├── frontend/               # React + TypeScript + Vite
│   ├── components/         # UI Components (Map, Login, Panels)
│   ├── services/           # API and WebSocket services
│   ├── public/             # Static assets (High-res images, logos)
│   ├── App.tsx             # Main React Application component
│   ├── index.tsx           # React entry point
│   ├── package.json        # Node.js dependencies and scripts
│   ├── vite.config.ts      # Vite build configuration
│   └── vitest.config.ts    # Vitest testing configuration
└── docker-compose.yml      # (Removed - now in Docker/)

## 🛠️ Workflow

1.  **Manager Update:** A restaurant manager toggles an ingredient status (e.g., "Out of Stock") in the Manager Panel.
2.  **Backend Processing:** The FastAPI backend updates the database and calculates the impact on dependent menu items.
3.  **Broadcast:** A WebSocket signal is broadcasted globally and to specific restaurant channels.
4.  **Instant UI Refresh:** All connected customer apps receive the update and refresh the menu status/badges without a page reload.

## 🏁 How to Run Locally

### Prerequisites
- Docker and Docker Compose installed.

### Steps
1.  **Navigate to Docker directory:**
    ```bash
    cd Docker
    ```
2.  **Clean Start:**
    ```bash
    docker compose down -v
    ```
3.  **Build & Start:**
    ```bash
    docker compose up --build -d
    ```
4.  **Seed Data:**
    ```bash
    docker compose exec app python seed.py
    ```
5.  **Access the App:**
    - **Frontend:** [http://localhost](http://localhost)
    - **API Docs:** [http://localhost/docs](http://localhost/docs)
    - **Metrics:** [http://localhost/metrics](http://localhost/metrics)

---
*Created as part of a DevOps Portfolio project.*
