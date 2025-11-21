document.getElementById("btn-create-child").addEventListener("click", () => {
  if (!selectedNode) return;
  const child = new Task("Task", false, 0, [], "");
  if (!selectedNode.data.children) {
    selectedNode.data.children = [];
  }
  selectedNode.data.children.push(child);
  render();
});

document.getElementById("btn-update").addEventListener("click", () => {
  if (!selectedNode) return;
  const newName = document.getElementById("task-name").value || selectedNode.data.name;
  selectedNode.data.name = newName;
  document.getElementById("selected-node-label").textContent = newName;
  selectedNode.data.descricao = document.getElementById("task-descricao").value || "";
  if (!selectedNode.data.children || selectedNode.data.children.length === 0) {
    selectedNode.data.status = document.getElementById("task-status").checked;
  }
  render();
});

document.getElementById("btn-delete").addEventListener("click", () => {
  if (!selectedNode) return;
  if (selectedNode.data === data) {
    alert("Não é possível excluir o nó raiz.");
    return;
  }
  const parent = findParent(data, selectedNode.data);
  if (parent && parent.children) {
    parent.children = parent.children.filter(c => c !== selectedNode.data);
    selectedNode = null;
    document.getElementById("selected-node-label").textContent = "nenhum";
    render();
  }
});

document.getElementById("btn-move").addEventListener("click", () => {
  if (!selectedNode) {
    alert("Selecione um nó primeiro.");
    return;
  }
  if (selectedNode.data === data) {
    alert("Não é possível mover o nó raiz.");
    return;
  }
  moveMode = true;
});

document.getElementById("btn-import-json").addEventListener("click", () => {
  const input = document.getElementById("input-import-json");
  input.click();
});

document.getElementById("input-import-json").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      const newRoot = plainObjectToTask(parsed);
      data = newRoot;
      selectedNode = null;
      document.getElementById("selected-node-label").textContent = "nenhum";
      render();
    } catch (err) {
      alert("Erro ao ler JSON: " + err.message);
    }
  };
  reader.readAsText(file, "utf-8");
});

document.getElementById("btn-export-json").addEventListener("click", () => {
  if (typeof exportDiagramJSON === "function") exportDiagramJSON();
});

document.getElementById("btn-export-png").addEventListener("click", () => {
  if (typeof exportDiagramPNG === "function") exportDiagramPNG();
});

document.getElementById("btn-export-jpeg").addEventListener("click", () => {
  if (typeof exportDiagramJPEG === "function") exportDiagramJPEG();
});

document.getElementById("btn-export-svg").addEventListener("click", () => {
  if (typeof exportDiagramSVG === "function") exportDiagramSVG();
});

// esconder formulário e limpar seleção ao clicar fora dos nós/controles
document.addEventListener("click", (event) => {
  const controls = document.getElementById("controls");
  const clickInsideControls = controls.contains(event.target);
  const clickOnNode = event.target.closest && event.target.closest('.node');

  if (clickInsideControls || clickOnNode) {
    return;
  }

  const active = document.activeElement;
  if (active && controls.contains(active)) {
    return;
  }

  selectedNode = null;
  controls.style.display = "none";
  moveMode = false;
  render();
});
