import type { Stroke } from "@/types/whiteboard";
import type { Point } from "@/types/whiteboard";

export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const { points, color, width, opacity } = stroke;
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    // Smooth curve through midpoints for natural feel.
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }
}

// Draws an in-progress stroke from a live point buffer (no quadratic smoothing
// on the final segment so the cursor tracks the pointer precisely).
export function drawLiveStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
  opacity: number
): void {
  if (points.length < 2) return;
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
