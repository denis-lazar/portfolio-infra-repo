import pytest
from app.schemas.restaurant import StatusUpdate, Review

def test_restaurant_schemas():
    # Test StatusUpdate
    update = StatusUpdate(inStock=False)
    assert update.inStock is False
    assert update.operational is None

    update_hw = StatusUpdate(operational=True)
    assert update_hw.operational is True

def test_review_schema():
    review_data = {
        "id": "rev1",
        "userId": "u1",
        "userName": "User",
        "rating": 4.5,
        "comment": "Great!",
        "date": "2026-01-27"
    }
    review = Review(**review_data)
    assert review.rating == 4.5
    assert review.userName == "User"
