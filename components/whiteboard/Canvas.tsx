"use client";

import { useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import type { ToolType } from "@/types/whiteboard";

interface CanvasProps {
  layerId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export default function Canvas({
  layerId,
  tool,
  color,
  strokeWidth,
  opacity,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } =
    useCanvas(canvasRef, { layerId, tool, color, strokeWidth, opacity });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : "default" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
