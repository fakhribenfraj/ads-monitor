'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { LogOut, Activity, Clock, FileText, Bell } from 'lucide-react'
import { BriefsList } from './BriefsList'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { pollingState, startPolling, stopPolling, startTestMode, stopTestMode } = useServiceWorker()
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

  const handleStartPolling = async () => {
    // The service worker will handle authentication server-side
    await startPolling()
  }

  const handleStopPolling = async () => {
    await stopPolling()
  }

  const handleLogout = () => {
    // Clear any local storage data
    localStorage.removeItem('lastBriefId')
    localStorage.removeItem('credentials')
    localStorage.removeItem('accessToken')
    onLogout()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  pollingState.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-lg font-bold">
                {pollingState.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pollingState.isActive
                ? 'Checking every 1 minute'
                : 'Click start to begin monitoring'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {formatDate(pollingState.lastCheck)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Next check in 1 min after start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Brief ID</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">
              {pollingState.lastBriefId || 'No briefs detected'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stored brief ID for deduplication
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When a new brief with status PENDING appears, you will receive a browser
            notification automatically.
          </p>
          
          {pollingState.error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              Error: {pollingState.error}
            </div>
          )}
          
           <div className="flex gap-4">
             {!pollingState.isActive ? (
               <Button onClick={handleStartPolling} disabled={!email}>
                 Start Monitoring
               </Button>
             ) : (
               <Button variant="outline" onClick={handleStopPolling}>
                 Stop Monitoring
               </Button>
             )}
           </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-2">Test Notifications</p>
            <p className="text-xs text-muted-foreground mb-3">
              Send a test notification every 1 minute with dummy text.
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
          </div>
        </CardContent>
      </Card>

      <BriefsList />
    </div>
  )
}
