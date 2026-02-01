
import pytest
from app.api.v1.endpoints.restaurants import check_restaurant_permission
from app.schemas.user import User, UserRole

def test_check_restaurant_permission_admin():
    admin = User(id="a1", email="admin@test.com", name="Admin", role=UserRole.ADMIN, favorites=[], visits=[])
    assert check_restaurant_permission(admin, "any_id") is True

def test_check_restaurant_permission_manager_correct():
    manager = User(id="m1", email="manager@test.com", name="Manager", role=UserRole.MANAGER, restaurantId="r1", favorites=[], visits=[])
    assert check_restaurant_permission(manager, "r1") is True

def test_check_restaurant_permission_manager_wrong():
    manager = User(id="m1", email="manager@test.com", name="Manager", role=UserRole.MANAGER, restaurantId="r1", favorites=[], visits=[])
    assert check_restaurant_permission(manager, "r2") is False

def test_check_restaurant_permission_customer():
    customer = User(id="c1", email="cust@test.com", name="Customer", role=UserRole.CUSTOMER, favorites=[], visits=[])
    assert check_restaurant_permission(customer, "r1") is False
