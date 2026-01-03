let data = null;
let selectedNode = null;
let moveMode = false;

// if other UI initialized the shared model, pick it up
if (window.data) data = window.data;
if (window.selectedNode) selectedNode = window.selectedNode;

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
  // prefer authoritative window model when available
  data = window.data || data;
  selectedNode = window.selectedNode || selectedNode;

  computePercentFromStatus(data);
  const baseWidth = 800;
  const radius = 30;

  d3.select("#diagram-wrapper svg").remove();

  const rootForSize = d3.hierarchy(data);
  const nodesForSize = rootForSize.descendants();
  const nodeCount = nodesForSize.length;
  const maxDepth = d3.max(nodesForSize, d => d.depth) || 0;

  const minHorizontalGap = radius * 2.4;
  const width = Math.max(baseWidth, nodeCount * minHorizontalGap);
  const baseHeight = 320;
  const extraHeightPerLevel = 120;
  const height = baseHeight + maxDepth * extraHeightPerLevel;

  const svg = d3.select("#canvas").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Clicking empty space deselects and hides the editor panel.
  // Node click handlers call event.stopPropagation(), so this only fires for background clicks.
  svg.on("click", (event) => {
    selectedNode = null;
    window.selectedNode = null;
    moveMode = false;

    const controls = document.getElementById("controls");
    if (controls) controls.style.display = "none";
    const label = document.getElementById("selected-node-label");
    if (label) label.textContent = "none";

    const tooltip = document.getElementById("tooltip");
    if (tooltip) tooltip.style.display = "none";

    window.data = data;
    render();
    if (typeof window.notifyTreeChange === "function") {
      window.notifyTreeChange();
    }
  });

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, 50)`);

  const tree = d3.tree()
    .size([width - 200, height - 200])
    .separation((a, b) => {
      return a.parent === b.parent ? 2 : 3;
    });

  const root = d3.hierarchy(data, d => (d.collapsed ? null : d.children));
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
          alert("It is not possible to move the root node.");
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
          alert("It is not possible to move a node into itself or one of its descendants.");
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
        // persist structural change to shared model
        window.data = data;
        render();
        event.stopPropagation();
        return;
      }

      // normal click: select node and open panel
      selectedNode = d;
      // sync selection and model globally so other UI sees it
      window.selectedNode = selectedNode;
      window.data = data;
      if (typeof window.openEditor === "function") {
        window.openEditor(d.data);
      } else {
        const controls = document.getElementById("controls");
        if (controls) controls.style.display = "block";
        const label = document.getElementById("selected-node-label");
        if (label) label.textContent = d.data.name;
        const nameInput = document.getElementById("task-name");
        if (nameInput) nameInput.value = d.data.name;
        const statusInput = document.getElementById("task-status");
        if (statusInput) statusInput.checked = !!d.data.status;
        const descInput = document.getElementById("task-descricao");
        if (descInput) descInput.value = d.data.descricao || "";
      }
      moveMode = false;
      // re-render so the selected node gets the 'selected' CSS class
      render();
      event.stopPropagation();
    })
    .on("dblclick", (event, d) => {
      // double-click toggles collapse/expand of children
      d.data.collapsed = !d.data.collapsed;
      // persist collapse change
      window.data = data;
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

  // base circle background
  node.append("circle")
    .attr("r", radius)
    .attr("data-status", d => d.data.status)
    .attr("fill", "#ff0000ff");

  // pie-like arc showing completion percentage
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  node.append("path")
    .attr("d", d => {
      // do not draw the pie when this node is selected, so the
      // selection highlight color remains clearly visible
      if (selectedNode && selectedNode.data === d.data) {
        return null;
      }
      const p = Math.max(0, Math.min(100, d.data.percent || 0));
      const angle = (p / 100) * 2 * Math.PI;
      if (p <= 0) {
        // draw a very small slice so 0% is still visible as a red mark
        //return arc({ startAngle: 0, endAngle: 0.01 });
      }
      return arc({ startAngle: 0, endAngle: angle });
    })
    .attr("fill", d => {
      const p = Math.max(0, Math.min(100, d.data.percent || 0));
      return `rgb(0, 255, 0)`;
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

  // indicator for collapsed nodes that still have children
  node.filter(d => d.data.collapsed && d.data.children && d.data.children.length > 0)
    .append("text")
    .attr("x", 0)
    .attr("class", "collapse-indicator")
    .attr("y", radius + 8)   // closer to the circle
    .attr("font-weight", "bold")
    .text("+");

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
  // write back any computed changes into shared model
  window.data = data;
}
