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
    currentIndex: 0,

    currentPath: null,
    currentHtml: null
  };

  /* =========================
     Utilities
     ========================= */

  function sortFilesChronologically(files) {
    return files.slice().sort((a, b) =>
      a.path_html.localeCompare(b.path_html)
    );
  }

  function checkReady() {
    return (
      state.ready.manifest &&
      state.ready.tags &&
      state.ready.current
    );
  }

  /* =========================
     Rendering
     ========================= */

  function renderFileList(files) {
    const container = document.querySelector(".results-list");
    if (!container) return;

    container.innerHTML = "";

    files.forEach((item, index) => {
      const el = document.createElement("div");
      el.className = "result-item";
      el.textContent = item.path_html.split("/").pop();
      el.dataset.index = index;
      container.appendChild(el);
    });

    bindFileClicks();
    updateFileCount();
  }

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

  function updateStatus() {
    const el = document.querySelector(".control-status");
    if (!el) return;

    el.textContent = `${state.currentIndex + 1} of ${state.files.length}`;
  }

  function updateFileCount() {
    let el = document.querySelector(".results-count");
    if (!el) {
      el = document.createElement("div");
      el.className = "results-count";
      document.querySelector(".semantic-results")?.appendChild(el);
    }

    el.textContent = `${state.files.length} files`;
  }

  /* =========================
     Haiku loading
     ========================= */

  async function loadHaikuByIndex(index) {
    const item = state.files[index];
    if (!item) return;

    state.currentIndex = index;

    try {
      const res = await fetch("/" + item.path_html);
      const html = await res.text();

      const display = document.querySelector(".semantic-display");
      if (display) {
        display.innerHTML = html;

        // Remove unresolved {{tags}} placeholder for now
        const tagBlock = display.querySelector(".haiku-tags");
        if (tagBlock && tagBlock.textContent.includes("{{")) {
          tagBlock.remove();
        }
      }

      updateStatus();
    } catch (err) {
      console.error("[semantic.js] Failed to load haiku", err);
    }
  }

  /* =========================
     Event binding
     ========================= */

  function bindFileClicks() {
    const list = document.querySelector(".results-list");
    if (!list) return;

    list.onclick = (e) => {
      const item = e.target.closest(".result-item");
      if (!item) return;

      loadHaikuByIndex(Number(item.dataset.index));
    };
  }

  function bindPrevNext() {
    document.querySelector(".control-prev")?.addEventListener("click", () => {
      if (state.currentIndex > 0) {
        loadHaikuByIndex(state.currentIndex - 1);
      }
    });

    document.querySelector(".control-next")?.addEventListener("click", () => {
      if (state.currentIndex < state.files.length - 1) {
        loadHaikuByIndex(state.currentIndex + 1);
      }
    });
  }

  function bindTagClicks() {
    document.querySelector(".filter-tags")?.addEventListener("click", (e) => {
      const tagEl = e.target.closest(".tag-item");
      if (!tagEl) return;

      applyTagFilter(tagEl.dataset.tag);
    });
  }

  /* =========================
     Filtering
     ========================= */

  function applyTagFilter(tag) {
    const paths = state.tagIndex[tag] || [];

    state.files = sortFilesChronologically(
      state.manifest.filter(item =>
        paths.includes(item.path_html)
      )
    );

    state.currentIndex = 0;
    renderFileList(state.files);

    if (state.files.length > 0) {
      loadHaikuByIndex(0);
    } else {
      const display = document.querySelector(".semantic-display");
      if (display) {
        display.innerHTML = "<p>No haiku found for this tag.</p>";
      }
      updateStatus();
    }
  }

  /* =========================
     Initialization
     ========================= */

  function initializeSemantic() {
    if (!checkReady()) return;

    state.manifest = window.HAIKU_ALL || [];
    state.tags = window.HAIKU_TAGS || [];
    state.tagIndex = window.HAIKU_TAG_INDEX || {};

    state.files = sortFilesChronologically(state.manifest);

    renderTags(state.tags);
    renderFileList(state.files);

    bindPrevNext();
    bindTagClicks();

    // Load first-resort haiku if present
    if (window.HAIKU_CURRENT_PATH) {
      const idx = state.files.findIndex(
        f => f.path_html === window.HAIKU_CURRENT_PATH
      );
      loadHaikuByIndex(idx >= 0 ? idx : 0);
    } else {
      loadHaikuByIndex(0);
    }
  }

  /* =========================
     Loader events
     ========================= */

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
})();

