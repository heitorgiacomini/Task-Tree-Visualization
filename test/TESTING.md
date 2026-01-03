# Manual Test Checklist

Use this checklist to validate all major features in both views.

## Setup

- Serve the repo (not file://) so `fetch('task-tree.json')` works.
- Use **Import JSON** to load fixtures from `test/fixtures/`.

## Core invariants

- Percent/status are derived by `computePercentFromStatus`.
- Only leaf nodes can be manually toggled Completed.
- Root cannot be deleted or moved.
- Move cannot create cycles (cannot move into itself/descendant).

## 1) Load + render

1. Import `test/fixtures/smoke-basic.json`.
2. Verify Diagram renders nodes + links and shows percent text.
3. Switch to Directory tab and ensure tree appears.

## 2) Selection + editor

1. In Diagram: click a node → editor opens, label updates.
2. In Directory: click a row → editor opens, selection syncs.
3. Close editor (X) → selection clears.

## 3) Status rule (leaf-only)

1. Import `test/fixtures/status-rule.json`.
2. Select a parent node that has children.
3. Try toggling Completed in editor → expect alert and checkbox reverts.
4. Select a leaf → toggle Completed → percent becomes 100 for that leaf.

## 4) Create child

1. Select any node.
2. Click **Create child**.
3. Expect:
   - A new child appears immediately in Directory (if visible).
   - Diagram updates.
   - Parent percent updates accordingly.

## 5) Rename / description

1. Change Name + Description in editor, click **Update node**.
2. Verify Diagram label updates and tooltip shows Description on hover.
3. In Directory: right-click → **Rename**; rename; verify Diagram updates.

## 6) Collapse / expand

1. In Diagram: double-click a node with children → subtree hides.
2. Verify a `+` indicator appears.
3. Double-click again → subtree shows.
4. Import `test/fixtures/collapsed-nodes.json` and verify initial collapsed states.

## 7) Directory context menu

1. Right-click a row → context menu appears.
2. **Edit** → opens editor for that node.
3. **Create subfolder** → node appears under selected parent and auto-enters rename.
4. **Delete** (non-root) → removes node; Diagram updates.

## 8) Drag & drop (Directory)

1. Import `test/fixtures/move-and-reparent.json`.
2. Drag a node to a different parent.
3. Verify Diagram reflects new hierarchy.
4. Try to drag a node into its descendant (if jsTree allows it) → expect it to be prevented logically (no cycles).

## 9) Move-to mode (Diagram)

1. Select a non-root node.
2. Click **Move to...**.
3. Click a different node as destination.
4. Verify it reparents and updates both views.
5. Try moving root → should alert.

## 10) Export/import

1. After edits, click **Export JSON** and confirm a file downloads.
2. Click **Export PNG/JPEG/SVG** and confirm exports render with styling.
3. Import an exported JSON and confirm the structure matches.

## 11) Large tree / performance sanity

1. Import `test/fixtures/large-tree.json`.
2. Verify both views load and interactions still work.

If you see browser console noise like `runtime.lastError`, it’s usually a browser extension/live reload script, not this app.
