// Export utilities for the task tree diagram
// Expects a global `data` (Task root) and an <svg> as the first SVG in document.

function exportDiagramJSON() {
    if (typeof data === "undefined") {
        console.error("Global 'data' not found");
        return;
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "task-tree.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportDirectoryMarkdown() {
    const root = (typeof window !== 'undefined' && window.data) ? window.data : (typeof data !== 'undefined' ? data : null);
    if (!root) {
        console.error("Global 'data' not found");
        return;
    }

    try {
        if (typeof computePercentFromStatus === 'function') {
            computePercentFromStatus(root);
        }
    } catch (err) {
        console.error(err);
    }

    function escapeMarkdown(text) {
        return String(text || '')
            .replace(/\\/g, '\\\\')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/`/g, '\\`');
    }

    function normalizeHttpUrl(input) {
        if (input === undefined || input === null) return null;
        let raw = String(input).trim();
        if (!raw) return null;

        // If no scheme, assume https.
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
            raw = 'https://' + raw;
        }
        try {
            const u = new URL(raw);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
            return u.href;
        } catch {
            return null;
        }
    }

    function formatLine(node, depth) {
        const indent = '  '.repeat(depth);
        const pct = (node && typeof node.percent === 'number') ? Math.round(node.percent) : 0;
        const name = escapeMarkdown(node && node.name ? node.name : '');

        const url = normalizeHttpUrl(node && node.url ? node.url : '');
        const label = url ? `[${name}](${url})` : name;

        let line = `${indent}- ${label} (${pct}%)`;

        const desc = (node && node.descricao) ? String(node.descricao) : '';
        if (desc.trim()) {
            const oneLine = desc.replace(/\s+/g, ' ').trim();
            line += ` — ${escapeMarkdown(oneLine)}`;
        }

        return line;
    }

    const lines = [];
    (function walk(node, depth) {
        if (!node) return;
        lines.push(formatLine(node, depth));
        const children = node.children || [];
        for (const child of children) {
            walk(child, depth + 1);
        }
    })(root, 0);

    const md = lines.join('\n') + '\n';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-tree.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Build a styled SVG string, embedding page <style> rules into the SVG
function buildStyledSVGString() {
    const svg = document.querySelector("svg");
    if (!svg) return null;

    const clone = svg.cloneNode(true);

    // Collect CSS from all <style> tags in the document
    const styleText = Array.from(document.querySelectorAll("style"))
        .map(node => node.textContent || "")
        .join("\n");

    if (styleText.trim()) {
        const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleEl.setAttribute("type", "text/css");
        styleEl.textContent = styleText;
        clone.insertBefore(styleEl, clone.firstChild);
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        source = source.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return source;
}

function exportDiagramSVG() {
    const source = buildStyledSVGString();
    if (!source) return;

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "task-tree.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportDiagramRaster(type) {
    const svg = document.querySelector("svg");
    if (!svg) return;

    const source = buildStyledSVGString();
    if (!source) return;
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement("canvas");
        const width = svg.clientWidth || parseInt(svg.getAttribute("width"), 10) || 1200;
        const height = svg.clientHeight || parseInt(svg.getAttribute("height"), 10) || 800;
        const scale = 3; // fator de escala para mais definição
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);

        const mime = type === "jpeg" ? "image/jpeg" : "image/png";
        const dataUrl = canvas.toDataURL(mime, 0.92);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = type === "jpeg" ? "task-tree.jpg" : "task-tree.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    img.onerror = function () {
        console.error("Failed to load SVG into image for raster export");
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

function exportDiagramPNG() {
    exportDiagramRaster("png");
}

function exportDiagramJPEG() {
    exportDiagramRaster("jpeg");
}
