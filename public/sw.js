const CACHE_NAME = "ads-notif-v1";
const POLLING_INTERVAL = 60 * 1000; // 1 minute

let userId = null;
let testModeEnabled = false;
let testCounter = 0;
let pollingTimer = null;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", async (event) => {
  const { data } = event;

  if (data && data.type === "SET_USER_ID") {
    userId = data.userId;
    console.log("User ID set in service worker:", userId);
    startPolling();
  } else if (data && data.type === "START_TEST_MODE") {
    testModeEnabled = true;
    await startTestMode();
  } else if (data && data.type === "STOP_TEST_MODE") {
    testModeEnabled = false;
    stopTestMode();
  } else if (data && data.type === "STOP_POLLING") {
    stopPolling();
  }
});

function startPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  checkForNewNotifications();
  pollingTimer = setInterval(checkForNewNotifications, POLLING_INTERVAL);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function checkForNewNotifications() {
  if (!userId) {
    console.log("No user ID set, skipping notification check");
    return;
  }

  console.log("Checking for new notifications for user:", userId);

  try {
    const response = await fetch(`/api/notifications/sent?userId=${userId}`);
    const data = await response.json();

    console.log("Unsent notifications found:", data.response?.length || 0);

    if (data.response && data.response.length > 0) {
      for (const notification of data.response) {
        console.log("Sending notification:", notification.title);
        await sendNotification(notification);
        await markNotificationAsSent(notification.id, userId);
      }
    }
  } catch (error) {
    console.error("Error checking for notifications:", error);
  }
}

async function sendNotification(notification) {
  if ("Notification" in self && Notification.permission === "granted") {
    self.registration.showNotification(notification.title, {
      body: notification.message,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      data: notification,
    });
  }

  await notifyClient({
    type: "NEW_NOTIFICATION",
    notification: notification,
  });
}

async function markNotificationAsSent(notificationId, userId) {
  try {
    await fetch("/api/notifications/sent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId,
        userId,
      }),
    });
  } catch (error) {
    console.error("Error marking notification as sent:", error);
  }
}

async function notifyClient(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

let testTimer = null;

async function startTestMode() {
  if (testTimer) return;

  testCounter = 0;

  const sendTestNotification = async () => {
    if (!testModeEnabled) return;

    testCounter++;
    const testMessage = `Test notification #${testCounter} - ${new Date().toLocaleTimeString()}`;

    if ("Notification" in self && Notification.permission === "granted") {
      self.registration.showNotification("Test Notification", {
        body: testMessage,
        icon: "/icon-192.svg",
        badge: "/icon-192.svg",
      });
    }

    await notifyClient({
      type: "TEST_NOTIFICATION",
      message: testMessage,
      count: testCounter,
    });
  };

  await sendTestNotification();
  testTimer = setInterval(sendTestNotification, 60000);
}

function stopTestMode() {
  if (testTimer) {
    clearInterval(testTimer);
    testTimer = null;
  }
}
