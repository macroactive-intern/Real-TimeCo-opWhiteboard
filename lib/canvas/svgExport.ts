import type { Layer, Stroke } from "@/types/whiteboard";

function strokeToPath(stroke: Stroke): string {
  const { points } = stroke;
  if (points.length < 2) return "";

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    parts.push(`Q ${points[i].x} ${points[i].y} ${mx} ${my}`);
  }
  const last = points[points.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(" ");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function strokesToSvg(
  strokes: Stroke[],
  layers: Layer[],
  width: number,
  height: number
): string {
  const layerMap = new Map(layers.map((l) => [l.id, l]));
  const visibleLayers = new Set(
    layers.filter((l) => l.visible).map((l) => l.id)
  );

  // Sort layers by order, render each as an SVG <g>.
  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);
  const groups = sortedLayers
    .filter((l) => visibleLayers.has(l.id))
    .map((layer) => {
      const layerStrokes = strokes.filter((s) => s.layerId === layer.id);
      const paths = layerStrokes
        .map((stroke) => {
          const d = strokeToPath(stroke);
          if (!d) return "";
          return (
            `<path` +
            ` d="${escapeXml(d)}"` +
            ` stroke="${escapeXml(stroke.color)}"` +
            ` stroke-width="${stroke.width}"` +
            ` stroke-linecap="round"` +
            ` stroke-linejoin="round"` +
            ` opacity="${stroke.opacity}"` +
            ` fill="none"/>`
          );
        })
        .filter(Boolean)
        .join("\n    ");

      return `  <g id="layer-${escapeXml(layer.id)}" data-name="${escapeXml(layer.name)}">\n    ${paths}\n  </g>`;
    })
    .join("\n");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg"` +
    ` width="${width}" height="${height}"` +
    ` viewBox="0 0 ${width} ${height}">\n` +
    groups +
    `\n</svg>`
  );
}

export function downloadSvg(svgString: string, filename = "whiteboard.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
