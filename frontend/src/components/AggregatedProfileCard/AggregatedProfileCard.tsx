import type { AggregationResult, WOWAAggregationResult } from '../../types'

interface Props {
  result: AggregationResult
}

const DIMS = [
  { key: 'temp',   label: 'Temperature', unit: ' °C'  },
  { key: 'licht',  label: 'Light',       unit: ' lux' },
  { key: 'height', label: 'Blind Height', unit: '%'   },
  { key: 'angle',  label: 'Slat Angle',  unit: '%'    },
] as const

function isWOWA(r: AggregationResult): r is WOWAAggregationResult {
  return r.method === 'wowa'
}

export function AggregatedProfileCard({ result }: Props) {
  const wowa = isWOWA(result) ? result : null
  const isConditionB = !!wowa
  const accent = isConditionB ? 'purple' : 'blue'

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5 md:col-span-2">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-primary">Aggregated Profile C</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Applied to dashboard · partner: <span className="font-medium">{result.partner_label}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full
            ${isConditionB ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isConditionB ? 'Condition B — WOWA' : 'Condition A — Simple Average'}
          </span>
          <span className="text-xs font-mono text-gray-400">{result.formula}</span>
        </div>
      </div>

      {/* ── WOWA: importance weights ── */}
      {wowa && (
        <div className="flex gap-6 bg-purple-50 rounded-xl px-4 py-3 text-sm text-purple-800 flex-wrap">
          <span>Your importance weight (β): <strong>{wowa.beta.user * 100}%</strong></span>
          <span>Partner importance weight (β): <strong>{wowa.beta.partner * 100}%</strong></span>
          <span className="ml-auto text-purple-400 text-xs font-mono">
            OWA quantifier: a={wowa.owa_params.a}, b={wowa.owa_params.b}
          </span>
        </div>
      )}

      {/* ── Metric tiles ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DIMS.map(({ key, label, unit }) => {
          const agg = result.aggregated[key]
          const usr = result.user_values[key]
          const prt = result.partner_values[key]
          return (
            <div key={key}
              className={`rounded-xl border-2 p-4 flex flex-col gap-1
                ${isConditionB ? 'border-purple-100 bg-purple-50' : 'border-blue-100 bg-blue-50'}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold
                ${isConditionB ? 'text-purple-700' : 'text-blue-700'}`}>
                {agg}{unit}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                You: {usr}{unit} · Partner: {prt}{unit}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Breakdown table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 text-sm">
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="px-3 py-2">Parameter</div>
          <div className="px-3 py-2 text-center">{result.partner_label}</div>
          <div className="px-3 py-2 text-center">Your Input</div>
          <div className={`px-3 py-2 text-center font-bold
            ${isConditionB ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
            Result
          </div>
        </div>
        {DIMS.map(({ key, label, unit }) => {
          const a   = result.partner_values[key]
          const b   = result.user_values[key]
          const res = result.aggregated[key]
          const calc = isConditionB
            ? `WOWA(${b}, ${a}) = ${res}${unit}`
            : `(${a} + ${b}) / 2 = ${res}${unit}`
          return (
            <div key={key} className="grid grid-cols-4 border-b border-gray-100 last:border-0">
              <div className="px-3 py-2.5 font-medium text-gray-700">{label}</div>
              <div className="px-3 py-2.5 text-center text-gray-600">{a}{unit}</div>
              <div className="px-3 py-2.5 text-center text-gray-600">{b}{unit}</div>
              <div className={`px-3 py-2.5 text-center text-xs font-semibold
                ${isConditionB ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {calc}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
