'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { LogOut, Bell } from 'lucide-react'
import { BriefsList } from './BriefsList'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { pollingState, startTestMode, stopTestMode } = useServiceWorker()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Get email from environment variables (exposed via API)
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || null);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    
    fetchConfig();
  }, [])

  const handleLogout = () => {
    // Clear any local storage data
    localStorage.removeItem('lastBriefId')
    localStorage.removeItem('credentials')
    localStorage.removeItem('accessToken')
    onLogout()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Brief Monitor</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {email && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Logged in as</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{email}</p>
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

      <BriefsList />
    </div>
  )
}
