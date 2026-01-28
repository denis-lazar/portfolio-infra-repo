from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from prometheus_client import Gauge

# Define custom metric
DB_CONNECTIONS_ACTIVE = Gauge("db_connections_active", "Number of active MongoDB connections")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_helper = Database()

async def connect_to_mongo():
    db_helper.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_helper.db = db_helper.client.get_database()
    DB_CONNECTIONS_ACTIVE.set(1) # Mark connection as active
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db_helper.client:
        db_helper.client.close()
        DB_CONNECTIONS_ACTIVE.set(0) # Mark connection as closed
    print("Closed MongoDB connection")

def get_database():
    return db_helper.db
