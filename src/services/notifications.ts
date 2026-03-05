export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export async function showNotification(title: string, options?: NotificationOptions): Promise<Notification | null> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return null
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    })
  }

  return null
}

export function getLastBriefId(): string | null {
  return localStorage.getItem('lastBriefId')
}

export function setLastBriefId(briefId: string): void {
  localStorage.setItem('lastBriefId', briefId)
}

export interface NotificationItem {
  id: string
  type: 'NEW_BRIEFS' | 'HALF_FULL_BRIEF' | 'TEST_NOTIFICATION'
  count: number
  briefIds?: string[]
  briefId?: string
  timestamp: string
  read: boolean
}

export function getNotificationHistory(): NotificationItem[] {
  const data = localStorage.getItem('notificationHistory')
  return data ? JSON.parse(data) : []
}

export function addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void {
  const history = getNotificationHistory()
  const newNotification: NotificationItem = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    read: false,
  }
  history.unshift(newNotification)
  localStorage.setItem('notificationHistory', JSON.stringify(history.slice(0, 100)))
}

export function markNotificationAsRead(id: string): void {
  const history = getNotificationHistory()
  const updated = history.map((n) => (n.id === id ? { ...n, read: true } : n))
  localStorage.setItem('notificationHistory', JSON.stringify(updated))
}

export function clearNotificationHistory(): void {
  localStorage.setItem('notificationHistory', JSON.stringify([]))
}
