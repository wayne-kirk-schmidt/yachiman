(function () {
  async function loadCurrentHaiku() {
    try {
      // 1. Load the first-resort pointer (absolute, location-agnostic)
      const res = await fetch("/data/current_haiku.json");
      const status = await res.json();

      // Preserve raw status for inspection/debugging
      window.HAIKU_CURRENT_STATUS = status;

      const path = status?.current_haiku?.path_html;
      if (!path) {
        throw new Error("current_haiku.path_html missing");
      }

      // Expose resolved path
      window.HAIKU_CURRENT_PATH = path;

      // 2. Load exactly ONE haiku HTML file (absolute)
      const htmlRes = await fetch(`/${path}`);
      const html = await htmlRes.text();

      // Expose HTML only — no interpretation
      window.HAIKU_CURRENT_HTML = html;

      console.log(
        "[haiku.current.js] Loaded first-resort haiku:",
        path
      );

      document.dispatchEvent(new Event("haikuCurrentLoaded"));
    } catch (err) {
      console.error(
        "[haiku.current.js] Failed to load first-resort haiku",
        err
      );

      window.HAIKU_CURRENT_STATUS = null;
      window.HAIKU_CURRENT_PATH = null;
      window.HAIKU_CURRENT_HTML = null;

      document.dispatchEvent(new Event("haikuCurrentLoaded"));
    }
  }

  loadCurrentHaiku();
})();

