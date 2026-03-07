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

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        swRef.current = registration
      }
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
      } else if (data.type === 'NEW_NOTIFICATION') {
        addNotification({
          type: 'NEW_BRIEFS',
          count: 1,
          briefId: data.notification?.briefId,
        })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const startTestMode = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      console.error('Service Worker not registered')
      return
    }

    registration.active?.postMessage({ type: 'START_TEST_MODE' })
    setPollingState((prev) => ({ ...prev, testMode: true, testCount: 0 }))
  }, [])

  const stopTestMode = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return
    
    registration.active?.postMessage({ type: 'STOP_TEST_MODE' })
    setPollingState((prev) => ({ ...prev, testMode: false }))
  }, [])

  const stopPolling = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return
    
    registration.active?.postMessage({ type: 'STOP_POLLING' })
  }, [])

  return {
    pollingState,
    startTestMode,
    stopTestMode,
    stopPolling,
  }
}
