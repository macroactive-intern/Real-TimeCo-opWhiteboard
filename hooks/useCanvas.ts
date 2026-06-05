"use client";

import { useRef, useCallback, useEffect, useLayoutEffect, RefObject } from "react";
import { useHistory } from "@liveblocks/react";
import { useUpdateMyPresence, useMutation, useStorage } from "../liveblocks.config";
import { LiveObject } from "@liveblocks/client";
import {
  clearCanvas,
  drawStrokes,
  drawLiveStroke,
  drawSelectionBox,
} from "@/lib/canvas/renderer";
import {
  findStrokeAtPoint,
  getPathBoundingBox,
  getStrokeBoundingBox,
  doesBoundingBoxIntersect,
} from "@/lib/canvas/geometry";
import type { Layer, Point, Stroke, ToolType } from "@/types/whiteboard";
import { nanoid } from "@liveblocks/client";

export interface UseCanvasOptions {
  layerId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  onLockedLayer?: () => void;
}

export function useCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseCanvasOptions
) {
  const { layerId, tool, color, strokeWidth, opacity, onLockedLayer } = options;

  // ── All live pointer data lives in refs, never in state ─────────────────
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastPointerRef = useRef<Point | null>(null);
  const selectedStrokeRef = useRef<Stroke | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const eraserPointsRef = useRef<Point[]>([]);

  const history = useHistory();
  const updatePresence = useUpdateMyPresence();

  // Readonly snapshots — shapes are identical to our types so casts are safe.
  const strokes = useStorage((root) => [...root.strokes] as unknown as Stroke[]);
  const layers = useStorage((root) => [...root.layers] as unknown as Layer[]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const commitStroke = useMutation(({ storage }, stroke: Stroke) => {
    storage.get("strokes").push(new LiveObject(stroke));
  }, []);

  const eraseStrokes = useMutation(({ storage }, ids: string[]) => {
    const list = storage.get("strokes");
    // Iterate backwards so deletions don't shift subsequent indices.
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list.get(i);
      if (item && ids.includes(item.get("id") as string)) list.delete(i);
    }
  }, []);

  const commitMove = useMutation(
    ({ storage }, id: string, dx: number, dy: number) => {
      storage.get("strokes").forEach((item) => {
        if ((item.get("id") as string) !== id) return;
        const pts = item.get("points") as unknown as Point[];
        item.set("points", pts.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })));
      });
    },
    []
  );

  const deleteStroke = useMutation(({ storage }, id: string) => {
    const list = storage.get("strokes");
    for (let i = 0; i < list.length; i++) {
      const item = list.get(i);
      if (item && (item.get("id") as string) === id) { list.delete(i); break; }
    }
  }, []);

  // ── Redraw ───────────────────────────────────────────────────────────────
  // Exposed so Canvas.tsx can trigger it after a resize empties the pixel buffer.

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !strokes || !layers) return;
    clearCanvas(ctx, canvas.width, canvas.height);
    drawStrokes(ctx, strokes, layers);
    // Overlay the selection box for the current selection (if any).
    const sel = selectedStrokeRef.current;
    if (sel) {
      const live = strokes.find((s) => s.id === sel.id);
      if (live) drawSelectionBox(ctx, live);
    }
  }, [canvasRef, strokes, layers]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Keyboard: Delete / Backspace removes selected stroke ─────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const sel = selectedStrokeRef.current;
      if (!sel) return;
      const layer = layers?.find((l) => l.id === sel.layerId);
      if (layer?.locked) return;
      deleteStroke(sel.id);
      selectedStrokeRef.current = null;
      updatePresence({ selectedStrokeId: null });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteStroke, updatePresence, layers]);

  // ── Utilities ────────────────────────────────────────────────────────────

  const getPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [canvasRef]
  );

  const isActiveLocked = useCallback(
    () => layers?.find((l) => l.id === layerId)?.locked ?? false,
    [layers, layerId]
  );

  // ── Pointer down ─────────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Capture so pointermove/up fire even if the pointer leaves the element.
      e.currentTarget.setPointerCapture(e.pointerId);
      const point = getPoint(e);
      lastPointerRef.current = point;

      if (tool === "pen") {
        if (isActiveLocked()) { onLockedLayer?.(); return; }
        isDrawingRef.current = true;
        currentPointsRef.current = [point];

      } else if (tool === "eraser") {
        isDrawingRef.current = true;
        eraserPointsRef.current = [point];

      } else if (tool === "select") {
        if (!strokes || !layers) return;
        const found = findStrokeAtPoint(point, strokes, layers);
        selectedStrokeRef.current = found;
        updatePresence({ selectedStrokeId: found?.id ?? null });
        dragStartRef.current = found ? point : null;
        redraw();
      }
    },
    [tool, getPoint, isActiveLocked, strokes, layers, updatePresence, redraw, onLockedLayer]
  );

  // ── Pointer move ─────────────────────────────────────────────────────────

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getPoint(e);
      updatePresence({ cursor: point });
      lastPointerRef.current = point;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (tool === "pen") {
        if (!isDrawingRef.current || !ctx || !canvas) return;
        currentPointsRef.current.push(point);
        // Local preview — zero Liveblocks writes here.
        clearCanvas(ctx, canvas.width, canvas.height);
        if (strokes && layers) drawStrokes(ctx, strokes, layers);
        drawLiveStroke(ctx, currentPointsRef.current, color, strokeWidth, opacity);

      } else if (tool === "eraser") {
        if (!isDrawingRef.current || !ctx || !canvas) return;
        eraserPointsRef.current.push(point);
        // Redraw all strokes plus a small eraser circle as visual feedback.
        clearCanvas(ctx, canvas.width, canvas.height);
        if (strokes && layers) drawStrokes(ctx, strokes, layers);
        ctx.save();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(strokeWidth / 2, 6), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

      } else if (tool === "select") {
        const sel = selectedStrokeRef.current;
        if (!sel || !dragStartRef.current || !ctx || !canvas) return;
        if (!strokes || !layers) return;
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        // Preview: draw everything except the selected stroke, then draw it moved.
        clearCanvas(ctx, canvas.width, canvas.height);
        drawStrokes(ctx, strokes.filter((s) => s.id !== sel.id), layers);
        const movedPoints = sel.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
        drawLiveStroke(ctx, movedPoints, sel.color, sel.width, sel.opacity);
        drawSelectionBox(ctx, { ...sel, points: movedPoints });
      }
    },
    [tool, getPoint, updatePresence, canvasRef, strokes, layers, color, strokeWidth, opacity]
  );

  // ── Pointer up ───────────────────────────────────────────────────────────

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getPoint(e);

      if (tool === "pen") {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const points = [...currentPointsRef.current];
        currentPointsRef.current = [];
        if (points.length < 2) return;
        // Single write to Liveblocks for the entire stroke.
        commitStroke({
          id: nanoid(),
          userId: "",
          layerId,
          color,
          width: strokeWidth,
          opacity,
          points,
          createdAt: Date.now(),
        });

      } else if (tool === "eraser") {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const eraserPoints = [...eraserPointsRef.current];
        eraserPointsRef.current = [];
        if (!strokes || !layers || eraserPoints.length === 0) return;
        const eraserBox = getPathBoundingBox(eraserPoints);
        const ids = strokes
          .filter((s) => {
            const layer = layers.find((l) => l.id === s.layerId);
            // Only erase strokes on visible, non-locked layers.
            if (!layer?.visible || layer.locked) return false;
            return doesBoundingBoxIntersect(eraserBox, getStrokeBoundingBox(s));
          })
          .map((s) => s.id);
        // Wrap in pause/resume so all deletes form one undo entry.
        if (ids.length > 0) {
          history.pause();
          eraseStrokes(ids);
          history.resume();
        }

      } else if (tool === "select") {
        const sel = selectedStrokeRef.current;
        if (!sel || !dragStartRef.current) return;
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        dragStartRef.current = null;
        // Only write if there was meaningful movement and the layer isn't locked.
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        const layer = layers?.find((l) => l.id === sel.layerId);
        if (layer?.locked) return;
        // Wrap in pause/resume so the move is one undo entry.
        history.pause();
        commitMove(sel.id, dx, dy);
        history.resume();
        // Update the ref so subsequent redraws show the selection box correctly.
        selectedStrokeRef.current = {
          ...sel,
          points: sel.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
        };
      }
    },
    [
      tool, getPoint, commitStroke, layerId, color, strokeWidth, opacity,
      strokes, layers, eraseStrokes, commitMove, history,
    ]
  );

  // ── Pointer leave ────────────────────────────────────────────────────────

  const handlePointerLeave = useCallback(() => {
    updatePresence({ cursor: null });
  }, [updatePresence]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    redraw,
  };
}
