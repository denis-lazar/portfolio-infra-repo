import pytest
import httpx
import os

# We want to test through the NGINX port (which is port 80 in the frontend container)
# In Docker Compose, the 'frontend' service handles port 80
NGINX_URL = os.getenv("NGINX_URL", "http://localhost:80")

@pytest.mark.asyncio
async def test_nginx_proxy_api():
    async with httpx.AsyncClient(base_url=NGINX_URL) as client:
        # Test if /api/v1/health is reachable through Nginx
        # The Nginx config proxies /api/ to backend /api/
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_nginx_websocket_upgrade_header():
    async with httpx.AsyncClient(base_url=NGINX_URL) as client:
        # Check if Nginx correctly rejects/handles a fake WS upgrade
        # We look for the "Connection" and "Upgrade" headers in a mock handshake
        headers = {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
            "Sec-WebSocket-Version": "13"
        }
        # We send to the WS endpoint
        response = await client.get("/api/v1/restaurants/test/ws", headers=headers)
        
        # If Nginx is configured correctly, it should at least try to proxy it.
        # It might return 404 (if restaurant 'test' doesn't exist) or 403, 
        # but it shouldn't be a 502/504 Bad Gateway.
        assert response.status_code != 502
        assert response.status_code != 504
