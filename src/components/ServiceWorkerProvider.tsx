'use client'

import { useEffect, useRef } from 'react'
import { addNotification } from '@/services/notifications'
import { useSession } from 'next-auth/react'

export function ServiceWorkerProvider() {
  const { data: session } = useSession()
  const swRef = useRef<ServiceWorkerRegistration | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || initialized.current) {
      return
    }
    initialized.current = true

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
      console.log('Message from SW:', data.type)
      if (data.type === 'TEST_NOTIFICATION') {
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

  return null
}
