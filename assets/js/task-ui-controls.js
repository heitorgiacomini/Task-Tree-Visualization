function ensureNodeUid(node) {
  if (!node || node._uid) return;
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  node._uid = "uid_" + stamp + rand;
}

function notifyTreeChange(options) {
  const opts = options || {};

  if (typeof window.syncJsTreeBranchFromData === "function") {
    let uid = opts.uid;
    if (!uid && window.selectedNode && window.selectedNode.data && window.selectedNode.data._uid) {
      uid = window.selectedNode.data._uid;
    }
    if (uid) {
      const ok = window.syncJsTreeBranchFromData(uid);
      if (ok) return;
    }
  }

  if (typeof window.refreshJsTree === "function") {
    window.refreshJsTree(opts);
  }
}

function openEditor(task) {
  if (!task) return;
  ensureNodeUid(task);
  const controls = document.getElementById("controls");
  if (controls) controls.style.display = "block";
  const label = document.getElementById("selected-node-label");
  if (label) label.textContent = task.name || "";
  const nameInput = document.getElementById("task-name");
  if (nameInput) nameInput.value = task.name || "";
  const statusInput = document.getElementById("task-status");
  if (statusInput) statusInput.checked = !!task.status;
  const descInput = document.getElementById("task-descricao");
  if (descInput) descInput.value = task.descricao || "";
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function setupControlsDrag() {
  const panel = document.getElementById("controls");
  const handle = document.getElementById("controls-header");
  if (!panel || !handle) return;

  let dragState = null;

  handle.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target && event.target.closest("#btn-close-controls")) return;
    const rect = panel.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    try {
      handle.setPointerCapture(event.pointerId);
    } catch (err) {
      console.error(err);
    }
    panel.classList.add("dragging");
    event.preventDefault();
  });

  handle.addEventListener("pointermove", event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const rect = panel.getBoundingClientRect();
    const width = rect.width || panel.offsetWidth;
    const height = rect.height || panel.offsetHeight;
    const maxLeft = Math.max(0, window.innerWidth - width);
    const maxTop = Math.max(0, window.innerHeight - height);
    const left = clamp(event.clientX - dragState.offsetX, 0, maxLeft);
    const top = clamp(event.clientY - dragState.offsetY, 0, maxTop);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });

  function stopDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    try {
      handle.releasePointerCapture(event.pointerId);
    } catch (err) {
      console.error(err);
    }
    dragState = null;
    panel.classList.remove("dragging");
  }

  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
}

document.getElementById("btn-create-child").addEventListener("click", () => {
  if (!selectedNode) return;
  const child = new Task("Task", false, 0, [], "");
  ensureNodeUid(child);
  if (!selectedNode.data.children) {
    selectedNode.data.children = [];
  }
  selectedNode.data.children.push(child);
  // persist to shared model
  window.data = data;
  window.selectedNode = selectedNode;
  try {
    if (window.jQuery) {
      const $tree = window.jQuery('#jstree');
      if ($tree && $tree.length && typeof $tree.jstree === 'function') {
        const tree = $tree.jstree(true);
        const parentUid = selectedNode.data._uid;
        if (tree && parentUid) {
          tree.create_node(parentUid, {
            id: child._uid,
            text: child.name,
            li_attr: { 'data-name': child.name, 'data-uid': child._uid }
          }, 'last', function () {
            notifyTreeChange({ uid: child._uid });
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
  render();
  if (!window.jQuery) {
    notifyTreeChange({ uid: child._uid });
  }
});

document.getElementById("btn-update").addEventListener("click", () => {
  if (!selectedNode) return;
  ensureNodeUid(selectedNode.data);
  const newName = document.getElementById("task-name").value || selectedNode.data.name;
  selectedNode.data.name = newName;
  document.getElementById("selected-node-label").textContent = newName;
  selectedNode.data.descricao = document.getElementById("task-descricao").value || "";

  const statusInput = document.getElementById("task-status");
  const hasChildren = !!(selectedNode.data.children && selectedNode.data.children.length);
  if (!hasChildren) {
    selectedNode.data.status = !!(statusInput && statusInput.checked);
  } else if (statusInput && statusInput.checked !== !!selectedNode.data.status) {
    alert("You can't manually change the status of a node that has sub-nodes. Update the children instead.");
    // revert UI to the current computed/derived status
    statusInput.checked = !!selectedNode.data.status;
  }
  // persist changes
  window.data = data;
  window.selectedNode = selectedNode;
  render();
  notifyTreeChange();
});

document.getElementById("btn-delete").addEventListener("click", () => {
  if (!selectedNode) return;
  if (selectedNode.data === data) {
    alert("It is not possible to delete the root node.");
    return;
  }
  const parent = findParent(data, selectedNode.data);
  if (parent && parent.children) {
    parent.children = parent.children.filter(c => c !== selectedNode.data);
    selectedNode = null;
    document.getElementById("selected-node-label").textContent = "none";
    // persist deletion and clear global selection
    window.data = data;
    window.selectedNode = null;
    render();
    notifyTreeChange();
  }
});

document.getElementById("btn-move").addEventListener("click", () => {
  if (!selectedNode) {
    alert("Select a node first.");
    return;
  }
  if (selectedNode.data === data) {
    alert("It is not possible to move the root node.");
    return;
  }
  moveMode = true;
});

// esconder formulário e limpar seleção ao clicar fora dos nós/controles
const closeControlsBtn = document.getElementById("btn-close-controls");
if (closeControlsBtn) {
  closeControlsBtn.addEventListener("click", () => {
    const controls = document.getElementById("controls");
    if (controls) controls.style.display = "none";
    const label = document.getElementById("selected-node-label");
    if (label) label.textContent = "none";
    moveMode = false;
    selectedNode = null;
    window.selectedNode = null;
    window.data = data;
    render();
    notifyTreeChange();
  });
}

setupControlsDrag();

window.openEditor = openEditor;

function setVisualizationView(view) {
  const panel = document.getElementById("jstree-panel");
  const diagramWrapper = document.getElementById("diagram-wrapper");
  const tabButtons = Array.from(document.querySelectorAll("[data-view-tab]"));

  for (const btn of tabButtons) {
    const isActive = btn.getAttribute("data-view") === view;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  }

  if (view === "tree") {
    if (panel) {
      panel.style.display = "block";
      panel.classList.add("fullwidth");
    }
    if (diagramWrapper) diagramWrapper.style.display = "none";
    let ok = false;
    if (typeof window.ensureJsTreeInitialized === "function") {
      ok = !!window.ensureJsTreeInitialized();
    } else if (typeof window.refreshJsTree === "function") {
      window.refreshJsTree();
      ok = true;
    }

    // If user clicks Tree before the JSON finishes loading, retry briefly.
    if (!ok) {
      let attempts = 0;
      const maxAttempts = 20;
      const timer = setInterval(() => {
        attempts += 1;
        if (attempts > maxAttempts) {
          clearInterval(timer);
          return;
        }
        if (typeof window.ensureJsTreeInitialized === "function" && window.ensureJsTreeInitialized()) {
          clearInterval(timer);
        }
      }, 100);
    }
  } else {
    if (panel) {
      panel.style.display = "none";
      panel.classList.remove("fullwidth");
    }
    if (diagramWrapper) diagramWrapper.style.display = "block";
  }
}

window.setVisualizationView = setVisualizationView;

// Wire the top tabs (Diagram/Tree)
const viewTabs = Array.from(document.querySelectorAll("[data-view-tab]"));
if (viewTabs.length) {
  for (const btn of viewTabs) {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view") || "diagram";
      setVisualizationView(view);
    });
  }
  const initialActive = viewTabs.find(b => b.classList.contains("active"));
  setVisualizationView((initialActive && initialActive.getAttribute("data-view")) || "diagram");
}
