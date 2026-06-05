import type { Layer, Stroke } from "@/types/whiteboard";
import type { Point } from "@/types/whiteboard";
import { getBoundingBox } from "./geometry";

const SELECTION_PADDING = 8;
const SELECTION_HANDLE_RADIUS = 4;
const SELECTION_DASH: number[] = [6, 3];
const SELECTION_COLOR = "#3b82f6";

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const { points, color, width, opacity } = stroke;
  if (points.length === 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();

  if (points.length === 1) {
    // Single point: draw a dot.
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  // Quadratic Bézier through midpoints for smooth curves.
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  layers: Layer[]
): void {
  const visibleIds = new Set(
    layers.filter((l) => l.visible).map((l) => l.id)
  );
  // Draw in layer order so higher-order layers appear on top.
  const byLayer = new Map<string, Stroke[]>();
  for (const stroke of strokes) {
    if (!visibleIds.has(stroke.layerId)) continue;
    const bucket = byLayer.get(stroke.layerId);
    if (bucket) bucket.push(stroke);
    else byLayer.set(stroke.layerId, [stroke]);
  }
  const sorted = [...layers].sort((a, b) => a.order - b.order);
  for (const layer of sorted) {
    if (!visibleIds.has(layer.id)) continue;
    const bucket = byLayer.get(layer.id);
    if (!bucket) continue;
    for (const stroke of bucket) drawStroke(ctx, stroke);
  }
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  const box = getBoundingBox(stroke.points);
  if (box.width === 0 && box.height === 0 && stroke.points.length <= 1) return;

  const x = box.x - SELECTION_PADDING;
  const y = box.y - SELECTION_PADDING;
  const w = box.width + SELECTION_PADDING * 2;
  const h = box.height + SELECTION_PADDING * 2;

  ctx.save();

  // Dashed bounding rectangle.
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(SELECTION_DASH);
  ctx.strokeRect(x, y, w, h);

  // Solid corner handles.
  ctx.setLineDash([]);
  ctx.lineWidth = 1.5;
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, SELECTION_HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = SELECTION_COLOR;
    ctx.stroke();
  }

  ctx.restore();
}

// Draws an in-progress stroke from a live ref buffer.
export function drawLiveStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
  opacity: number
): void {
  if (points.length === 0) return;
  drawStroke(ctx, {
    id: "",
    userId: "",
    layerId: "",
    color,
    width,
    opacity,
    points,
    createdAt: 0,
  });
}
