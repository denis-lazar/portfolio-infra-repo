from fastapi import WebSocket
from typing import List, Dict
from app.core.config import settings
import redis.asyncio as redis
import asyncio
import json
import structlog

logger = structlog.get_logger()

class ConnectionManager:
    def __init__(self):
        # active_connections[restaurant_id] = [list of websockets]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client = None
        self.pubsub = None
        self.listener_task = None

    async def _get_redis(self):
        if self.redis_client is None:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
        return self.redis_client

    async def connect(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)
        
        # Start Redis listener if not already running
        if self.listener_task is None:
            self.listener_task = asyncio.create_task(self._redis_listener())
            logger.info("redis_pubsub_started", host=settings.REDIS_HOST)

        logger.debug("websocket_connected", restaurant_id=restaurant_id, count=len(self.active_connections[restaurant_id]))

    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].remove(websocket)
            logger.debug("websocket_disconnected", restaurant_id=restaurant_id, count=len(self.active_connections.get(restaurant_id, [])))
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]

    async def broadcast_to_restaurant(self, restaurant_id: str, message: dict):
        """Publish message to Redis instead of direct broadcast."""
        r = await self._get_redis()
        # Add the restaurant_id to the message so listeners know who it belongs to
        payload = {
            "restaurant_id": restaurant_id,
            "message": message
        }
        await r.publish("menusync_updates", json.dumps(payload))
        logger.debug("redis_published", restaurant_id=restaurant_id, type=message.get("type"))

    async def _redis_listener(self):
        """Background task to listen for Redis messages and broadcast to local clients."""
        r = await self._get_redis()
        pubsub = r.pubsub()
        await pubsub.subscribe("menusync_updates")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    restaurant_id = data["restaurant_id"]
                    actual_message = data["message"]
                    
                    # Send to local clients watching this restaurant
                    local_clients = self.active_connections.get(restaurant_id, [])
                    # Send to local clients watching global view
                    global_clients = self.active_connections.get("global", []) if restaurant_id != "global" else []
                    
                    targets = list(local_clients)
                    for gc in global_clients:
                        if gc not in targets:
                            targets.append(gc)
                    
                    if targets:
                        logger.debug("local_broadcast", count=len(targets), type=actual_message.get("type"))
                        for connection in targets:
                            try:
                                await connection.send_json(actual_message)
                            except Exception as e:
                                logger.error("websocket_send_error", error=str(e))
        except Exception as e:
            logger.error("redis_listener_error", error=str(e))
            self.listener_task = None

manager = ConnectionManager()