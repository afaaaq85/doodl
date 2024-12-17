import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Meteors from "@/components/ui/meteors";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [createRoom, setCreateRoom] = useState(false);
  const [joinRoom, setJoinRoom] = useState(false);
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL

  const handleCreateRoom = async () => {
    if (!playerName) {
      alert("Please enter your name.");
      return;
    }
    try {
      const { data } = await axios.post(`${serverUrl}/api/create-room`, {
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
      alert("Please enter your name.");
      return;
    }
    if (roomId) {
      try {
        const response = await axios.post(`${serverUrl}/api/create-room/room-exists`, { roomId });
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
    <div className="flex flex-col items-center justify-center min-h-screen min-w-screen home-bg">
      <div className="relative overflow-hidden flex flex-col gap-5 items-center justify-center bg-white rounded-2xl shadow-lg p-8 py-14 min-w-[400px]">

        <Meteors number={30} />
        <h1 className="text-4xl font-bold ">Draw, Guess, and Have Fun!</h1>
        <p className="max-w-xl text-center text-neutral-500">
          Join millions of players in the most entertaining online drawing and guessing game. Show
          off your artistic skills or laugh at funny interpretations!
        </p>
        <div className="flex flex-col gap-5 items-center">
          <div className="flex flex-col gap-2 items-center w-full min-w-[200px]">
            <Button
              onClick={() => {
                setCreateRoom(true);
                setJoinRoom(false);
              }}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white rounded"
            >
              Create Room
            </Button>
            <div className={createRoom ? "flex items-center gap-1" : "hidden"}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border p-2 rounded outline-none "
              />
              <ChevronRight
                onClick={handleCreateRoom}
                color="white"
                className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-[8px] h-10 w-auto rounded"
              />
            </div>
            <Button
              onClick={() => {
                setCreateRoom(false);
                setJoinRoom(true);
              }}
              variant="outline"
              className="w-full rounded "
            >
              Join Room
            </Button>
            <div className={joinRoom ? "flex flex-col items-center gap-2" : "hidden"}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border p-2 rounded w-full outline-none"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Enter room id"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="border p-2 rounded outline-none"
                />
                <ChevronRight
                  onClick={handleJoinRoom}
                  color="white"
                  className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-2 h-10 w-10 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
