"use client";

import { useState, useRef, useCallback } from "react";
import { useStorage } from "../../liveblocks.config";
import { exportStrokesToSvg, downloadSvg } from "@/lib/canvas/svgExport";
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

  const strokes = useStorage((root) => [...root.strokes] as unknown as Stroke[]);
  const layers = useStorage((root) => [...root.layers] as unknown as Layer[]);

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
          onToolChange={setTool}
          onColorChange={setColor}
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
          />
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
