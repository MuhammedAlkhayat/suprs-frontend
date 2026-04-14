// src/services/socket.js
import { io } from 'socket.io-client';

const ENABLE_SOCKETS = (process.env.REACT_APP_ENABLE_SOCKETS || '').trim().toLowerCase() !== 'false';

// derive sensible base for sockets:
// 1) explicit REACT_APP_SOCKET_URL
// 2) REACT_APP_API_BASE
// 3) window.location.origin (client-side fallback)
const socketHost = (process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_BASE || '').trim()
  || (typeof window !== 'undefined' ? window.location.origin : undefined);

const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || '/socket.io';

// noop socket to avoid checks throughout app when sockets are disabled/unavailable
const noopSocket = {
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  disconnect: () => {},
  connect: () => noopSocket,
  connected: false,
};

let socket = noopSocket;

if (ENABLE_SOCKETS && socketHost) {
  try {
    // io() will pick wss vs ws automatically based on socketHost protocol (https => wss)
    socket = io(socketHost, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // optional: small guard to avoid exceptions when socket fails early
    socket.on('connect_error', (err) => {
      // log but keep socket object — handlers can still call .on/.off safely
      // you can remove this console.debug in production
      console.warn('[socket] connect_error', err && err.message ? err.message : err);
    });
  } catch (err) {
    console.warn('[socket] init failed, falling back to noop socket', err);
    socket = noopSocket;
  }
} else {
  // sockets are disabled by env or no host resolved
  socket = noopSocket;
}

export default socket;
export { noopSocket };