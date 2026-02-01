
import pytest
import os
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.fixture
async def customer_client():
    async with AsyncClient(base_url=BASE_URL) as client:
        email = f"cust_rbac_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": email, "name": "Cust RBAC", "password": "Password123!", "role": "CUSTOMER"
        })
        res = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        token = res.json()["access_token"]
        
        auth_ac = AsyncClient(base_url=BASE_URL, headers={"Authorization": f"Bearer {token}"})
        yield auth_ac
        await auth_ac.aclose()

@pytest.mark.asyncio
async def test_customer_cannot_create_restaurant(customer_client):
    new_rest = {
        "id": "rbac-test", "name": "Should Fail", "description": "X", "cuisine": "X",
        "logo": "", "image": "", "address": "X", "lat": 0, "lng": 0,
        "tags": [], "ingredients": [], "hardware": [], "menu": [], "reviews": []
    }
    response = await customer_client.post("/api/v1/restaurants/", json=new_rest)
    assert response.status_code == 403 # Forbidden

@pytest.mark.asyncio
async def test_customer_cannot_delete_restaurant(customer_client):
    response = await customer_client.delete("/api/v1/restaurants/any-id")
    assert response.status_code == 403
