import type { Json } from "@liveblocks/client";

export type ToolType = 'pen' | 'eraser' | 'select';

export interface Point {
  x: number;
  y: number;
  [key: string]: Json | undefined;
}

export interface Stroke {
  id: string;
  userId: string;
  layerId: string;
  color: string;
  width: number;
  opacity: number;
  points: Point[];
  createdAt: number;
  [key: string]: Json | undefined;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
  [key: string]: Json | undefined;
}
