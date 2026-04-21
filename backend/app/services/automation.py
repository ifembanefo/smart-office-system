import time
from typing import Dict, List
from app.models.sensor import SensorData, BlindPosition
from app.services.calculation import compute_average, determine_auto_position

COOLDOWN_SECONDS = 30


class AutomationService:
    def __init__(self):
        self.sensors: Dict[str, SensorData] = {}
        self.current_position = BlindPosition(height=0.0, angle=0.0)
        self.auto_mode = True
        self._last_change = 0.0

    def update_sensor(self, data: SensorData):
        self.sensors[data.remote_id] = data

    def get_sensor_list(self) -> List[SensorData]:
        return list(self.sensors.values())

    def run_automation(self) -> BlindPosition | None:
        """Run automation logic; returns new position if changed, else None."""
        if not self.auto_mode:
            return None
        if time.time() - self._last_change < COOLDOWN_SECONDS:
            return None

        avg_temp, avg_licht = compute_average(self.get_sensor_list())
        new_pos = determine_auto_position(avg_temp, avg_licht)

        if new_pos.height != self.current_position.height or new_pos.angle != self.current_position.angle:
            self.current_position = new_pos
            self._last_change = time.time()
            return new_pos
        return None

    def set_manual_position(self, position: BlindPosition):
        self.current_position = position
        self._last_change = time.time()

    def get_averages(self) -> dict:
        avg_temp, avg_licht = compute_average(self.get_sensor_list())
        return {"avg_temp": round(avg_temp, 2), "avg_licht": round(avg_licht, 2)}


automation_service = AutomationService()
