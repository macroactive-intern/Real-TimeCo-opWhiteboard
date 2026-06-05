"use client";

import { useState, useRef, useEffect } from "react";
import { useStorage, useMutation } from "../../liveblocks.config";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "@liveblocks/client";
import type { Layer } from "@/types/whiteboard";

interface LayerPanelProps {
  activeLayerId: string;
  onLayerSelect: (id: string) => void;
}

export default function LayerPanel({ activeLayerId, onLayerSelect }: LayerPanelProps) {
  // Local state only for the inline rename input.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // useStorage snapshot — readonly plain objects.
  const layers = useStorage((root) => [...root.layers] as unknown as Layer[]);

  // Sorted highest-order first so the "top" layer renders at the top of the list.
  const sorted = layers ? [...layers].sort((a, b) => b.order - a.order) : [];

  // Auto-focus the rename input whenever renaming starts.
  useEffect(() => {
    if (renamingId) inputRef.current?.select();
  }, [renamingId]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addLayer = useMutation(({ storage }) => {
    const list = storage.get("layers");
    const existing = [...list];
    const maxOrder = existing.reduce((m, l) => Math.max(m, l.get("order") as number), -1);
    list.push(
      new LiveObject<Layer>({
        id: nanoid(),
        name: `Layer ${existing.length + 1}`,
        visible: true,
        locked: false,
        order: maxOrder + 1,
      })
    );
  }, []);

  const renameLayer = useMutation(({ storage }, id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    storage.get("layers").forEach((item) => {
      if ((item.get("id") as string) === id) item.set("name", trimmed);
    });
  }, []);

  const toggleVisible = useMutation(({ storage }, id: string) => {
    storage.get("layers").forEach((item) => {
      if ((item.get("id") as string) === id) item.set("visible", !item.get("visible"));
    });
  }, []);

  const toggleLocked = useMutation(({ storage }, id: string) => {
    storage.get("layers").forEach((item) => {
      if ((item.get("id") as string) === id) item.set("locked", !item.get("locked"));
    });
  }, []);

  // Swaps the order values of two layers so they exchange positions in the stack.
  const swapOrder = useMutation(({ storage }, idA: string, idB: string) => {
    const list = storage.get("layers");
    let orderA: number | null = null;
    let orderB: number | null = null;
    list.forEach((item) => {
      if ((item.get("id") as string) === idA) orderA = item.get("order") as number;
      if ((item.get("id") as string) === idB) orderB = item.get("order") as number;
    });
    if (orderA === null || orderB === null) return;
    list.forEach((item) => {
      if ((item.get("id") as string) === idA) item.set("order", orderB as number);
      if ((item.get("id") as string) === idB) item.set("order", orderA as number);
    });
  }, []);

  // ── Rename helpers ─────────────────────────────────────────────────────────

  function startRename(layer: Layer) {
    setRenamingId(layer.id);
    setDraftName(layer.name);
  }

  function commitRename() {
    if (renamingId) renameLayer(renamingId, draftName);
    setRenamingId(null);
  }

  function cancelRename() {
    setRenamingId(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-52 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Layers
        </span>
        <button
          onClick={addLayer}
          className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
          title="Add layer"
        >
          + Add
        </button>
      </div>

      {/* Layer list — top of stack first */}
      <ul className="flex flex-col max-h-72 overflow-y-auto divide-y divide-zinc-50">
        {sorted.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          const isRenaming = renamingId === layer.id;
          const canMoveUp = index > 0;
          const canMoveDown = index < sorted.length - 1;

          return (
            <li
              key={layer.id}
              onClick={() => !isRenaming && onLayerSelect(layer.id)}
              className={`flex items-center gap-1 px-2 py-1.5 text-sm cursor-pointer transition-colors
                ${isActive ? "bg-zinc-100" : "hover:bg-zinc-50"}
                ${!layer.visible ? "opacity-50" : ""}
              `}
            >
              {/* Reorder arrows */}
              <div className="flex flex-col">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canMoveUp) swapOrder(layer.id, sorted[index - 1].id);
                  }}
                  disabled={!canMoveUp}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-0 leading-none text-xs"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canMoveDown) swapOrder(layer.id, sorted[index + 1].id);
                  }}
                  disabled={!canMoveDown}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-0 leading-none text-xs"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Layer name — double-click to rename */}
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    ref={inputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelRename();
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm bg-white border border-blue-400 rounded px-1 outline-none"
                  />
                ) : (
                  <span
                    className={`block truncate text-sm ${isActive ? "font-medium text-zinc-900" : "text-zinc-700"}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(layer);
                    }}
                    title="Double-click to rename"
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Visibility toggle: ● = visible, ○ = hidden */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleVisible(layer.id); }}
                className="text-zinc-400 hover:text-zinc-700 text-xs w-4 text-center transition-colors"
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? "●" : "○"}
              </button>

              {/* Lock toggle: ◼ = locked, ◻ = unlocked */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLocked(layer.id); }}
                className={`text-xs w-4 text-center transition-colors ${
                  layer.locked ? "text-amber-500 hover:text-amber-700" : "text-zinc-300 hover:text-zinc-600"
                }`}
                title={layer.locked ? "Unlock layer" : "Lock layer"}
              >
                {layer.locked ? "◼" : "◻"}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Active layer indicator */}
      {activeLayerId && layers && (
        <div className="px-3 py-1.5 border-t border-zinc-100 bg-zinc-50">
          {(() => {
            const active = layers.find((l) => l.id === activeLayerId);
            return active ? (
              <p className="text-xs text-zinc-400 truncate">
                Drawing on: <span className="text-zinc-600 font-medium">{active.name}</span>
                {active.locked && (
                  <span className="ml-1 text-amber-500 font-medium">· locked</span>
                )}
              </p>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
