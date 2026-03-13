# Deployment Guide

This guide provides step-by-step instructions for deploying the Pomodoro application. We recommend using **Vercel** for the frontend (client) and **Render** for the backend (server).

---

## 1. Backend Deployment (Render)

The backend is a Node.js Express server using Socket.io for real-time communication.

### Steps:
1.  **Create a New Web Service**:
    *   Sign in to [Render](https://render.com/).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub/GitLab repository.
2.  **Configure the Service**:
    *   **Name**: `pomodoro-server` (or your choice).
    *   **Language**: `Node`.
    *   **Root Directory**: `server`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start`.
3.  **Advanced Settings**:
    *   No specific environment variables are required, but you can add `PORT` (Render sets this automatically).
4.  **Deploy**:
    *   Click **Create Web Service**.
    *   Wait for the deployment to finish. **Keep note of your Service URL** (e.g., `https://pomodoro-server.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

The frontend is a React application built with Vite and Tailwind CSS.

### Steps:
1.  **Create a New Project**:
    *   Sign in to [Vercel](https://vercel.com/).
    *   Click **Add New...** -> **Project**.
    *   Connect your repository.
2.  **Configure Project**:
    *   **Framework Preset**: `Vite`.
    *   **Root Directory**: `client`.
3.  **Environment Variables**:
    *   Add a new environment variable:
        *   **Key**: `VITE_SERVER_URL`
        *   **Value**: Your Render Service URL (e.g., `https://pomodoro-server.onrender.com`).
4.  **Deploy**:
    *   Click **Deploy**.
    *   Verify that the app connects to the socket server by checking the "Socket Connected" status in the UI.

---

## Troubleshooting

### Socket Connection Issues
If the frontend fails to connect to the backend:
1.  **Check Mixed Content**: Ensure your Render URL is `https://`.
2.  **CORS**: The current server setup allows all origins (`*`). If you change this in `server/src/index.js`, ensure your Vercel URL is added to the allowed origins.
3.  **Port**: Render automatically handles the port for Web Services. Ensure `server/src/index.js` uses `process.env.PORT || 3001`.

### Build Failures
*   Ensure you have configured the **Root Directory** correctly for each service (`client` for Vercel, `server` for Render).
