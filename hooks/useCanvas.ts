"use client";

import { useRef, useCallback, useEffect, RefObject } from "react";
import { useUpdateMyPresence, useMutation, useStorage } from "../liveblocks.config";
import { LiveObject } from "@liveblocks/client";
import { drawStrokes, drawLiveStroke, clearCanvas } from "@/lib/canvas/renderer";
import type { Layer, Point, Stroke, ToolType } from "@/types/whiteboard";
import { nanoid } from "@liveblocks/client";

interface UseCanvasOptions {
  layerId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export function useCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseCanvasOptions
) {
  const { layerId, tool, color, strokeWidth, opacity } = options;

  // Live drawing state stays in refs — never written to Liveblocks during mousemove.
  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);

  const updatePresence = useUpdateMyPresence();

  // useStorage returns a readonly snapshot. Casts are safe — shapes are identical.
  const strokes = useStorage(
    (root) => [...root.strokes] as unknown as Stroke[]
  );
  const layers = useStorage(
    (root) => [...root.layers] as unknown as Layer[]
  );

  const commitStroke = useMutation(({ storage }, stroke: Stroke) => {
    storage.get("strokes").push(new LiveObject(stroke));
  }, []);

  // Exposed so Canvas.tsx can call it after a resize clears the pixel buffer.
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    clearCanvas(ctx, canvas.width, canvas.height);
    if (strokes && layers) drawStrokes(ctx, strokes, layers);
  }, [canvasRef, strokes, layers]);

  // Redraw whenever Liveblocks storage changes.
  useEffect(() => { redraw(); }, [redraw]);

  const getPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [canvasRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getPoint(e);
      updatePresence({ cursor: point });

      if (!isDrawing.current || tool !== "pen") return;

      currentPoints.current.push(point);

      // Re-render committed strokes + in-progress stroke each frame.
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      clearCanvas(ctx, canvas.width, canvas.height);
      if (strokes && layers) drawStrokes(ctx, strokes, layers);
      drawLiveStroke(ctx, currentPoints.current, color, strokeWidth, opacity);
    },
    [getPoint, updatePresence, tool, canvasRef, strokes, layers, color, strokeWidth, opacity]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool !== "pen") return;
      isDrawing.current = true;
      currentPoints.current = [getPoint(e)];
    },
    [tool, getPoint]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const points = currentPoints.current;
      if (points.length < 2) {
        currentPoints.current = [];
        return;
      }

      // Only here do we write to Liveblocks.
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

      currentPoints.current = [];
    },
    [commitStroke, layerId, color, strokeWidth, opacity]
  );

  const handleMouseLeave = useCallback(() => {
    updatePresence({ cursor: null });
  }, [updatePresence]);

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, redraw };
}
