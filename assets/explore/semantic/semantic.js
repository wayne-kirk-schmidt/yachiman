(function () {
  const state = {
    ready: {
      manifest: false,
      tags: false,
      current: false
    },

    manifest: [],
    tags: [],
    tagIndex: {},

    files: [],
    currentIndex: -1,
    currentPath: null,
    currentHtml: null
  };

  function checkReady() {
    return state.ready.manifest &&
           state.ready.tags &&
           state.ready.current;
  }

  function sortFilesChronologically(files) {
    return files.slice().sort((a, b) =>
      a.path_html.localeCompare(b.path_html)
    );
  }

  function renderFileList(files) {
    const list = document.querySelector(".results-list");
    if (!list) return;

    list.innerHTML = "";

    files.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = "result-item";
      el.textContent = item.path_html.split("/").pop();
      el.dataset.index = idx;
      el.dataset.path = item.path_html;
      list.appendChild(el);
    });
  }

  function loadHaikuByIndex(index) {
    const item = state.files[index];
    if (!item) return;

    fetch(`/${item.path_html}`)
      .then(res => res.text())
      .then(html => {
        state.currentIndex = index;
        state.currentPath = item.path_html;
        state.currentHtml = html;

        const display = document.querySelector(".semantic-display");
        if (display) display.innerHTML = html;

        const status = document.querySelector(".control-status");
        if (status) {
          status.textContent = `${index + 1} of ${state.files.length}`;
        }
      });
  }

  function initializeSemantic() {
    if (!checkReady()) return;

    state.manifest = window.HAIKU_ALL || [];
    state.tags = window.HAIKU_TAGS || [];
    state.tagIndex = window.HAIKU_TAG_INDEX || {};

    /* call once during initialization */
    renderTags(state.tags);

    state.currentPath = window.HAIKU_CURRENT_PATH;
    state.currentHtml = window.HAIKU_CURRENT_HTML;

    state.files = sortFilesChronologically(state.manifest);
    state.currentIndex = state.files.findIndex(
      f => f.path_html === state.currentPath
    );

    renderFileList(state.files);

    const display = document.querySelector(".semantic-display");
    if (display && state.currentHtml) {
      display.innerHTML = state.currentHtml;
    }

    const status = document.querySelector(".control-status");
    if (status && state.currentIndex >= 0) {
      status.textContent = `${state.currentIndex + 1} of ${state.files.length}`;
    }

    console.log("[semantic.js] Semantic ready");
  }

  document.addEventListener("haikuManifestLoaded", () => {
    state.ready.manifest = true;
    initializeSemantic();
  });

  document.addEventListener("haikuTagsLoaded", () => {
    state.ready.tags = true;
    initializeSemantic();
  });

  document.addEventListener("haikuCurrentLoaded", () => {
    state.ready.current = true;
    initializeSemantic();
  });

  document.querySelector(".results-list")?.addEventListener("click", (e) => {
    const item = e.target.closest(".result-item");
    if (!item) return;

    const index = Number(item.dataset.index);
    loadHaikuByIndex(index);
  });

  /* =========================
     Prev / Next navigation
     ========================= */

  function loadPrev() {
    if (state.currentIndex <= 0) return;
    loadHaikuByIndex(state.currentIndex - 1);
  }

  function loadNext() {
    if (state.currentIndex >= state.files.length - 1) return;
    loadHaikuByIndex(state.currentIndex + 1);
  }

  document.querySelector(".control-prev")?.addEventListener("click", () => {
    loadPrev();
  });

  document.querySelector(".control-next")?.addEventListener("click", () => {
    loadNext();
  });

  /* =========================
     Tag rendering (display only)
     ========================= */

  function renderTags(tags) {
    const container = document.querySelector(".filter-tags");
    if (!container) return;

    container.innerHTML = "";

    tags.forEach(tag => {
      const el = document.createElement("div");
      el.className = "tag-item";
      el.textContent = tag;
      el.dataset.tag = tag;
      container.appendChild(el);
    });
  }

  /* =========================
     Single-tag filtering
     ========================= */

  function applyTagFilter(tag) {
    const paths = state.tagIndex[tag] || [];

    // rebuild file list from manifest using exact match
    state.files = state.manifest.filter(item =>
      paths.includes(item.path_html)
    );

    // reset index
    state.currentIndex = 0;

    // re-render file list
    renderFileList(state.files);

    // load first haiku in filtered list
    if (state.files.length > 0) {
      loadHaikuByIndex(0);
    } else {
      const display = document.querySelector(".semantic-display");
      if (display) {
        display.innerHTML = "<p>No haiku found for this tag.</p>";
      }

      const status = document.querySelector(".control-status");
      if (status) status.textContent = "0 of 0";
    }
  }

  /* click handling for tags */
  document.querySelector(".filter-tags")?.addEventListener("click", (e) => {
    const tagEl = e.target.closest(".tag-item");
    if (!tagEl) return;

    const tag = tagEl.dataset.tag;
    applyTagFilter(tag);
  });

})();
