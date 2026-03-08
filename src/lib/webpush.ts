import webpush from 'web-push'

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_EMAIL) {
  console.warn('VAPID keys not configured - push notifications will not work')
}

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:example@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || ''
}

export async function sendPushNotification(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload)
    return true
  } catch (error: any) {
    if (error.statusCode === 410) {
      return false
    }
    throw error
  }
}

export default webpush
