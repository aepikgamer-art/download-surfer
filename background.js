// Download Surfer - background script
// Opens a runner game window whenever a download is in progress.

const GAME_URL = browser.runtime.getURL("game.html");
let gameWindowId = null;

async function settings() {
  const store = await browser.storage.local.get({ autoOpen: true, closeWhenDone: true });
  return store;
}

async function openGameWindow() {
  const s = await settings();
  if (!s.autoOpen) return;
  if (gameWindowId !== null) {
    try { browser.windows.update(gameWindowId, { focused: true }); } catch (e) {}
    return;
  }
  const win = await browser.windows.create({
    url: GAME_URL,
    type: "popup",
    width: 480,
    height: 720
  });
  gameWindowId = win.id;
  browser.windows.onRemoved.addListener((removedId) => {
    if (removedId === gameWindowId) gameWindowId = null;
  });
}

async function closeGameWindow() {
  const s = await settings();
  if (!s.closeWhenDone || gameWindowId === null) return;
  try {
    const tabs = await browser.tabs.query({ windowId: gameWindowId });
    for (const t of tabs) browser.tabs.sendMessage(t.id, { type: "download-done" });
    await browser.windows.remove(gameWindowId);
  } catch (e) {}
  gameWindowId = null;
}

async function refresh() {
  const downloads = await browser.downloads.search({});
  const inProgress = downloads.filter(
    (d) => d.state === "in_progress" && !d.paused
  );

  if (inProgress.length > 0) {
    await openGameWindow();
    if (gameWindowId !== null) {
      const payload = inProgress.map((d) => ({
        id: d.id,
        filename: (d.filename || "").split(/[\\/]/).pop(),
        bytes: d.bytesReceived,
        total: d.totalBytes || d.fileSize || 0,
        paused: d.paused
      }));
      try {
        const tabs = await browser.tabs.query({ windowId: gameWindowId });
        for (const t of tabs) browser.tabs.sendMessage(t.id, { type: "download-progress", downloads: payload });
      } catch (e) {}
    }
  } else {
    await closeGameWindow();
  }
}

browser.downloads.onCreated.addListener(refresh);
browser.downloads.onChanged.addListener(refresh);
browser.downloads.onErased.addListener(refresh);

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "check-now") refresh();
  if (msg && msg.type === "open-game") openGameWindow();
});
