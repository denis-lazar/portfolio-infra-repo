# MenuSync - DevOps Portfolio Context (Session Summary)

## 📌 Project Overview
**MenuSync** is a real-time restaurant menu availability platform. It empowers managers to sync ingredient/hardware status instantly with customers, providing transparent and reliable dining information.

## 🏗️ Technical Architecture (Monolith + Shared Volume)
The app is fully containerized and mimics a production-grade Kubernetes environment:
- **Frontend (Nginx + Shared Volume):**
    - **Performance:** Nginx serves static assets (JS, CSS, Images) directly from a shared volume (`static_files`), bypassing the application server for speed.
    - **Ingress Simulation:** Nginx acts as a Load Balancer/Reverse Proxy, routing `/api` and `/ws` traffic to the backend.
- **Backend (FastAPI Monolith):**
    - **Unified Logic:** A single Python image containing the API, WebSocket manager, and the compiled React application (for local dev fallback).
    - **Real-time Engine:** WebSocket `ConnectionManager` utilizing both specific and **global** broadcast channels for instant cross-session updates.
    - **Security:** **JWT (JSON Web Tokens)** with role-based access control (RBAC).
    - **Observability:** Prometheus instrumentation at `/metrics` and structured JSON logging.
- **Database (MongoDB):** Isolated and secured within the internal Docker network.

## ✅ Completed Milestones

### 1. DevOps & Infrastructure
- **High-Performance Serving:** Implemented Nginx `root` serving from a shared Docker volume, optimizing static asset delivery.
- **Global Real-time Sync:** Enhanced WebSockets to update "Dishes Ready" counts on the restaurant list view instantly when a manager toggles a supply.
- **Session Hardening:** Implemented `sessionStorage` with versioning and a 24-hour expiry check to ensure clean state on new deployments.
- **Observability:** Custom Prometheus gauge `db_connections_active` added alongside standard HTTP metrics.

### 2. Testing & Quality Assurance
- **3-Tier Test Suite:**
    - **Unit:** Fast logic testing (hashing, schemas).
    - **Integration:** Black-box testing via a dedicated `tester` container targeting the live API.
    - **Component:** Vitest + React Testing Library for UI logic.
- **Nginx Verification:** Automated tests to ensure proxy headers and WebSocket upgrades are correctly configured.

### 3. Application Logic & Premium UI
- **Critical Ingredient Logic:** Implemented "Warning vs Sold Out" states. Dishes like Pizza stay available if non-critical items (e.g., Basil) are missing, but show a warning badge.
- **Premium Map:** Integrated **Leaflet.js** with CartoDB Dark Matter tiles and custom markers.
- **Visual Overhaul:**
    - Massive, centered logos on restaurant cards for brand focus.
    - 30 unique high-resolution meal images (zero repetition).
    - Refined navigation with a "Back to Discovery" button (context-aware).
    - Solid, vibrant UI feedback for Favorite actions and "Check-in" visits.
- **Data Fidelity:** `seed.py` updated with "Kosher" tag support and rich, realistic fake reviews.

## 🚀 How to Start (Fresh Environment)
1. **Initialize:** `docker compose down -v` (to clear old data/volumes)
2. **Build & Start:** `docker compose up --build -d`
3. **Seed Data:** `docker compose exec app python seed.py`
4. **Access:** `http://localhost`
5. **Metrics:** `http://localhost/metrics`

## 📋 Next Steps
- [ ] **K8s Migration:** Prepare Helm charts and Kubernetes manifests for EKS deployment.
- [ ] **CI/CD Pipeline:** Implement Jenkins/GitHub Actions to automate the monolith build and test flow.
- [ ] **Cloud Assets:** Setup AWS S3 + CloudFront logic for the CDN-ready distribution.