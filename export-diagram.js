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
