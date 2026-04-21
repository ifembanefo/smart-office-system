import json
from typing import List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active = [c for c in self.active if c != ws]

    async def broadcast(self, message: dict):
        data = json.dumps(message)
        for ws in list(self.active):
            try:
                await ws.send_text(data)
            except Exception:
                self.disconnect(ws)

    async def send(self, ws: WebSocket, message: dict):
        await ws.send_text(json.dumps(message))


manager = ConnectionManager()
