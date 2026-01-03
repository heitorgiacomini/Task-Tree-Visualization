// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests'),
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:8000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    launchOptions: (() => {
      const slowMo = Number(process.env.PW_SLOW_MO || 0);
      return slowMo > 0 ? { slowMo } : undefined;
    })()
  },
  webServer: {
    command: 'python -m http.server 8000',
    url: 'http://localhost:8000/project-conclusion-visualization.html',
    reuseExistingServer: true,
    cwd: path.join(__dirname, '..')
  },
  reporter: [['list']]
});
