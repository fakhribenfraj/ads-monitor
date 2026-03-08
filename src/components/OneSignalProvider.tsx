'use client'

import { useEffect } from 'react'
import { useOneSignal } from '@/hooks/useOneSignal'

export function OneSignalProvider() {
  useOneSignal()
  return null
}
