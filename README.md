# Task Tree Visualization

![Task Tree Screenshot](task-tree.jpg)

## Features

| Feature | Description |
| --- | --- |
| Hierarchical task model | Tree structure using `Task` class with name, status, percent, description and children. |
| Automatic progress calculation | Percent and status of each node computed dynamically from its children. |
| D3.js visualization | Interactive SVG tree with nodes, links and arrow markers using D3 v7. |
| Pie-style progress indicator | Each node shows a red base circle with a green pie slice representing completion percentage. |
| Node selection and highlight | Click a node to highlight it and load its data in the side panel. |
| Tooltip with description | Shows task description when hovering the mouse over a node. |
| Task editing panel | Side panel to change name, status (for leaf nodes) and description. |
| Subtask creation | Button to create child nodes under the selected node, starting as "Task" with false status. |
| Node deletion | Remove selected nodes with protection against deleting the root node. |
| Hierarchy reparenting | "Move to..." feature to change a node's parent without creating cycles. |
| JSON import | Load trees from a JSON file or default `task-tree.json`. |
| JSON export | Export the current task structure to a JSON file. |
| Image export | Export the diagram as PNG, JPEG or SVG preserving styling. |
| Adaptive layout | SVG width/height and spacing adapt dynamically to node count and depth. |
| Refined panel UX | Edit panel stays open while interacting and does not close on text selection. |
| Collapse/expand children | Double-click a node to hide or show its child subtree. |
| Collapse indicator | A small `+` indicator below a collapsed node shows it has hidden children. |

## Mouse interactions

| Action | Effect |
| --- | --- |
| Single click on a node | Selects the node, highlights it and loads its data into the side panel. |
| Double click on a node | Toggles collapse/expand of that node's children; a `+` marker appears when it has hidden children. |
| Hover over a node | Shows a tooltip with the node's description (if filled). |
| Click on empty space | Deselects any node and hides the side panel. |
| Drag to select text in panel | Only affects panel fields; the diagram is not changed. |
