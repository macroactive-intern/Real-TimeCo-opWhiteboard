"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import CursorOverlay from "./CursorOverlay";
import type { ToolType } from "@/types/whiteboard";

interface CanvasProps {
  layerId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

const CURSOR: Record<ToolType, string> = {
  pen: "crosshair",
  eraser: "cell",
  select: "default",
};

export default function Canvas({
  layerId,
  tool,
  color,
  strokeWidth,
  opacity,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    redraw,
  } = useCanvas(canvasRef, { layerId, tool, color, strokeWidth, opacity });

  // Sync canvas pixel dimensions to the container on first paint.
  // Without this the canvas starts at 0×0 and clears itself before
  // the ResizeObserver fires.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Keep canvas pixel dimensions in sync whenever the container is resized.
  // Changing width/height attributes clears the canvas, so we redraw immediately.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);
      redraw();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [redraw]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/*
        The <canvas> element handles all pointer events.
        Mouse coordinates are stored in refs inside useCanvas —
        never in React state — so drawing never triggers a re-render.
      */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: CURSOR[tool] }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* SVG overlay renders other users' cursors; pointer-events: none in CursorOverlay */}
      <CursorOverlay />
    </div>
  );
}
