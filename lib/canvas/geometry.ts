import type { Layer, Point, Stroke } from "@/types/whiteboard";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function distanceBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Tight axis-aligned bounding box around a point array.
export function getBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Named alias used when working with raw point arrays (e.g. eraser paths).
export function getPathBoundingBox(points: Point[]): BoundingBox {
  return getBoundingBox(points);
}

// Bounding box of a stroke, expanded by half the stroke width on every side
// so that hit-testing against the visual paint area is accurate.
export function getStrokeBoundingBox(stroke: Stroke): BoundingBox {
  const box = getBoundingBox(stroke.points);
  const r = stroke.width / 2;
  return { x: box.x - r, y: box.y - r, width: box.width + r * 2, height: box.height + r * 2 };
}

// True if `point` falls inside `box` expanded outward by `margin` on all sides.
export function isPointNearBoundingBox(
  point: Point,
  box: BoundingBox,
  margin: number
): boolean {
  return (
    point.x >= box.x - margin &&
    point.x <= box.x + box.width + margin &&
    point.y >= box.y - margin &&
    point.y <= box.y + box.height + margin
  );
}

// Standard AABB intersection test.
export function doesBoundingBoxIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

// Shortest distance from point p to line segment [a, b].
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceBetween(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return distanceBetween(p, { x: a.x + t * dx, y: a.y + t * dy });
}

export function isPointNearStroke(point: Point, stroke: Stroke, threshold: number): boolean {
  const pts = stroke.points;
  if (pts.length === 0) return false;
  if (pts.length === 1) return distanceBetween(point, pts[0]) <= threshold;
  for (let i = 0; i < pts.length - 1; i++) {
    if (pointToSegmentDistance(point, pts[i], pts[i + 1]) <= threshold) return true;
  }
  return false;
}

// Returns the topmost visible stroke within `margin` pixels of `point`.
// "Topmost" = highest layer.order; ties broken by newest createdAt.
// Strokes on hidden layers are never returned.
// Strokes on locked layers ARE returned — callers must check layer.locked
// before allowing movement.
export function findStrokeAtPoint(
  point: Point,
  strokes: Stroke[],
  layers: Layer[],
  margin = 8
): Stroke | null {
  const layerMap = new Map(layers.map((l) => [l.id, l]));

  const candidates = strokes.filter((stroke) => {
    const layer = layerMap.get(stroke.layerId);
    if (!layer?.visible) return false;
    // Cheap bbox cull before exact path test.
    if (!isPointNearBoundingBox(point, getStrokeBoundingBox(stroke), margin)) return false;
    return isPointNearStroke(point, stroke, margin + stroke.width / 2);
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aOrder = layerMap.get(a.layerId)?.order ?? -1;
    const bOrder = layerMap.get(b.layerId)?.order ?? -1;
    if (bOrder !== aOrder) return bOrder - aOrder;
    return b.createdAt - a.createdAt;
  });

  return candidates[0];
}

// Returns a new stroke with every point translated by (dx, dy).
// Does not mutate the original.
export function moveStrokePoints(stroke: Stroke, dx: number, dy: number): Stroke {
  return {
    ...stroke,
    points: stroke.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
  };
}
