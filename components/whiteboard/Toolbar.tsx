"use client";

import { useCallback } from "react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { ToolType } from "@/types/whiteboard";

const PRESET_COLORS = [
  "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
];

interface ToolbarProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onExportSvg: () => void;
}

export default function Toolbar({
  tool,
  color,
  strokeWidth,
  opacity,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onExportSvg,
}: ToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const handleToolChange = useCallback(
    (t: ToolType) => onToolChange(t),
    [onToolChange]
  );

  const handleColorChange = useCallback(
    (c: string) => onColorChange(c),
    [onColorChange]
  );

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm select-none">

      {/* Tools */}
      <ToolGroup>
        {(["pen", "eraser", "select"] as ToolType[]).map((t) => (
          <ToolButton key={t} active={tool === t} onClick={() => handleToolChange(t)}>
            {TOOL_LABEL[t]}
          </ToolButton>
        ))}
      </ToolGroup>

      <Divider />

      {/* Preset color swatches */}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => handleColorChange(c)}
            className="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: c,
              boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
              transform: color === c ? "scale(1.15)" : undefined,
            }}
          />
        ))}
        {/* Custom color picker */}
        <label
          className="w-5 h-5 rounded-full overflow-hidden cursor-pointer relative hover:scale-110 transition-transform"
          title="Custom color"
          style={{
            background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
            boxShadow: !PRESET_COLORS.includes(color)
              ? `0 0 0 2px white, 0 0 0 3.5px ${color}`
              : undefined,
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      <Divider />

      {/* Stroke width */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-400 w-8 shrink-0">Size</span>
        <input
          type="range"
          min={1}
          max={40}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-20 accent-zinc-900"
        />
        <span className="text-xs text-zinc-500 w-4 text-right">{strokeWidth}</span>
      </div>

      <Divider />

      {/* Opacity */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-400 w-8 shrink-0">Opacity</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-20 accent-zinc-900"
        />
        <span className="text-xs text-zinc-500 w-6 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      <Divider />

      {/* Undo / Redo */}
      <ToolGroup>
        <ToolButton onClick={undo} disabled={!canUndo}>Undo</ToolButton>
        <ToolButton onClick={redo} disabled={!canRedo}>Redo</ToolButton>
      </ToolGroup>

      <Divider />

      {/* Export */}
      <button
        onClick={onExportSvg}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        Export SVG
      </button>
    </div>
  );
}

// ---- small layout helpers ----

const TOOL_LABEL: Record<ToolType, string> = {
  pen: "Pen",
  eraser: "Eraser",
  select: "Select",
};

function Divider() {
  return <div className="w-px h-6 bg-zinc-200 mx-0.5 shrink-0" />;
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
        ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
