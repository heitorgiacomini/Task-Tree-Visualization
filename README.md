# Task Tree Visualization

![Task Tree Screenshot](task-tree.jpg)

![Directory Screenshot](directory.png)

## Features
| Feature | Description |
| --- | --- |
| Two visualization modes | Switch between **Directory** (jsTree) and **Diagram** (D3) using the top tabs. **Tested: Yes** |
| Hierarchical task model | Tree structure using `Task` class with name, status, percent, description and children. **Tested: Yes** |
| Automatic progress calculation | Percent and status of each node computed dynamically from its children. **Tested: Yes** |
| D3.js visualization | Interactive SVG tree with nodes, links and arrow markers using D3 v7. **Tested: Yes** |
| Pie-style progress indicator | Each node shows a red base circle with a green pie slice representing completion percentage. **Tested: Partial** (presence + selection-hide is tested; exact angle math is not) |
| Node selection and highlight | Click a node to highlight it and load its data in the side panel. **Tested: Yes** |
| Tooltip with description | Shows task description when hovering the mouse over a node. **Tested: Yes** |
| Task editing panel | Side panel to view/edit the selected node and access actions (create/update/delete/move). **Tested: Partial** (open panel + some actions are tested; field edits are not fully asserted) |
| Update node | Apply edits (name/description and leaf status) via the **Update node** button. **Tested: Partial** (derived-status alert path is tested; normal update path is not) |
| Draggable editor panel | Drag the editor panel by its header to reposition it on screen. **Tested: Yes** |
| Close editor button | Close button hides the panel and clears selection. **Tested: Yes** |
| Subtask creation | Button to create child nodes under the selected node, starting as "Task" with false status. **Tested: Yes** |
| Node deletion | Remove selected nodes with protection against deleting the root node. **Tested: Partial** (non-root delete + root protection are tested; root delete via panel button is not) |
| Diagram reparenting (Move to...) | "Move to..." changes a node's parent, blocking moving the root and preventing cycles (move into self/descendant). **Tested: Partial** (reparenting is tested; error paths are not) |
| Directory drag-and-drop reparenting | Drag & drop nodes in Directory to reparent/reorder them. **Tested: Yes** (reparenting via jsTree move triggers model update) |
| Directory table progress column | Directory shows a completion percentage column with a progress bar + label. **Tested: Yes** |
| Cross-view synchronization | Changes in selection/data sync between Diagram and Directory views. **Tested: Yes** |
| JSON import | Load trees from a JSON file or default `task-tree.json`. **Tested: Yes** |
| JSON export | Export the current task structure to a JSON file. **Tested: Yes** |
| Image export | Export the diagram as PNG, JPEG or SVG preserving styling. **Tested: Yes** (downloads) |
| Adaptive layout | SVG width/height and spacing adapt dynamically to node count and depth. **Tested: Partial** (width growth sanity) |
| Refined panel UX | Edit panel stays open while interacting and does not close on text selection. **Tested: Partial** (text selection is tested; other interactions are not) |
| Collapse/expand children | Double-click a node to hide or show its child subtree. **Tested: Yes** |
| Collapse indicator | A small `+` indicator below a collapsed node shows it has hidden children. **Tested: Yes** |

## Views

### Diagram (D3)

- Click a node to select it and open the editor panel. **Tested: Yes**
- Double-click a node to collapse/expand its children. **Tested: Yes**

### Directory (jsTree)

- Left-click a row to select the node and open the editor panel. **Tested: Yes**
- Right-click anywhere on a row to open the context menu. **Tested: Partial** (context menu actions are tested; full-row right-click surface is not)
	- **Edit**
	- **Create subfolder**
	- **Rename**
	- **Delete**

Context menu coverage:
	- Edit: **Tested: Yes**
	- Create subfolder: **Tested: Yes**
	- Rename: **Tested: Yes**
	- Delete (non-root): **Tested: Yes**
	- Delete (root protection): **Tested: Yes**

## Status rule (important)

- A node **with sub-nodes** has its status derived from its children.
- If you try to manually change the status checkbox for a node that has children, the app shows an alert and reverts the checkbox.

## Mouse interactions

| Action | Effect |
| --- | --- |
| Single click on a node | Selects the node, highlights it and loads its data into the side panel. **Tested: Yes** |
| Double click on a node | Toggles collapse/expand of that node's children; a `+` marker appears when it has hidden children. **Tested: Yes** |
| Hover over a node | Shows a tooltip with the node's description (if filled). **Tested: Yes** |
| Click on empty space | Deselects any node and hides the side panel. **Tested: Yes** |
| Drag to select text in panel | Only affects panel fields; the diagram is not changed. **Tested: Partial** (text selection without closing is tested) |

## Run locally

This is a static HTML app. You can open the HTML directly, but using a local server avoids browser restrictions when fetching `task-tree.json`.

- Python:
	- `python -m http.server 8000`
	- Open `http://localhost:8000/project-conclusion-visualization.html`
