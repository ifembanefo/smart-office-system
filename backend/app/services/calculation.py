import math
from typing import List
from app.models.sensor import SensorData, BlindPosition

# NTC Thermistor constants
B = 3950.0
T0 = 298.15  # 25°C in Kelvin
R1 = 10000.0  # 10 kΩ reference resistor


def raw_adc_to_temperature(raw: float) -> float:
    """Convert raw 12-bit ADC value (0–4095) to °C using Steinhart-Hart."""
    if raw <= 0:
        return 0.0
    voltage = raw * (3.3 / 4095.0)
    if voltage <= 0:
        return 0.0
    resistance = R1 * (3.3 / voltage - 1.0)
    temp_k = 1.0 / (1.0 / T0 + (1.0 / B) * math.log(resistance / R1))
    return temp_k - 273.15


def compute_average(sensor_list: List[SensorData]) -> tuple[float, float]:
    """Return (avg_temp, avg_licht) across all active sensors."""
    if not sensor_list:
        return 0.0, 0.0
    avg_temp = sum(s.temp for s in sensor_list) / len(sensor_list)
    avg_licht = sum(s.licht for s in sensor_list) / len(sensor_list)
    return avg_temp, avg_licht


# Automation stages - threshold-based blind position mapping
STAGES = [
    {"temp": 25.0, "licht": 2500, "height": 25.0, "angle": 25.0},
    {"temp": 26.5, "licht": 2650, "height": 50.0, "angle": 50.0},
    {"temp": 28.0, "licht": 2800, "height": 75.0, "angle": 75.0},
    {"temp": 30.0, "licht": 3000, "height": 100.0, "angle": 100.0},
]


def determine_auto_position(avg_temp: float, avg_licht: float) -> BlindPosition:
    """Map average sensor values to a blind position using stage-based threshold logic."""
    position = BlindPosition(height=0.0, angle=0.0)
    for stage in STAGES:
        if avg_temp >= stage["temp"] or avg_licht >= stage["licht"]:
            position = BlindPosition(height=stage["height"], angle=stage["angle"])
    return position
