// Initialize a jsTree panel that shows the raw task-tree.json structure
(function () {
  let initialized = false;
  let uidCounter = Date.now();

  function generateUid() {
    uidCounter += 1;
    return 'uid_' + uidCounter;
  }
  
  function assignUIDs(node) {
    if (!node) return;
    if (!node._uid) node._uid = generateUid();
    if (node.children && node.children.length) {
      for (const c of node.children) assignUIDs(c);
    }
  }

  function svgIconDataUrl(color) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path d='M10 4L12 6h8a1 1 0 011 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6z' fill='${color}'/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function toJsTree(node) {
    const children = (node.children || []).map(toJsTree);


    const color = node.status ? 'green' : 'red';

    return {
      id: node._uid,
      // show name in the tree column only
      text: node.name,
      children: children,
      state: { opened: !node.collapsed },
      li_attr: { 'data-name': node.name, 'data-uid': node._uid },
      a_attr: { style: `color: ${color};` },
      icon: svgIconDataUrl(color),
      // jstree-table reads values from node.data[col.value]
      data: { percent: node.percent, status: node.status, descricao: node.descricao }
    };
  }

  function rebuildTreeFromData(options) {
    if (!window.data) return;
    if (!window.jQuery) return;
    const $tree = window.jQuery('#jstree');
    if (!$tree || $tree.length === 0) return;
    if (typeof $tree.jstree !== 'function') return;
    const tree = $tree.jstree(true);
    if (!tree) return;

    assignUIDs(window.data);
    const nodes = [toJsTree(window.data)];
    let targetUid;
    if (options && Object.prototype.hasOwnProperty.call(options, 'selectUid')) {
      targetUid = options.selectUid;
    } else if (window.selectedNode && window.selectedNode.data) {
      targetUid = window.selectedNode.data._uid;
    }

    tree.settings.core.data = nodes;
    $tree.off('refresh.jstree.syncSelection');
    if (targetUid !== undefined) {
      $tree.one('refresh.jstree.syncSelection', () => {
        try {
          tree.deselect_all();
          if (targetUid) tree.select_node(targetUid);
        } catch (err) {
          console.error(err);
        }
      });
    }
    tree.refresh(false, true);
  }

  window.refreshJsTree = rebuildTreeFromData;

  function ensureInitialized() {
    if (initialized) return true;
    if (!window.jQuery) return false;
    const $tree = window.jQuery('#jstree');
    if (!$tree || $tree.length === 0) return false;

    // Prefer the shared, authoritative model. task-ui-controls keeps window.data in sync.
    const root = window.data;
    if (!root) return false;

    assignUIDs(root);
    const nodes = [toJsTree(root)];

    const treeConfig = {
      core: {
        data: nodes,
        multiple: false,
        check_callback: true,
        themes: {
          name: true,
          dots: true,
          icons: true,
          stripes: true,
        }
      },
      plugins: ["dnd", "contextmenu", "wholerow", "table"],
      table: {
        columns: [
          { tree: true, header: 'Task', width: 'auto' },
          {
            header: 'Completion percentage',
            value: 'percent',
            width: 260,
            format: function (v) {
              var pct = (v === undefined || v === null) ? 0 : Number(v);
              if (isNaN(pct)) pct = 0;
              pct = Math.max(0, Math.min(100, pct));
              var intPct = Math.round(pct);
              return '<div class="progress-cell"><div class="progress-base"><div class="progress-foreground" style="width:' + intPct + '%"></div></div><span class="progress-label">' + intPct + '%</span></div>';
            }
          }
        ],
        resizable: true,
        // jsTree-table has its own right-click handler; disable it so jsTree contextmenu plugin can work.
        contextmenu: false
      },
      contextmenu: {
        items: function (node) {
          return {
            edit: {
              label: 'Edit',
              action: function () {
                try {
                  const uid = node.id;
                  const found = window.data ? findByUid(window.data, uid) : null;
                  if (!found) return;

                  // Keep both globals consistent so the Update/Delete buttons work.
                  selectedNode = { data: found };
                  window.selectedNode = selectedNode;

                  if (window.openEditor && typeof window.openEditor === 'function') {
                    window.openEditor(found);
                  }
                  if (typeof render === 'function') render();
                } catch (err) { console.error(err); }
              }
            },
            create: {
              label: 'Create subfolder',
              action: function () {
                const tree = window.jQuery('#jstree').jstree(true);
                const parentId = node.id;
                const newUid = generateUid();
                const newDataNode = { name: 'New folder', percent: 0, status: false, descricao: '', collapsed: false, children: [], _uid: newUid };
                try {
                  if (window.data) {
                    const parentObj = findByUid(window.data, parentId);
                    if (!parentObj.children) parentObj.children = [];
                    parentObj.children.push(newDataNode);
                    window.data = window.data;
                  }
                } catch (e) { console.error(e); }
                tree.create_node(parentId, { id: newUid, text: newDataNode.name, li_attr: { 'data-name': newDataNode.name, 'data-uid': newUid } }, 'last', function (n) {
                  tree.edit(n);
                  if (typeof render === 'function') render();
                  if (typeof window.refreshJsTree === 'function') window.refreshJsTree({ selectUid: newUid });
                });
              }
            },
            rename: {
              label: 'Rename',
              action: function () {
                const tree = window.jQuery('#jstree').jstree(true);
                tree.edit(node.id);
              }
            },
            remove: {
              label: 'Delete',
              action: function () {
                const tree = window.jQuery('#jstree').jstree(true);
                const uid = node.id;
                try {
                  if (window.data) {
                    const parentObj = findParentByUid(window.data, uid);
                    if (parentObj && parentObj.children) parentObj.children = parentObj.children.filter(c => c._uid !== uid);
                  }
                } catch (e) { console.error(e); }
                tree.delete_node(uid);
                if (typeof render === 'function') render();
              }
            }
          };
        }
      }
    };

    if ($tree.jstree(true)) {
      const inst = $tree.jstree(true);
      inst.settings = Object.assign(inst.settings, treeConfig);
      inst.settings.core.data = nodes;
      inst.refresh();
    } else {
      $tree.jstree(treeConfig);
    }

    initialized = true;
    return true;
  }

  window.ensureJsTreeInitialized = function () {
    const ok = ensureInitialized();
    if (ok && typeof window.refreshJsTree === 'function') window.refreshJsTree();
    return ok;
  };

  document.addEventListener('DOMContentLoaded', () => {
    // jsTree event bindings only. View switching/tab UI is handled by task-ui-controls.js.

    // In jsTree-table view, right-click often happens on a table cell (td).
    // Some handlers can stop propagation, so we attach a CAPTURE listener to ensure we see it.
    try {
      const container = document.getElementById('jstree');
      if (container) {
        if (container._jstreeContextmenuCaptureHandler) {
          container.removeEventListener('contextmenu', container._jstreeContextmenuCaptureHandler, true);
        }

        const handler = function (e) {
          // Only handle right-clicks occurring inside a node row.
          const li = e.target && e.target.closest ? e.target.closest('li') : null;
          if (!li || !li.id) return;

          const $tree = window.jQuery ? window.jQuery('#jstree') : null;
          const inst = $tree && typeof $tree.jstree === 'function' ? $tree.jstree(true) : null;
          if (!inst || typeof inst.show_contextmenu !== 'function') return;

          // Let jsTree do selection + menu, but prevent the browser menu.
          e.preventDefault();

          try {
            inst.deselect_all(true);
            inst.select_node(li.id);
          } catch (err) {
            console.error(err);
          }

          inst.show_contextmenu(li, e.pageX, e.pageY);
        };

        container._jstreeContextmenuCaptureHandler = handler;
        container.addEventListener('contextmenu', handler, true);
      }
    } catch (err) {
      console.error(err);
    }

    // clicking/selecting a node in jsTree will select it in the diagram
    $('#jstree').on('select_node.jstree', function (e, data) {
      const uid = data.node.id;
      try {
        if (window.data) {
          const found = findByUid(window.data, uid);
          if (found) {
            selectedNode = { data: found };
            window.selectedNode = selectedNode;
            if (typeof window.openEditor === 'function') {
              window.openEditor(found);
            }
            if (typeof render === 'function') render();
          }
        }
      } catch (e) { console.error(e); }
    });

    // when a node is renamed in jsTree, update underlying data
    $('#jstree').on('rename_node.jstree', function (e, data) {
      const uid = data.node.id;
      const newName = data.text;
      try {
        if (window.data) {
          const obj = findByUid(window.data, uid);
          if (obj) obj.name = newName;
          if (typeof render === 'function') render();
        }
      } catch (err) { console.error(err); }
    });

    // when a node is deleted through jsTree controls, update underlying data
    $('#jstree').on('delete_node.jstree', function (e, data) {
      const uid = data.node.id;
      try {
        if (window.data) {
          const parentObj = findParentByUid(window.data, uid);
          if (parentObj && parentObj.children) parentObj.children = parentObj.children.filter(c => c._uid !== uid);
          if (typeof render === 'function') render();
        }
      } catch (err) { console.error(err); }
    });

    // when a node is moved (drag & drop), update underlying data structure
    $('#jstree').on('move_node.jstree', function (e, data) {
      const movedUid = data.node.id;
      const oldParentUid = data.old_parent === '#' ? null : data.old_parent;
      const newParentUid = data.parent === '#' ? null : data.parent;
      const position = data.position;
      try {
        if (window.data) {
          const movedObj = findByUid(window.data, movedUid);
          const oldParentObj = oldParentUid ? findByUid(window.data, oldParentUid) : null;
          const newParentObj = newParentUid ? findByUid(window.data, newParentUid) : window.data;
          if (oldParentObj && oldParentObj.children) {
            oldParentObj.children = oldParentObj.children.filter(c => c._uid !== movedUid);
          }
          if (!newParentObj.children) newParentObj.children = [];
          newParentObj.children.splice(position, 0, movedObj);
          if (typeof render === 'function') render();
        }
      } catch (err) { console.error(err); }
    });
    // when a table cell is edited via jstree-table, sync the value back into window.data
    $('#jstree').on('update_cell.jstree-table', function (e, info) {
      try {
        var uid = info && info.node && info.node.id ? info.node.id : null;
        var col = info && info.col;
        var val = info && info.value;
        if (!uid) return;
        if (window.data) {
          var obj = findByUid(window.data, uid);
          if (obj) {
            if (col === 'percent') obj.percent = Number(val);
            else obj[col] = val;
            if (typeof render === 'function') render();
          }
        }
      } catch (err) { console.error(err); }
    });

    // helper finders
    function findByUid(n, uid) {
      if (!n) return null;
      if (n._uid === uid) return n;
      if (!n.children) return null;
      for (const c of n.children) {
        const f = findByUid(c, uid);
        if (f) return f;
      }
      return null;
    }

    function findParentByUid(root, uid) {
      if (!root || !root.children) return null;
      for (const c of root.children) {
        if (c._uid === uid) return root;
        const rec = findParentByUid(c, uid);
        if (rec) return rec;
      }
      return null;
    }
  });
})();
