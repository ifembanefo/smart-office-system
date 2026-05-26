import { useState, useCallback, useRef } from 'react'
import { SensorPanel } from '../components/SensorPanel/SensorPanel'
import { BlindControl } from '../components/BlindControl/BlindControl'
import { PresetButtons } from '../components/PresetButtons/PresetButtons'
import { VideoSimulation } from '../components/VideoSimulation/VideoSimulation'
import { ConsentModal } from '../components/ConsentModal/ConsentModal'
import { PreferenceWizard } from '../components/PreferenceWizard/PreferenceWizard'
import { AggregatedProfileCard } from '../components/AggregatedProfileCard/AggregatedProfileCard'
import { useWebSocket } from '../hooks/useWebSocket'
import { setPosition, setAutoMode, sendSensorData } from '../services/api'
import { determineBlindPosition } from '../utils/automationLogic'
import type { AppState, BlindPosition, Preset, WSMessage, AggregationResult } from '../types'

const DEFAULT_STATE: AppState = {
  position: { height: 0, angle: 0 },
  avg_temp: 0,
  avg_licht: 0,
  auto_mode: false,
  sensors: [],
}

export function Dashboard() {
  const [consented, setConsented] = useState(() => localStorage.getItem('consent') === 'true')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [justAggregated, setJustAggregated] = useState(false)
  const didAggregateRef = useRef(false)
  const [aggregatedProfile, setAggregatedProfile] = useState<AggregationResult | null>(() => {
    try { return JSON.parse(localStorage.getItem('aggregated_profile') ?? 'null') } catch { return null }
  })
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [sensorValues, setSensorValues] = useState({ temp: 0, licht: 0 })

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'init') {
      setState((prev) => ({
        ...prev,
        position: msg.position ?? prev.position,
        auto_mode: msg.auto_mode ?? prev.auto_mode,
        avg_temp: msg.avg_temp ?? prev.avg_temp,
        avg_licht: msg.avg_licht ?? prev.avg_licht,
      }))
    } else if (msg.type === 'position') {
      setState((prev) => ({
        ...prev,
        position: { height: msg.height ?? 0, angle: msg.angle ?? 0 },
      }))
    } else if (msg.type === 'sensor_update') {
      setState((prev) => ({
        ...prev,
        avg_temp: msg.avg_temp ?? prev.avg_temp,
        avg_licht: msg.avg_licht ?? prev.avg_licht,
      }))
    }
  }, [])

  useWebSocket(handleMessage)

  const handleSensorChange = async (values: { temp: number; licht: number }) => {
    setSensorValues(values)
    const newPosition = determineBlindPosition(values.temp, values.licht)
    setState((prev) => ({ ...prev, position: newPosition }))
    await sendSensorData({ remote_id: 'manual', temp: values.temp, licht: values.licht })
  }

  const handlePositionChange = async (pos: BlindPosition) => {
    setState((prev) => ({ ...prev, position: pos }))
    await setPosition(pos)
  }

  const handleAutoToggle = async (enabled: boolean) => {
    setState((prev) => ({ ...prev, auto_mode: enabled }))
    await setAutoMode(enabled)
  }

  const handleConsent = () => {
    localStorage.setItem('consent', 'true')
    setConsented(true)
  }

  const handleResetEvaluation = () => {
    localStorage.removeItem('consent')
    localStorage.removeItem('aggregated_profile')
    setConsented(false)
    setAggregatedProfile(null)
  }

  const handlePreset = async (preset: Preset) => {
    const pos: BlindPosition = { height: preset.height, angle: preset.angle }
    setState((prev) => ({ ...prev, auto_mode: false, position: pos }))
    await setAutoMode(false)
    await setPosition(pos)
    if (preset.temp !== undefined && preset.licht !== undefined) {
      const newSensor = { temp: preset.temp, licht: preset.licht }
      setSensorValues(newSensor)
      await sendSensorData({ remote_id: 'manual', ...newSensor })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!consented && <ConsentModal onConsent={handleConsent} />}
      {wizardOpen && (
        <PreferenceWizard
          onClose={() => {
            setWizardOpen(false)
            if (didAggregateRef.current) {
              didAggregateRef.current = false
              setJustAggregated(true)
              setTimeout(() => setJustAggregated(false), 3000)
            }
          }}
          onAggregated={async (result) => {
            didAggregateRef.current = true
            setAggregatedProfile(result)
            localStorage.setItem('aggregated_profile', JSON.stringify(result))
            const { temp, licht } = result.aggregated
            setSensorValues({ temp, licht })
            setState((prev) => ({ ...prev, auto_mode: false }))
            await setAutoMode(false)
            await sendSensorData({ remote_id: 'aggregated', temp, licht })
          }}
        />
      )}
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Office System</h1>
            <p className="text-blue-200 text-sm">Thesis 2026 — Ife Mbanefo</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state.auto_mode ? 'bg-green-400' : 'bg-yellow-400'
                }`}
              />
              <span className="text-sm">{state.auto_mode ? 'Automatic' : 'Manual'}</span>
            </div>
            <button
              onClick={handleResetEvaluation}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Restart Evaluation
            </button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SensorPanel values={sensorValues} onChange={handleSensorChange} />
        <BlindControl
          position={state.position}
          autoMode={state.auto_mode}
          onChange={handlePositionChange}
          onAutoToggle={handleAutoToggle}
        />
        <div className={`rounded-2xl transition-all duration-700 ${justAggregated ? 'ring-4 ring-blue-400 shadow-xl shadow-blue-200' : ''}`}>
          <VideoSimulation position={state.position} />
        </div>
        <PresetButtons onSelect={handlePreset} onAggregatePreferences={() => setWizardOpen(true)} />
        {aggregatedProfile && (
          <div className={`rounded-2xl transition-all duration-700 md:col-span-2 ${justAggregated ? 'ring-4 ring-blue-400 shadow-xl shadow-blue-200' : ''}`}>
            <AggregatedProfileCard result={aggregatedProfile} />
          </div>
        )}
      </main>
    </div>
  )
}
