(async () => {
  const store = await browser.storage.local.get({ autoOpen: true, closeWhenDone: true });
  const autoOpen = document.getElementById("autoOpen");
  const closeWhenDone = document.getElementById("closeWhenDone");
  autoOpen.checked = store.autoOpen;
  closeWhenDone.checked = store.closeWhenDone;

  autoOpen.addEventListener("change", () => browser.storage.local.set({ autoOpen: autoOpen.checked }));
  closeWhenDone.addEventListener("change", () => browser.storage.local.set({ closeWhenDone: closeWhenDone.checked }));

  document.getElementById("play").addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "open-game" });
    window.close();
  });
})();
