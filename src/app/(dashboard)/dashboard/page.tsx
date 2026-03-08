'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { Bell, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

export default function DashboardPage() {
  const { pollingState, startTestMode, stopTestMode } = useServiceWorker()
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {session?.user?.email && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Logged in as</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">ID: {session.user.id}</p>
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
