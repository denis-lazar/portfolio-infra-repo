from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import restaurants, auth, ai
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Gauge
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import structlog
import time
import os
import asyncio

# Create the info metric for observability
APP_INFO = Gauge(
    'menusync_app_info', 
    'Static metric with build metadata',
    ['version', 'commit_sha']
)

# Set the labels once at startup
APP_INFO.labels(
    version=os.getenv('APP_VERSION', '0.0.0'),
    commit_sha=os.getenv('GIT_SHA', 'unknown')
).set(1)

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
    # --- Robust Automatic Seeding Logic ---
    # After a 'terraform apply', MongoDB takes time to elect a Primary.
    # We retry the connection and seeding for up to 5 minutes.
    MAX_RETRIES = 30
    RETRY_INTERVAL = 10 # seconds
    
    await connect_to_mongo()
    db = get_database()
    
    for attempt in range(MAX_RETRIES):
        try:
            # This ping checks if the connection is actually usable (and Primary is elected)
            await db.command("ping")
            
            count = await db.restaurants.count_documents({})
            if count == 0:
                logger.info("database_empty", msg="Seeding initial data...", attempt=attempt+1)
                from seed import INITIAL_RESTAURANTS
                for rest in INITIAL_RESTAURANTS:
                    rest["_id"] = rest["id"]
                    await db.restaurants.insert_one(rest)
                logger.info("database_seeded", count=len(INITIAL_RESTAURANTS))
            else:
                logger.info("database_ready", count=count)
            
            break # Success! Exit the retry loop
            
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                logger.warn("database_not_ready", error=str(e), next_retry_in=f"{RETRY_INTERVAL}s")
                await asyncio.sleep(RETRY_INTERVAL)
            else:
                logger.error("seeding_failed_exhausted", error=str(e))
    
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
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for Kubernetes Liveness/Readiness probes.
    """
    return {"status": "healthy", "version": os.getenv('APP_VERSION', '0.0.0')}

# Include API Routers
app.include_router(restaurants.router, prefix="/api/v1/restaurants", tags=["Restaurants"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])

# Serve Static Files (React Frontend)
# Base directory is /code inside container
static_path = os.path.join(os.getcwd(), "static")

if os.path.exists(static_path):
    # Mount images specifically to ensure they take precedence
    if os.path.exists(os.path.join(static_path, "images")):
        app.mount("/images", StaticFiles(directory=os.path.join(static_path, "images")), name="images")
    
    # Mount assets specifically to ensure they are served correctly
    if os.path.exists(os.path.join(static_path, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_path, "assets")), name="assets")
    
    @app.get("/{catchall:path}", include_in_schema=False)
    async def serve_react_app(request: Request, catchall: str):
        """Catch-all route to support React Router (SPA)"""
        from fastapi import HTTPException
        
        # 1. If it looks like an API call but reached here, it is a real 404
        if catchall.startswith("api/v1"):
            raise HTTPException(status_code=404, detail="API route not found")
            
        # 2. If it is a request for a file that does not exist
        if "." in catchall.split("/")[-1]:
             raise HTTPException(status_code=404, detail="File not found")

        # 3. Check if index.html actually exists before serving
        index_path = os.path.join(static_path, "index.html")
        if not os.path.exists(index_path):
            raise HTTPException(status_code=404, detail="Application not built")

        return FileResponse(index_path)

    # Mount the rest of the React build last
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

    