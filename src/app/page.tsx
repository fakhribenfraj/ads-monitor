'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { getAuthToken } from '@/services/api'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLoginSuccess = () => {
    router.push('/dashboard')
  }

  const handleLoginSuccessWithCredentials = (_credentials: { email: string; password: string }, _token: string) => {
    router.push('/dashboard')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoginForm onLoginSuccess={handleLoginSuccessWithCredentials} />
    </div>
  )
}
