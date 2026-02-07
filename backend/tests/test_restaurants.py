import pytest
import pytest_asyncio
import os
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest_asyncio.fixture(loop_scope="function")
async def auth_client():
    async with AsyncClient(base_url=BASE_URL) as client:
        # 1. Create a user
        email = f"test_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": email,
            "name": "Tester",
            "password": "Password123!",
            "role": "MANAGER"
        })
        # 2. Login
        res = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        token = res.json()["access_token"]
        user_id = res.json()["id"]
        
        # 3. Create a specialized client with headers
        auth_ac = AsyncClient(base_url=BASE_URL, headers={"Authorization": f"Bearer {token}"})
        yield auth_ac, user_id
        await auth_ac.aclose()

@pytest.mark.asyncio
async def test_get_restaurants(auth_client):
    client, _ = auth_client
    response = await client.get("/api/v1/restaurants/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_update_ingredient_status(auth_client):
    client, user_id = auth_client
    # 1. Get a restaurant
    res = await client.get("/api/v1/restaurants/")
    rests = res.json()
    rest_id = rests[0]["id"]
    ing_id = rests[0]["ingredients"][0]["id"]
    
    # 2. Manager needs to claim it first
    await client.post(f"/api/v1/auth/users/{user_id}/claim", json={"restaurantId": rest_id})
    
    # 3. Toggle status
    patch_res = await client.patch(
        f"/api/v1/restaurants/{rest_id}/ingredients/{ing_id}",
        json={"inStock": False}
    )
    assert patch_res.status_code == 200

@pytest.mark.asyncio
async def test_add_restaurant_review(auth_client):
    client, _ = auth_client
    res = await client.get("/api/v1/restaurants/")
    rest_id = res.json()[0]["id"]
    
    review_data = {
        "id": "test-rev",
        "userId": "auto", # Backend will overwrite
        "userName": "auto",
        "rating": 5.0,
        "comment": "JWT Review",
        "date": "2026-01-27"
    }
    
    response = await client.post(f"/api/v1/restaurants/{rest_id}/reviews", json=review_data)
    assert response.status_code == 200
