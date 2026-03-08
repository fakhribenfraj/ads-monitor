'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOneSignal } from '@/hooks/useOneSignal'

export function NotificationButton() {
  const { showPrompt, isSubscribed, isSupported } = useOneSignal()
  const [loading, setLoading] = useState(false)

  if (!isSupported) {
    return null
  }

  const handleEnableNotifications = async () => {
    setLoading(true)
    try {
      await showPrompt()
    } finally {
      setLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Bell className="h-4 w-4" />
        Notifications On
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleEnableNotifications}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      Enable Notifications
    </Button>
  )
}
