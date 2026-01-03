// Wiring for export/import buttons (moved into assets/export)
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const btnImport = document.getElementById('btn-import-json');
    const input = document.getElementById('input-import-json');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportJpeg = document.getElementById('btn-export-jpeg');
    const btnExportSvg = document.getElementById('btn-export-svg');

    if (btnImport && input) {
      btnImport.addEventListener('click', () => input.click());
    }

    if (input) {
      input.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
          try {
            const parsed = JSON.parse(e.target.result);
            const newRoot = plainObjectToTask(parsed);
            window.data = newRoot;
            window.selectedNode = null;
            const label = document.getElementById('selected-node-label');
            if (label) label.textContent = 'nenhum';
            if (typeof render === 'function') render();
            // Keep Directory (jsTree) in sync when it's already initialized.
            if (typeof window.refreshJsTree === 'function') {
              window.refreshJsTree();
            }
          } catch (err) {
            alert('Erro ao ler JSON: ' + err.message);
          }
        };
        reader.readAsText(file, 'utf-8');
      });
    }

    if (btnExportJson) btnExportJson.addEventListener('click', () => { if (typeof exportDiagramJSON === 'function') exportDiagramJSON(); });
    if (btnExportMd) btnExportMd.addEventListener('click', () => { if (typeof exportDirectoryMarkdown === 'function') exportDirectoryMarkdown(); });
    if (btnExportPng) btnExportPng.addEventListener('click', () => { if (typeof exportDiagramPNG === 'function') exportDiagramPNG(); });
    if (btnExportJpeg) btnExportJpeg.addEventListener('click', () => { if (typeof exportDiagramJPEG === 'function') exportDiagramJPEG(); });
    if (btnExportSvg) btnExportSvg.addEventListener('click', () => { if (typeof exportDiagramSVG === 'function') exportDiagramSVG(); });
  });
})();
