import type { BlindPosition, SensorData, UserPreference } from '../types'

const BASE = '/api/blind'

export async function fetchState() {
  const res = await fetch(`${BASE}/state`)
  return res.json()
}

export async function setPosition(pos: BlindPosition) {
  await fetch(`${BASE}/position`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pos),
  })
}

export async function sendSensorData(data: SensorData) {
  await fetch(`${BASE}/sensor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function setAutoMode(enabled: boolean) {
  await fetch(`${BASE}/auto_mode?enabled=${enabled}`, { method: 'POST' })
}

export async function submitPreference(pref: UserPreference) {
  const res = await fetch(`${BASE}/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pref),
  })
  return res.json()
}

export async function fetchPreferences() {
  const res = await fetch(`${BASE}/preferences`)
  return res.json()
}
