(function () {
  console.log("[semantic] semantic.js loaded");

  const state = {
    allFiles: [],
    tags: [],
    tagIndex: {},
    filteredFiles: [],
    currentIndex: -1
  };

  /* =========================
     DOM (contract)
     ========================= */

  const dom = {
    tagPanel: () => document.querySelector(".filter-tags"),
    tagInputHost: () => document.querySelector(".filter-input"),
    fileList: () => document.querySelector(".results-list"),
    haikuDisplay: () => document.querySelector(".semantic-display"),
    resetBtn: () => document.querySelector(".reset-filter")
  };

  const filenameFromPath = p => p.split("/").pop();

  function log(msg, data) {
    if (data !== undefined) {
      console.log(`[semantic] ${msg}`, data);
    } else {
      console.log(`[semantic] ${msg}`);
    }
  }

  /* =========================
     HAIKU
     ========================= */

  function loadHaiku(pathHtml) {
    if (!pathHtml) return;

    const target = dom.haikuDisplay();
    if (!target) return;

    fetch("/" + pathHtml)
      .then(r => r.text())
      .then(html => {
        target.innerHTML = html;
      })
      .catch(err => console.error("[semantic] haiku load failed", err));
  }

  function restoreInitialHaiku() {
    if (window.HAIKU_CURRENT_PATH) {
      log("loading default haiku", window.HAIKU_CURRENT_PATH);
      loadHaiku(window.HAIKU_CURRENT_PATH);
    }
  }

  /* =========================
     FILE LIST
     ========================= */

  function renderFileList() {
    const list = dom.fileList();
    if (!list) return;

    list.innerHTML = "";

    state.filteredFiles.forEach((item, i) => {
      const a = document.createElement("a");
      a.href = "#";
      a.dataset.index = i;
      a.textContent = filenameFromPath(item.path_html);

      a.onclick = e => {
        e.preventDefault();
        log("file selected", item.path_html);
        state.currentIndex = i;
        loadHaiku(item.path_html);
      };

      list.appendChild(a);
    });
  }

  function renderAllFiles() {
    state.filteredFiles = [...state.allFiles];
    renderFileList();
  }

  /* =========================
     TAGS
     ========================= */

  function renderTags(filter = "") {
    const panel = dom.tagPanel();
    if (!panel) return;

    panel.innerHTML = "";

    state.tags
      .filter(t => t.includes(filter))
      .forEach(tag => {
        const el = document.createElement("div");
        el.className = "tag";
        el.textContent = tag;

        el.onclick = () => {
          log("tag selected", tag);
          filterFilesByTag(tag);
        };

        panel.appendChild(el);
      });
  }

  function filterFilesByTag(tag) {
    const filenames = new Set(state.tagIndex[tag] || []);

    state.filteredFiles = state.allFiles.filter(item =>
      filenames.has(filenameFromPath(item.path_html))
    );

    log("filteredFiles.length", state.filteredFiles.length);
    renderFileList();
  }

  /* =========================
     CONTROLS
     ========================= */

  function bindControls() {
    const host = dom.tagInputHost();
    if (!host) return;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "filter tags…";

    input.oninput = e => {
      const q = e.target.value.trim();
      log("tag input", q);
      renderTags(q);
    };

    host.appendChild(input);

    const reset = dom.resetBtn();
    if (reset) {
      reset.onclick = () => {
        log("reset");
        input.value = "";
        renderTags();
        renderAllFiles();
        restoreInitialHaiku();
      };
    }
  }

  /* =========================
     INIT
     ========================= */

  function init() {
    log("init()");

    state.allFiles = window.HAIKU_ALL.map(item => ({
      ...item,
      filename: filenameFromPath(item.path_html)
    }));

    state.tags = window.HAIKU_TAGS;
    state.tagIndex = window.HAIKU_TAG_INDEX;

    log("manifest size", state.allFiles.length);
    log("tag count", state.tags.length);

    bindControls();

    // DEFAULT STATE (per contract)
    renderTags();          // all tags
    renderAllFiles();      // all files
    restoreInitialHaiku(); // default haiku
  }

  function waitForData() {
    const ready =
      Array.isArray(window.HAIKU_ALL) &&
      Array.isArray(window.HAIKU_TAGS) &&
      window.HAIKU_TAG_INDEX;

    if (ready) {
      init();
    } else {
      setTimeout(waitForData, 50);
    }
  }

  window.addEventListener("DOMContentLoaded", waitForData);
})();

