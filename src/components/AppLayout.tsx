'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { NavDrawer, MobileNavToggle } from '@/components/NavDrawer'
import { clearAuth, getAuthToken } from '@/services/api'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    setIsNavOpen(false)
  }, [pathname])

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  const isAuthPage = pathname === '/' || pathname === '/login'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <MobileNavToggle onClick={() => setIsNavOpen(true)} />
          <div className="flex-1" />
        </header>
        
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      <NavDrawer 
        isOpen={isNavOpen} 
        onClose={() => setIsNavOpen(false)} 
        onLogout={handleLogout}
      />
    </div>
  )
}
