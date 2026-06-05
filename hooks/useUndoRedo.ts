"use client";

import { useEffect } from "react";
import { useHistory, useCanUndo, useCanRedo } from "@liveblocks/react";

export function useUndoRedo() {
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Ctrl+Z → undo  |  Ctrl+Y / Ctrl+Shift+Z → redo
  // metaKey covers ⌘ on macOS.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        history.redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history]);

  return {
    undo: history.undo,
    redo: history.redo,
    canUndo,
    canRedo,
    pause: history.pause,
    resume: history.resume,
  };
}
