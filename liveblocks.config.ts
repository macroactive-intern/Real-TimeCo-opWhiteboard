import { createClient, LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { Layer, Stroke, ToolType } from "@/types/whiteboard";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

type Presence = {
  cursor: { x: number; y: number } | null;
  selectedStrokeId: string | null;
  tool: ToolType;
  color: string;
};

type Storage = {
  strokes: LiveList<LiveObject<Stroke>>;
  layers: LiveList<LiveObject<Layer>>;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
  };
};

type RoomEvent = never;

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useStorage,
  useMutation,
  useOthers,
  useOthersMapped,
  useSelf,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
