"use client";

import { ReactNode } from "react";
import { RoomProvider } from "../liveblocks.config";
import { LiveList, LiveObject } from "@liveblocks/client";
import type { Layer } from "@/types/whiteboard";

interface RoomWrapperProps {
  roomId: string;
  children: ReactNode;
}

const defaultLayer: Layer = {
  id: "default",
  name: "Layer 1",
  visible: true,
  locked: false,
  order: 0,
};

export default function RoomWrapper({ roomId, children }: RoomWrapperProps) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selectedStrokeId: null,
        tool: "pen",
        color: "#000000",
      }}
      initialStorage={{
        strokes: new LiveList([]),
        layers: new LiveList([new LiveObject(defaultLayer)]),
      }}
    >
      {children}
    </RoomProvider>
  );
}
