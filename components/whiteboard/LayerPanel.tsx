"use client";

import { useStorage, useMutation } from "../../liveblocks.config";
// useStorage snapshots are plain objects; mutations receive mutable LiveList/LiveObject.
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "@liveblocks/client";
import type { Layer } from "@/types/whiteboard";

interface LayerPanelProps {
  activeLayerId: string;
  onLayerSelect: (id: string) => void;
}

export default function LayerPanel({ activeLayerId, onLayerSelect }: LayerPanelProps) {
  const layers = useStorage((root) => [...root.layers]);

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

  const toggleVisible = useMutation(({ storage }, id: string) => {
    storage.get("layers").forEach((item) => {
      if (item.get("id") === id) item.set("visible", !item.get("visible"));
    });
  }, []);

  const toggleLocked = useMutation(({ storage }, id: string) => {
    storage.get("layers").forEach((item) => {
      if (item.get("id") === id) item.set("locked", !item.get("locked"));
    });
  }, []);

  const sorted = layers ? [...layers].sort((a, b) => b.order - a.order) : [];

  return (
    <div className="flex flex-col w-48 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Layers</span>
        <button
          onClick={addLayer}
          className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
        >
          + Add
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-50">
        {sorted.map((layer) => (
          <li
            key={layer.id}
            onClick={() => onLayerSelect(layer.id)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-50 text-sm ${
              activeLayerId === layer.id ? "bg-zinc-100 font-medium" : "text-zinc-700"
            }`}
          >
            <span className="flex-1 truncate">{layer.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisible(layer.id); }}
              className="text-zinc-400 hover:text-zinc-700 text-xs"
              title={layer.visible ? "Hide" : "Show"}
            >
              {layer.visible ? "●" : "○"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLocked(layer.id); }}
              className="text-zinc-400 hover:text-zinc-700 text-xs"
              title={layer.locked ? "Unlock" : "Lock"}
            >
              {layer.locked ? "🔒" : "🔓"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
