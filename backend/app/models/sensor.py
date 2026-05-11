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


class UserPreference(BaseModel):
    partner_profile: str        # "professor" | "student"
    height: float               # 0–100 %
    angle: float                # 0–100 %
    temp: float                 # °C
    licht: float                # raw lux/ADC
    mode: str                   # "preset" | "slider"
    preset_label: Optional[str] = None


class SimpleAggregationResult(BaseModel):
    method: str = "simple_average"
    formula: str = "(Profile A + Profile B) / 2"
    partner_label: str
    partner_values: dict
    user_values: dict
    aggregated: dict
    blind_position: BlindPosition


class WOWAAggregationResult(BaseModel):
    method: str = "wowa"
    formula: str = "Σ ω_i · v_(i)   where ω_i = w*(Σβ_{1..i}) - w*(Σβ_{1..i-1})"
    partner_label: str
    beta: dict                   # {"user": float, "partner": float}
    owa_params: dict             # {"a": float, "b": float}
    partner_values: dict
    user_values: dict
    aggregated: dict
    blind_position: BlindPosition
