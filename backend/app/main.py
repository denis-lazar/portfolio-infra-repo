from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import restaurants, auth
from app.core.database import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import structlog
import time
import os

# Configure Structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="MenuSync API",
    lifespan=lifespan
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration=f"{duration:.4f}s"
    )
    return response

# Initialize Prometheus Instrumentator
Instrumentator().instrument(app).expose(app, endpoint="/api/v1/metrics")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for Kubernetes Liveness/Readiness probes.
    """
    return {"status": "healthy", "version": "1.0.0"}

# Include API Routers
app.include_router(restaurants.router, prefix="/api/v1/restaurants", tags=["Restaurants"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

# Serve Static Files (React Frontend)
# Base directory is /code inside container
static_path = os.path.join(os.getcwd(), "static")

if os.path.exists(static_path):
    # Mount images specifically to ensure they take precedence
    if os.path.exists(os.path.join(static_path, "images")):
        app.mount("/images", StaticFiles(directory=os.path.join(static_path, "images")), name="images")
    
    # Mount the rest of the React build
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

    @app.get("/{catchall:path}", include_in_schema=False)
    async def serve_react_app(catchall: str):
        """Catch-all route to support React Router (SPA)"""
        # If not an API call, return the index.html for React to handle routing
        if not catchall.startswith("api/v1"):
            return FileResponse(os.path.join(static_path, "index.html"))