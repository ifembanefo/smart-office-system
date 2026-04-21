interface SensorValues {
  temp: number
  licht: number
}

interface Props {
  values: SensorValues
  onChange: (values: SensorValues) => void
}

export function SensorPanel({ values, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-bold text-primary mb-5">Sensor Control</h2>

      {/* Temperature */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-600">Temperature</label>
          <span className="text-sm font-bold text-orange-500">{values.temp.toFixed(1)} °C</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          step={0.1}
          value={values.temp}
          onChange={(e) => onChange({ ...values, temp: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 °C</span><span>40 °C</span>
        </div>
        {/* Visual bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(values.temp / 40) * 100}%` }}
          />
        </div>
      </div>

      {/* Light intensity */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-600">Light Intensity</label>
          <span className="text-sm font-bold text-yellow-500">{values.licht.toFixed(0)} lux</span>
        </div>
        <input
          type="range"
          min={0}
          max={4095}
          step={1}
          value={values.licht}
          onChange={(e) => onChange({ ...values, licht: Number(e.target.value) })}
          className="w-full accent-yellow-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span><span>4095</span>
        </div>
        {/* Visual bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-blue-300 to-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(values.licht / 4095) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
