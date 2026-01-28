import pytest
import os
from httpx import AsyncClient

# Use the URL provided by the environment (default to localhost for local runs)
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.fixture
async def client():
    async with AsyncClient(base_url=BASE_URL) as ac:
        yield ac

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    # Use a unique email to avoid "user already exists" errors in the live DB
    test_email = f"test_{os.urandom(4).hex()}@example.com"
    response = await client.post("/api/v1/auth/register", json={
        "email": test_email,
        "name": "Integration Test User",
        "password": "Password123!",
        "role": "CUSTOMER"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_email
    assert "access_token" in data

@pytest.mark.asyncio
async def test_login_invalid_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "Password123!"
    })
    assert response.status_code == 401