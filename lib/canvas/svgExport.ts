import type { Layer, Stroke } from "@/types/whiteboard";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function strokeToPolyline(stroke: Stroke): string {
  if (stroke.points.length === 0) return "";
  const pts = stroke.points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    `<polyline` +
    ` points="${pts}"` +
    ` stroke="${escapeXml(stroke.color)}"` +
    ` stroke-width="${stroke.width}"` +
    ` stroke-linecap="round"` +
    ` stroke-linejoin="round"` +
    ` opacity="${stroke.opacity}"` +
    ` fill="none"/>`
  );
}

// Pure function — returns a complete SVG string.
// Only strokes on visible layers are included.
// Does not trigger a download; use downloadSvg for that.
export function exportStrokesToSvg(
  strokes: Stroke[],
  layers: Layer[],
  width: number,
  height: number
): string {
  const visibleIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));

  // Render layers bottom-to-top (ascending order).
  const sortedLayers = [...layers]
    .filter((l) => visibleIds.has(l.id))
    .sort((a, b) => a.order - b.order);

  const groups = sortedLayers.map((layer) => {
    const polylines = strokes
      .filter((s) => s.layerId === layer.id)
      .map(strokeToPolyline)
      .filter(Boolean)
      .join("\n    ");

    return (
      `  <g id="layer-${escapeXml(layer.id)}" data-name="${escapeXml(layer.name)}">\n` +
      (polylines ? `    ${polylines}\n` : "") +
      `  </g>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg"` +
    ` width="${width}" height="${height}"` +
    ` viewBox="0 0 ${width} ${height}">\n` +
    groups.join("\n") +
    `\n</svg>`
  );
}

// Triggers a browser download of an SVG string.
// Kept separate so exportStrokesToSvg stays pure and testable.
export function downloadSvg(svgString: string, filename = "whiteboard.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
