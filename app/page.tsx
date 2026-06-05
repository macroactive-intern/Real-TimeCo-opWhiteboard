import RoomWrapper from "@/components/RoomWrapper";

export default function Home() {
  return (
    <RoomWrapper roomId="whiteboard-room-1">
      <main className="flex h-screen w-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500 text-sm">Whiteboard canvas coming soon.</p>
      </main>
    </RoomWrapper>
  );
}
