import RoomWrapper from "@/components/RoomWrapper";
import Whiteboard from "@/components/whiteboard/Whiteboard";

export default function Home() {
  return (
    <RoomWrapper roomId="whiteboard-room-1">
      <Whiteboard />
    </RoomWrapper>
  );
}
