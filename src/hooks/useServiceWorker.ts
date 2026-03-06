'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { addNotification } from '@/services/notifications'

interface PollingState {
  testMode: boolean
  testCount: number
}

export function useServiceWorker() {
  const [pollingState, setPollingState] = useState<PollingState>({
    testMode: false,
    testCount: 0,
  })
  const swRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        swRef.current = registration
        console.log('Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })

    const handleMessage = (event: MessageEvent) => {
      const { data } = event
      if (data.type === 'TEST_NOTIFICATION') {
        setPollingState((prev) => ({
          ...prev,
          testCount: data.count,
        }))
        addNotification({
          type: 'TEST_NOTIFICATION',
          count: 1,
        })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const startTestMode = useCallback(async () => {
    if (!swRef.current) {
      console.error('Service Worker not registered')
      return
    }

    swRef.current.active?.postMessage({ type: 'START_TEST_MODE' })
    setPollingState((prev) => ({ ...prev, testMode: true, testCount: 0 }))
  }, [])

  const stopTestMode = useCallback(async () => {
    if (!swRef.current) return
    
    swRef.current.active?.postMessage({ type: 'STOP_TEST_MODE' })
    setPollingState((prev) => ({ ...prev, testMode: false }))
  }, [])

  return {
    pollingState,
    startTestMode,
    stopTestMode,
  }
}
