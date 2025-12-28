(function () {
  console.log("[semantic] semantic.js (descoped) loaded");

  const state = {
    allFiles: [],
    tags: [],
    tagIndex: {},
    filteredFiles: [],
    currentIndex: -1
  };

  /* =========================
     helpers
     ========================= */

  const $ = (id) => document.getElementById(id);

  function log(msg, data) {
    if (data !== undefined) {
      console.log(`[semantic] ${msg}`, data);
    } else {
      console.log(`[semantic] ${msg}`);
    }
  }

  function filenameFromPath(path) {
    return path.split("/").pop();
  }

  /* =========================
     core flow
     ========================= */

  function applyFilter(source, tagName) {
    log("applyFilter()", { source, tagName });

    if (!tagName) {
      log("applyFilter aborted: no tag");
      return;
    }

    const paths = state.tagIndex[tagName] || [];
    log("tag paths", paths.length);

    const pathSet = new Set(paths);

    state.filteredFiles = state.allFiles.filter(item =>
      [...pathSet].some(p => item.path_html.endsWith(p))
    );

    state.currentIndex = -1;

    log("filteredFiles.length", state.filteredFiles.length);

    renderFileList();
    clearHaiku();
  }

  function selectIndex(index, source) {
    log("selectIndex()", { index, source });

    if (!state.filteredFiles.length) {
      log("selectIndex aborted: no filteredFiles");
      return;
    }

    if (index < 0 || index >= state.filteredFiles.length) {
      log("selectIndex aborted: out of bounds", index);
      return;
    }

    state.currentIndex = index;
    const item = state.filteredFiles[index];

    log("selected file", item.path_html);

    loadHaiku(item.path_html);
    highlightActiveFile();
  }

  /* =========================
     rendering
     ========================= */

  function renderFileList() {
    const list = $("fileList");
    if (!list) {
      log("ERROR: fileList not found");
      return;
    }

    list.innerHTML = "";

    state.filteredFiles.forEach((item, i) => {
      const a = document.createElement("a");
      a.href = "#";
      a.dataset.index = i;
      a.textContent = filenameFromPath(item.path_html);

      a.addEventListener("click", (e) => {
        e.preventDefault();
        log("file clicked", i);
        selectIndex(i, "fileClick");
      });

      list.appendChild(a);
    });
  }

  function highlightActiveFile() {
    const list = $("fileList");
    if (!list) return;

    [...list.children].forEach(el => {
      el.classList.toggle(
        "active",
        Number(el.dataset.index) === state.currentIndex
      );
    });
  }

  /* =========================
     haiku loading
     ========================= */

  function loadHaiku(pathHtml) {
    log("loadHaiku()", pathHtml);

    const iframe = $("haikuFrame");
    if (iframe) {
      iframe.src = "/" + pathHtml;
      return;
    }

    const container = $("haikuDisplay");
    if (container) {
      fetch("/" + pathHtml)
        .then(r => r.text())
        .then(html => {
          container.innerHTML = html;
        })
        .catch(err => {
          console.error("[semantic] haiku load failed", err);
        });
      return;
    }

    log("ERROR: no haiku container found");
  }

  function clearHaiku() {
    const iframe = $("haikuFrame");
    if (iframe) iframe.src = "";

    const container = $("haikuDisplay");
    if (container) container.innerHTML = "";
  }

  /* =========================
     tags
     ========================= */

  function renderTagList(query = "") {
    const list = $("tagList");
    if (!list) {
      log("ERROR: tagList not found");
      return;
    }

    list.innerHTML = "";

    state.tags
      .filter(t => t.toLowerCase().includes(query))
      .forEach(tag => {
        const el = document.createElement("div");
        el.className = "tag";
        el.textContent = tag;

        el.addEventListener("click", () => {
          log("tag selected", tag);
          $("tagInput").value = tag;
          applyFilter("tagClick", tag);
        });

        list.appendChild(el);
      });
  }

  /* =========================
     controls
     ========================= */

  function bindControls() {
    log("bindControls()");

    $("tagInput")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      log("tag input", q);
      renderTagList(q);
    });
  }

  /* =========================
     init
     ========================= */

  function init() {
    log("init()");

    state.allFiles = window.HAIKU_ALL || [];
    state.tags = window.HAIKU_TAGS || [];
    state.tagIndex = window.HAIKU_TAG_INDEX || {};

    log("manifest size", state.allFiles.length);
    log("tag count", state.tags.length);

    if (!state.allFiles.length) {
      log("ERROR: manifest empty");
      return;
    }

    bindControls();
    renderTagList();
  }

  /* =========================
     boot
     ========================= */

  document.addEventListener("manifestLoaded", () => {
    log("manifestLoaded event");
    init();
  });
})();

