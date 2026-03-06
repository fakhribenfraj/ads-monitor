const CACHE_NAME = "ads-notif-v1";
const POLLING_INTERVAL = 60 * 1000; // 1 minute

let testModeEnabled = false;
let testCounter = 0;

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
  if (event.data && event.data.type === "START_TEST_MODE") {
    testModeEnabled = true;
    await startTestMode();
  } else if (event.data && event.data.type === "STOP_TEST_MODE") {
    testModeEnabled = false;
    stopTestMode();
  }
});

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
  testTimer = setInterval(sendTestNotification, POLLING_INTERVAL);
}

function stopTestMode() {
  if (testTimer) {
    clearInterval(testTimer);
    testTimer = null;
  }
}

async function notifyClient(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}
