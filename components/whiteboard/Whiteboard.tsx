"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStorage, useUpdateMyPresence } from "../../liveblocks.config";
import { exportStrokesToSvg, downloadSvg } from "@/lib/canvas/svgExport";
import { useToolShortcuts } from "@/hooks/useToolShortcuts";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import LayerPanel from "./LayerPanel";
import UserList from "./UserList";
import type { Layer, Stroke, ToolType } from "@/types/whiteboard";

export default function Whiteboard() {
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [activeLayerId, setActiveLayerId] = useState("default");

  // Used to read pixel dimensions at export time without needing a prop tunnel.
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const updatePresence = useUpdateMyPresence();

  const strokes = useStorage((root) => [...root.strokes] as unknown as Stroke[]);
  const layers = useStorage((root) => [...root.layers] as unknown as Layer[]);

  // Presence is synced here so both click (Toolbar) and keyboard share one path.
  const handleToolChange = useCallback((t: ToolType) => {
    setTool(t);
    updatePresence({ tool: t });
  }, [updatePresence]);

  const handleColorChange = useCallback((c: string) => {
    setColor(c);
    updatePresence({ color: c });
  }, [updatePresence]);

  // P / E / V tool shortcuts — same guard logic as other keyboard handlers.
  useToolShortcuts(handleToolChange);

  // ── Locked-layer toast ────────────────────────────────────────────────────
  const [showLockedWarning, setShowLockedWarning] = useState(false);
  const lockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLockedLayer = useCallback(() => {
    setShowLockedWarning(true);
    if (lockedTimerRef.current) clearTimeout(lockedTimerRef.current);
    lockedTimerRef.current = setTimeout(() => setShowLockedWarning(false), 2000);
  }, []);

  useEffect(() => () => { if (lockedTimerRef.current) clearTimeout(lockedTimerRef.current); }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleExportSvg = useCallback(() => {
    if (!strokes || !layers) return;
    const el = canvasAreaRef.current;
    const width = el ? el.clientWidth : 1280;
    const height = el ? el.clientHeight : 720;
    const svg = exportStrokesToSvg(strokes, layers, width, height);
    downloadSvg(svg, "whiteboard-export.svg");
  }, [strokes, layers]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 overflow-hidden">
      {/* Top bar: toolbar on the left, user list on the right */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border-b border-zinc-200 shrink-0">
        <Toolbar
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          onToolChange={handleToolChange}
          onColorChange={handleColorChange}
          onStrokeWidthChange={setStrokeWidth}
          onOpacityChange={setOpacity}
          onExportSvg={handleExportSvg}
        />
        <UserList />
      </div>

      {/* Main area: canvas fills the space, layer panel on the right */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div ref={canvasAreaRef} className="flex-1 relative">
          <Canvas
            layerId={activeLayerId}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            onLockedLayer={handleLockedLayer}
          />

          {/* Locked-layer toast — absolutely positioned over the canvas */}
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg
              bg-amber-50 border border-amber-300 text-amber-800 text-sm font-medium
              shadow-sm pointer-events-none select-none
              transition-opacity duration-200
              ${showLockedWarning ? "opacity-100" : "opacity-0"}`}
            aria-live="polite"
            aria-atomic="true"
          >
            This layer is locked.
          </div>
        </div>

        <div className="shrink-0 p-3 border-l border-zinc-200 bg-white overflow-y-auto">
          <LayerPanel
            activeLayerId={activeLayerId}
            onLayerSelect={setActiveLayerId}
          />
        </div>
      </div>
    </div>
  );
}
