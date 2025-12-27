(function () {
  async function loadManifest() {
    try {
      const res = await fetch("./data/manifest.json");
      const data = await res.json();

      // Keep original for debugging
      window.MANIFEST = data;

      // Normalize into what index.html / explorer.html expect
      window.HAIKU_ALL = data.items || [];

      console.log(
        "[haiku.manifest.js] Loaded manifest.json with",
        window.HAIKU_ALL.length,
        "items"
      );

      document.dispatchEvent(new Event("haikuManifestLoaded"));
    } catch (err) {
      console.error("[haiku.manifest.js] Failed to load manifest.json", err);
      window.MANIFEST = { items: [] };
      window.HAIKU_ALL = [];
      document.dispatchEvent(new Event("haikuManifestLoaded"));
    }
  }

  loadManifest();
})();
