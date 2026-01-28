import pytest
import os
import asyncio
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.mark.asyncio
async def test_full_manager_flow():
    async with AsyncClient(base_url=BASE_URL) as client:
        # 1. Register a Manager
        email = f"manager_{os.urandom(2).hex()}@example.com"
        reg_res = await client.post("/api/v1/auth/register", json={
            "email": email,
            "name": "Big Manager",
            "password": "Password123!",
            "role": "MANAGER"
        })
        assert reg_res.status_code == 200
        user_id = reg_res.json()["id"]

        # 2. Login
        login_res = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 3. Get Restaurants and Claim one
        rests_res = await client.get("/api/v1/restaurants/")
        restaurants = rests_res.json()
        assert len(restaurants) > 0
        target_rest_id = restaurants[0]["id"]

        claim_res = await client.post(f"/api/v1/auth/users/{user_id}/claim", json={
            "restaurantId": target_rest_id
        }, headers=auth_headers)
        assert claim_res.status_code == 200
        assert claim_res.json()["restaurantId"] == target_rest_id

        # 4. Toggle an ingredient
        ing_id = restaurants[0]["ingredients"][0]["id"]
        toggle_res = await client.patch(
            f"/api/v1/restaurants/{target_rest_id}/ingredients/{ing_id}",
            json={"inStock": False},
            headers=auth_headers
        )
        assert toggle_res.status_code == 200

        # 5. Verify as a (simulated) customer
        verify_res = await client.get("/api/v1/restaurants/")
        updated_rest = next(r for r in verify_res.json() if r["id"] == target_rest_id)
        updated_ing = next(i for i in updated_rest["ingredients"] if i["id"] == ing_id)
        assert updated_ing["inStock"] is False
