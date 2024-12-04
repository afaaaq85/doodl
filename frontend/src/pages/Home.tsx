import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!playerName) {
      setPlayerName("player" + Math.random().toString(36).substring(2, 8));
    }
    try {
      const { data } = await axios.post("http://localhost:5000/api/create-room", {
        playerName,
      });
      console.log("data:", data);
      
      navigate(`/room/${data.roomId}`, { state: { playerName, roomId: data.roomId } });
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName) {
      setPlayerName("player" + Math.random().toString(36).substring(2, 8));
    }
    if (roomId) {
      try {
        const response = await axios.post("http://localhost:5000/api/room-exists", { roomId });
        if (response.data.exists) {
          navigate(`/room/${roomId}`, { state: { playerName } });
        } else {
          alert("Room not found. Please check the room ID.");
        }
      } catch (error) {
        console.error("Error joining room:", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl  font-bold ">Scribble Game</h1>
      <div className="flex flex-col gap-5 items-center">
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <Button onClick={handleCreateRoom} className="bg-blue-500 text-white rounded">
            Create Room
          </Button>
          <Button onClick={handleJoinRoom} className="bg-green-500 text-white rounded ml-2">
            Join Room
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
