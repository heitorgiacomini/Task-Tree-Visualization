// tentativa de carregar JSON padrão ao iniciar, após o DOM estar pronto
document.addEventListener("DOMContentLoaded", () => {
  // Force a fresh request on every load (avoid disk cache during local development).
  const taskTreeUrl = `task-tree.json?CacheBuster=${Date.now()}`;
  fetch(taskTreeUrl, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('not found');
      return response.json();
    })
    .then(json => {
      data = plainObjectToTask(json);
      selectedNode = null;
      window.data = data;
      window.selectedNode = selectedNode;
      document.getElementById("selected-node-label").textContent = "none";
      render();

      // If Directory is the active tab, ensure jsTree is initialized/refreshed
      // after async data load completes (avoids timing races on slow/large JSON).
      try {
        const activeTab = document.querySelector('[data-view-tab].active');
        const activeView = activeTab ? activeTab.getAttribute('data-view') : null;
        if (activeView === 'tree' && typeof window.ensureJsTreeInitialized === 'function') {
          window.ensureJsTreeInitialized();
        }
        if (activeView === 'tree' && typeof window.refreshJsTree === 'function') {
          window.refreshJsTree();
        }
      } catch (err) {
        console.error(err);
      }
    })
    .catch(() => {
      data = new Task("Project", false, 0, [], "", "");
      selectedNode = null;
      window.data = data;
      window.selectedNode = selectedNode;
      document.getElementById("selected-node-label").textContent = "none";
      render();

      try {
        const activeTab = document.querySelector('[data-view-tab].active');
        const activeView = activeTab ? activeTab.getAttribute('data-view') : null;
        if (activeView === 'tree' && typeof window.ensureJsTreeInitialized === 'function') {
          window.ensureJsTreeInitialized();
        }
        if (activeView === 'tree' && typeof window.refreshJsTree === 'function') {
          window.refreshJsTree();
        }
      } catch (err) {
        console.error(err);
      }
    });
});
