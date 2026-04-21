import type { BlindPosition } from '../../types'

interface Props {
  position: BlindPosition
  autoMode: boolean
  onChange: (pos: BlindPosition) => void
  onAutoToggle: (enabled: boolean) => void
}

export function BlindControl({ position, autoMode, onChange, onAutoToggle }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-primary">Blind Control</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-500">Auto</span>
          <div
            onClick={() => onAutoToggle(!autoMode)}
            className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${
              autoMode ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                autoMode ? 'left-7' : 'left-1'
              }`}
            />
          </div>
        </label>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-600">Height</label>
          <span className="text-sm font-bold text-primary">{position.height.toFixed(0)} %</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={position.height}
          disabled={autoMode}
          onChange={(e) => onChange({ ...position, height: Number(e.target.value) })}
          className="w-full accent-primary disabled:opacity-50"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-600">Angle</label>
          <span className="text-sm font-bold text-primary">{position.angle.toFixed(0)} °</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={position.angle}
          disabled={autoMode}
          onChange={(e) => onChange({ ...position, angle: Number(e.target.value) })}
          className="w-full accent-primary disabled:opacity-50"
        />
      </div>

      {autoMode && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          Automatic mode active — sliders disabled
        </p>
      )}
    </div>
  )
}
