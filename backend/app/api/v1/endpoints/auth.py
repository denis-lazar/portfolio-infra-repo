from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from app.schemas.user import UserCreate, User, UserLogin, UserUpdate, TokenData, VisitCreate
from app.core.database import get_database
from app.core.security import create_access_token, decode_access_token
from passlib.context import CryptContext
from datetime import datetime
import uuid

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    user["id"] = user["_id"]
    return User(**user)

import hashlib
import base64

# Setup password hashing
# Switching to pbkdf2_sha256 as it has no length limit, avoiding bcrypt's 72-byte restriction entirely.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def _pre_hash(password: str) -> str:
    """
    Hash the password with SHA-256 before passing it to bcrypt.
    This bypasses the 72-character bcrypt limit and adds a layer of security.
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_password_hash(password):
    return pwd_context.hash(_pre_hash(password))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(_pre_hash(plain_password), hashed_password)

@router.post("/register", response_model=User)
async def register(user_in: UserCreate):
    db = get_database()
    
    # 1. Check if user already exists
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # 2. Create user document
    user_dict = user_in.model_dump()
    # Replace plain password with hash
    hashed_password = get_password_hash(user_dict.pop("password"))
    
    user_id = str(uuid.uuid4())
    new_user = {
        **user_dict,
        "_id": user_id, 
        "hashed_password": hashed_password,
        "favorites": [],
        "visits": [],
        "created_at": datetime.utcnow()
    }
    
    # 3. Save to DB
    await db.users.insert_one(new_user)
    
    # 4. Generate Token
    access_token = create_access_token(data={"sub": user_id, "role": new_user["role"]})
    
    # 5. Return user object
    new_user["id"] = new_user["_id"]
    new_user["access_token"] = access_token
    return new_user

@router.post("/login", response_model=User)
async def login(user_in: UserLogin):
    db = get_database()
    
    user = await db.users.find_one({"email": user_in.email})
    if not user or not verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate Token
    access_token = create_access_token(data={"sub": user["_id"], "role": user["role"]})
    
    user["id"] = user["_id"]
    user["access_token"] = access_token
    return user

@router.post("/users/{user_id}/claim", response_model=User)
async def claim_restaurant(user_id: str, update_data: UserUpdate):
    db = get_database()
    
    # 1. Update the user's restaurantId
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": {"restaurantId": update_data.restaurantId}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 2. Get the updated user
    updated_user = await db.users.find_one({"_id": user_id})
    updated_user["id"] = updated_user["_id"]
    return updated_user

@router.post("/users/{user_id}/visit", response_model=User)
async def log_visit(
    user_id: str, 
    visit_data: VisitCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db = get_database()
    
    visit = {
        "restaurantId": visit_data.restaurantId,
        "restaurantName": visit_data.restaurantName,
        "date": datetime.utcnow().isoformat()
    }
    
    result = await db.users.update_one(
        {"_id": user_id},
        {"$push": {"visits": visit}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    updated_user = await db.users.find_one({"_id": user_id})
    updated_user["id"] = updated_user["_id"]
    return updated_user

@router.post("/users/{user_id}/favorites", response_model=User)
async def toggle_favorite(user_id: str, update_data: UserUpdate):
    db = get_database()
    
    # 1. Get current user
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    favorites = user.get("favorites", [])
    
    # 2. Add or Remove
    if update_data.restaurantId in favorites:
        favorites.remove(update_data.restaurantId)
    else:
        favorites.append(update_data.restaurantId)
    
    # 3. Update DB
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"favorites": favorites}}
    )
    
    # 4. Return updated user
    updated_user = await db.users.find_one({"_id": user_id})
    updated_user["id"] = updated_user["_id"]
    return updated_user