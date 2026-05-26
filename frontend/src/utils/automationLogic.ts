import type { BlindPosition } from '../types'

const QUARTERS = [
  { temp: 25.0, licht: 2500, height: 25.0, angle: 25.0 },
  { temp: 26.5, licht: 2650, height: 50.0, angle: 50.0 },
  { temp: 28.0, licht: 2800, height: 75.0, angle: 75.0 },
  { temp: 30.0, licht: 3000, height: 100.0, angle: 100.0 },
]

export function determineBlindPosition(avgTemp: number, avgLicht: number): BlindPosition {
  let position: BlindPosition = { height: 0, angle: 0 }

  for (const q of QUARTERS) {
    if (avgTemp >= q.temp || avgLicht >= q.licht) {
      position = { height: q.height, angle: q.angle }
    }
  }

  return position
}
