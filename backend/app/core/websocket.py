from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # active_connections[restaurant_id] = [list of websockets]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)
        print(f"DEBUG: WebSocket connected for restaurant {restaurant_id}. Active: {len(self.active_connections[restaurant_id])}")

    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].remove(websocket)
            print(f"DEBUG: WebSocket disconnected for restaurant {restaurant_id}. Active: {len(self.active_connections[restaurant_id])}")
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]

    async def broadcast_to_restaurant(self, restaurant_id: str, message: dict):
        # 1. Get clients specifically watching this restaurant
        restaurant_clients = self.active_connections.get(restaurant_id, [])
        # 2. Get clients on the 'global' list view
        global_clients = self.active_connections.get("global", [])
        
        # Combine unique connections
        all_targets = list(set(restaurant_clients + global_clients))
        
        if all_targets:
            print(f"DEBUG: Broadcasting to {len(all_targets)} clients (Rest: {restaurant_id})")
            for connection in all_targets:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"DEBUG: Error sending WS message: {e}")

manager = ConnectionManager()
