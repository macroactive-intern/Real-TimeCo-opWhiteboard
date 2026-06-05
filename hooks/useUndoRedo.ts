"use client";

import { useHistory, useCanUndo, useCanRedo } from "@liveblocks/react";

export function useUndoRedo() {
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return {
    undo: history.undo,
    redo: history.redo,
    canUndo,
    canRedo,
    pause: history.pause,
    resume: history.resume,
  };
}
