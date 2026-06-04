import { useRef, useEffect, useState } from 'react'
import type { BlindPosition } from '../../types'

interface Props {
  position: BlindPosition
}

function getVideoTime(position: BlindPosition, duration: number, video: 1 | 2): number {
  const progress = video === 1 ? position.height / 100 : position.angle / 100
  return progress * duration
}

export function VideoSimulation({ position }: Props) {
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)

  const heightProgress = position.height / 100
  const angleProgress = position.angle / 100
  const effectiveDarkness = Math.max(heightProgress * 0.7, angleProgress)
  const lightness = 95 - effectiveDarkness * 60

  const slats = Array.from({ length: 10 })
  const videoSrc = `/videos/Video${activeVideo}.mp4`

  // Sync preview video to position on every change
  useEffect(() => {
    const video = previewRef.current
    if (!video || !video.duration || isNaN(video.duration)) return
    video.currentTime = getVideoTime(position, video.duration, activeVideo)
  }, [position])

  // Track fullscreen state changes (e.g. user presses Escape)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const enterFullscreen = async () => {
    const el = fullscreenContainerRef.current
    if (el && el.requestFullscreen) {
      await el.requestFullscreen()
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {[]
      await document.exitFullscreen()
    }
  }

  const slatsOverlay = (gap: string, padding: string) => (
    <div className={`absolute inset-0 flex flex-col justify-start ${padding} ${gap} pointer-events-none`}>
      {slats.map((_, i) => {
        const visible = i / slats.length < position.height / 100
        return (
          <div
            key={i}
            className="w-full rounded-sm transition-all duration-500"
            style={{
              height: `${100 / slats.length - 1}%`,
              backgroundColor: visible ? 'rgba(192,160,128,0.75)' : 'transparent',
              transform: `scaleY(${visible ? Math.cos((position.angle / 100) * Math.PI * 0.45) : 0})`,
              opacity: visible ? 1 : 0,
            }}
          />
        )
      })}
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">Blind Simulation</h2>
          <button
            onClick={enterFullscreen}
            className="text-sm bg-accent text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition"
          >
            Fullscreen
          </button>
        </div>

        {/* Preview */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
          <video
            ref={previewRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={() => {
              const video = previewRef.current
              if (video) video.currentTime = getVideoTime(position, video.duration, activeVideo)
            }}
          />
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{ backgroundColor: `hsla(210, 60%, ${lightness}%, 0.25)` }}
          />
          {slatsOverlay('gap-[2px]', 'pt-2 px-2')}
          <div className="absolute bottom-2 right-3 text-xs text-white font-mono drop-shadow">
            H: {position.height}% | A: {position.angle}%
          </div>
        </div>

        {/* Video selector */}
        <div className="flex gap-2 mt-3">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              onClick={() => setActiveVideo(n)}
              className={`flex-1 py-1 text-sm rounded-lg border transition ${
                activeVideo === n
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
              }`}
            >
              {n === 1 ? 'Video 1 – Height' : 'Video 2 – Angle'}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen container — lives outside the card so it can go truly fullscreen */}
      <div
        ref={fullscreenContainerRef}
        className="fixed inset-0 bg-black z-50"
        style={{ display: isFullscreen ? 'block' : 'none' }}
      >
        <video
          src={videoSrc}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget
            video.currentTime = getVideoTime(position, video.duration, activeVideo)
          }}
          ref={(video) => {
            if (video && video.duration && !isNaN(video.duration)) {
              video.currentTime = getVideoTime(position, video.duration, activeVideo)
            }
          }}
        />
        {slatsOverlay('gap-[3px]', 'pt-3 px-3')}

        {/* HUD overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 text-white text-sm px-6 py-3 rounded-full backdrop-blur">
          <span>H: {position.height}%</span>
          <span>A: {position.angle}%</span>
          <button
            onClick={exitFullscreen}
            className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-full transition text-xs"
          >
            Exit Fullscreen
          </button>
        </div>
      </div>
    </>
  )
}
