"use client";

import { useOthersMapped } from "../../liveblocks.config";

export default function CursorOverlay() {
  const others = useOthersMapped((other) => ({
    cursor: other.presence.cursor,
    color: other.presence.color,
    name: other.info?.name ?? "Anonymous",
  }));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {others.map(([connectionId, { cursor, color, name }]) => {
        if (!cursor) return null;
        return (
          <g key={connectionId} transform={`translate(${cursor.x}, ${cursor.y})`}>
            {/* Simple arrow cursor shape */}
            <path
              d="M 0 0 L 0 14 L 4 10 L 7 16 L 9 15 L 6 9 L 11 9 Z"
              fill={color}
              stroke="white"
              strokeWidth={1}
            />
            <rect
              x={12}
              y={10}
              width={name.length * 7 + 8}
              height={18}
              rx={3}
              fill={color}
            />
            <text
              x={16}
              y={23}
              fill="white"
              fontSize={11}
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
