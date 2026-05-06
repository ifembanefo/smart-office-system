import type { Preset } from '../../types'

const PRESETS: Preset[] = [
  { label: 'Glare Mode', height: 55, angle: 80, temp: 28, licht: 3500 },
  { label: 'Summer Mode', height: 75, angle: 91, temp: 30, licht: 3800 },
  { label: 'Winter Mode', height: 55, angle: 10, temp: 18, licht: 1000 },
]

const PROFILES: Preset[] = [
  { label: 'Prof. Weber', height: 60, angle: 93, temp: 23, licht: 3000 },
  { label: 'Leonie Bauer', height: 80, angle: 85, temp: 27, licht: 1200 },
]

interface Props {
  onSelect: (preset: Preset) => void
  onAggregatePreferences: () => void
}

export function PresetButtons({ onSelect, onAggregatePreferences }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-primary mb-3">Scene Presets</h2>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSelect(p)}
              className="bg-primary text-white rounded-xl py-3 px-3 text-sm font-medium hover:bg-blue-900 active:scale-95 transition-all duration-150 flex flex-col items-center gap-1"
            >
              <span className="font-semibold">{p.label}</span>
              <span className="text-xs opacity-80">{p.temp} °C · {p.licht} lux</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-primary mb-3">User Profiles</h2>
        <div className="grid grid-cols-2 gap-3">
          {PROFILES.map((p) => (
            <button
              key={p.label}
              onClick={() => onSelect(p)}
              className="bg-accent text-white rounded-xl py-3 px-3 text-sm font-medium hover:bg-yellow-600 active:scale-95 transition-all duration-150 flex flex-col items-center gap-1"
            >
              <span className="font-semibold">{p.label}</span>
              <span className="text-xs opacity-80">{p.temp} °C · {p.licht} lux</span>
            </button>
          ))}
        </div>
        <button
          onClick={onAggregatePreferences}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Aggregate My Preferences
        </button>
      </div>
    </div>
  )
}
