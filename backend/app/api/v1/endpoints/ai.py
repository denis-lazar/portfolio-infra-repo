from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.schemas.user import User
from app.api.v1.endpoints.auth import get_current_user
import google.generativeai as genai
import os
import structlog

logger = structlog.get_logger()

router = APIRouter()

class ApologyRequest(BaseModel):
    item_name: str
    reason: str

@router.post("/apology")
async def get_ai_apology(request: ApologyRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("gemini_api_key_missing", message="GEMINI_API_KEY environment variable is not set")
        return {"apology": f"We're sorry, {request.item_name} is currently unavailable due to {request.reason}. Please check our other items!"}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = (
            f"The menu item '{request.item_name}' is currently unavailable because of: '{request.reason}'. "
            "As a friendly restaurant host, give a 1-sentence empathetic apology and suggest that the customer "
            "checks out other delicious options on the menu."
        )
        
        response = model.generate_content(prompt)
        return {"apology": response.text.strip()}
    except Exception as e:
        logger.error("gemini_api_error", error=str(e))
        return {"apology": f"We're sorry, {request.item_name} is currently out of stock. Please check back later!"}
