'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { addNotification } from '@/services/notifications'

interface PollingState {
  isActive: boolean
  lastCheck: string | null
  lastBriefId: string | null
  error: string | null
  testMode: boolean
  testCount: number
}

export function useServiceWorker() {
  const [pollingState, setPollingState] = useState<PollingState>({
    isActive: false,
    lastCheck: null,
    lastBriefId: null,
    error: null,
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
      if (data.type === 'POLLING_CHECK') {
        setPollingState((prev) => ({
          ...prev,
          lastCheck: data.timestamp,
        }))
      } else if (data.type === 'NEW_BRIEFS') {
        setPollingState((prev) => ({
          ...prev,
          lastBriefId: data.briefIds?.[0] || null,
        }))
        addNotification({
          type: 'NEW_BRIEFS',
          count: data.count || 1,
          briefIds: data.briefIds,
        })
      } else if (data.type === 'NEW_BRIEF') {
        setPollingState((prev) => ({
          ...prev,
          lastBriefId: data.briefId,
        }))
        addNotification({
          type: 'NEW_BRIEFS',
          count: 1,
          briefIds: [data.briefId],
        })
      } else if (data.type === 'POLLING_ERROR') {
        setPollingState((prev) => ({
          ...prev,
          error: data.error,
        }))
      } else if (data.type === 'TEST_NOTIFICATION') {
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

  const startPolling = useCallback(async (credentials: { email: string; password: string }, token: string) => {
    if (!swRef.current) {
      console.error('Service Worker not registered')
      return
    }

    const cache = await caches.open('ads-notif-v1')
    await cache.put('/credentials', new Response(JSON.stringify(credentials)))
    await cache.put('/token', new Response(JSON.stringify({ token })))

    const lastBriefId = localStorage.getItem('lastBriefId')
    if (lastBriefId) {
      await cache.put('/lastBriefId', new Response(JSON.stringify({ briefId: lastBriefId })))
    }

    swRef.current.active?.postMessage({ type: 'START_POLLING' })
    setPollingState((prev) => ({ ...prev, isActive: true }))
  }, [])

  const stopPolling = useCallback(async () => {
    if (!swRef.current) return
    
    swRef.current.active?.postMessage({ type: 'STOP_POLLING' })
    setPollingState((prev) => ({ ...prev, isActive: false }))
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
    startPolling,
    stopPolling,
    startTestMode,
    stopTestMode,
  }
}
