"use client";

import { useRef, useEffect } from "react";
import { useStorage } from "../../liveblocks.config";
import { clearCanvas, drawStrokes } from "@/lib/canvas/renderer";
import type { Layer, Stroke } from "@/types/whiteboard";

const MINIMAP_W = 200;
const MINIMAP_H = 120;

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
}

export default function Minimap({ canvasWidth, canvasHeight }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useStorage((root) => [...root.strokes] as unknown as Stroke[]);
  const layers = useStorage((root) => [...root.layers] as unknown as Layer[]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !strokes || !layers || canvasWidth <= 0 || canvasHeight <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas(ctx, MINIMAP_W, MINIMAP_H);
    ctx.save();
    // Scale the coordinate system so world coordinates map to minimap pixels.
    ctx.scale(MINIMAP_W / canvasWidth, MINIMAP_H / canvasHeight);
    drawStrokes(ctx, strokes, layers);
    ctx.restore();
  }, [strokes, layers, canvasWidth, canvasHeight]);

  if (canvasWidth <= 0 || canvasHeight <= 0) return null;

  return (
    <div
      className="absolute bottom-4 right-4 rounded-lg overflow-hidden shadow-md
        border border-zinc-200 bg-white opacity-80 hover:opacity-100
        transition-opacity pointer-events-none"
    >
      <div className="px-2 py-0.5 bg-zinc-50 border-b border-zinc-200">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
          Overview
        </span>
      </div>
      <canvas ref={canvasRef} width={MINIMAP_W} height={MINIMAP_H} className="block" />
    </div>
  );
}
