import { useState } from 'react'
import type { UserPreference, SimpleAggregationResult, WOWAAggregationResult, AggregationResult } from '../../types'
import { submitPreference, aggregateSimple, aggregateWowa } from '../../services/api'

interface Props {
  onClose: () => void
  onAggregated: (result: AggregationResult) => void
}

type AggMethod = 'simple' | 'wowa'
type Step      = 'input' | 'method' | 'result'

const FIXED_PARTNER    = 'student'
const PARTNER_LABEL    = 'Leonie Bauer'
const WOWA_BETA_USER    = 0.3   // partner always has stronger influence
const WOWA_BETA_PARTNER = 0.7

const DIMS = [
  { key: 'temp',   label: 'Temperature', unit: ' °C'  },
  { key: 'licht',  label: 'Light',       unit: ' lux' },
  { key: 'height', label: 'Height',      unit: '%'    },
  { key: 'angle',  label: 'Angle',       unit: '%'    },
] as const

const PROGRESS: Record<Step, number> = {
  input:  0,
  method: 1,
  result: 2,
}

export function PreferenceWizard({ onClose, onAggregated }: Props) {
  const [step,         setStep]         = useState<Step>('input')
  const [aggMethod,    setAggMethod]    = useState<AggMethod>('simple')
  const [sliders,      setSliders]      = useState({ height: 50, angle: 50, temp: 22, licht: 2000 })
  const [simpleResult, setSimpleResult] = useState<SimpleAggregationResult | null>(null)
  const [wowaResult,   setWowaResult]   = useState<WOWAAggregationResult | null>(null)

  const submit = async (method: AggMethod = aggMethod) => {
    const pref: UserPreference = {
      partner_profile: FIXED_PARTNER,
      mode:            'slider',
      height:          sliders.height,
      angle:           sliders.angle,
      temp:            sliders.temp,
      licht:           sliders.licht,
    }
    await submitPreference(pref)

    if (method === 'simple') {
      const r = await aggregateSimple(pref)
      setSimpleResult(r)
      onAggregated(r)
    } else {
      const r = await aggregateWowa(pref, WOWA_BETA_USER, WOWA_BETA_PARTNER)
      setWowaResult(r)
      onAggregated(r)
    }

    setStep('result')
  }

  const BackBtn = ({ to }: { to: Step }) => (
    <button onClick={() => setStep(to)} className="text-sm text-gray-400 hover:text-gray-600 mt-1">
      ← Back
    </button>
  )

  const progressIndex = PROGRESS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full p-8 flex flex-col gap-6 relative
        ${step === 'result' ? 'max-w-xl' : 'max-w-md'}`}>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors
              ${i <= progressIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Partner info badge */}
        {step !== 'result' && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-600 -mt-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            Aggregating with partner: <strong className="text-gray-800 ml-1">{PARTNER_LABEL}</strong>
          </div>
        )}

        {/* ── Step 1: Sliders ── */}
        {step === 'input' && (
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
              <button onClick={() => setStep('method')}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Aggregation method ── */}
        {step === 'method' && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Choose Aggregation Method</h2>
            <p className="text-sm text-gray-500 -mt-2">
              How should your preferences be combined with {PARTNER_LABEL}'s?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setAggMethod('simple'); submit('simple') }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">Condition A — Simple Averaging</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">Σv / n</span>
                </div>
                <p className="text-sm text-gray-500">Both preferences are weighted equally. The result is the arithmetic mean of your values and your partner's values.</p>
              </button>

              <button
                onClick={() => { setAggMethod('wowa'); submit('wowa') }}
                className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">Condition B — Weighted Aggregation (WOWA)</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">Σω·v</span>
                </div>
                <p className="text-sm text-gray-500">Combines importance weights with positional weights. {PARTNER_LABEL}'s preferences carry stronger influence (β = {WOWA_BETA_PARTNER * 100}%).</p>
              </button>

              <BackBtn to="input" />
            </div>
          </>
        )}

        {/* ── Step 3: Result ── */}
        {step === 'result' && (simpleResult || wowaResult) && (
          <>
            <h2 className="text-xl font-bold text-gray-800">Aggregated Profile C</h2>

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

            {wowaResult && (
              <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm text-purple-800 flex gap-6 flex-wrap">
                <span>Your weight (β): <strong>{wowaResult.beta.user * 100}%</strong></span>
                <span>Partner weight (β): <strong>{wowaResult.beta.partner * 100}%</strong></span>
                <span className="ml-auto text-purple-500 text-xs font-mono">
                  a={wowaResult.owa_params.a} · b={wowaResult.owa_params.b}
                </span>
              </div>
            )}

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
                    const a   = r.partner_values[key]
                    const b   = r.user_values[key]
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
