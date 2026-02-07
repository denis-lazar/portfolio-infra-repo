# MenuSync Backend

The MenuSync backend is a high-performance API service built with **FastAPI**. It handles complex business logic, real-time synchronization via WebSockets, and persistent data storage in MongoDB.

![Backend API](https://via.placeholder.com/800x200?text=MenuSync+FastAPI+Backend)

## 🛠️ Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **Database:** [MongoDB](https://www.mongodb.com/) (Motor Async Driver)
- **Messaging/Cache:** [Redis](https://redis.io/) (Pub/Sub for WebSockets)
- **Testing:** [Pytest](https://docs.pytest.org/)
- **Documentation:** Swagger UI (Auto-generated)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12
- MongoDB & Redis (or use Docker)

### Installation
```bash
cd Application/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running Locally
```bash
# Ensure MongoDB and Redis are running
uvicorn app.main:app --reload --port 8000
```
- **API Docs:** `http://localhost:8000/docs`
- **Alternative Docs:** `http://localhost:8000/redoc`

---

## 🏗️ Project Structure

```text
backend/
├── app/
│   ├── api/            # API endpoints (Auth, Restaurants, Menu)
│   ├── core/           # Config, Database connection, Security
│   ├── models/         # Pydantic models (Schemas)
│   ├── schemas/        # Request/Response schemas
│   ├── tests_unit/     # Unit tests for core logic
│   └── main.py         # Application entry point
├── tests/              # Integration and E2E tests
│   ├── test_auth.py
│   ├── test_restaurants.py
│   └── test_e2e.py
├── pytest.ini
├── requirements.txt    # Python dependencies
├── seed.py             # Script to populate initial data
└── tests.Dockerfile
```

---

## 🔌 API Endpoints (Highlights)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/v1/login` | Authenticate users and return JWT. |
| **GET** | `/api/v1/restaurants` | List all available restaurants. |
| **PUT** | `/api/v1/availability` | Update ingredient/item status (Manager only). |
| **WS** | `/ws/{client_id}` | WebSocket connection for real-time updates. |

---

## 🧪 Testing

We use `pytest` with `httpx` for testing both REST endpoints and WebSocket behavior.

### Run All Tests
```bash
pytest
```

### Key Test Suites
- `test_auth.py`: JWT authentication logic.
- `test_restaurants.py`: CRUD operations for menu items.
- `test_e2e.py`: Full flow from manager update to customer view.

---

## 📡 Real-Time Sync Logic

The backend implements a **Pub/Sub pattern** using Redis:
1. **API receives update** -> Writes to MongoDB.
2. **Backend publishes** -> `redis.publish("availability_updates", data)`.
3. **WebSocket Task** -> Listens to Redis and broadcasts to all connected WebSocket clients.

This allows the backend to scale horizontally while maintaining consistent real-time state.