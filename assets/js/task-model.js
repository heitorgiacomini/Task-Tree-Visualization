class Task {
  constructor(name, status = false, percent = 0, children = [], descricao = "", url = "", collapsed = false) {
    this.name = name;
    this.status = status;
    this.percent = percent;
    this.children = children;
    this.descricao = descricao;
    this.url = url;
    this.collapsed = collapsed; // hide/show children in the tree
  }
}

function computePercentFromStatus(node) {
  if (!node.children || node.children.length === 0) {
    node.percent = node.status ? 100 : 0;
    return node.percent;
  }

  const totalChildren = node.children.length;
  let sumPercent = 0;

  node.children.forEach(child => {
    const childPercent = computePercentFromStatus(child);
    sumPercent += childPercent;
  });

  node.percent = totalChildren > 0 ? sumPercent / totalChildren : 0;
  node.status = node.percent >= 100;
  return node.percent;
}

function plainObjectToTask(obj) {
  const children = (obj.children || []).map(plainObjectToTask);
  return new Task(
    obj.name || "",
    !!obj.status,
    typeof obj.percent === "number" ? obj.percent : 0,
    children,
    obj.descricao || "",
    obj.url || "",
    !!obj.collapsed
  );
}
