"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useOthersMapped } from "../../liveblocks.config";

// SVG path for a pointer arrow. Origin (0,0) is the cursor tip.
const CURSOR_PATH = "M 0 0 L 0 16 L 5 12 L 8 19 L 11 18 L 8 11 L 13 11 Z";

const SPRING = { type: "spring", damping: 30, stiffness: 350 } as const;

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string | undefined;
}

function Cursor({ x, y, color, name }: CursorProps) {
  const label = name
    ? name.length > 18 ? name.slice(0, 16) + "…" : name
    : undefined;
  // Rough px estimate: ~7px per character + 16px padding
  const labelWidth = label ? label.length * 7 + 16 : 0;

  return (
    <motion.g
      initial={{ x, y, opacity: 0, scale: 0.5 }}
      animate={{ x, y, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.12 } }}
      transition={{
        x: SPRING,
        y: SPRING,
        opacity: { duration: 0.12 },
        scale: { duration: 0.12 },
      }}
    >
      {/* Cursor arrow */}
      <path
        d={CURSOR_PATH}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Name tag */}
      {label && (
        <g transform="translate(14, 7)">
          <rect
            x={0}
            y={-9}
            width={labelWidth}
            height={17}
            rx={4}
            fill={color}
            opacity={0.9}
          />
          <text
            x={8}
            y={4}
            fill="white"
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      )}
    </motion.g>
  );
}

export default function CursorOverlay() {
  const others = useOthersMapped((other) => ({
    cursor: other.presence.cursor,
    color: other.presence.color,
    name: other.info?.name,
  }));

  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible"
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <AnimatePresence>
        {others.map(([connectionId, { cursor, color, name }]) =>
          cursor ? (
            <Cursor
              key={connectionId}
              x={cursor.x}
              y={cursor.y}
              color={color}
              name={name}
            />
          ) : null
        )}
      </AnimatePresence>
    </svg>
  );
}
