import { io } from 'socket.io-client';

const socket = io('http://doodl-backend.vercel.app', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;