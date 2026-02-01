
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.api.v1.endpoints.restaurants import update_restaurant_stats

@pytest.mark.asyncio
async def test_update_restaurant_stats_logic():
    # Mock DB
    db = MagicMock()
    db.restaurants.find_one = AsyncMock()
    db.restaurants.update_one = AsyncMock()
    
    # Case 1: Multiple reviews
    db.restaurants.find_one.return_value = {
        "_id": "r1",
        "reviews": [{"rating": 5}, {"rating": 4}]
    }
    
    await update_restaurant_stats("r1", db)
    
    # Check if update_one was called with avg 4.5
    args, kwargs = db.restaurants.update_one.call_args
    assert kwargs["$set"]["rating"] == 4.5
    assert kwargs["$set"]["reviewCount"] == 2

@pytest.mark.asyncio
async def test_update_restaurant_stats_no_reviews():
    db = MagicMock()
    db.restaurants.find_one = AsyncMock()
    db.restaurants.update_one = AsyncMock()
    
    db.restaurants.find_one.return_value = {
        "_id": "r1",
        "reviews": []
    }
    
    await update_restaurant_stats("r1", db)
    
    args, kwargs = db.restaurants.update_one.call_args
    assert kwargs["$set"]["rating"] == 0.0
    assert kwargs["$set"]["reviewCount"] == 0
