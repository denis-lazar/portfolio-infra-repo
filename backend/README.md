# MenuSync Backend

The MenuSync Backend is a high-performance FastAPI application designed for real-time data synchronization and robust restaurant management logic.

## 🛠️ Technology Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast (high-performance) web framework for building APIs with Python 3.10+.
- **Database:** [MongoDB](https://www.mongodb.com/) with [Motor](https://motor.readthedocs.io/) - Asynchronous Python driver for MongoDB.
- **Real-time:** [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - For instant bi-directional updates between the server and connected clients.
- **Security:** [JWT (JSON Web Tokens)](https://jwt.io/) - Secure authentication and Role-Based Access Control (RBAC).
- **Observability:** [Prometheus](https://prometheus.io/) & [Structlog](https://www.structlog.org/) - Metrics instrumentation and structured JSON logging for production monitoring.
- **Testing:** [Pytest](https://docs.pytest.org/) - Comprehensive testing suite including unit and integration tests.

## 📁 Folder Structure

```text
backend/
├── app/
│   ├── api/            # API Route handlers (Auth, Restaurants)
│   ├── core/           # Configuration, Security (JWT), and DB connection
│   ├── models/         # MongoDB data models
│   ├── schemas/        # Pydantic models for request/response validation
│   ├── main.py         # Application entry point & WebSocket manager
│   └── websocket.py    # Connection management and broadcasting logic
├── tests/              # E2E and integration tests
├── seed.py             # Script to populate MongoDB with initial data
└── requirements.txt    # Python dependency list
```

## ⚙️ How It Works

### 1. Ingredient-to-Meal Mapping
The core logic resides in the backend's ability to map ingredient availability to menu items. When an ingredient (e.g., "Pizza Dough") is toggled to "Out of Stock," the backend automatically identifies all dependent menu items and updates their status in the database.

### 2. WebSocket Broadcasting
The `ConnectionManager` handles active WebSocket connections. It supports:
- **Global Broadcasts:** Updating all users when a restaurant's general status changes.
- **Targeted Updates:** Sending specific data to users viewing a particular restaurant.

### 3. Production Readiness
- **Structured Logging:** All logs are outputted in JSON format for easy ingestion by ELK or Loki.
- **Metrics:** A `/metrics` endpoint provides real-time data on HTTP request latency, database connection counts, and application health.

## 🧪 Testing
Run the backend tests using the following command:
```bash
pytest backend/
```
Or via Docker:
```bash
docker compose run backend pytest
```
