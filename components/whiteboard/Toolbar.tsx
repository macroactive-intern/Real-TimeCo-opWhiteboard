"use client";

import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { ToolType } from "@/types/whiteboard";

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];

interface ToolbarProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onExportSvg: () => void;
}

export default function Toolbar({
  tool,
  color,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onExportSvg,
}: ToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
      {(["pen", "eraser", "select"] as ToolType[]).map((t) => (
        <button
          key={t}
          onClick={() => onToolChange(t)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
            tool === t
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {t}
        </button>
      ))}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onColorChange(c)}
          className={`w-6 h-6 rounded-full transition-transform ${
            color === c ? "ring-2 ring-offset-1 ring-zinc-400 scale-110" : "hover:scale-110"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      <input
        type="range"
        min={1}
        max={20}
        value={strokeWidth}
        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
        className="w-24 accent-zinc-900"
      />

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className="px-2 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="px-2 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Redo
      </button>

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      <button
        onClick={onExportSvg}
        className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100"
      >
        Export SVG
      </button>
    </div>
  );
}
