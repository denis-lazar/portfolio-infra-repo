
import pytest
import os
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.fixture
async def admin_client():
    async with AsyncClient(base_url=BASE_URL) as client:
        # 1. Create an admin user
        email = f"admin_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": email,
            "name": "Admin Tester",
            "password": "Password123!",
            "role": "ADMIN"
        })
        # 2. Login
        res = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        token = res.json()["access_token"]
        
        # 3. Create a specialized client with headers
        auth_ac = AsyncClient(base_url=BASE_URL, headers={"Authorization": f"Bearer {token}"})
        yield auth_ac
        await auth_ac.aclose()

@pytest.mark.asyncio
async def test_admin_create_delete_restaurant(admin_client):
    # 1. Create a restaurant
    new_rest = {
        "id": f"rest_{os.urandom(2).hex()}",
        "name": "Admin New Place",
        "description": "Created by test",
        "cuisine": "Modern",
        "logo": "http://logo.com",
        "image": "http://image.com",
        "address": "123 Admin St",
        "lat": 40.0,
        "lng": -70.0,
        "rating": 0.0,
        "reviewCount": 0,
        "tags": ["New"],
        "ingredients": [],
        "hardware": [],
        "menu": [],
        "reviews": []
    }
    response = await admin_client.post("/api/v1/restaurants/", json=new_rest)
    assert response.status_code == 200
    created_id = response.json()["id"]
    
    # 2. Delete the restaurant
    del_response = await admin_client.delete(f"/api/v1/restaurants/{created_id}")
    assert del_response.status_code == 200
    assert del_response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_admin_add_menu_item(admin_client):
    # 1. Get first restaurant
    res = await admin_client.get("/api/v1/restaurants/")
    rest_id = res.json()[0]["id"]
    
    # 2. Add menu item (Admins can do it too)
    new_item = {
        "id": "new-dish",
        "name": "Admin Dish",
        "description": "Tasty",
        "price": 15.0,
        "category": "Main",
        "image": "",
        "requiredIngredients": [],
        "optionalIngredients": [],
        "requiredHardware": [],
        "rating": 0,
        "reviews": []
    }
    response = await admin_client.post(f"/api/v1/restaurants/{rest_id}/menu", json=new_item)
    assert response.status_code == 200
    assert any(item["name"] == "Admin Dish" for item in response.json()["menu"])
