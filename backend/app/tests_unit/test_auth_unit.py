import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.mark.asyncio
async def test_register_unit():
    mock_db = MagicMock()
    # Mock find_one to return None (user doesn't exist)
    mock_db.users.find_one = AsyncMock(return_value=None)
    mock_db.users.insert_one = AsyncMock()

    with patch("app.api.v1.endpoints.auth.get_database", return_value=mock_db):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/v1/auth/register", json={
                "email": "new@example.com",
                "name": "New User",
                "password": "Password123!",
                "role": "CUSTOMER"
            })
            assert response.status_code == 200
            assert response.json()["email"] == "new@example.com"
            mock_db.users.insert_one.assert_called_once()

@pytest.mark.asyncio
async def test_register_existing_user_unit():
    mock_db = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value={"email": "exists@example.com"})

    with patch("app.api.v1.endpoints.auth.get_database", return_value=mock_db):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/v1/auth/register", json={
                "email": "exists@example.com",
                "name": "Exist",
                "password": "Password123!",
                "role": "CUSTOMER"
            })
            assert response.status_code == 400
            assert "already exists" in response.json()["detail"]
