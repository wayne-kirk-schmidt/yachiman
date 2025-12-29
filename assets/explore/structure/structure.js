(function () {
  console.log("[structure] structure.js loaded");

  const state = {
    allFiles: [],          // full manifest entries
    fileById: {},          // id -> file object
    tags: [],              // list of tag strings
    tagIndex: {},          // tag -> [file ids]
    filteredFiles: [],
    currentIndex: -1
  };

  /* =========================
     DOM
     ========================= */

  const dom = {
    tagPanel: () => document.querySelector(".filter-tags"),
    tagInputHost: () => document.querySelector(".filter-input"),
    fileList: () => document.querySelector(".results-files"),
    haikuDisplay: () => document.querySelector(".structure-display"),
    resetBtn: () => document.querySelector(".filter-reset"),
    prevBtn: () => document.querySelector(".control-prev"),
    nextBtn: () => document.querySelector(".control-next")
  };

  function log(msg, data) {
    if (data !== undefined) {
      console.log(`[structure] ${msg}`, data);
    } else {
      console.log(`[structure] ${msg}`);
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
        // defensive cleanup
        const cleaned = html
          .replaceAll("{{tags}}", "")
          .replace(/^Tags:.*$/gmi, "");
        target.innerHTML = cleaned;
      })
      .catch(err => console.error("[structure] haiku load failed", err));
  }

  function restoreInitialHaiku() {
    if (!window.HAIKU_CURRENT_PATH) return;

    const idx = state.filteredFiles.findIndex(
      f => f.path_html === window.HAIKU_CURRENT_PATH
    );

    if (idx >= 0) {
      state.currentIndex = idx;
    }

    loadHaiku(window.HAIKU_CURRENT_PATH);
  }

  /* =========================
     FILE LIST
     ========================= */

  function renderFileList() {
    const list = dom.fileList();
    if (!list) return;

    list.style.flex = "1";
    list.innerHTML = "";

    state.filteredFiles.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "result-row";

      const a = document.createElement("a");
      a.className = "about-link";

      a.href = "#";
      a.textContent = item.id;

      a.onclick = e => {
        e.preventDefault();
        state.currentIndex = i;
        loadHaiku(item.path_html);
      };

      row.appendChild(a);
      list.appendChild(row);
    });
  }

  function renderAllFiles() {
    state.filteredFiles = [...state.allFiles];
    state.currentIndex = state.filteredFiles.length - 1;
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
        const ids = state.tagIndex[tag] || [];
        const el = document.createElement("div");
        el.className = "tag-item";
        el.textContent = `${tag} (${ids.length})`;

        el.onclick = () => filterFilesByTag(tag);

        panel.appendChild(el);
      });
  }

  function filterFilesByTag(tag) {
    const ids = state.tagIndex[tag];
    if (!ids || ids.length === 0) {
      state.filteredFiles = [];
      state.currentIndex = -1;
      renderFileList();
      return;
    }

    state.filteredFiles = ids
      .map(id => state.fileById[id])
      .filter(Boolean);

    state.currentIndex = state.filteredFiles.length - 1;
    renderFileList();

    loadHaiku(state.filteredFiles[state.currentIndex].path_html);
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
      renderTags(e.target.value.trim());
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
    // manifest
    state.allFiles = window.HAIKU_ALL.map(item => ({
      ...item
    }));

    state.allFiles.forEach(item => {
      state.fileById[item.id] = item;
    });

    // tags
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

