import { useState } from 'react'
import type { UserPreference } from '../../types'
import { submitPreference } from '../../services/api'

interface Props {
  onClose: () => void
}

type Mode = 'preset' | 'slider'
type Step = 'profile' | 'mode' | 'input' | 'done'

const PARTNER_PROFILES = [
  { id: 'professor', label: 'Professor Profile', subtitle: 'Prof. Dr. Weber' },
  { id: 'student', label: 'Student Profile', subtitle: 'Leonie Bauer' },
]

const PRESETS = [
  { label: 'Glare Mode', height: 55, angle: 80, temp: 28, licht: 3500 },
  { label: 'Summer Mode', height: 75, angle: 91, temp: 30, licht: 3800 },
  { label: 'Winter Mode', height: 55, angle: 10, temp: 18, licht: 1000 },
]

const STEP_LABELS: Record<Step, string> = {
  profile: 'Choose Partner Profile',
  mode: 'Select Mode',
  input: 'Set Your Preferences',
  done: 'Done',
}

export function PreferenceWizard({ onClose }: Props) {
  const [step, setStep] = useState<Step>('profile')
  const [partnerProfile, setPartnerProfile] = useState<string>('')
  const [mode, setMode] = useState<Mode>('slider')
  const [sliders, setSliders] = useState({ height: 50, angle: 50, temp: 22, licht: 2000 })
  const [submitting, setSubmitting] = useState(false)

  const handleProfileSelect = (id: string) => {
    setPartnerProfile(id)
    setStep('mode')
  }

  const handleModeSelect = (m: Mode) => {
    setMode(m)
    setStep('input')
  }

  const handlePresetSelect = async (preset: typeof PRESETS[number]) => {
    await submit({
      height: preset.height,
      angle: preset.angle,
      temp: preset.temp,
      licht: preset.licht,
      preset_label: preset.label,
    })
  }

  const handleSliderSubmit = async () => {
    await submit({ ...sliders })
  }

  const submit = async (values: Partial<UserPreference>) => {
    setSubmitting(true)
    await submitPreference({
      partner_profile: partnerProfile,
      mode,
      height: values.height ?? 0,
      angle: values.angle ?? 0,
      temp: values.temp ?? 0,
      licht: values.licht ?? 0,
      preset_label: values.preset_label,
    })
    setSubmitting(false)
    setStep('done')
  }

  const steps: Step[] = ['profile', 'mode', 'input', 'done']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-6">

        {/* Progress bar */}
        {step !== 'done' && (
          <div className="flex gap-1.5">
            {steps.slice(0, 3).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step title */}
        {step !== 'done' && (
          <h2 className="text-xl font-bold text-gray-800">{STEP_LABELS[step]}</h2>
        )}

        {/* Step 1: Partner profile */}
        {step === 'profile' && (
          <div className="flex flex-col gap-3">
            {PARTNER_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProfileSelect(p.id)}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors"
              >
                <p className="font-semibold text-gray-800">{p.label}</p>
                <p className="text-sm text-gray-500">{p.subtitle}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Mode selection */}
        {step === 'mode' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleModeSelect('preset')}
              className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors"
            >
              <p className="font-semibold text-gray-800">Select a Preset</p>
              <p className="text-sm text-gray-500">Glare – Summer – Winter</p>
            </button>
            <button
              onClick={() => handleModeSelect('slider')}
              className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors"
            >
              <p className="font-semibold text-gray-800">Adjust Sliders</p>
              <p className="text-sm text-gray-500">Height – Angle – Temp – Lux</p>
            </button>
            <button onClick={() => setStep('profile')} className="text-sm text-gray-400 hover:text-gray-600 mt-1">
              ← Back
            </button>
          </div>
        )}

        {/* Step 3a: Preset selection */}
        {step === 'input' && mode === 'preset' && (
          <div className="flex flex-col gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePresetSelect(p)}
                disabled={submitting}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors disabled:opacity-50"
              >
                <p className="font-semibold text-gray-800">{p.label}</p>
                <p className="text-sm text-gray-500">{p.temp} °C · {p.licht} lux · height {p.height}% · angle {p.angle}%</p>
              </button>
            ))}
            <button onClick={() => setStep('mode')} className="text-sm text-gray-400 hover:text-gray-600 mt-1">
              ← Back
            </button>
          </div>
        )}

        {/* Step 3b: Slider input */}
        {step === 'input' && mode === 'slider' && (
          <div className="flex flex-col gap-5">
            {(
              [
                { key: 'height', label: 'Blind Height', min: 0, max: 100, unit: '%' },
                { key: 'angle', label: 'Slat Angle', min: 0, max: 100, unit: '%' },
                { key: 'temp', label: 'Temperature', min: 15, max: 35, unit: '°C' },
                { key: 'licht', label: 'Light Intensity', min: 0, max: 5000, unit: 'lux' },
              ] as const
            ).map(({ key, label, min, max, unit }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-blue-600 font-semibold">{sliders[key]} {unit}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={sliders[key]}
                  onChange={(e) => setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep('mode')} className="text-sm text-gray-400 hover:text-gray-600">
                ← Back
              </button>
              <button
                onClick={handleSliderSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✓</div>
            <h2 className="text-xl font-bold text-gray-800">Preferences Saved</h2>
            <p className="text-sm text-gray-500 text-center">
              Your preferences have been added anonymously to the group collection.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Close button */}
        {step !== 'done' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
