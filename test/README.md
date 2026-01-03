# Test Folder

This folder contains manual testing instructions and JSON fixtures to exercise all app features.

## How to run

1. Start a local server from the repo root:
   - `python -m http.server 8000`
2. Open:
   - `http://localhost:8000/project-conclusion-visualization.html`

## How to use fixtures

- Recommended: use **Import JSON** in the UI and pick any file in `test/fixtures/`.
- Alternative: temporarily copy a fixture over `task-tree.json` (keep a backup), then refresh.

## What to run

Follow the checklist in [TESTING.md](TESTING.md).
