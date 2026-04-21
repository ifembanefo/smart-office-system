from pydantic import BaseModel
from typing import Optional


class SensorData(BaseModel):
    remote_id: str
    temp: float
    licht: float


class BlindPosition(BaseModel):
    height: float   # 0–100 %
    angle: float    # 0–100 %


class RemoteClient(BaseModel):
    id: str
    role: str  # "sensor" | "output" | "frontend"
    last_seen: Optional[float] = None
