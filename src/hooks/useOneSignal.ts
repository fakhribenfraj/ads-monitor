'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

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

  const showPrompt = useCallback(async () => {
    if (window.OneSignal) {
      const { OneSignal } = window
      if (OneSignal?.initialized) {
        OneSignal.showSlidedownPrompt()
      } else {
        OneSignal.push(['showSlidedownPrompt'])
      }
    }
  }, [])

  const checkSubscription = useCallback(async () => {
    const OneSignal = window.OneSignal
    if (OneSignal?.initialized) {
      const subscribed = await OneSignal.isPushNotificationsEnabled()
      setIsSubscribed(subscribed)
      return subscribed
    }
    return false
  }, [])

  useEffect(() => {
    if (initialized.current || typeof window === 'undefined') return
    initialized.current = true

    const initOneSignal = () => {
      const OneSignal = window.OneSignal
      if (!OneSignal) return

      OneSignal.push(async function() {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          welcomeNotification: {
            disable: true,
          },
          autoRegister: false,
        })

        console.log('OneSignal initialized')

        const subscribed = await OneSignal.isPushNotificationsEnabled()
        setIsSubscribed(subscribed)

        OneSignal.on('subscriptionChange', async function(isSubscribed: boolean) {
          console.log('Subscription changed:', isSubscribed)
          setIsSubscribed(isSubscribed)
          if (isSubscribed) {
            const playerId = await OneSignal.getUserId()
            console.log('Player ID:', playerId)
            if (playerId) {
              savePlayerId(playerId)
            }
          }
        })

        OneSignal.on('notificationClick', function(event: any) {
          console.log('Notification clicked:', event)
        })

        setTimeout(() => {
          const currentSub = OneSignal.isPushNotificationsEnabled()
          currentSub.then((subscribed: boolean) => {
            if (!subscribed) {
              OneSignal.showSlidedownPrompt()
            }
          })
        }, 3000)
      })
    }

    if (window.OneSignal && window.OneSignal.initialized) {
      initOneSignal()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js'
      script.async = true
      script.onload = initOneSignal
      script.onerror = () => {
        console.error('Failed to load OneSignal SDK')
        setIsSupported(false)
      }
      document.head.appendChild(script)
    }

    return () => {
      // Cleanup if needed
    }
  }, [savePlayerId])

  return { showPrompt, isSubscribed, isSupported }
}
