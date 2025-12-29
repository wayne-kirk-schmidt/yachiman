(function () {
  console.log("[structure] structure.js loaded");

  /* =========================
     STATE
     ========================= */

  const state = {
    allFiles: [],
    tree: null,          // hierarchical model (later)
    query: "",
    currentFile: null
  };

  /* =========================
     DOM
     ========================= */

  const dom = {
    haikuDisplay: () => document.querySelector(".structure-display"),
    queryHost: () => document.querySelector(".structure-query"),
    treeHost: () => document.querySelector(".structure-tree"),
    resetBtn: () => document.querySelector(".structure-reset-btn")
  };

  /* =========================
     HAIKU LOADING
     ========================= */

  function loadHaiku(pathHtml) {
    if (!pathHtml) return;
    const target = dom.haikuDisplay();
    if (!target) return;

    fetch("/" + pathHtml)
      .then(r => r.text())
      .then(html => {
        const cleaned = html
          .replaceAll("{{tags}}", "")
          .replace(/^Tags:.*$/gmi, "");
        target.innerHTML = cleaned;
      })
      .catch(err => console.error("[structure] haiku load failed", err));
  }

  function loadCurrentHaiku() {
    if (!window.HAIKU_CURRENT_PATH) return;
    loadHaiku(window.HAIKU_CURRENT_PATH);
    state.currentFile = window.HAIKU_CURRENT_PATH;
  }

  /* =========================
     QUERY (no logic yet)
     ========================= */

  function bindQuery() {
    const host = dom.queryHost();
    if (!host) return;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "locate in archive…";

    input.addEventListener("input", e => {
      state.query = e.target.value.trim().toLowerCase();
      console.log("[structure] query:", state.query);
      // highlight logic will be added later
    });

    host.appendChild(input);
  }

  /* =========================
     RESET (calm default)
     ========================= */

  function bindReset() {
    const btn = dom.resetBtn();
    if (!btn) return;

    btn.addEventListener("click", () => {
      state.query = "";
      const input = dom.queryHost()?.querySelector("input");
      if (input) input.value = "";

      console.log("[structure] reset");

      // later:
      // - clear highlights
      // - collapse tree

      loadCurrentHaiku();
    });
  }

  /* =========================
     INIT
     ========================= */

  function init() {
    console.log("[structure] init");

    // manifest is already normalized into HAIKU_ALL
    if (Array.isArray(window.HAIKU_ALL)) {
      state.allFiles = [...window.HAIKU_ALL];
    }

    bindQuery();
    bindReset();
    loadCurrentHaiku();

    // later:
    // - buildTreeFromManifest()
    // - renderTree()
  }

  function waitForData() {
    if (Array.isArray(window.HAIKU_ALL) && window.HAIKU_CURRENT_PATH) {
      init();
    } else {
      setTimeout(waitForData, 50);
    }
  }

  window.addEventListener("DOMContentLoaded", waitForData);
})();

