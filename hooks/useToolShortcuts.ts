"use client";

import { useEffect } from "react";
import type { ToolType } from "@/types/whiteboard";

const KEY_TO_TOOL: Record<string, ToolType> = {
  p: "pen",
  e: "eraser",
  v: "select",
};

export function useToolShortcuts(onToolChange: (tool: ToolType) => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when a modifier is held — avoids clashing with Ctrl+P (print), etc.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const tool = KEY_TO_TOOL[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        onToolChange(tool);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToolChange]);
}
