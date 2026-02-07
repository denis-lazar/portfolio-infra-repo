
import pytest
import pytest_asyncio
import os
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest_asyncio.fixture(loop_scope="function")
async def manager_client():
    async with AsyncClient(base_url=BASE_URL) as client:
        # 1. Create a manager user
        email = f"manager_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": email,
            "name": "Manager Tester",
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
async def test_manager_menu_management(manager_client):
    client, user_id = manager_client
    # 1. Get a restaurant and claim it
    res = await client.get("/api/v1/restaurants/")
    rest_id = res.json()[0]["id"]
    await client.post(f"/api/v1/auth/users/{user_id}/claim", json={"restaurantId": rest_id})
    
    # 2. Add ingredient
    ing_data = {"id": "new-ing", "name": "Secret Sauce", "inStock": True}
    res_ing = await client.post(f"/api/v1/restaurants/{rest_id}/ingredients", json=ing_data)
    assert res_ing.status_code == 200
    assert any(i["name"] == "Secret Sauce" for i in res_ing.json()["ingredients"])
    
    # 3. Add menu item
    item_data = {
        "id": "new-manager-dish",
        "name": "Manager Special",
        "description": "Exclusive",
        "price": 20.0,
        "category": "Main",
        "image": "",
        "requiredIngredients": ["new-ing"],
        "optionalIngredients": [],
        "requiredHardware": [],
        "rating": 0,
        "reviews": []
    }
    res_item = await client.post(f"/api/v1/restaurants/{rest_id}/menu", json=item_data)
    assert res_item.status_code == 200
    assert any(item["name"] == "Manager Special" for item in res_item.json()["menu"])

    # 4. Update ingredient details
    updated_ing = {"id": "new-ing", "name": "Super Secret Sauce", "inStock": True}
    res_upd = await client.patch(f"/api/v1/restaurants/{rest_id}/ingredients/new-ing/details", json=updated_ing)
    assert res_upd.status_code == 200
    assert any(i["name"] == "Super Secret Sauce" for i in res_upd.json()["ingredients"])
