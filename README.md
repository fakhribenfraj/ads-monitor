# Ads Notif - Brief Monitor PWA

A Next.js 14 App Router PWA that monitors ConnectContent for new briefs and sends browser push notifications.

## Features

- Login with email/password
- Automatic polling every 15 minutes via Service Worker
- Browser push notifications for new briefs
- Token auto-refresh on 401 errors
- Duplicate notification prevention
- PWA installable on mobile/desktop

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

## PWA Installation

- Chrome/Edge: Click the install icon in the address bar
- Safari (iOS): Share > Add to Home Screen
- Desktop: Menu > Install AdsNotif

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── dashboard.tsx
│   ├── login-form.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── hooks/
│   └── useServiceWorker.ts
├── lib/
│   └── utils.ts
├── services/
│   ├── api.ts
│   └── notifications.ts
└── types/
    └── index.ts
public/
├── icon-192.svg
├── manifest.json
├── offline.html
└── sw.js
```

## Notes

- The app stores credentials in localStorage for demo purposes only
- Token is automatically refreshed on 401 errors
- Last brief ID is stored to prevent duplicate notifications
- Service Worker handles polling in the background
