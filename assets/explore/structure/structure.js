(function () {
  console.log("[structure] structure.js loaded");

  /* ========================= STATE ========================= */

  const state = {
    allFiles: [],
    tree: null,          // hierarchical model (later)
    query: "",
    currentFile: null
  };

  /* ========================= DOM ========================= */

  const dom = {
    haikuDisplay: () => document.querySelector(".structure-display"),
    queryHost: () => document.querySelector(".structure-query"),
    treeHost: () => document.querySelector(".structure-tree"),
    resetBtn: () => document.querySelector(".structure-reset-btn")
  };

  /* ========================= HAIKU LOADING ========================= */

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

  /* ========================= CURRENT HAIKU LOADING ========================= */

  function loadCurrentHaiku() {
    if (!window.HAIKU_CURRENT_PATH) return;
    loadHaiku(window.HAIKU_CURRENT_PATH);
    state.currentFile = window.HAIKU_CURRENT_PATH;
  }

  /* ========================= TREE MODEL ========================= */

  function buildTreeFromManifest(files) {
    const root = {
      name: "root",
      type: "dir",
      path: "",
      children: []
    };

    function getOrCreateDir(parent, name, path) {
      let node = parent.children.find(
        c => c.type === "dir" && c.name === name
      );
      if (!node) {
        node = {
          name,
          type: "dir",
          path,
          children: []
        };
        parent.children.push(node);
      }
      return node;
    }

    files.forEach(item => {
      if (!item.path_html) return;

      const parts = item.path_html.split("/").filter(Boolean);
      let current = root;
      let currentPath = "";

      parts.forEach((part, idx) => {
        currentPath += (currentPath ? "/" : "") + part;
        const isFile = idx === parts.length - 1;

        if (isFile) {
          current.children.push({
            name: part,
            type: "file",
            path: currentPath,
            path_html: item.path_html,
            path_json: item.path_json, // optional, future-safe
            file: item
          });
        } else {
          current = getOrCreateDir(current, part, currentPath);
        }
      });
    });

    return root;
  }

  /* ========================= GET DEPTH ========================= */

  function getDepth(row) {
    return Number(row.dataset.depth || 0);
  }

  /* ========================= APPLY HIGHLIGHTS ========================= */

  function applyHighlights(query) {
    const rows = Array.from(
      document.querySelectorAll(".tree-row")
    );

    // Clear existing highlights
    rows.forEach(row => {
      row.classList.remove("hl-match", "hl-exact", "hl-ancestor");
    });

    if (!query) return;

    const matchedRows = [];

    // PASS 1: find matches (O(n), no indexOf)
    rows.forEach((row, index) => {
      const label = row.querySelector(".tree-label");
      if (!label) return;

      const text = label.textContent.toLowerCase();
      const exact = text === query;
      const matched = exact || text.includes(query);

      if (matched) {
        row.classList.add(exact ? "hl-exact" : "hl-match");
        matchedRows.push({
          row,
          depth: getDepth(row),
          index
        });
      }
    });

    // PASS 2: mark ancestors
    matchedRows.forEach(({ index, depth }) => {
      let currentDepth = depth;
      for (let i = index - 1; i >= 0; i--) {
        const prev = rows[i];
        const prevDepth = getDepth(prev);

        if (prevDepth < currentDepth) {
          prev.classList.add("hl-ancestor");
          currentDepth = prevDepth;
          if (currentDepth === 0) break;
        }
      }
    });
  }

  /* ========================= QUERY ========================= */

  function bindQuery() {
    const host = dom.queryHost();
    if (!host) return;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "locate in archive…";

    let _queryTimer = null;

    input.addEventListener("input", e => {
      state.query = e.target.value.trim().toLowerCase();
      console.log("[structure] query:", state.query);

      clearTimeout(_queryTimer);
      _queryTimer = setTimeout(() => {
        applyHighlights(state.query);
      }, 120);
    });

    host.appendChild(input);
  }

  /* ========================= TOGGLE CHILDREN ========================= */

  function toggleChildren(row) {
    const host = dom.treeHost();
    if (!host) return;

    const path = row.dataset.path;
    const depth = Number(row.dataset.depth);
    const isCollapsed = row.dataset.collapsed === "true";

    host.querySelectorAll(".tree-row").forEach(child => {
      const childDepth = Number(child.dataset.depth);
      const childParent = child.dataset.parent;

      if (childParent === path && childDepth === depth + 1) {
        child.style.display = isCollapsed ? "" : "none";
        child.dataset.collapsed = "true";
      }
    });

    row.dataset.collapsed = isCollapsed ? "false" : "true";
  }

  /* ========================= RESET ========================= */

  function bindReset() {

    const btn = dom.resetBtn();
    if (!btn) return;

    btn.addEventListener("click", () => {
      state.query = "";
      const input = dom.queryHost()?.querySelector("input");
      if (input) input.value = "";

      console.log("[structure] reset");

      clearHighlights();
      collapseAll()
      loadCurrentHaiku();

    });
  }

/* ========================= TREE RENDERING ========================= */

function renderTree() {
  const host = dom.treeHost();
  if (!host || !state.tree) return;

  host.innerHTML = "";

  const container = document.createElement("div");
  container.className = "structure-tree-root";

  renderNode(state.tree, container, 0);

  host.appendChild(container);
}

/* ========================= NODE RENDERING ========================= */

  function renderNode(node, parentEl, depth) {
    // skip rendering the synthetic root itself
    if (node.name !== "root") {
      const row = document.createElement("div");
      row.className = `tree-row tree-${node.type}`;
      row.style.paddingLeft = `${depth * 1.25}rem`;

      row.dataset.path = node.path;
      row.dataset.type = node.type;
      row.dataset.depth = depth;
      row.dataset.parent = node.path.split("/").slice(0, -1).join("/");
      row.dataset.collapsed = "true";

      const label = document.createElement("span");
      label.className = "tree-label";
      label.textContent = node.name;

      if (node.type === "file") {
        label.classList.add("tree-file");
        label.addEventListener("click", () => {
          state.currentFile = node.path_html || node.path;
          loadHaiku(state.currentFile);
        });
      } else {
        label.classList.add("tree-dir");
        label.addEventListener("click", () => {
          toggleChildren(row);
        });
      }
      row.appendChild(label);
      parentEl.appendChild(row);
    }

    if (node.children && node.children.length) {
      node.children.forEach(child =>
        renderNode(child, parentEl, depth + 1)
      );
    }
  }

  function clearHighlights() {
    const host = dom.treeHost();
    if (!host) return;

    host.querySelectorAll(
      ".hl-ancestor, .hl-match, .hl-exact"
    ).forEach(el => {
      el.classList.remove("hl-ancestor", "hl-match", "hl-exact");
    });
  }

  /* ========================= COLLAPSE ALL ========================= */

  function collapseAll() {
    const host = dom.treeHost();
    if (!host) return;

    host.querySelectorAll(".tree-row").forEach(row => {
      const depth = Number(row.dataset.depth || 0);

      if (depth > 1) {
        row.style.display = "none";
      }

      row.dataset.collapsed = "true";
    });
  }

  /* ========================= INIT ========================= */

  let _initialized = false;

  function init() {
    if (_initialized) return;
    _initialized = true;

    console.log("[structure] init");

    if (Array.isArray(window.HAIKU_ALL)) {
      state.allFiles = [...window.HAIKU_ALL];
    }

    state.tree = buildTreeFromManifest(state.allFiles);

    bindQuery();
    bindReset();
    loadCurrentHaiku();

    renderTree();
    collapseAll();

  }

  let _waitTries = 0;

  function waitForData() {
    if (Array.isArray(window.HAIKU_ALL) && window.HAIKU_CURRENT_PATH) {
      init();
      return;
    }

    if (_waitTries++ > 200) {
      console.warn("[structure] waitForData timeout");
      return;
    }

    setTimeout(waitForData, 50);
  }

  window.addEventListener("DOMContentLoaded", waitForData);
})();

