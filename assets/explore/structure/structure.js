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

  /* ========================= QUERY (no logic yet) ========================= */

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

  /* ========================= RESET (calm default) ========================= */

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

  /* ========================= INIT ========================= */

  function init() {
    console.log("[structure] init");

    if (Array.isArray(window.HAIKU_ALL)) {
      state.allFiles = [...window.HAIKU_ALL];
    }

    state.tree = buildTreeFromManifest(state.allFiles);

    bindQuery();
    bindReset();
    loadCurrentHaiku();

    renderTree();
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

