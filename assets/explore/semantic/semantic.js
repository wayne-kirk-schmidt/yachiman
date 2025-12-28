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
    resetBtn: () => document.querySelector(".filter-reset"),
    prevBtn: () => document.querySelector(".control-prev"),
    nextBtn: () => document.querySelector(".control-next")
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
        state.currentIndex = i;
        loadHaiku(item.path_html);
      };

      list.appendChild(a);
    });
  }

  function renderAllFiles() {
    state.filteredFiles = [...state.allFiles];
    state.currentIndex = state.filteredFiles.length > 0 ? 0 : -1;
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

        el.onclick = () => filterFilesByTag(tag);

        panel.appendChild(el);
      });
  }

  function filterFilesByTag(tag) {
    const filenames = new Set(state.tagIndex[tag] || []);

    state.filteredFiles = state.allFiles.filter(item =>
      filenames.has(filenameFromPath(item.path_html))
    );

    state.currentIndex = state.filteredFiles.length > 0 ? 0 : -1;
    renderFileList();

    if (state.currentIndex === 0) {
      loadHaiku(state.filteredFiles[0].path_html);
    }
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
      renderTags(q);
    };

    host.appendChild(input);

    const prev = dom.prevBtn();
    if (prev) {
      prev.onclick = () => {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          loadHaiku(state.filteredFiles[state.currentIndex].path_html);
        }
      };
    }

    const next = dom.nextBtn();
    if (next) {
      next.onclick = () => {
        if (state.currentIndex < state.filteredFiles.length - 1) {
          state.currentIndex++;
          loadHaiku(state.filteredFiles[state.currentIndex].path_html);
        }
      };
    }

    const reset = dom.resetBtn();
    if (reset) {
      reset.onclick = () => {
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
    state.allFiles = window.HAIKU_ALL.map(item => ({
      ...item,
      filename: filenameFromPath(item.path_html)
    }));

    state.tags = window.HAIKU_TAGS;
    state.tagIndex = window.HAIKU_TAG_INDEX;

    bindControls();
    renderTags();
    renderAllFiles();
    restoreInitialHaiku();
  }

  function waitForData() {
    if (
      Array.isArray(window.HAIKU_ALL) &&
      Array.isArray(window.HAIKU_TAGS) &&
      window.HAIKU_TAG_INDEX
    ) {
      init();
    } else {
      setTimeout(waitForData, 50);
    }
  }

  window.addEventListener("DOMContentLoaded", waitForData);
})();

