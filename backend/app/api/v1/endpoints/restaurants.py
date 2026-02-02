from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List
from app.schemas.restaurant import Restaurant, Review, StatusUpdate, MenuItem, Ingredient, Hardware
from app.schemas.user import User, UserRole
from app.core.database import get_database
from app.core.websocket import manager
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId
import datetime
import uuid

router = APIRouter()

async def get_manager_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers or admins can perform this action"
        )
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action"
        )
    return current_user

def check_restaurant_permission(user: User, restaurant_id: str):
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.MANAGER and user.restaurantId == restaurant_id:
        return True
    return False

@router.websocket("/{restaurant_id}/ws")
async def websocket_endpoint(websocket: WebSocket, restaurant_id: str):
    await manager.connect(websocket, restaurant_id)
    try:
        while True:
            # Keep connection alive, we mostly push from server to client
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, restaurant_id)

@router.get("/", response_model=List[Restaurant])
async def get_restaurants():
    db = get_database()
    cursor = db.restaurants.find().sort("name", 1)
    restaurants = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        restaurants.append(document)
    return restaurants

@router.post("/", response_model=Restaurant)
async def create_restaurant(
    restaurant: Restaurant, 
    current_user: User = Depends(get_admin_user)
):
    db = get_database()
    rest_dict = restaurant.model_dump()
    if not rest_dict.get("id"):
        rest_dict["_id"] = str(uuid.uuid4())
    else:
        rest_dict["_id"] = rest_dict["id"]
    
    await db.restaurants.insert_one(rest_dict)
    rest_dict["id"] = rest_dict["_id"]

    # Broadcast global update
    try:
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "CREATE"
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    return rest_dict

@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: str,
    current_user: User = Depends(get_admin_user)
):
    db = get_database()
    result = await db.restaurants.delete_one({"_id": restaurant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Broadcast global update
    try:
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "DELETE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    return {"status": "success"}

@router.post("/{restaurant_id}/menu", response_model=Restaurant)
async def add_menu_item(
    restaurant_id: str, 
    item: MenuItem, 
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id},
        {"$push": {"menu": item.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    updated = await db.restaurants.find_one({"_id": restaurant_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.patch("/{restaurant_id}/menu/{item_id}", response_model=Restaurant)
async def update_menu_item(
    restaurant_id: str,
    item_id: str,
    item: MenuItem,
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id, "menu.id": item_id},
        {"$set": {"menu.$": item.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant or Menu Item not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    updated = await db.restaurants.find_one({"_id": restaurant_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{restaurant_id}/menu/{item_id}", response_model=Restaurant)
async def delete_menu_item(
    restaurant_id: str,
    item_id: str,
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id},
        {"$pull": {"menu": {"id": item_id}}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    updated = await db.restaurants.find_one({"_id": restaurant_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.patch("/{restaurant_id}/ingredients/{ingredient_id}")
async def update_ingredient(
    restaurant_id: str, 
    ingredient_id: str, 
    update: StatusUpdate,
    current_user: User = Depends(get_manager_user)
):
    # Verify manager belongs to this restaurant
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    
    update_data = {}
    if update.inStock is not None:
        update_data["ingredients.$.inStock"] = update.inStock
    
    if not update_data:
        return {"status": "no update"}

    result = await db.restaurants.update_one(
        {"_id": restaurant_id, "ingredients.id": ingredient_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant or Ingredient not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")
    
    return {"status": "success"}

@router.post("/{restaurant_id}/ingredients", response_model=Restaurant)
async def add_ingredient(
    restaurant_id: str,
    ingredient: Ingredient,
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id},
        {"$push": {"ingredients": ingredient.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    updated = await db.restaurants.find_one({"_id": restaurant_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.patch("/{restaurant_id}/ingredients/{ingredient_id}/details", response_model=Restaurant)
async def update_ingredient_details(
    restaurant_id: str,
    ingredient_id: str,
    ingredient: Ingredient,
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id, "ingredients.id": ingredient_id},
        {"$set": {"ingredients.$": ingredient.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant or Ingredient not found")
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    updated = await db.restaurants.find_one({"_id": restaurant_id})
    updated["id"] = str(updated["_id"])
    return updated


@router.patch("/{restaurant_id}/hardware/{hardware_id}")
async def update_hardware(
    restaurant_id: str, 
    hardware_id: str, 
    update: StatusUpdate,
    current_user: User = Depends(get_manager_user)
):
    if not check_restaurant_permission(current_user, restaurant_id):
         raise HTTPException(status_code=403, detail="You do not have permission for this restaurant")

    db = get_database()
    result = await db.restaurants.update_one(
        {"_id": restaurant_id, "hardware.id": hardware_id},
        {"$set": {"hardware.$.operational": update.operational}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant or Hardware not found")

    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    return {"status": "success"}

async def update_restaurant_stats(restaurant_id: str, db):
    """Recalculate average rating and review count for a restaurant."""
    restaurant = await db.restaurants.find_one({"_id": restaurant_id})
    if not restaurant:
        return
    
    reviews = restaurant.get("reviews", [])
    if not reviews:
        await db.restaurants.update_one(
            {"_id": restaurant_id},
            {"$set": {"rating": 0.0, "reviewCount": 0}}
        )
        return

    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.restaurants.update_one(
        {"_id": restaurant_id},
        {"$set": {"rating": round(avg_rating, 1), "reviewCount": len(reviews)}}
    )

@router.post("/{restaurant_id}/reviews", response_model=Restaurant)
async def add_restaurant_review(
    restaurant_id: str, 
    review: Review,
    current_user: User = Depends(get_current_user)
):
    # Ensure user can only review as themselves
    review.userId = current_user.id
    review.userName = current_user.name
    
    db = get_database()
    
    # 1. Check if user already reviewed this restaurant
    restaurant = await db.restaurants.find_one({"_id": restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    existing_reviews = restaurant.get("reviews", [])
    user_review_idx = next((i for i, r in enumerate(existing_reviews) if r["userId"] == review.userId), None)
    
    if user_review_idx is not None:
        # Update existing review
        await db.restaurants.update_one(
            {"_id": restaurant_id},
            {"$set": {f"reviews.{user_review_idx}": review.model_dump()}}
        )
    else:
        # Add new review
        await db.restaurants.update_one(
            {"_id": restaurant_id},
            {"$push": {"reviews": review.model_dump()}}
        )
    
    # 2. Update restaurant stats
    await update_restaurant_stats(restaurant_id, db)
    
    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")
    
    updated_restaurant = await db.restaurants.find_one({"_id": restaurant_id})
    updated_restaurant["id"] = str(updated_restaurant["_id"])
    return updated_restaurant

@router.post("/{restaurant_id}/menu/{dish_id}/reviews", response_model=Restaurant)
async def add_dish_review(
    restaurant_id: str, 
    dish_id: str, 
    review: Review,
    current_user: User = Depends(get_current_user)
):
    review.userId = current_user.id
    review.userName = current_user.name

    db = get_database()
    
    # Update logic for dish: find item, find if user reviewed it
    restaurant = await db.restaurants.find_one({"_id": restaurant_id, "menu.id": dish_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant or Dish not found")
    
    menu_item = next(m for m in restaurant["menu"] if m["id"] == dish_id)
    dish_reviews = menu_item.get("reviews", [])
    user_review_idx = next((i for i, r in enumerate(dish_reviews) if r["userId"] == review.userId), None)

    if user_review_idx is not None:
        # Update specific review in the menu array
        # We use the positional operator $ combined with the index
        await db.restaurants.update_one(
            {"_id": restaurant_id, "menu.id": dish_id},
            {"$set": {f"menu.$.reviews.{user_review_idx}": review.model_dump()}}
        )
    else:
        # Add new review to dish
        await db.restaurants.update_one(
            {"_id": restaurant_id, "menu.id": dish_id},
            {"$push": {"menu.$.reviews": review.model_dump()}}
        )
    
    # Recalculate Dish Average
    updated_restaurant = await db.restaurants.find_one({"_id": restaurant_id})
    updated_menu_item = next(m for m in updated_restaurant["menu"] if m["id"] == dish_id)
    new_dish_reviews = updated_menu_item.get("reviews", [])
    if new_dish_reviews:
        new_avg = sum(r["rating"] for r in new_dish_reviews) / len(new_dish_reviews)
        await db.restaurants.update_one(
            {"_id": restaurant_id, "menu.id": dish_id},
            {"$set": {"menu.$.rating": round(new_avg, 1)}}
        )

    # Broadcast the update (Soft-fail to avoid blocking the main request)
    try:
        await manager.broadcast_to_restaurant(restaurant_id, {
            "type": "RESTAURANT_UPDATE",
            "restaurantId": restaurant_id
        })
        await manager.broadcast_to_restaurant("global", {
            "type": "GLOBAL_UPDATE",
            "action": "UPDATE",
            "restaurantId": restaurant_id
        })
    except Exception as e:
        print(f"Broadcast failed: {e}")

    final_updated = await db.restaurants.find_one({"_id": restaurant_id})
    final_updated["id"] = str(final_updated["_id"])
    return final_updated

