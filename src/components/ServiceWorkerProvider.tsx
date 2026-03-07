'use client'

import { useEffect, useRef, useCallback } from 'react'
import { addNotification } from '@/services/notifications'
import { useSession } from 'next-auth/react'

export function ServiceWorkerProvider() {
  const { data: session } = useSession()
  const swRef = useRef<ServiceWorkerRegistration | null>(null)
  const userIdSentRef = useRef<string | null>(null)

  const sendUserIdToSW = useCallback(async (userId: string) => {
    if (!swRef.current) return

    const sendMessage = () => {
      if (swRef.current?.active) {
        console.log('Sending SET_USER_ID to SW:', userId)
        swRef.current.active.postMessage({
          type: 'SET_USER_ID',
          userId: userId,
        })
      } else {
        setTimeout(sendMessage, 100)
      }
    }

    sendMessage()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        swRef.current = registration
        console.log('Service Worker registered:', registration.scope)

        if (session?.user?.id) {
          sendUserIdToSW(session.user.id)
        }
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
  }, [sendUserIdToSW])

  useEffect(() => {
    if (session?.user?.id && userIdSentRef.current !== session.user.id) {
      userIdSentRef.current = session.user.id
      if (swRef.current) {
        sendUserIdToSW(session.user.id)
      }
    }
  }, [session, sendUserIdToSW])

  return null
}
