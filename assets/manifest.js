(function () {
  async function loadManifest() {
    try {
      const res = await fetch("/data/manifest.json");
      const data = await res.json();

      // Keep original for debugging
      window.MANIFEST = data;

      // Normalize into what index.html / explorer.html expect
      window.HAIKU_ALL = data.items || [];

      console.log("[manifest.js] Loaded manifest.json with", window.HAIKU_ALL.length, "items");
      document.dispatchEvent(new Event("manifestLoaded"));
    } catch (err) {
      console.error("[manifest.js] Failed to load manifest.json", err);
      window.MANIFEST = { items: [] };
      window.HAIKU_ALL = [];
      document.dispatchEvent(new Event("manifestLoaded"));
    }
  }

  loadManifest();
})();
