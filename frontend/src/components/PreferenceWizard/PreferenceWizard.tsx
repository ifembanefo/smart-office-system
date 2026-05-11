import { useState } from 'react'
import type { UserPreference, SimpleAggregationResult, WOWAAggregationResult, AggregationResult } from '../../types'
import { submitPreference, aggregateSimple, aggregateWowa } from '../../services/api'

interface Props {
  onClose: () => void
  onAggregated: (result: AggregationResult) => void
}

type Mode       = 'preset' | 'slider'
type AggMethod  = 'simple' | 'wowa'
type Step       = 'profile' | 'mode' | 'input' | 'method' | 'importance' | 'result'

// ── Static data ───────────────────────────────────────────────────────────────

const PARTNER_PROFILES = [
  { id: 'professor', label: 'Professor Profile', subtitle: 'Prof. Dr. Weber' },
  { id: 'student',   label: 'Student Profile',   subtitle: 'Leonie Bauer' },
]

const PRESETS = [
  { label: 'Glare Mode',  height: 55, angle: 80, temp: 28, licht: 3500 },
  { label: 'Summer Mode', height: 75, angle: 91, temp: 30, licht: 3800 },
  { label: 'Winter Mode', height: 55, angle: 10, temp: 18, licht: 1000 },
]

const IMPORTANCE_OPTIONS = [
  {
    label: 'Equal importance',
    sublabel: 'Both preferences count equally',
    betaUser: 0.5,
    betaPartner: 0.5,
    tag: '50 / 50',
  },
  {
    label: 'My preference matters more',
    sublabel: 'Your input has stronger influence on the result',
    betaUser: 0.7,
    betaPartner: 0.3,
    tag: '70 / 30',
  },
  {
    label: "Partner's preference matters more",
    sublabel: "Your partner's input has stronger influence on the result",
    betaUser: 0.3,
    betaPartner: 0.7,
    tag: '30 / 70',
  },
]

const DIMS = [
  { key: 'temp',   label: 'Temperature', unit: ' °C'  },
  { key: 'licht',  label: 'Light',       unit: ' lux' },
  { key: 'height', label: 'Height',      unit: '%'    },
  { key: 'angle',  label: 'Angle',       unit: '%'    },
] as const

// Progress bar maps all possible steps to an index 0-4 (5 visual steps)
const PROGRESS: Record<Step, number> = {
  profile:    0,
  mode:       1,
  input:      2,
  method:     3,
  importance: 3,   // same bar as method
  result:     4,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PreferenceWizard({ onClose, onAggregated }: Props) {
  const [step,           setStep]           = useState<Step>('profile')
  const [partnerProfile, setPartnerProfile] = useState('')
  const [inputMode,      setInputMode]      = useState<Mode>('slider')
  const [aggMethod,      setAggMethod]      = useState<AggMethod>('simple')
  const [betaUser,       setBetaUser]       = useState(0.5)
  const [betaPartner,    setBetaPartner]    = useState(0.5)
  const [sliders,        setSliders]        = useState({ height: 50, angle: 50, temp: 22, licht: 2000 })
  const [submitting,     setSubmitting]     = useState(false)
  const [simpleResult,   setSimpleResult]   = useState<SimpleAggregationResult | null>(null)
  const [wowaResult,     setWowaResult]     = useState<WOWAAggregationResult | null>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePresetSelect = async (preset: typeof PRESETS[number]) => {
    await submit({ height: preset.height, angle: preset.angle, temp: preset.temp, licht: preset.licht, preset_label: preset.label })
  }

  const handleImportanceSelect = (bu: number, bp: number) => {
    setBetaUser(bu)
    setBetaPartner(bp)
    submit({ ...sliders, betaUser: bu, betaPartner: bp }, bu, bp)
  }

  const submit = async (
    values: Partial<UserPreference> & { betaUser?: number; betaPartner?: number },
    bu = betaUser,
    bp = betaPartner,
  ) => {
    setSubmitting(true)
    const pref: UserPreference = {
      partner_profile: partnerProfile,
      mode:            inputMode,
      height:          values.height ?? 0,
      angle:           values.angle  ?? 0,
      temp:            values.temp   ?? 0,
      licht:           values.licht  ?? 0,
      preset_label:    values.preset_label,
    }
    await submitPreference(pref)

    if (aggMethod === 'simple') {
      const r = await aggregateSimple(pref)
      setSimpleResult(r)
      onAggregated(r)
    } else {
      const r = await aggregateWowa(pref, bu, bp)
      setWowaResult(r)
      onAggregated(r)
    }

    setSubmitting(false)
    setStep('result')
  }

  // ── Shared UI pieces ───────────────────────────────────────────────────────

  const BackBtn = ({ to }: { to: Step }) => (
    <button onClick={() => setStep(to)} className="text-sm text-gray-400 hover:text-gray-600 mt-1">← Back</button>
  )

  const progressIndex = PROGRESS[step]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full p-8 flex flex-col gap-6 relative
        ${step === 'result' ? 'max-w-xl' : 'max-w-md'}`}>

        {/* ── Progress bar ── */}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors
              ${i <= progressIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* ── Step 1: Partner profile ── */}
        {step === 'profile' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Choose Partner Profile</h2>
            <div className="flex flex-col gap-3">
              {PARTNER_PROFILES.map((p) => (
                <button key={p.id}
                  onClick={() => { setPartnerProfile(p.id); setStep('mode') }}
                  className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                  <p className="font-semibold text-gray-800">{p.label}</p>
                  <p className="text-sm text-gray-500">{p.subtitle}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Input mode ── */}
        {step === 'mode' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">How do you want to set your preferences?</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setInputMode('preset'); setStep('input') }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <p className="font-semibold text-gray-800">Select a Preset</p>
                <p className="text-sm text-gray-500">Glare – Summer – Winter</p>
              </button>
              <button onClick={() => { setInputMode('slider'); setStep('input') }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <p className="font-semibold text-gray-800">Adjust Sliders</p>
                <p className="text-sm text-gray-500">Height – Angle – Temp – Lux</p>
              </button>
              <BackBtn to="profile" />
            </div>
          </>
        )}

        {/* ── Step 3a: Preset selection ── */}
        {step === 'input' && inputMode === 'preset' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Select Your Preference Preset</h2>
            <div className="flex flex-col gap-3">
              {PRESETS.map((p) => (
                <button key={p.label}
                  onClick={() => { setSliders({ height: p.height, angle: p.angle, temp: p.temp, licht: p.licht }); setStep('method') }}
                  className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                  <p className="font-semibold text-gray-800">{p.label}</p>
                  <p className="text-sm text-gray-500">{p.temp} °C · {p.licht} lux · height {p.height}% · angle {p.angle}%</p>
                </button>
              ))}
              <BackBtn to="mode" />
            </div>
          </>
        )}

        {/* ── Step 3b: Sliders ── */}
        {step === 'input' && inputMode === 'slider' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Set Your Preferences</h2>
            <div className="flex flex-col gap-5">
              {([
                { key: 'height', label: 'Blind Height',    min: 0,  max: 100,  unit: '%'    },
                { key: 'angle',  label: 'Slat Angle',      min: 0,  max: 100,  unit: '%'    },
                { key: 'temp',   label: 'Temperature',     min: 15, max: 35,   unit: ' °C'  },
                { key: 'licht',  label: 'Light Intensity', min: 0,  max: 5000, unit: ' lux' },
              ] as const).map(({ key, label, min, max, unit }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-blue-600 font-semibold">{sliders[key]}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={sliders[key]}
                    onChange={(e) => setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-blue-600" />
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <BackBtn to="mode" />
                <button onClick={() => setStep('method')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Aggregation method ── */}
        {step === 'method' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Choose Aggregation Method</h2>
            <p className="text-sm text-gray-500 -mt-2">
              How should your preferences be combined with your partner's?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setAggMethod('simple'); handlePresetSelect(sliders as any) || submit({ ...sliders }) }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">Condition A — Simple Averaging</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">Σv / n</span>
                </div>
                <p className="text-sm text-gray-500">Both preferences are weighted equally. The result is the arithmetic mean of your values and your partner's values.</p>
              </button>

              <button onClick={() => { setAggMethod('wowa'); setStep('importance') }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">Condition B — Weighted Aggregation (WOWA)</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">Σω·v</span>
                </div>
                <p className="text-sm text-gray-500">Combines importance weights (who matters more) with positional weights (which values rank higher). You will choose the importance in the next step.</p>
              </button>

              <BackBtn to="input" />
            </div>
          </>
        )}

        {/* ── Step 5 (WOWA only): Importance weights ── */}
        {step === 'importance' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">How important is each preference?</h2>
            <p className="text-sm text-gray-500 -mt-2">
              This importance weight (β) determines how much each person's preferences influence the aggregated result.
            </p>
            <div className="flex flex-col gap-3">
              {IMPORTANCE_OPTIONS.map((opt) => (
                <button key={opt.tag}
                  disabled={submitting}
                  onClick={() => handleImportanceSelect(opt.betaUser, opt.betaPartner)}
                  className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors disabled:opacity-50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800">{opt.label}</p>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                      You {opt.betaUser * 100}% · Partner {opt.betaPartner * 100}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{opt.sublabel}</p>
                </button>
              ))}
              <BackBtn to="method" />
            </div>
            {submitting && <p className="text-sm text-center text-blue-600">Calculating…</p>}
          </>
        )}

        {/* ── Step 6: Result ── */}
        {step === 'result' && (simpleResult || wowaResult) && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Aggregated Profile C</h2>

            {/* Method badge + formula */}
            <div className="flex items-center gap-2 -mt-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                simpleResult ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {simpleResult ? 'Condition A' : 'Condition B'}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {simpleResult ? simpleResult.formula : wowaResult!.formula}
              </span>
            </div>

            {/* WOWA only: importance weights used */}
            {wowaResult && (
              <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm text-purple-800 flex gap-6">
                <span>Your weight (β): <strong>{wowaResult.beta.user * 100}%</strong></span>
                <span>Partner weight (β): <strong>{wowaResult.beta.partner * 100}%</strong></span>
                <span className="ml-auto text-purple-500 text-xs font-mono">
                  a={wowaResult.owa_params.a} · b={wowaResult.owa_params.b}
                </span>
              </div>
            )}

            {/* Breakdown table */}
            {(() => {
              const r = (simpleResult ?? wowaResult)!
              const condLabel = simpleResult ? '÷ 2' : 'WOWA'
              return (
                <div className="overflow-hidden rounded-xl border border-gray-200 text-sm">
                  <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="px-3 py-2">Parameter</div>
                    <div className="px-3 py-2 text-center">{r.partner_label}</div>
                    <div className="px-3 py-2 text-center">Your Input</div>
                    <div className={`px-3 py-2 text-center ${simpleResult ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      Result ({condLabel})
                    </div>
                  </div>
                  {DIMS.map(({ key, label, unit }) => {
                    const a = r.partner_values[key]
                    const b = r.user_values[key]
                    const res = r.aggregated[key]
                    const calc = simpleResult
                      ? `(${a} + ${b}) / 2 = ${res}${unit}`
                      : `WOWA(${b}, ${a}) = ${res}${unit}`
                    return (
                      <div key={key} className="grid grid-cols-4 border-b border-gray-100 last:border-0">
                        <div className="px-3 py-2.5 font-medium text-gray-700">{label}</div>
                        <div className="px-3 py-2.5 text-center text-gray-600">{a}{unit}</div>
                        <div className="px-3 py-2.5 text-center text-gray-600">{b}{unit}</div>
                        <div className={`px-3 py-2.5 text-center text-xs font-semibold
                          ${simpleResult ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {calc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            <p className="text-xs text-gray-400 text-center">
              Blind position set to height {(simpleResult ?? wowaResult)!.blind_position.height}% · angle {(simpleResult ?? wowaResult)!.blind_position.angle}% and applied to the dashboard.
            </p>

            <button onClick={onClose}
              className={`w-full text-white font-semibold py-3 rounded-xl transition-colors
                ${simpleResult ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
              Back to Dashboard
            </button>
          </>
        )}

        {/* ── Close button (not on result) ── */}
        {step !== 'result' && (
          <button onClick={onClose}
            className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
