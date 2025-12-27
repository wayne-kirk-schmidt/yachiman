(function () {
  const state = {
    ready: {
      manifest: false,
      tags: false,
      current: false
    },

    // Data copies (Semantic-owned)
    manifest: null,
    tags: null,
    tagIndex: null,

    currentStatus: null,
    currentPath: null,
    currentHtml: null
  };

  function checkReady() {
    return (
      state.ready.manifest &&
      state.ready.tags &&
      state.ready.current
    );
  }

  function initializeSemantic() {
    if (!checkReady()) return;

    // Snapshot global loader outputs into local state
    state.manifest = window.HAIKU_ALL || [];
    state.tags = window.HAIKU_TAGS || [];
    state.tagIndex = window.HAIKU_TAG_INDEX || {};

    state.currentStatus = window.HAIKU_CURRENT_STATUS;
    state.currentPath = window.HAIKU_CURRENT_PATH;
    state.currentHtml = window.HAIKU_CURRENT_HTML;

    console.log("[semantic.js] Semantic ready");
    console.log("[semantic.js] First-resort haiku:", state.currentPath);

    // Phase 2 will render + wire interactions
  }

  // Loader event listeners
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

