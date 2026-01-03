# Automated Tests (Playwright)

These are end-to-end browser tests that exercise the UI.

## Prereqs

- Node.js + npm
- Python (used to run `python -m http.server 8000`)
- Internet access (the app loads D3/jsTree from CDNs)

## Install + run

From repo root:

- `cd test`
- `npm install`
- `npm run install:browsers`
- `npm test`

To watch it in a real browser window:

- `npm run test:headed`

To slow interactions down (Windows-friendly):

- `npm run test:headed:slow`

Interactive modes:

- UI runner: `npm run test:ui`
- Inspector: `npm run test:debug`

Or on Windows PowerShell:

- `./test/scripts/run-tests.ps1`

## What is covered

Specs live in `test/tests/` and cover:

- Page loads and tabs exist
- Directory renders (including jstree-table progress column)
- Import fixture + leaf-only status rule alert
- Create child updates Directory immediately
- Diagram selection opens editor + updates selected label
- Tooltip shows description on hover
- Collapse/expand via double-click shows `+` indicator
- Move-to reparenting updates underlying model
- Directory context menu create subfolder + rename
- Delete node removes it from model
- Export JSON + PNG/JPEG/SVG downloads
- Large tree causes diagram SVG width to grow

If you already have a server on port 8000, Playwright will reuse it.
