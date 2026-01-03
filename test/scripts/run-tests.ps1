$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$testDir = Join-Path $repoRoot 'test'

Set-Location $testDir

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm is required (install Node.js)'
}

npm install
npm run install:browsers
npm test
