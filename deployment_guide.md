# Deployment Guide

This project has two parts that deploy separately:

| Part | Folder | What it needs |
| --- | --- | --- |
| Frontend (Vite + React) | `client/` | Any static host (Vercel) |
| Backend (Express + Socket.IO) | `server/` | A host that keeps a Node process alive (Render, Railway, Fly, VPS) |

> **Why the app says "Not connected to server" on the live site**
> The frontend was built without `VITE_SERVER_URL`, so it fell back to
> `http://localhost:3001`. On a visitor's browser, `localhost` is *their own
> machine*, not your server, so the Socket.IO handshake always fails.
> Vite bakes env vars into the bundle **at build time**, so you must set the
> variable and then **redeploy** the frontend.

---

## 1. Backend deployment (recommended: Render)

Socket.IO needs a long-lived process. Serverless platforms such as Vercel
Functions can accept WebSocket upgrades now, but each connection is capped by
the function's max duration and in-memory rooms are not shared between
instances — a 25-minute Pomodoro session will not survive that. Use Render.

### Steps
1. Sign in to [Render](https://render.com/) and click **New + → Web Service**.
2. Connect the repository.
3. Configure:
   * **Root Directory**: `server`
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Deploy and copy the service URL, e.g. `https://pomodoro-server.onrender.com`.
5. Open that URL in a browser. It should return
   `Promate Socket.IO Server is running`. If it doesn't, fix the backend before
   touching the frontend.

Render sets `PORT` automatically; `server/src/index.js` already reads
`process.env.PORT`.

---

## 2. Frontend deployment (Vercel)

1. Import the repo into Vercel.
2. **Root Directory**: `client`
3. **Framework Preset**: `Vite`
4. **Environment Variables** (Project → Settings → Environment Variables):

   | Key | Value |
   | --- | --- |
   | `VITE_SERVER_URL` | `https://pomodoro-server.onrender.com` |

   Use `https://` — a `http://` URL will be blocked as mixed content on the
   HTTPS Vercel site. Do not add a trailing slash.
5. **Redeploy** the project. Env changes only apply to new builds:
   * Deployments → the latest one → **⋯ → Redeploy**, or push a commit.
6. Open the site, check the browser console. You should see
   `[socket] connected to https://…` and the app should stop showing
   "Not connected to server".
7. Open DevTools → Network → WS to confirm a `socket.io` WebSocket connection
   with status `101 Switching Protocols`.

`client/.env.example` documents the available variables. Copy it to
`client/.env.local` for local development.

---

## 3. Optional: backend on Vercel Functions

`server/api/socket-io.js` exposes the same server as a Vercel Function
(`https://<server-project>.vercel.app/api/socket-io`). This only works with
**Fluid compute enabled** (default for projects created after April 23, 2025)
and is **not recommended for this app** because:

* connections are closed when the function hits its max duration;
* room state lives in memory, so reconnects/new participants may land on a
  different instance and see "Room not found";
* you'd need Redis to share rooms between instances.

If you still want it:

1. Create a second Vercel project with **Root Directory**: `server`.
2. Deploy it, then set these on the **frontend** project and redeploy:

   | Key | Value |
   | --- | --- |
   | `VITE_SERVER_URL` | `https://<server-project>.vercel.app` |
   | `VITE_SOCKET_PATH` | `/api/socket-io/socket.io` |
   | `VITE_SOCKET_TRANSPORTS` | `websocket` |

3. Verify `https://<server-project>.vercel.app/api/socket-io` returns
   `Promate Socket.IO Server is running`.

---

## Troubleshooting

### "Not connected to server"
The socket never connected. Check, in order:
1. **Wrong URL baked into the bundle** — the single most common cause. Open the
   deployed JS in DevTools and search for `localhost:3001`. If it's there,
   `VITE_SERVER_URL` was missing at build time. Set it and redeploy.
2. **Backend asleep or crashed** — open the backend URL directly. Render free
   instances sleep; the first request can take ~30–60s.
3. **Mixed content** — the backend URL must be `https://`.
4. **CORS** — the server currently allows all origins (`origin: '*'` in
   `server/src/app.js`). If you restrict it, include your Vercel domain.

### "Room not found" after a refresh
Rooms are in memory. A redeploy, a server restart, or (on Vercel Functions) a
different instance will drop them. Recreate the session.

### Build failures
Ensure **Root Directory** is `client` on the Vercel frontend project and
`server` on the backend project.
