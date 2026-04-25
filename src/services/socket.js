// src/services/socket.js
import { io } from 'socket.io-client';
import { SOCKET_HOST, SOCKET_PATH } from './api';

const ENABLE_SOCKETS =
  String(process.env.REACT_APP_ENABLE_SOCKETS || '')
    .trim()
    .toLowerCase() !== 'false';

const noop = () => {};

const socketProxy = {
  on: () => socketProxy,
  off: () => socketProxy,
  emit: () => socketProxy,
  disconnect: noop,
  connect: noop,
  connected: false,
  id: null,
};

let socketInstance = socketProxy;

function trimTrailingSlashes(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function resolveSocketHost() {
  const host = trimTrailingSlashes(SOCKET_HOST);

  // If SOCKET_HOST is empty, use same-origin connection (io(options))
  return host || null;
}

function getCandidatePaths() {
  const paths = [];

  if (process.env.REACT_APP_SOCKET_PATH) {
    const override = String(process.env.REACT_APP_SOCKET_PATH).trim();
    if (override) paths.push(override);
  }

  if (SOCKET_PATH) paths.push(String(SOCKET_PATH).trim());
  paths.push('/api/socket.io');
  paths.push('/socket.io');

  return [...new Set(paths.map((p) => String(p || '').trim()).filter(Boolean))];
}

async function tryConnect(host, path, token, timeoutMs = 3000) {
  return new Promise((resolve) => {
    let settled = false;
    let socket;
    let timeoutId;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      resolve(result);
    };

    try {
      const options = {
        path,
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
        autoConnect: true,
        reconnection: false,
      };

      socket = host ? io(host, options) : io(options);
    } catch (err) {
      return finish({ success: false, socket: null, error: err });
    }

    const onConnect = () => {
      socket.off('connect_error', onError);
      finish({ success: true, socket });
    };

    const onError = (err) => {
      socket.off('connect', onConnect);
      finish({ success: false, socket, error: err });
    };

    timeoutId = setTimeout(() => {
      try {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        socket.disconnect();
      } catch (e) {
        // ignore
      }
      finish({ success: false, socket: null, error: new Error('timeout') });
    }, timeoutMs);

    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
}

function attachSocketToInstance(socket) {
  socketInstance = {
    on: socket.on.bind(socket),
    off: socket.off.bind(socket),
    emit: socket.emit.bind(socket),
    disconnect: socket.disconnect.bind(socket),
    connect: socket.connect.bind(socket),
    connected: true,
    id: socket.id,
  };

  socket.on('disconnect', () => {
    socketInstance.connected = false;
    socketInstance.id = null;
  });

  socket.on('connect', () => {
    socketInstance.connected = true;
    socketInstance.id = socket.id;
  });

  return socketInstance;
}

export async function initSocket(token = null) {
  if (!ENABLE_SOCKETS) return socketProxy;

  const host = resolveSocketHost();
  if (socketInstance !== socketProxy && socketInstance.connected) {
    return socketInstance;
  }

  const paths = getCandidatePaths();
  console.info('[socket] init host=', host || '(same-origin)', 'trying paths=', paths);

  for (const path of paths) {
    // eslint-disable-next-line no-await-in-loop
    const { success, socket, error } = await tryConnect(host, path, token, 2500);

    if (success && socket) {
      console.info('[socket] connected using path=', path, socket.id);
      return attachSocketToInstance(socket);
    }

    console.warn(
      '[socket] failed path=',
      path,
      'error=',
      error?.message || error || 'unknown'
    );

    try {
      if (socket) socket.disconnect();
    } catch (e) {
      // ignore
    }
  }

  console.error('[socket] all connection attempts failed');
  socketInstance = socketProxy;
  return socketProxy;
}

export function cleanupSocket() {
  try {
    if (socketInstance && typeof socketInstance.disconnect === 'function') {
      socketInstance.disconnect();
    }
  } catch (e) {
    // ignore
  }
  socketInstance = socketProxy;
}

export const getSocket = () => socketInstance;
export default socketInstance;