from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import List, Optional
from enum import Enum
import re

class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"

class Visit(BaseModel):
    restaurantId: str
    restaurantName: str
    date: str

class VisitCreate(BaseModel):
    restaurantId: str
    restaurantName: str

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str):
        if not re.search(r"[0-9]", v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)

class UserUpdate(BaseModel):
    restaurantId: str

class User(UserBase):
    id: str
    restaurantId: Optional[str] = None
    favorites: List[str] = []
    visits: List[Visit] = []
    access_token: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
