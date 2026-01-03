# Task Tree Visualization

![Task Tree Screenshot](task-tree.jpg)

![Directory Screenshot](directory.png)

## See it in action
https://heitorgiacomini.github.io/Task-Tree-Visualization/

## Features
| Feature | Description |
| --- | --- |
| Two visualization modes | Switch between **Directory** (jsTree) and **Diagram** (D3) using the top tabs. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Hierarchical task model | Tree structure using `Task` class with name, status, percent, description, URL and children. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Automatic progress calculation | Percent and status of each node computed dynamically from its children. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| D3.js visualization | Interactive SVG tree with nodes, links and arrow markers using D3 v7. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Pie-style progress indicator | Each node shows a red base circle with a green pie slice representing completion percentage. <strong>Tested: Partial</strong> (presence + selection-hide is tested; exact angle math is not) |
| Node selection and highlight | Click a node to highlight it and load its data in the side panel. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Tooltip with description | Shows task description when hovering the mouse over a node. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Task editing panel | Side panel to view/edit the selected node and access actions (create/update/delete/move). <strong>Tested: Partial</strong> (open panel + some actions are tested; field edits are not fully asserted) |
| Per-node URL field | Optional URL field on each task; shown as a clickable link in Directory when it is a valid HTTP(S) URL (missing scheme is normalized to https). <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Update node | Apply edits (name/description and leaf status) via the **Update node** button. <strong>Tested: Partial</strong> (derived-status alert path is tested; normal update path is not) |
| Draggable editor panel | Drag the editor panel by its header to reposition it on screen. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Close editor button | Close button hides the panel and clears selection. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Subtask creation | Button to create child nodes under the selected node, starting as "Task" with false status. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Node deletion | Remove selected nodes with protection against deleting the root node. <strong>Tested: Partial</strong> (non-root delete + root protection are tested; root delete via panel button is not) |
| Diagram reparenting (Move to...) | "Move to..." changes a node's parent, blocking moving the root and preventing cycles (move into self/descendant). <strong>Tested: Partial</strong> (reparenting is tested; error paths are not) |
| Directory drag-and-drop reparenting | Drag & drop nodes in Directory to reparent/reorder them. <span style="color: green;"><strong>Tested: Yes</strong></span> (reparenting via jsTree move triggers model update) |
| Directory table progress column | Directory shows a completion percentage column with a progress bar + label. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Directory table URL column | Directory shows a URL column (150px default). <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Cross-view synchronization | Changes in selection/data sync between Diagram and Directory views. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| JSON import | Load trees from a JSON file or default `task-tree.json`. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| JSON export | Export the current task structure to a JSON file. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Image export | Export the diagram as PNG, JPEG or SVG preserving styling. <span style="color: green;"><strong>Tested: Yes</strong></span> (downloads) |
| Markdown export | Export the current task structure to a Markdown file (`task-tree.md`). <span style="color: green;"><strong>Tested: Yes</strong></span> (download) |
| Adaptive layout | SVG width/height and spacing adapt dynamically to node count and depth. <strong>Tested: Partial</strong> (width growth sanity) |
| Refined panel UX | Edit panel stays open while interacting and does not close on text selection. <strong>Tested: Partial</strong> (text selection is tested; other interactions are not) |
| Collapse/expand children | Double-click a node to hide or show its child subtree. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Collapse indicator | A small `+` indicator below a collapsed node shows it has hidden children. <span style="color: green;"><strong>Tested: Yes</strong></span> |

## Views

### Diagram (D3)

- Click a node to select it and open the editor panel. <span style="color: green;"><strong>Tested: Yes</strong></span>
- Double-click a node to collapse/expand its children. <span style="color: green;"><strong>Tested: Yes</strong></span>

### Directory (jsTree)

- Left-click a row to select the node and open the editor panel. <span style="color: green;"><strong>Tested: Yes</strong></span>
- Right-click anywhere on a row to open the context menu. <strong>Tested: Partial</strong> (context menu actions are tested; full-row right-click surface is not)
	- **Edit**
	- **Create subfolder**
	- **Rename**
	- **Delete**

Context menu coverage:
	- Edit: <span style="color: green;"><strong>Tested: Yes</strong></span>
	- Create subfolder: <span style="color: green;"><strong>Tested: Yes</strong></span>
	- Rename: <span style="color: green;"><strong>Tested: Yes</strong></span>
	- Delete (non-root): <span style="color: green;"><strong>Tested: Yes</strong></span>
	- Delete (root protection): <span style="color: green;"><strong>Tested: Yes</strong></span>

## Status rule (important)

- A node **with sub-nodes** has its status derived from its children.
- If you try to manually change the status checkbox for a node that has children, the app shows an alert and reverts the checkbox.

## Mouse interactions

| Action | Effect |
| --- | --- |
| Single click on a node | Selects the node, highlights it and loads its data into the side panel. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Double click on a node | Toggles collapse/expand of that node's children; a `+` marker appears when it has hidden children. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Hover over a node | Shows a tooltip with the node's description (if filled). <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Click on empty space | Deselects any node and hides the side panel. <span style="color: green;"><strong>Tested: Yes</strong></span> |
| Drag to select text in panel | Only affects panel fields; the diagram is not changed. <strong>Tested: Partial</strong> (text selection without closing is tested) |

## Run locally

This is a static HTML app. You can open the HTML directly, but using a local server avoids browser restrictions when fetching `task-tree.json`.

- Python:
	- `python -m http.server 8000`
	- Open `http://localhost:8000/index.html`
