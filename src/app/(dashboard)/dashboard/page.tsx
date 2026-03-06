'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function DashboardPage() {
  const { pollingState, startTestMode, stopTestMode } = useServiceWorker()
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {session?.user?.email && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Logged in as</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test notifications to verify your browser notification setup.
          </p>
          
          <div className="flex gap-4">
            {!pollingState.testMode ? (
              <Button variant="secondary" onClick={startTestMode}>
                Start Test Mode
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={stopTestMode}>
                  Stop Test Mode
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Sent: {pollingState.testCount}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
