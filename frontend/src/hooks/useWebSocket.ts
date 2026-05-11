import { useEffect, useRef, useCallback } from 'react'
import type { WSMessage } from '../types'

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/api/blind/ws`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data) as WSMessage)
      } catch {}
    }

    ws.onerror = () => console.error('WebSocket Fehler')

    return () => ws.close()
  }, [onMessage])

  return { send }
}
