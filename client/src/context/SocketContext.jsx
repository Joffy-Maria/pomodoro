import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

// Vite inlines these at BUILD time, so changing them requires a new deployment
// (not just a restart of the Vercel project).
const SERVER_URL = (
    import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
).replace(/\/+$/, '');

const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io';

const SOCKET_TRANSPORTS = import.meta.env.VITE_SOCKET_TRANSPORTS
    ? import.meta.env.VITE_SOCKET_TRANSPORTS.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined;

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(SERVER_URL, {
            path: SOCKET_PATH,
            // 'undefined' lets socket.io-client use its default (polling + websocket).
            transports: SOCKET_TRANSPORTS,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        newSocket.on('connect', () => {
            console.info(`[socket] connected to ${SERVER_URL}${SOCKET_PATH}`);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error(
                `[socket] failed to connect to ${SERVER_URL}${SOCKET_PATH}: ${err.message}`,
                '\nCheck that VITE_SERVER_URL points to the deployed Socket.IO server.'
            );
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
