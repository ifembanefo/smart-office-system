import type { BlindPosition, SensorData, UserPreference, SimpleAggregationResult, WOWAAggregationResult } from '../types'

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

export async function aggregateSimple(pref: UserPreference): Promise<SimpleAggregationResult> {
  const res = await fetch(`${BASE}/aggregate/simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pref),
  })
  return res.json()
}

export async function aggregateWowa(
  pref: UserPreference,
  betaUser: number,
  betaPartner: number,
): Promise<WOWAAggregationResult> {
  const res = await fetch(
    `${BASE}/aggregate/wowa?beta_user=${betaUser}&beta_partner=${betaPartner}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pref),
    },
  )
  return res.json()
}
