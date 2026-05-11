export interface SensorData {
  remote_id: string
  temp: number
  licht: number
}

export interface BlindPosition {
  height: number
  angle: number
}

export interface AppState {
  position: BlindPosition
  avg_temp: number
  avg_licht: number
  auto_mode: boolean
  sensors: SensorData[]
}

export interface WSMessage {
  type: 'init' | 'position' | 'sensor_update'
  position?: BlindPosition
  height?: number
  angle?: number
  avg_temp?: number
  avg_licht?: number
  auto_mode?: boolean
}

export interface Preset {
  label: string
  height: number
  angle: number
  temp?: number
  licht?: number
}

export interface SimpleAggregationResult {
  method: string
  formula: string
  partner_label: string
  partner_values: { height: number; angle: number; temp: number; licht: number }
  user_values:    { height: number; angle: number; temp: number; licht: number }
  aggregated:     { height: number; angle: number; temp: number; licht: number }
  blind_position: BlindPosition
}

export interface WOWAAggregationResult {
  method: string
  formula: string
  partner_label: string
  beta: { user: number; partner: number }
  owa_params: { a: number; b: number }
  partner_values: { height: number; angle: number; temp: number; licht: number }
  user_values:    { height: number; angle: number; temp: number; licht: number }
  aggregated:     { height: number; angle: number; temp: number; licht: number }
  blind_position: BlindPosition
}

export type AggregationResult = SimpleAggregationResult | WOWAAggregationResult

export interface UserPreference {
  partner_profile: string
  height: number
  angle: number
  temp: number
  licht: number
  mode: string
  preset_label?: string
}
