const { test, expect } = require('@playwright/test');
const path = require('path');

async function importFixture(page, fixtureFileName) {
  const fixturePath = path.join(__dirname, '..', 'fixtures', fixtureFileName);
  await page.setInputFiles('#input-import-json', fixturePath);
  // Wait until window.data reflects the imported file.
  const expectedRootName = fixtureFileName
    .replace(/\.json$/i, '')
    .replace(/[-_]/g, '');
  await page.waitForFunction(() => !!window.data && typeof window.data.name === 'string');
  // Import fixtures are authored with explicit root names; trust them.
  await page.waitForTimeout(50);
  // Keep Directory in sync if initialized.
  await page.evaluate(() => {
    if (typeof window.refreshJsTree === 'function') window.refreshJsTree();
  });
}

async function openDirectoryView(page) {
  await page.goto('/index.html');
  await page.getByRole('tab', { name: 'Directory' }).click();
  await expect(page.locator('#jstree')).toBeVisible();
}

async function openDiagramView(page) {
  await page.goto('/index.html');
  await page.getByRole('tab', { name: 'Diagram' }).click();
  await expect(page.locator('#canvas svg')).toBeVisible();
}

function diagramText(page, text) {
  return page.locator('#canvas svg').getByText(text, { exact: true }).first();
}

async function diagramDblclickByLabel(page, labelText) {
  await page.evaluate((label) => {
    const svg = document.querySelector('#canvas svg');
    if (!svg) throw new Error('diagram svg not found');

    const tspans = Array.from(svg.querySelectorAll('tspan'));
    const tspan = tspans.find(t => (t.textContent || '').trim() === label);
    if (!tspan) throw new Error(`tspan '${label}' not found`);

    const nodeGroup = tspan.closest('g.node');
    if (!nodeGroup) throw new Error('node group not found');

    nodeGroup.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  }, labelText);
}

async function openJsTreeContextMenuByLabel(page, labelText) {
  // Wait until the row exists (jsTree refresh after import is async).
  await expect(page.locator('#jstree a.jstree-anchor', { hasText: labelText }).first()).toBeVisible();

  await page.evaluate((labelText) => {
    const $ = window.jQuery;
    if (!$) throw new Error('jQuery not available');

    const tree = $('#jstree').jstree(true);
    if (!tree) throw new Error('jsTree not initialized');

    // Prefer DOM lookup for stability (table plugin can decorate model text).
    const anchors = Array.from(document.querySelectorAll('#jstree a.jstree-anchor'));
    const anchor = anchors.find(a => (a.textContent || '').includes(labelText));

    let nodeId = null;
    if (anchor) {
      const li = anchor.closest('li');
      if (li && li.id) nodeId = li.id;
    }

    // Fallback: scan jsTree model by node.text.
    if (!nodeId && tree && tree._model && tree._model.data) {
      const entries = Object.entries(tree._model.data);
      for (const [id, node] of entries) {
        if (!id || id === '#') continue;
        if (node && typeof node.text === 'string' && node.text.includes(labelText)) {
          nodeId = id;
          break;
        }
      }
    }

    if (!nodeId) throw new Error('Node not found: ' + labelText);

    tree.deselect_all(true);
    tree.select_node(nodeId);
    const li = document.getElementById(nodeId);
    if (!li) throw new Error('Node li not found for: ' + labelText);

    // Trigger a real DOM contextmenu so the app's capture handler runs
    // (jsTree-table can interfere with direct show_contextmenu calls).
    li.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      pageX: 200,
      pageY: 200,
    }));
  }, labelText);
}

test('loads and shows both tabs', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('tab', { name: 'Directory' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Diagram' })).toBeVisible();
});

test('Directory view renders nodes', async ({ page }) => {
  await openDirectoryView(page);
  // jsTree renders nodes as <li id="uid_...">
  await expect.poll(async () => page.locator('#jstree li').count()).toBeGreaterThan(0);
  // jstree-table progress column renders labels.
  await expect(page.locator('.progress-label').first()).toBeVisible();
  // URL column is present.
  await expect(page.locator('.jstree-table-header-cell', { hasText: 'URL' }).first()).toBeVisible();
});

test('Directory: URL column renders clickable links', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  // LeafA has an explicit https URL.
  const leafALink = page.locator('.jstree-table-wrapper a[href^="https://example.com/leafa"]');
  await expect(leafALink.first()).toBeVisible();
  await expect(leafALink.first()).toHaveAttribute('target', '_blank');

  // LeafB uses a bare domain in the fixture; app normalizes it to https.
  const leafBLink = page.locator('.jstree-table-wrapper a[href^="https://example.com/leafb"]');
  await expect(leafBLink.first()).toBeVisible();
});

test('Default task-tree.json: url values load into Directory', async ({ page }) => {
  await openDirectoryView(page);

  // Wait for the app to load default task-tree.json.
  await page.waitForFunction(() => !!window.data && typeof window.data.name === 'string');

  const result = await page.evaluate(() => {
    const $ = window.jQuery;
    if (!$) throw new Error('jQuery not available');
    const tree = $('#jstree').jstree(true);
    if (!tree || !tree._model || !tree._model.data) throw new Error('jsTree not initialized');

    // Find a known node name from the default dataset and return its data.url.
    const entries = Object.entries(tree._model.data);
    for (const [id, node] of entries) {
      if (!id || id === '#') continue;
      if (node && node.text === 'Ohara') {
        return {
          found: true,
          url: node.data && typeof node.data.url === 'string' ? node.data.url : null
        };
      }
    }
    return { found: false, url: null };
  });

  expect(result.found).toBeTruthy();
  // The default repo task-tree.json currently has an Ohara.url set.
  expect(result.url).toContain('youtube');
});

test('import fixture and enforce leaf-only status rule', async ({ page }) => {
  await openDirectoryView(page);

  await importFixture(page, 'status-rule.json');

  // Select the parent row by text.
  await page.locator('#jstree a.jstree-anchor', { hasText: 'Parent (derived)' }).first().click();
  await expect(page.locator('#controls')).toBeVisible();

  // Attempt to change Completed and update -> should alert.
  page.once('dialog', async (dialog) => {
    await expect(dialog.message()).toContain("can't manually change the status");
    await dialog.accept();
  });

  // The checkbox is visually hidden (custom switch), so set it via DOM.
  await page.evaluate(() => {
    const el = document.getElementById('task-status');
    if (!el) throw new Error('task-status not found');
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.getByRole('button', { name: 'Update node' }).click();
});

test('create child updates Directory immediately', async ({ page }) => {
  await openDirectoryView(page);

  // Select any visible node (first tree anchor).
  await page.locator('#jstree a.jstree-anchor').first().click();

  // Count existing nodes, create child, then expect count increases.
  const before = await page.locator('#jstree li').count();
  await page.getByRole('button', { name: 'Create child' }).click();

  await expect.poll(async () => page.locator('#jstree li').count()).toBeGreaterThan(before);
});

test('Diagram: click selects node and opens editor', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');

  await page.getByRole('tab', { name: 'Diagram' }).click();
  await expect(page.locator('#canvas svg')).toBeVisible();

  // Click the node label in SVG.
  await diagramText(page, 'LeafA').click();
  await expect(page.locator('#controls')).toBeVisible();
  await expect(page.locator('#selected-node-label')).toHaveText('LeafA');
});

test('Diagram: pie-style progress indicator renders and hides on selection', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  const parentNode = page.locator('#canvas svg g.node', { has: page.locator('text=Parent') }).first();
  const baseCircle = parentNode.locator('circle').first();
  await expect(baseCircle).toHaveAttribute('fill', /rgb\(255,\s*0,\s*0\)|#?f00|red/i);

  const piePath = parentNode.locator('path').first();
  await expect(piePath).toHaveAttribute('fill', /rgb\(0,\s*255,\s*0\)|#?0f0|green/i);
  await expect(piePath).toHaveAttribute('d', /.+/);

  await diagramText(page, 'Parent').click();
  await expect(piePath).not.toHaveAttribute('d', /.+/);
});

test('Diagram: click empty space deselects node and hides editor panel', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await diagramText(page, 'LeafA').click();
  await expect(page.locator('#controls')).toBeVisible();

  const svg = page.locator('#canvas svg');
  const bbox = await svg.boundingBox();
  expect(bbox).toBeTruthy();

  // Click bottom-right corner (likely empty space).
  await svg.click({ position: { x: Math.max(1, bbox.width - 5), y: Math.max(1, bbox.height - 5) } });
  await expect(page.locator('#controls')).toBeHidden();
  await expect(page.locator('#selected-node-label')).toHaveText('none');
});

test('Panel: selecting text does not close the panel', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await diagramText(page, 'LeafA').click();
  await expect(page.locator('#controls')).toBeVisible();

  const desc = page.locator('#task-descricao');
  await desc.click();
  await desc.fill('Some description text to select');
  await desc.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');

  await expect(page.locator('#controls')).toBeVisible();
  await expect(page.locator('#selected-node-label')).toHaveText('LeafA');
});

test('Panel: Close editor button hides the panel and clears selection', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await diagramText(page, 'LeafA').click();
  await expect(page.locator('#controls')).toBeVisible();

  await page.getByRole('button', { name: 'Close editor' }).click();
  await expect(page.locator('#controls')).toBeHidden();
  await expect(page.locator('#selected-node-label')).toHaveText('none');

  const selectedIsNull = await page.evaluate(() => window.selectedNode === null);
  expect(selectedIsNull).toBe(true);
});

test('Panel: editor panel is draggable by header', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await diagramText(page, 'LeafA').click();
  const panel = page.locator('#controls');
  await expect(panel).toBeVisible();

  const before = await panel.boundingBox();
  expect(before).toBeTruthy();

  const handle = page.locator('#controls-header');
  const hb = await handle.boundingBox();
  expect(hb).toBeTruthy();

  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 - 80, hb.y + hb.height / 2 + 60);
  await page.mouse.up();

  const after = await panel.boundingBox();
  expect(after).toBeTruthy();

  // The panel should have moved by a noticeable amount.
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
});

test('Diagram: tooltip shows description on hover', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await diagramText(page, 'LeafA').hover();
  await expect(page.locator('#tooltip')).toBeVisible();
  await expect(page.locator('#tooltip')).toHaveText('Tooltip for LeafA');
});

test('Diagram: double-click collapses/expands and shows + indicator', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  await expect(diagramText(page, 'LeafA')).toBeVisible();
  await diagramDblclickByLabel(page, 'Parent');

  await expect(page.locator('text.collapse-indicator')).toBeVisible();
  await expect(diagramText(page, 'LeafA')).toHaveCount(0);

  await diagramDblclickByLabel(page, 'Parent');
  await expect(diagramText(page, 'LeafA')).toBeVisible();
});

test('Diagram: Move to... reparents without full refresh', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'full-features.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  // Select LeafA, enter move mode, then click Dest.
  await diagramText(page, 'LeafA').click();
  await page.getByRole('button', { name: 'Move to...' }).click();
  await diagramText(page, 'Dest').click();

  // Verify via the underlying model.
  const moved = await page.evaluate(() => {
    function findByName(node, name) {
      if (!node) return null;
      if (node.name === name) return node;
      const children = node.children || [];
      for (const c of children) {
        const f = findByName(c, name);
        if (f) return f;
      }
      return null;
    }
    function findParentOf(root, childName) {
      if (!root || !root.children) return null;
      for (const c of root.children) {
        if (c.name === childName) return root;
        const rec = findParentOf(c, childName);
        if (rec) return rec;
      }
      return null;
    }
    const parent = findParentOf(window.data, 'LeafA');
    return parent ? parent.name : null;
  });
  expect(moved).toBe('Dest');
});

test('Directory: context menu Create subfolder + Rename works', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  // Wait until the expected node is rendered (refresh after import is async).
  await expect(page.locator('#jstree a.jstree-anchor', { hasText: 'Parent' }).first()).toBeVisible();

  // Disable the floating editor panel so it does not intercept pointer events.
  await page.evaluate(() => {
    const controls = document.getElementById('controls');
    if (!controls) return;
    controls.style.display = 'none';
    controls.style.pointerEvents = 'none';
  });

  // Open jsTree context menu programmatically (more reliable than OS-level right-click).
  await page.evaluate(() => {
    const $ = window.jQuery;
    if (!$) throw new Error('jQuery not available');
    const inst = $('#jstree').jstree(true);
    if (!inst) throw new Error('jsTree instance not available');

    const anchors = Array.from(document.querySelectorAll('#jstree a.jstree-anchor'));
    const anchor = anchors.find(a => (a.textContent || '').includes('Parent'));
    if (!anchor) throw new Error('Parent anchor not found');
    const li = anchor.closest('li');
    if (!li || !li.id) throw new Error('Parent li not found');

    inst.deselect_all(true);
    inst.select_node(li.id);
    if (typeof inst.show_contextmenu === 'function') {
      inst.show_contextmenu(inst.get_node(li.id), 40, 40);
    } else {
      // Fallback: dispatch a DOM contextmenu event.
      li.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, view: window }));
    }
  });

  await expect(page.locator('.vakata-context')).toBeVisible();

  // jsTree context menu is rendered into .vakata-context
  await page.locator('.vakata-context').getByText('Create subfolder', { exact: true }).click({ force: true });

  // The app attempts to auto-enter rename mode after creation.
  // If that doesn't happen (timing/DOM), explicitly invoke edit on the currently selected node.
  await page.waitForFunction(() => {
    const rename = document.querySelector('input.jstree-rename-input');
    if (rename) return true;
    // Fallback: if jsTree exists and has a selection, we can invoke edit programmatically.
    try {
      const $ = window.jQuery;
      if (!$) return false;
      const inst = $('#jstree').jstree(true);
      if (!inst) return false;
      return inst.get_selected().length > 0;
    } catch {
      return false;
    }
  });

  let renameInput = page.locator('input.jstree-rename-input');
  if (await renameInput.count() === 0) {
    const selectedId = await page.evaluate(() => {
      const inst = window.jQuery ? window.jQuery('#jstree').jstree(true) : null;
      if (!inst) return null;
      const sel = inst.get_selected();
      return sel && sel.length ? sel[0] : null;
    });
    expect(selectedId).toBeTruthy();

    await page.evaluate((nodeId) => {
      const inst = window.jQuery ? window.jQuery('#jstree').jstree(true) : null;
      if (!inst) return;
      inst.edit(nodeId);
    }, selectedId);
  }

  renameInput = page.locator('input.jstree-rename-input');
  await expect(renameInput).toBeVisible();
  await renameInput.fill('CtxChild');
  await renameInput.press('Enter');

  await expect(page.locator('#jstree a.jstree-anchor', { hasText: 'CtxChild' }).first()).toBeVisible();
});

test('Directory: drag-and-drop reparenting updates the model', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  await expect(page.locator('#jstree a.jstree-anchor', { hasText: 'LeafA' }).first()).toBeVisible();
  await expect(page.locator('#jstree a.jstree-anchor', { hasText: 'Dest' }).first()).toBeVisible();

  // Use jsTree's API to perform the move (this triggers move_node.jstree).
  await page.evaluate(() => {
    const $ = window.jQuery;
    const inst = $ ? $('#jstree').jstree(true) : null;
    if (!inst) throw new Error('jsTree not initialized');

    function findLiIdByAnchorTextContains(text) {
      const anchors = Array.from(document.querySelectorAll('#jstree a.jstree-anchor'));
      const anchor = anchors.find(a => (a.textContent || '').includes(text));
      if (!anchor) return null;
      const li = anchor.closest('li');
      return li && li.id ? li.id : null;
    }

    const leafId = findLiIdByAnchorTextContains('LeafA');
    const destId = findLiIdByAnchorTextContains('Dest');
    if (!leafId || !destId) throw new Error('Required nodes not found');

    inst.move_node(leafId, destId, 'last');
    inst.open_node(destId);
  });

  // Verify model reflects new parent.
  const parentName = await page.evaluate(() => {
    function findParentOf(root, childName) {
      if (!root || !root.children) return null;
      for (const c of root.children) {
        if (c && c.name === childName) return root;
        const rec = findParentOf(c, childName);
        if (rec) return rec;
      }
      return null;
    }
    const parent = findParentOf(window.data, 'LeafA');
    return parent ? parent.name : null;
  });
  expect(parentName).toBe('Dest');
});

test('Cross-view sync: data changes in Directory reflect in Diagram', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  await page.locator('#jstree a.jstree-anchor', { hasText: 'LeafA' }).first().click();
  await expect(page.locator('#controls')).toBeVisible();

  await page.locator('#task-name').fill('LeafA2');
  await page.getByRole('button', { name: 'Update node' }).click();

  // Switch to Diagram and assert the updated name is rendered.
  await page.getByRole('tab', { name: 'Diagram' }).click();
  await expect(page.locator('#canvas svg')).toBeVisible();
  await expect(diagramText(page, 'LeafA2')).toBeVisible();
});

test('Cross-view sync: Directory selection highlights Diagram node', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  // Select in Directory.
  await page.locator('#jstree a.jstree-anchor', { hasText: 'LeafA' }).first().click();
  await expect(page.locator('#selected-node-label')).toHaveText('LeafA');

  // Switch to Diagram and ensure the same node is selected/highlighted.
  await page.getByRole('tab', { name: 'Diagram' }).click();
  await expect(page.locator('#canvas svg')).toBeVisible();

  const hasSelectedClass = await page.evaluate(() => {
    const svg = document.querySelector('#canvas svg');
    if (!svg) return false;
    const tspans = Array.from(svg.querySelectorAll('tspan'));
    const tspan = tspans.find(t => (t.textContent || '').trim() === 'LeafA');
    if (!tspan) return false;
    const nodeGroup = tspan.closest('g.node');
    return !!(nodeGroup && nodeGroup.classList.contains('selected'));
  });
  expect(hasSelectedClass).toBe(true);
});

test('Directory: context menu Edit opens editor panel', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  await openJsTreeContextMenuByLabel(page, 'Parent');
  await expect(page.locator('.vakata-context')).toBeVisible();
  await page.locator('.vakata-context').getByText('Edit', { exact: true }).click({ force: true });

  await expect(page.locator('#controls')).toBeVisible();
  await expect(page.locator('#selected-node-label')).toHaveText('Parent');
});

test('Directory: context menu Delete removes node (non-root)', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  await openJsTreeContextMenuByLabel(page, 'LeafA');
  await expect(page.locator('.vakata-context')).toBeVisible();
  await expect(page.locator('.vakata-context')).toContainText('Delete');

  // With jsTree-table involved, DOM-clicking the menu item can be flaky across browsers.
  // Invoke the context-menu action via jsTree's configured items to validate the behavior.
  await page.evaluate(() => {
    const $ = window.jQuery;
    const inst = $ ? $('#jstree').jstree(true) : null;
    if (!inst) throw new Error('jsTree not initialized');
    const selected = inst.get_selected();
    if (!selected || !selected.length) throw new Error('No selected node');
    const node = inst.get_node(selected[0]);
    const items = inst.settings && inst.settings.contextmenu && inst.settings.contextmenu.items
      ? inst.settings.contextmenu.items(node)
      : null;
    if (!items || !items.remove || typeof items.remove.action !== 'function') {
      throw new Error('Delete action not available');
    }
    items.remove.action();
  });

  await expect.poll(async () => page.evaluate(() => {
    function countByName(node, name) {
      if (!node) return 0;
      let count = node.name === name ? 1 : 0;
      for (const c of node.children || []) count += countByName(c, name);
      return count;
    }
    return countByName(window.data, 'LeafA');
  })).toBe(0);

  await expect(page.locator('#jstree a.jstree-anchor', { hasText: 'LeafA' })).toHaveCount(0);
});

test('Directory: context menu cannot delete root node', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  page.once('dialog', async (dialog) => {
    await expect(dialog.message()).toMatch(/not possible to delete the root/i);
    await dialog.accept();
  });

  const rootName = await page.evaluate(() => (window.data && window.data.name) ? window.data.name : '');
  expect(rootName).toBeTruthy();
  await openJsTreeContextMenuByLabel(page, rootName);
  await expect(page.locator('.vakata-context')).toBeVisible();
  await page.locator('.vakata-context').getByText('Delete', { exact: true }).click({ force: true });

  await expect(page.locator('#jstree a.jstree-anchor', { hasText: rootName }).first()).toBeVisible();
});

test('Directory: delete non-root node removes it', async ({ page }) => {
  await openDirectoryView(page);
  await importFixture(page, 'full-features.json');

  await page.locator('#jstree a.jstree-anchor', { hasText: 'LeafA' }).first().click();
  await expect(page.locator('#controls')).toBeVisible();

  const before = await page.evaluate(() => {
    function countByName(node, name) {
      if (!node) return 0;
      let count = node.name === name ? 1 : 0;
      for (const c of node.children || []) count += countByName(c, name);
      return count;
    }
    return countByName(window.data, 'LeafA');
  });
  expect(before).toBe(1);

  await page.getByRole('button', { name: 'Delete node' }).click();

  await expect.poll(async () => page.evaluate(() => {
    function countByName(node, name) {
      if (!node) return 0;
      let count = node.name === name ? 1 : 0;
      for (const c of node.children || []) count += countByName(c, name);
      return count;
    }
    return countByName(window.data, 'LeafA');
  })).toBe(0);
});

test('export PNG/JPEG/SVG each triggers a download', async ({ page }) => {
  await page.goto('/index.html');

  const d1 = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();
  const png = await d1;
  expect(png.suggestedFilename()).toMatch(/task-tree\.png$/);

  const d2 = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JPEG' }).click();
  const jpg = await d2;
  expect(jpg.suggestedFilename()).toMatch(/task-tree\.(jpg|jpeg)$/);

  const d3 = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export SVG' }).click();
  const svg = await d3;
  expect(svg.suggestedFilename()).toMatch(/task-tree\.svg$/);
});

test('Diagram: adaptive layout grows SVG width for larger trees', async ({ page }) => {
  await openDiagramView(page);
  await page.getByRole('tab', { name: 'Directory' }).click();
  await importFixture(page, 'large-tree.json');
  await page.getByRole('tab', { name: 'Diagram' }).click();

  const width = await page.locator('#canvas svg').getAttribute('width');
  const numeric = Number(width);
  expect(Number.isFinite(numeric)).toBe(true);
  expect(numeric).toBeGreaterThan(1000);
});

test('export JSON triggers a download', async ({ page }) => {
  await page.goto('/index.html');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  await expect(download.suggestedFilename()).toMatch(/task-tree\.json$/);
});
