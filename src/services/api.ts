// This file now only contains frontend-specific utilities
// All external API calls are handled server-side in /api routes

const isBrowser = typeof window !== 'undefined'

// Keep clearAuth for cleanup purposes (e.g., when user logs out manually)
export function clearAuth() {
  if (!isBrowser) return
  localStorage.removeItem('lastBriefId')
  localStorage.removeItem('credentials')
  localStorage.removeItem('accessToken')
}
