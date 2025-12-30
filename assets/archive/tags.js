(function () {
  async function loadTags() {
    try {
      const res = await fetch("./data/tags.json");
      const data = await res.json();

      // Keep original for debugging
      window.TAGS = data;

      // Normalize into what index.html expects
      window.HAIKU_TAGS = (data.tags || []).map(t => t.tag);
      window.HAIKU_TAG_INDEX = {};
      (data.tags || []).forEach(t => {
        window.HAIKU_TAG_INDEX[t.tag] = t.files;
      });

      console.log("[tags.js] Loaded tags.json with", window.HAIKU_TAGS.length, "tags");
      document.dispatchEvent(new Event("tagsLoaded"));
    } catch (err) {
      console.error("[tags.js] Failed to load tags.json", err);
      window.TAGS = { tags: [] };
      window.HAIKU_TAGS = [];
      window.HAIKU_TAG_INDEX = {};
      document.dispatchEvent(new Event("tagsLoaded"));
    }
  }

  loadTags();
})();
