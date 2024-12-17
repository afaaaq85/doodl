import { io } from 'socket.io-client';
const serverUrl = import.meta.env.VITE_SERVER_URL

const socket = io(serverUrl, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;