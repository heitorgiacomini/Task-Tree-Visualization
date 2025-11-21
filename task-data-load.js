// tentativa de carregar JSON padrão ao iniciar, após o DOM estar pronto
document.addEventListener("DOMContentLoaded", () => {
  fetch('task-tree.json')
    .then(response => {
      if (!response.ok) throw new Error('not found');
      return response.json();
    })
    .then(json => {
      data = plainObjectToTask(json);
      selectedNode = null;
      document.getElementById("selected-node-label").textContent = "none";
      render();
    })
    .catch(() => {
      data = new Task("Project", false, 0, [], "");
      selectedNode = null;
      document.getElementById("selected-node-label").textContent = "none";
      render();
    });
});
