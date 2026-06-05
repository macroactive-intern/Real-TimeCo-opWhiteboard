"use client";

import { useOthers, useSelf } from "../../liveblocks.config";

const AVATAR_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
];

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function UserList() {
  const self = useSelf();
  const others = useOthers();

  return (
    <div className="flex items-center -space-x-2">
      {self && (
        <Avatar
          name={self.info?.name ?? "You"}
          color={self.presence.color ?? AVATAR_COLORS[0]}
        />
      )}
      {others.map((other, i) => (
        <Avatar
          key={other.connectionId}
          name={other.info?.name ?? `User ${other.connectionId}`}
          color={other.presence.color ?? AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length]}
        />
      ))}
      {others.length > 0 && (
        <span className="pl-4 text-xs text-zinc-500">
          {others.length + 1} online
        </span>
      )}
    </div>
  );
}
