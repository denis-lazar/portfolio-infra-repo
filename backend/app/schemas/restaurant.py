from pydantic import BaseModel, Field
from typing import List, Optional

class Ingredient(BaseModel):
    id: str
    name: str
    inStock: bool

class StatusUpdate(BaseModel):
    inStock: Optional[bool] = None
    operational: Optional[bool] = None

class Hardware(BaseModel):
    id: str
    name: str
    operational: bool

class Review(BaseModel):
    id: str
    userId: str
    userName: str
    rating: float
    comment: str
    date: str

class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image: str
    requiredIngredients: List[str]
    optionalIngredients: Optional[List[str]] = []
    requiredHardware: List[str]
    rating: float
    reviews: List[Review] = []

class RestaurantBase(BaseModel):
    name: str
    description: str
    cuisine: str
    logo: str
    image: str
    address: str
    lat: float
    lng: float
    rating: float = 0.0
    reviewCount: int = 0
    tags: List[str] = []

class RestaurantCreate(RestaurantBase):
    pass

class Restaurant(RestaurantBase):
    id: str
    ingredients: List[Ingredient] = []
    hardware: List[Hardware] = []
    menu: List[MenuItem] = []
    reviews: List[Review] = []

    class Config:
        from_attributes = True
