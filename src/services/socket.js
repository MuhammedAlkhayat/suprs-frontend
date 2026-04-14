// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || '').trim() || (process.env.REACT_APP_API_BASE || '').trim() || undefined;
const socket = io(SOCKET_URL, { autoConnect: true });

export default socket;