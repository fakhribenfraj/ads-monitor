const API_BASE_URL = "/api"; // Use internal API
const POLLING_INTERVAL = 60 * 1000; // 1 minute
const CACHE_NAME = "ads-notif-v1";

let isPolling = false;
let pollingTimer = null;
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
  if (event.data && event.data.type === "START_POLLING") {
    await startPolling();
  } else if (event.data && event.data.type === "STOP_POLLING") {
    stopPolling();
  } else if (event.data && event.data.type === "START_TEST_MODE") {
    testModeEnabled = true;
    await startTestMode();
  } else if (event.data && event.data.type === "STOP_TEST_MODE") {
    testModeEnabled = false;
    stopTestMode();
  }
});

async function startPolling() {
  if (isPolling) return;
  isPolling = true;

  await checkForNewBriefs();

  pollingTimer = setInterval(async () => {
    await checkForNewBriefs();
  }, POLLING_INTERVAL);
}

function stopPolling() {
  isPolling = false;
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
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
  testTimer = setInterval(sendTestNotification, POLLING_INTERVAL);
}

function stopTestMode() {
  if (testTimer) {
    clearInterval(testTimer);
    testTimer = null;
  }
}

async function checkForNewBriefs() {
  console.log("Checking for new briefs...");
  try {
    // Use internal API endpoint that handles authentication server-side
    const response = await fetch(
      `${API_BASE_URL}/briefs/check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          brief: "public",
          typePosting: "posting",
          status: "PENDING",
          platform: ["tiktok", "instagram"],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      await processBriefs(data?.briefs || []);
    }

    await notifyClient({
      type: "POLLING_CHECK",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Polling error:", error);
    await notifyClient({
      type: "POLLING_ERROR",
      error: error.message || "Unknown error",
    });
  }
}

async function processBriefs(briefs) {
  if (!briefs || !Array.isArray(briefs) || briefs.length === 0) {
    return;
  }

  const lastBriefId = await getLastBriefId();
  const newBriefs = briefs.filter((brief) => brief._id !== lastBriefId);

  if (newBriefs.length > 0) {
    await storeLastBriefId(newBriefs[0]._id);

    await notifyClient({
      type: "NEW_BRIEFS",
      count: newBriefs.length,
      briefIds: newBriefs.map((b) => b._id),
    });

    if ("Notification" in self && Notification.permission === "granted") {
      const countText = newBriefs.length === 1 ? "1 new brief" : `${newBriefs.length} new briefs`;
      self.registration.showNotification("New Briefs Available!", {
        body: countText,
        icon: "/icon-192.svg",
        badge: "/icon-192.svg",
      });
    }
  }

  for (const brief of briefs) {
    const threshold = brief.numberCreators / 2;
    if (brief.activeCreators === threshold) {
      const halfNotified = await getHalfNotifiedBriefIds();
      if (!halfNotified.includes(brief._id)) {
        await storeHalfNotifiedBriefId(brief._id);

        if ("Notification" in self && Notification.permission === "granted") {
          self.registration.showNotification("Brief Half Full!", {
            body: `${brief.campaignName}: ${brief.activeCreators}/${brief.numberCreators} creators`,
            icon: "/icon-192.svg",
            badge: "/icon-192.svg",
          });
        }

        await notifyClient({
          type: "HALF_FULL_BRIEF",
          briefId: brief._id,
        });
      }
    }
  }
}

async function notifyClient(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

async function getLastBriefId() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match("/lastBriefId");
  if (response) {
    const data = await response.json();
    return data.briefId;
  }
  return null;
}

async function storeLastBriefId(briefId) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put("/lastBriefId", new Response(JSON.stringify({ briefId })));
}

async function getHalfNotifiedBriefIds() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match("/halfNotifiedBriefIds");
  if (response) {
    const data = await response.json();
    return data.ids || [];
  }
  return [];
}

async function storeHalfNotifiedBriefId(briefId) {
  const ids = await getHalfNotifiedBriefIds();
  if (!ids.includes(briefId)) {
    ids.push(briefId);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      "/halfNotifiedBriefIds",
      new Response(JSON.stringify({ ids })),
    );
  }
}
