// Vercel Functions entry point (Socket.IO over WebSockets, Fluid compute required).
//
// This file makes the server available at /api/socket-io, so the client must be
// configured with:
//   VITE_SERVER_URL=https://<your-server-project>.vercel.app
//   VITE_SOCKET_PATH=/api/socket-io/socket.io
//   VITE_SOCKET_TRANSPORTS=websocket
//
// Note: Vercel Functions have a maximum duration, so long sessions will be
// disconnected and in-memory rooms are not shared between instances. A
// long-running host (Render/Railway/Fly) is a better fit for this app.
import { httpServer } from '../src/app.js';

export default httpServer;
