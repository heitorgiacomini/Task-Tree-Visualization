class Task {
  constructor(name, status = false, percent = 0, children = [], descricao = "") {
    this.name = name;
    this.status = status;
    this.percent = percent;
    this.children = children;
    this.descricao = descricao;
    this.collapsed = false; // hide/show children in the tree
  }
}

function computePercentFromStatus(node) {
  if (!node.children || node.children.length === 0) {
    node.percent = node.status ? 100 : 0;
    return node.percent;
  }

  let completedChildren = 0;
  let totalChildren = node.children.length;

  node.children.forEach(child => {
    const childPercent = computePercentFromStatus(child);
    if (childPercent >= 100) {
      completedChildren++;
    }
  });

  node.percent = (completedChildren / totalChildren) * 100;
  node.status = completedChildren === totalChildren;
  return node.percent;
}

function plainObjectToTask(obj) {
  const children = (obj.children || []).map(plainObjectToTask);
  return new Task(
    obj.name || "",
    !!obj.status,
    typeof obj.percent === "number" ? obj.percent : 0,
    children,
    obj.descricao || ""
  );
}
