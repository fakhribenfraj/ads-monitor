'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { addNotification } from '@/services/notifications'
import { useSession } from 'next-auth/react'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export function ServiceWorkerProvider() {
  const { data: session } = useSession()
  const swRef = useRef<ServiceWorkerRegistration | null>(null)
  const userIdSentRef = useRef<string | null>(null)
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)

  const subscribeToPush = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      console.log('Push subscription successful:', subscription)

      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      if (response.ok) {
        setPushSubscription(subscription)
        console.log('Push subscription saved to server')
      }
    } catch (error) {
      console.error('Failed to subscribe to push:', error)
    }
  }, [])

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

        registration.pushManager.getSubscription().then((existingSub) => {
          if (!existingSub && session?.user?.id) {
            subscribeToPush(registration)
          } else if (existingSub) {
            setPushSubscription(existingSub)
          }
        })
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
        swRef.current.pushManager.getSubscription().then((existingSub) => {
          if (!existingSub) {
            subscribeToPush(swRef.current!)
          }
        })
      }
    }
  }, [session, sendUserIdToSW, subscribeToPush])

  return null
}
