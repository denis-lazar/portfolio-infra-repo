import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.mark.asyncio
async def test_health_endpoint_unit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "version": "1.0.0"}

@pytest.mark.asyncio
async def test_get_restaurants_unit():
    # Mocking the database to avoid needing a real Mongo for unit tests
    mock_db = MagicMock()
    mock_cursor = MagicMock()
    # Configure mock for 'async for document in cursor:'
    mock_cursor.__aiter__.return_value = [
        {
            "_id": "1", 
            "name": "Test Rest", 
            "cuisine": "Italian",
            "description": "Test Description",
            "logo": "http://logo.com",
            "image": "http://image.com",
            "address": "123 Street",
            "lat": 0.0,
            "lng": 0.0,
            "rating": 5.0,
            "reviewCount": 1,
            "tags": ["Italian"],
            "ingredients": [],
            "hardware": [],
            "menu": [],
            "reviews": []
        }
    ]
    mock_db.restaurants.find.return_value = mock_cursor

    with patch("app.api.v1.endpoints.restaurants.get_database", return_value=mock_db):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/restaurants/")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Test Rest"
            assert data[0]["id"] == "1"

@pytest.mark.asyncio
async def test_update_ingredient_unit():
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.matched_count = 1
    mock_db.restaurants.update_one = AsyncMock(return_value=mock_result)

    # We need to mock the authentication dependency
    from app.schemas.user import User, UserRole
    mock_user = User(
        id="user1", 
        email="manager@test.com", 
        name="Manager", 
        role=UserRole.MANAGER, 
        restaurantId="rest1"
    )

    with patch("app.api.v1.endpoints.restaurants.get_database", return_value=mock_db), \
         patch("app.api.v1.endpoints.restaurants.manager.broadcast_to_restaurant", new_callable=AsyncMock) as mock_broadcast, \
         patch("app.api.v1.endpoints.restaurants.get_manager_user", return_value=mock_user):
        
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.patch(
                "/api/v1/restaurants/rest1/ingredients/ing1",
                json={"inStock": False}
            )
            assert response.status_code == 200
            assert response.json() == {"status": "success"}
            mock_broadcast.assert_called_once()
