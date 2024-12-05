import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { Brush, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import Comments from "@/components/room/Comments";
import WordsModal from "@/components/room/WordsModal";
import confetti from "canvas-confetti";
import WinnerModal from "@/components/room/WinnerModal";
import { RainbowButton } from "@/components/ui/rainbow-button";

interface Player {
  id: string;
  name: string;
  drawer?: boolean;
}

interface DrawingData {
  x: number;
  y: number;
  color: string;
  lineWidth: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CommentsInterface {
  // id: string;
  name: string;
  comment: string;
}

function Room() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [comment, setComment] = useState("");
  const [userComments, setUserComments] = useState<CommentsInterface[]>([]);
  const playerName = location.state?.playerName || `player_${new Date().getSeconds()}`;
  const roomId = useParams().roomId;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerName, setWinnerName] = useState("");

  // Drawing settings
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

  // Previous drawing position
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Setup canvas context
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set initial canvas styles
        ctx.lineCap = "round";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        setContext(ctx);

        // Resize canvas to fill container
        canvas.width = canvas.offsetWidth;
        canvas.height = 500;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update context styles when they change
    if (context) {
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
    }
  }, [strokeColor, strokeWidth, context]);

  useEffect(() => {
    // Socket connection and event listeners
    socket.emit("join_room", { roomId, playerName });

    const updatePlayersHandler = (updatedPlayers: Player[]) => {
      const uniquePlayers = Array.from(
        new Map(updatedPlayers.map((player) => [player.id, player])).values()
      );
      setPlayers(uniquePlayers);
    };

    const startGameHandler = (drawerPlayer: Player) => {
      setIsDrawer(drawerPlayer.id === socket.id);
    };

    const clearCanvasHandler = () => {
      if (context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      }
    };

    socket.on("update_players", updatePlayersHandler);
    socket.on("start_game", startGameHandler);

    socket.on("clear_canvas", clearCanvasHandler);

    return () => {
      socket.off("update_players", updatePlayersHandler);
      socket.off("start_game", startGameHandler);
      socket.off("clear_canvas", clearCanvasHandler);
    };
  }, [roomId, playerName, isDrawer, context]);

  useEffect(() => {
    socket.on("draw_incremental", (data: DrawingData) => {
      if (context) {
        context.strokeStyle = data.color;
        context.lineWidth = data.lineWidth;
        context.beginPath();
        context.moveTo(data.startX, data.startY);
        context.lineTo(data.endX, data.endY);
        context.stroke();
      }
    });

    socket.on("comment", (player: Player, comment: string) => {
      console.log("comment", player, comment);
      setUserComments((prevComments) => [...prevComments, { name: player.name, comment }]);
    });

    socket.on("round_over", (winner: Player) => {
      setWinnerName(winner.name);
      // setCurrentWord("");
      setShowWinnerModal(true);
      handleShowConfetti();
    });

    return () => {
      socket.off("draw_incremental");
      socket.off("comment");
      socket.off("round_over");
    };
  }, [context]);

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    setLastPosition({ x, y });
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas || !context || !lastPosition) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw on local canvas
    context.beginPath();
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.stroke();

    // Emit drawing event to send incremental changes
    socket.emit("draw_incremental", {
      roomId,
      drawingData: {
        startX: lastPosition.x,
        startY: lastPosition.y,
        endX: x,
        endY: y,
        color: strokeColor,
        lineWidth: strokeWidth,
      },
    });

    // Update last position
    setLastPosition({ x, y });
  };

  const stopDrawing = () => {
    if (!isDrawer) return;

    setIsDrawing(false);
    setLastPosition(null);
  };

  const handleStartGame = () => {
    setShowWordsModal(true);
  };

  const clearCanvas = () => {
    if (!isDrawer || !context) return;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    socket.emit("clear_canvas", roomId);
  };

  const handlePressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!comment || comment.trim().length === 0) return;
    if (currentWord === comment.trim()) {
      console.log("matched");
      socket.emit("round_over", roomId, socket.id);
      setShowWinnerModal(true);
      handleShowConfetti();
    }
    setComment("");
    socket.emit("comment", roomId, socket.id, e.currentTarget.value);
    e.currentTarget.value = "";
  };

  const handleShowConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  return (
    <div className="room-bg w-screen h-screen flex flex-col gap-2 p-4 ">
      <div className="flex w-full justify-between px-3">
        <div className="flex gap-1 items-center bg-white shadow-custom p-2 rounded-md">
          <p className="font-bold">Room ID:</p>
          <p>{roomId}</p>
          <Copy
            size={20}
            className="cursor-pointer text-neutral-600 hover:text-neutral-500"
            onClick={() => navigator.clipboard.writeText(roomId ?? "")}
          />
        </div>

        <div className="flex gap-1">
          <RainbowButton className="h-10 rounded-md" onClick={handleStartGame}>Start Game</RainbowButton>
          <Button className="shadow-custom bg-red-600 hover:bg-red-500" onClick={() => navigate("/")} >
            Quit
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 lg:flex-row flex-col">
        <div className="flex flex-col gap-3 w-full lg:flex-[3]">
          <div className="flex flex-col gap-2 p-2">
            {/* word display */}
            {currentWord && (
              <div className="flex w-fit px-8 self-center justify-center gap-2 bg-lime-300 shadow-custom rounded-md p-2">
                <p className="font-bold mt-[3px]">Word ({currentWord.length}):</p>
                {currentWord.split("").map((_, index) => (
                  <span key={index} className="font-bold">
                    _
                  </span>
                ))}
              </div>
            )}

            {/* middle container */}
            <div className="w-full grid grid-cols-1 md:grid-cols-6 lg:flex-row flex-col items-start gap-2">
              <div className="players bg-white shadow-custom  flex col-span-1 flex-col border rounded-md min-h-[500px]">
                <p className="font-bold bg-black text-white p-2 rounded-t-md text-center py-4">
                  Players
                </p>
                <ol className="flex flex-col gap-0 mt-2 list-decimal list-inside p-2">
                  {players.map((player) => (
                    <li key={player.id}>
                      {player.name}
                      {player.id === socket.id && " (You)"}
                      {player.drawer && " (Drawing)"}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-white shadow-custom flex p-5 rounded-lg col-span-1 md:col-span-3 lg:col-span-4 flex-col h-[500px]">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 rounded-lg shadow-sm h-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  style={{ cursor: isDrawer ? "crosshair" : "default" }}
                />
              </div>
              <div className="flex flex-col md:col-span-2 lg:col-span-1 col-span-1 gap-2">
                <div className="shadow-custom  relative flex bg-white flex-col border rounded-md min-h-[500px]">
                  <Comments commentsData={userComments} />
                  <div className="comment absolute bottom-2 left-0 right-0 mx-2">
                    <input
                      className="border rounded-md w-full px-3 py-2"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Enter your guess..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handlePressEnter(e);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-fit rounded-lg self-center flex flex-col gap-2 items-center bg-white shadow-custom p-4">
              <div className="flex space-x-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full ${
                      strokeColor === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setStrokeColor(c)}
                  />
                ))}
                <Eraser
                  onClick={() => setStrokeColor("white")}
                  className="cursor-pointer h-9 w-9 bg-white border border-gray-500 shadow-lg rounded-full p-1"
                  color="black"
                />
              </div>
              <div className="flex items-center w-full gap-2 justify-between mt-2">
                <div className="flex items-end gap-1 ">
                  <Brush />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    disabled={!isDrawer}
                  />
                </div>
                {isDrawer && (
                  <Button variant={"outline"} onClick={clearCanvas} className="text-black">
                    Erase all
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <WordsModal
        open={showWordsModal}
        setOpen={setShowWordsModal}
        setCurrentWord={setCurrentWord}
        roomId={roomId}
      />
      <WinnerModal
        open={showWinnerModal}
        setOpen={setShowWinnerModal}
        currentWord={currentWord}
        winner={winnerName}
      />
    </div>
  );
}

export default Room;
