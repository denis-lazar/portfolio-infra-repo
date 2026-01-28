import pytest
from ..api.v1.endpoints.auth import _pre_hash, get_password_hash, verify_password
from ..schemas.user import UserCreate
from pydantic import ValidationError

def test_password_hashing_logic():
    password = "SecurePassword123!"
    
    # 1. Test pre-hash is consistent
    h1 = _pre_hash(password)
    h2 = _pre_hash(password)
    assert h1 == h2
    assert len(h1) == 64 # SHA-256 hex length
    
    # 2. Test full hashing
    hashed = get_password_hash(password)
    assert hashed.startswith("$pbkdf2-sha256$")
    
    # 3. Test verification
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_user_schema_validation():
    # Test valid user
    valid_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password": "Password123!",
        "role": "CUSTOMER"
    }
    user = UserCreate(**valid_data)
    assert user.email == "test@example.com"

    # Test invalid password (no number)
    invalid_data = valid_data.copy()
    invalid_data["password"] = "NoNumber!"
    with pytest.raises(ValueError, match="at least one number"):
        UserCreate(**invalid_data)

    # Test invalid password (no special char)
    invalid_data["password"] = "NoSpecial123"
    with pytest.raises(ValueError, match="at least one special character"):
        UserCreate(**invalid_data)
