$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Serving repo at http://localhost:8000 ..."
Write-Host "Open: http://localhost:8000/project-conclusion-visualization.html"
python -m http.server 8000
