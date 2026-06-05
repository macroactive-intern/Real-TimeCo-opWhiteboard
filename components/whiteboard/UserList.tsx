"use client";

import { useOthers, useSelf } from "../../liveblocks.config";
import type { ToolType } from "@/types/whiteboard";

const TOOL_LABEL: Record<ToolType, string> = {
  pen: "P",
  eraser: "E",
  select: "S",
};

const TOOL_TITLE: Record<ToolType, string> = {
  pen: "pen",
  eraser: "eraser",
  select: "select",
};

interface AvatarProps {
  name: string;
  color: string;
  tool?: ToolType;
  isSelf?: boolean;
}

function Avatar({ name, color, tool, isSelf }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const toolLabel = tool ? TOOL_LABEL[tool] : null;
  const tooltipText = [
    isSelf ? `${name} (you)` : name,
    tool ? `tool: ${TOOL_TITLE[tool]}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative" title={tooltipText}>
      {/* Avatar circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
          ring-2 ring-white select-none"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>

      {/* "You" badge */}
      {isSelf && (
        <span
          className="absolute -top-1.5 -right-1 bg-zinc-800 text-white text-[9px] font-semibold
            leading-none px-0.5 py-0.5 rounded"
        >
          you
        </span>
      )}

      {/* Tool badge (shown for others only) */}
      {!isSelf && toolLabel && (
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center
            text-[9px] font-bold bg-white ring-1 ring-zinc-200"
          style={{ color }}
        >
          {toolLabel}
        </div>
      )}
    </div>
  );
}

export default function UserList() {
  const self = useSelf();
  const others = useOthers();
  const totalOnline = (self ? 1 : 0) + others.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        {/* Current user first */}
        {self && (
          <Avatar
            name={self.info?.name ?? "You"}
            color={self.presence.color}
            tool={self.presence.tool}
            isSelf
          />
        )}

        {/* Other connected users */}
        {others.map((other) => (
          <Avatar
            key={other.connectionId}
            name={other.info?.name ?? `User ${other.connectionId}`}
            color={other.presence.color}
            tool={other.presence.tool}
          />
        ))}
      </div>

      {/* Online count */}
      <span className="text-xs text-zinc-400 whitespace-nowrap">
        {totalOnline} {totalOnline === 1 ? "user" : "users"} online
      </span>
    </div>
  );
}
