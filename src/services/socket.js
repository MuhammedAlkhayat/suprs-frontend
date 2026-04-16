import { io } from 'socket.io-client';

const ENABLE_SOCKETS = (process.env.REACT_APP_ENABLE_SOCKETS || '').trim().toLowerCase() !== 'false';

console.log('[socket] ENABLE_SOCKETS:', ENABLE_SOCKETS);

const noopSocket = {
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  disconnect: () => {},
  connect: () => noopSocket,
  connected: false,
};

let socket = noopSocket;

if (ENABLE_SOCKETS) {
  try {
    const socketHost = (process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_BASE || '').trim()
      || (typeof window !== 'undefined' ? window.location.origin : undefined);

    if (!socketHost) {
      console.warn('[socket] No socket host URL found, falling back to noop socket');
      socket = noopSocket;
    } else {
      socket = io(socketHost, {
        path: process.env.REACT_APP_SOCKET_PATH || '/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      socket.on('connect_error', (err) => {
        console.warn('[socket] connect_error', err && err.message ? err.message : err);
      });

      socket.on('connect', () => {
        console.log('[socket] connected to', socketHost);
      });

      socket.on('disconnect', (reason) => {
        console.log('[socket] disconnected:', reason);
      });
    }
  } catch (err) {
    console.warn('[socket] init failed, falling back to noop socket', err);
    socket = noopSocket;
  }
} else {
  console.log('[socket] sockets are disabled by environment variable');
}

export default socket;
export { noopSocket };