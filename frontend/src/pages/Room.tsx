import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function Room() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const playerName = location.state?.playerName || `player_${new Date().getSeconds()}`;
  const roomId = useParams().roomId;

  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing settings
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);

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

    return () => {
      socket.off("draw_incremental");
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
    socket.emit("start_game", roomId);
  };

  const clearCanvas = () => {
    if (!isDrawer || !context) return;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    socket.emit("clear_canvas", roomId);
  };

  return (
    <div className="w-screen h-screen flex flex-col gap-2 p-4 ">
      <div className="flex w-full justify-between">
        <div className="flex gap-1 items-center">
          <p className="font-bold">Room ID:</p>
          <p>{roomId}</p>
          <Copy
            size={20}
            className="cursor-pointer text-neutral-600 hover:text-neutral-500"
            onClick={() => navigator.clipboard.writeText(roomId ?? "")}
          />
        </div>

        <div className="flex gap-1">
          <Button onClick={handleStartGame}>Start Game</Button>
          <Button onClick={() => navigate("/")} variant="destructive">
            Quit
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 lg:flex-row flex-col">
        <div className="flex flex-col gap-3 w-full lg:flex-[3]">
          <div className="flex flex-col gap-2 p-2">
            <div className="flex gap-2 items-center">
              <label>Stroke Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                disabled={!isDrawer}
              />
              <label>Stroke Width</label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                disabled={!isDrawer}
              />
              {isDrawer && (
                <Button variant={"outline"} onClick={clearCanvas}>
                  Clear Canvas
                </Button>
              )}
            </div>
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              style={{ cursor: isDrawer ? "crosshair" : "default" }}
            />
          </div>
          <div className="comment">
            <input
              className="border rounded-md w-full px-3 py-2"
              placeholder="Enter your guess..."
            />
          </div>
        </div>

        <div className="players flex w-full lg:flex-1 flex-col col-span-1 border rounded-md h-[500px] p-2">
          <p className="font-bold">Players</p>
          <ol className="flex flex-col gap-0 mt-2 list-decimal list-inside">
            {players.map((player) => (
              <li key={player.id}>
                {player.name}
                {player.id === socket.id && " (You)"}
                {player.drawer && " (Drawing)"}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Room;
