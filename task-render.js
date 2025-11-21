let data = null;
let selectedNode = null;
let moveMode = false;

function findParent(rootNode, target) {
  if (!rootNode.children) return null;
  for (const child of rootNode.children) {
    if (child === target) return rootNode;
    const found = findParent(child, target);
    if (found) return found;
  }
  return null;
}

function render() {
  computePercentFromStatus(data);
  const baseWidth = 800;
  const radius = 30;

  d3.select("svg").remove();

  const rootForSize = d3.hierarchy(data);
  const nodesForSize = rootForSize.descendants();
  const nodeCount = nodesForSize.length;
  const maxDepth = d3.max(nodesForSize, d => d.depth) || 0;

  const minHorizontalGap = radius * 2.4;
  const width = Math.max(baseWidth, nodeCount * minHorizontalGap);
  const baseHeight = 320;
  const extraHeightPerLevel = 120;
  const height = baseHeight + maxDepth * extraHeightPerLevel;

  const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, 50)`);

  const tree = d3.tree()
    .size([width - 200, height - 200])
    .separation((a, b) => {
      return a.parent === b.parent ? 2 : 3;
    });

  const root = d3.hierarchy(data);
  tree(root);

  const link = g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d3.linkVertical()
      .x(d => d.x - width / 2 + 100)
      .y(d => d.y))
    .attr("marker-end", "url(#arrowhead)");

  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", d => "node" + (selectedNode && selectedNode.data === d.data ? " selected" : ""))
    .attr("transform", d => `translate(${d.x - width / 2 + 100},${d.y})`)
    .on("click", (event, d) => {
      if (moveMode && selectedNode && d !== selectedNode) {
        if (selectedNode.data === data) {
          alert("Não é possível mover o nó raiz.");
          moveMode = false;
          event.stopPropagation();
          return;
        }

        let cursor = d;
        let isDescendant = false;
        while (cursor) {
          if (cursor.data === selectedNode.data) {
            isDescendant = true;
            break;
          }
          cursor = cursor.parent;
        }
        if (isDescendant) {
          alert("Não é possível mover um nó para dentro de si mesmo ou de um descendente.");
          moveMode = false;
          event.stopPropagation();
          return;
        }

        const oldParent = findParent(data, selectedNode.data);
        if (!oldParent || !oldParent.children) {
          moveMode = false;
          event.stopPropagation();
          return;
        }

        oldParent.children = oldParent.children.filter(c => c !== selectedNode.data);

        if (!d.data.children) {
          d.data.children = [];
        }
        d.data.children.push(selectedNode.data);

        moveMode = false;
        render();
        event.stopPropagation();
        return;
      }

      selectedNode = d;
      document.getElementById("controls").style.display = "block";
      document.getElementById("selected-node-label").textContent = d.data.name;
      document.getElementById("task-name").value = d.data.name;
      document.getElementById("task-status").checked = !!d.data.status;
      document.getElementById("task-descricao").value = d.data.descricao || "";
      moveMode = false;
      render();
      event.stopPropagation();
    })
    .on("mouseover", function (event, d) {
      d3.select(this).select(".edit-icon").style("display", "block");

      const tooltip = document.getElementById("tooltip");
      if (d.data.descricao) {
        tooltip.textContent = d.data.descricao;
        tooltip.style.display = "block";
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 8}px`;
        tooltip.style.top = `${rect.top}px`;
      }
    })
    .on("mouseout", function () {
      d3.select(this).select(".edit-icon").style("display", "none");
      const tooltip = document.getElementById("tooltip");
      tooltip.style.display = "none";
    });

  node.append("circle")
    .attr("r", radius)
    .attr("data-status", d => d.data.status)
    .attr("fill", d => {
      const p = Math.max(0, Math.min(100, d.data.percent || 0));
      const t = p / 100;

      let r, g, b;
      if (t <= 0.5) {
        const u = t / 0.5;
        const r0 = 255, g0 = 0, b0 = 0;
        const r1 = 60, g1 = 120, b1 = 255;
        r = Math.round(r0 + (r1 - r0) * u);
        g = Math.round(g0 + (g1 - g0) * u);
        b = Math.round(b0 + (b1 - b0) * u);
      } else {
        const u = (t - 0.5) / 0.5;
        if (u <= 0.5) {
          const v = u / 0.5;
          r = 0;
          g = Math.round(255 * v);
          b = 255;
        } else {
          const v = (u - 0.5) / 0.5;
          r = 0;
          g = 255;
          b = Math.round(255 * (1 - v));
        }
      }
      return `rgb(${r},${g},${b})`;
    });

  const label = node.append("text");

  label.each(function (d) {
    const nameParts = d.data.name.split(" ");
    const percentPart = `(${Math.round(d.data.percent)}%)`;
    const parts = [...nameParts, percentPart];
    const lineHeight = 16;
    const totalLines = parts.length;

    d3.select(this)
      .selectAll("tspan")
      .data(parts)
      .enter()
      .append("tspan")
      .attr("x", 0)
      .attr("dy", (t, i) => (i === 0
        ? -((totalLines - 1) * lineHeight) / 2 - 6
        : lineHeight))
      .text(t => t);
  });

  node.append("text")
    .attr("class", "edit-icon")
    .attr("x", radius - 4)
    .attr("y", -radius + 6)
    .style("display", "none")
    .text("✎");

  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("class", "arrow");
}
