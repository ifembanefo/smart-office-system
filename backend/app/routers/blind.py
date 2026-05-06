from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.sensor import SensorData, BlindPosition, UserPreference
from app.services.automation import automation_service
from app.services.preference_store import preference_store
from app.websocket.manager import manager
import json

router = APIRouter()


@router.get("/state")
async def get_state():
    return {
        "position": automation_service.current_position,
        "auto_mode": automation_service.auto_mode,
        **automation_service.get_averages(),
        "sensors": [s.model_dump() for s in automation_service.get_sensor_list()],
    }


@router.post("/position")
async def set_position(pos: BlindPosition):
    automation_service.set_manual_position(pos)
    await manager.broadcast({"type": "position", "height": pos.height, "angle": pos.angle})
    return {"status": "ok", "position": pos}


@router.post("/sensor")
async def update_sensor(data: SensorData):
    automation_service.update_sensor(data)
    new_pos = automation_service.run_automation()

    await manager.broadcast({
        "type": "sensor_update",
        "remote_id": data.remote_id,
        "temp": data.temp,
        "licht": data.licht,
        **automation_service.get_averages(),
    })

    if new_pos:
        await manager.broadcast({"type": "position", "height": new_pos.height, "angle": new_pos.angle})

    return {"status": "ok"}


@router.post("/preference")
async def submit_preference(pref: UserPreference):
    preference_store.add(pref)
    return {"status": "ok", "total": preference_store.count()}


@router.get("/preferences")
async def get_preferences():
    return {"preferences": [p.model_dump() for p in preference_store.all()]}


@router.post("/auto_mode")
async def toggle_auto_mode(enabled: bool):
    automation_service.auto_mode = enabled
    return {"auto_mode": automation_service.auto_mode}


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send current state on connect
        state = {
            "type": "init",
            "position": automation_service.current_position.model_dump(),
            "auto_mode": automation_service.auto_mode,
            **automation_service.get_averages(),
        }
        await manager.send(ws, state)

        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "sensor":
                data = SensorData(**msg)
                automation_service.update_sensor(data)
                new_pos = automation_service.run_automation()
                await manager.broadcast({
                    "type": "sensor_update",
                    **automation_service.get_averages(),
                })
                if new_pos:
                    await manager.broadcast({"type": "position", "height": new_pos.height, "angle": new_pos.angle})

            elif msg.get("type") == "position":
                pos = BlindPosition(height=msg["height"], angle=msg["angle"])
                automation_service.set_manual_position(pos)
                await manager.broadcast({"type": "position", "height": pos.height, "angle": pos.angle})

    except WebSocketDisconnect:
        manager.disconnect(ws)
