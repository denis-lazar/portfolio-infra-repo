
import pytest
import os
from httpx import AsyncClient

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.mark.asyncio
async def test_complete_admin_manager_customer_flow():
    async with AsyncClient(base_url=BASE_URL) as client:
        # 1. ADMIN FLOW: Create a new restaurant
        admin_email = f"admin_e2e_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": admin_email, "name": "Admin E2E", "password": "Password123!", "role": "ADMIN"
        })
        login_res = await client.post("/api/v1/auth/login", json={"email": admin_email, "password": "Password123!"})
        admin_token = login_res.json()["access_token"]
        
        rest_id = f"e2e_rest_{os.urandom(2).hex()}"
        new_rest = {
            "id": rest_id, "name": "E2E Restaurant", "description": "Flow Test", "cuisine": "E2E",
            "logo": "", "image": "", "address": "E2E Lane", "lat": 0, "lng": 0,
            "tags": [], "ingredients": [], "hardware": [], "menu": [], "reviews": []
        }
        await client.post("/api/v1/restaurants/", json=new_rest, headers={"Authorization": f"Bearer {admin_token}"})
        
        # 2. MANAGER FLOW: Claim restaurant and add a meal
        mgr_email = f"mgr_e2e_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": mgr_email, "name": "Mgr E2E", "password": "Password123!", "role": "MANAGER"
        })
        login_res = await client.post("/api/v1/auth/login", json={"email": mgr_email, "password": "Password123!"})
        mgr_token = login_res.json()["access_token"]
        mgr_id = login_res.json()["id"]
        
        await client.post(f"/api/v1/auth/users/{mgr_id}/claim", json={"restaurantId": rest_id}, headers={"Authorization": f"Bearer {mgr_token}"})
        
        meal_data = {
            "id": "e2e-meal", "name": "E2E Burger", "description": "E2E Tasty", "price": 10.0, "category": "Burgers",
            "image": "", "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 0, "reviews": []
        }
        await client.post(f"/api/v1/restaurants/{rest_id}/menu", json=meal_data, headers={"Authorization": f"Bearer {mgr_token}"})
        
        # 3. CUSTOMER FLOW: View the restaurant and the new meal
        cust_email = f"cust_e2e_{os.urandom(2).hex()}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": cust_email, "name": "Cust E2E", "password": "Password123!", "role": "CUSTOMER"
        })
        login_res = await client.post("/api/v1/auth/login", json={"email": cust_email, "password": "Password123!"})
        cust_token = login_res.json()["access_token"]
        
        res = await client.get("/api/v1/restaurants/", headers={"Authorization": f"Bearer {cust_token}"})
        rests = res.json()
        target_rest = next(r for r in rests if r["id"] == rest_id)
        assert target_rest["name"] == "E2E Restaurant"
        assert any(item["id"] == "e2e-meal" for item in target_rest["menu"])
