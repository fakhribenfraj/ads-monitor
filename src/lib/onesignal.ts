import axios from 'axios'

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY

export interface OneSignalNotification {
  heading?: string
  content: string
  data?: Record<string, any>
  url?: string
}

export async function sendOneSignalNotification(notification: OneSignalNotification): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.error('OneSignal credentials not configured')
    return false
  }

  try {
    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        headings: {
          en: notification.heading || 'New Notification',
        },
        contents: {
          en: notification.content,
        },
        data: notification.data || {},
        url: notification.url || 'https://ads-notif.vercel.app',
        target_channel: 'push',
        included_segments: ['All'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    )

    console.log('OneSignal notification sent:', response.data.id)
    return true
  } catch (error: any) {
    console.error('Error sending OneSignal notification:', error.response?.data || error.message)
    return false
  }
}

export async function sendNotificationToAll(title: string, message: string, data?: Record<string, any>): Promise<boolean> {
  return sendOneSignalNotification({
    heading: title,
    content: message,
    data,
  })
}
