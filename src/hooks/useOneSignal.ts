'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    OneSignal: any
  }
}

export function useOneSignal() {
  const { data: session } = useSession()
  const initialized = useRef(false)
  const savedPlayerId = useRef<string | null>(null)

  const savePlayerId = useCallback(async (playerId: string) => {
    if (!session?.user?.id || savedPlayerId.current === playerId) return
    savedPlayerId.current = playerId

    try {
      await fetch('/api/onesignal/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, userId: session.user.id }),
      })
      console.log('Player ID saved to server:', playerId)
    } catch (error) {
      console.error('Error saving player ID:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (initialized.current || typeof window === 'undefined') return
    initialized.current = true

    const initOneSignal = () => {
      if (typeof window !== 'undefined') {
        window.OneSignal = window.OneSignal || []
        
        window.OneSignal.push(function() {
          window.OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            welcomeNotification: {
              disable: true,
            },
          })

          console.log('OneSignal initialized')

          window.OneSignal.on('subscriptionChange', async function(isSubscribed: boolean) {
            console.log('Subscription changed:', isSubscribed)
            if (isSubscribed) {
              const playerId = await window.OneSignal.getUserId()
              console.log('Player ID:', playerId)
              if (playerId) {
                savePlayerId(playerId)
              }
            }
          })

          window.OneSignal.on('notificationClick', function(event: any) {
            console.log('Notification clicked:', event)
          })
        })
      }
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js'
    script.async = true
    script.onload = initOneSignal
    document.head.appendChild(script)

    return () => {
      if (window.OneSignal) {
        window.OneSignal = []
      }
    }
  }, [savePlayerId])

  const showPrompt = useCallback(async () => {
    if (window.OneSignal) {
      window.OneSignal.push(function() {
        window.OneSignal.showSlidedownPrompt()
      })
    }
  }, [])

  const isSubscribed = useCallback(async (): Promise<boolean> => {
    if (window.OneSignal) {
      return await window.OneSignal.isPushNotificationsEnabled()
    }
    return false
  }, [])

  return { showPrompt, isSubscribed }
}
