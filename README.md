# Promate

Promate is a production-ready, real-time, ephemeral Pomodoro web application boasting an extreme sci-fi and futuristic aesthetic powered by WebGL/Three.js. It is designed to facilitate high-focus study or work sessions either solo or synchronized with a team.
 
## App Description
At its core, Promate removes the friction of typical productivity apps by requiring absolutely zero onboarding. Users simply land on the app, traverse an immersive 3D tunnel, and can instantly launch an ephemeral focus room. By sharing the room link, friends and colleagues can join the exact same environment, staring at the exact same master timer, while collaborating on a real-time synchronized task list.

## Features
- **Zero Friction Onboarding:** No login, no signup, no persistent data storage. Sessions exist purely in-memory and vanish when everyone leaves.
- **Ephemeral Shared Rooms:** Instantly generate a session link. Anyone joining is immediately synced to the room's overarching state.
- **Master Timer Control:** The room host has authoritative control over the Pomodoro timer (Start, Pause, Reset, Focus/Break modes). The countdown is deterministic based on server time to prevent client-side drift.
- **Immersive 3D Environments:** Users can customize their focus spaces. Built-in options include interactive WebGL particles, CSS 3D landscapes (Blooming Garden, Climbing Cube, Saturn Hula, Lighthouse Ocean), or the ability to upload custom direct GIF/Image URLs.
- **Real-time Task Management:** A built-in, floating Glassmorphism Task Manager allows participants to track goals together. Adding, ticking off, or deleting a task instantly updates the list for everyone in the room.
- **Synchronized Chat:** Communicate with anyone in the ephemeral room using the bottom-left chat panel, which leverages Socket.io for millisecond delivery.
- **Microinteractions & Polish:** Framer Motion-powered page morphs, `@react-three/drei` Sparkle particle emissions on hover states, and layered backdrop blurs make the experience feel highly premium and tactile.



## Project Structure
```text
pomodoro/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Shared 3D & UI components
│   │   │   ├── Backgrounds/    # Implemented 3D scenes (Lighthouse, Garden, etc)
│   │   │   └── ui/             # PageTransition, InteractiveButton
│   │   ├── context/            # Socket.io Context Provider
│   │   └── pages/              # Intro Tunnel, Home Config, Room Session
│   └── package.json            # React-Three-Fiber, Framer-Motion, Tailwind v4
└── server/                     # Express + Socket.IO Backend
    ├── src/
    │   ├── index.js            # Node entrypoint + Socket API
    │   └── RoomManager.js      # In-memory Pomodoro room orchestration
    └── package.json            # Socket.io, Express
```

## Setup Instructions

### 1. Backend (Node + Express)
```bash
cd server
npm install
npm run dev
```

### 2. Frontend (Vite + React)
Open a new terminal relative to the project root:
```bash
cd client
npm install
npm run dev
```
Navigate to `http://localhost:5173`. Make sure the Node server is running on `http://localhost:3001` (default setting in `SocketContext.jsx`).

## Room Synchronization Architecture

Promate uses an **Authoritative Server** model to orchestrate ephemeral rooms without drifting:

1. **Room State & Memory:** `RoomManager.js` handles all state tracking using a Map. Rooms hold a unique ID, participants, and a `.timer` object representing the current session (remaining time, start/end timestamps, and current mode).
2. **Deterministic Master Timer:** To avoid drift from `setInterval` unreliability in browsers, the server relies on `Date.now()`. When a session starts, `endTime` is stored in the server (`startTime + remainingDuration`). 
3. **Mid-Session Joins:** When a user late-joins via `join_room_direct`, they fetch the master state in the handshake. The local client then runs a `setInterval` that simply calculates the difference between `timerState.endTime` (received from the socket) and the local `Date.now()`, rendering the synchronization pixel-perfect.
4. **Broadcast Hooks:** Any controls modifying the state (`timer_start`, `change_background`) resolve on the server, which then emits global broadcasts to all participants in a socket room group to recalculate UI visually.
5. **Garbage Collection:** No data persists. Once the final participant disconnects or leaves, `RoomManager` deletes the instance from memory.

## Key Implementation Highlights
- **WebGL Particle Injection:** Normal DOM elements (`InteractiveButton`) are infused with nested `<Canvas>` components containing `@react-three/drei` Sparkles, merging basic HTML interactability with 3D particles on hover.
- **Morphing Page Transitions:** Replaced CSS transitions with Framer Motion `AnimatePresence`. Page switches utilize smooth cubic-bezier (`[0.22, 1, 0.36, 1]`) interpolation.

## Deployment Guidelines
Since the architecture relies on sticky WebSockets and in-memory routing, the deployment dictates specific constraints.

1. **Frontend:** Can be deployed to Vercel, Netlify, or AWS S3/Cloudfront.
   - Run `npm run build` in `/client`.
   - Update the `io('http://localhost:3001')` logic in `SocketContext.jsx` point to your production backend URL using an `.env` variable (e.g., `import.meta.env.VITE_SERVER_URL`).
2. **Backend:** Demands a capable runtime for long-lived WebSocket connections (e.g., Render, Railway, AWS ECS, or DigitalOcean Droplets).
   - Ensure the provider supports scaling *only if* using a Redis adapter (not implemented by design for simple ephemeral storage).
   - Point the `origin` configurations in `server/src/index.js` to whitelist your frontend domain.
