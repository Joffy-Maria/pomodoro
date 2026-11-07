import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import RoomManager from './RoomManager.js';
import { onPayload } from './socketUtils.js';

// Process-level safety: last-resort error logging to prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
    console.error('[Process Error] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
app.use(cors());

// Health check route for deployment platforms (like Render)
app.get('/', (req, res) => {
    res.status(200).send('Promate Socket.IO Server is running');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow development origins
        methods: ['GET', 'POST']
    }
});

// Broadcast timer completion and synced state when room timer expires on the server
RoomManager.onTimerComplete = ({ roomId, completedMode, duration, completionId, nextMode, timer }) => {
    io.to(roomId).emit('timer_complete', {
        roomId,
        mode: completedMode,
        duration,
        completionId,
        nextMode
    });
    io.to(roomId).emit('timer_sync', timer);
};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room. Solo rooms skip chat entirely.
    onPayload(socket, 'create_room', { isSolo: { type: 'boolean', required: false } }, (payload, callback) => {
        const roomId = RoomManager.createRoom(socket.id, { isSolo: Boolean(payload.isSolo) });
        socket.join(roomId);
        callback({ success: true, roomId, roomState: RoomManager.getRoom(roomId) });
    });

    // Request to join a room
    onPayload(socket, 'request_join', { roomId: 'string', username: { type: 'string', required: false } }, ({ roomId, username }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (!room) {
            callback({ success: false, message: 'Room not found', error: 'Room not found' });
            return;
        }

        // Add request and notify host
        RoomManager.addJoinRequest(roomId, { socketId: socket.id, username });
        io.to(room.host).emit('join_request', { socketId: socket.id, username });
        callback({ success: true });
    });

    // Host approves join request
    onPayload(socket, 'approve_request', { roomId: 'string', targetSocketId: 'string' }, ({ roomId, targetSocketId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.host === socket.id) {
            RoomManager.joinRoom(roomId, targetSocketId);
            RoomManager.removeJoinRequest(roomId, targetSocketId);

            // Make the approved user join the socket room
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.join(roomId);
                io.to(targetSocketId).emit('join_approved', { roomId, roomState: room });

                // Broadcast new participant
                socket.to(roomId).emit('participant_joined', { socketId: targetSocketId });
            }

            callback({ success: true });
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    // Host rejects join request
    onPayload(socket, 'reject_request', { roomId: 'string', targetSocketId: 'string' }, ({ roomId, targetSocketId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.host === socket.id) {
            RoomManager.removeJoinRequest(roomId, targetSocketId);
            io.to(targetSocketId).emit('join_rejected', { roomId });
            callback({ success: true });
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    // Directly join room using link (no approval for demo simplicity, or we can enforce)
    onPayload(socket, 'join_room_direct', { roomId: 'string' }, ({ roomId }, callback) => {
        const success = RoomManager.joinRoom(roomId, socket.id);
        if (success) {
            socket.join(roomId);
            const room = RoomManager.getRoom(roomId);
            socket.to(roomId).emit('participant_joined', { socketId: socket.id });
            callback({ success: true, roomState: room });
        } else {
            callback({ success: false, message: 'Room not found', error: 'Room not found' });
        }
    });

    // Check room validity - also re-joins socket.io room to handle reconnects
    onPayload(socket, 'check_room', { roomId: 'string' }, ({ roomId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room) {
            // Always re-join the socket.io room in case of reconnect/refresh
            // This ensures chat_sync and other broadcasts reach this socket
            if (room.participants.includes(socket.id)) {
                socket.join(roomId);
            }
            callback({ success: true, roomState: room });
        } else {
            callback({ success: false, message: 'Room not found', error: 'Room not found' });
        }
    });

    // Leave room manually
    onPayload(socket, 'leave_room', { roomId: 'string' }, ({ roomId }, callback) => {
        socket.leave(roomId);
        RoomManager.leaveRoom(roomId, socket.id);
        io.to(roomId).emit('participant_left', { socketId: socket.id });
        callback({ success: true });
    });

    // Timer controls
    onPayload(socket, 'timer_start', { roomId: 'string' }, ({ roomId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.startTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
                callback({ success: true, timer: room.timer });
            } else {
                callback({ success: false, message: 'Timer already running or could not be started', error: 'Timer could not be started' });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Clean up rooms the user was in
        for (const [roomId, room] of RoomManager.rooms.entries()) {
            if (room.participants.includes(socket.id)) {
                RoomManager.leaveRoom(roomId, socket.id);
                io.to(roomId).emit('participant_left', { socketId: socket.id });
            }
        }
    });

    onPayload(socket, 'timer_pause', { roomId: 'string' }, ({ roomId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.pauseTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
                callback({ success: true, timer: room.timer });
            } else {
                callback({ success: false, message: 'Timer not running or could not be paused', error: 'Timer could not be paused' });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    onPayload(socket, 'timer_reset', { roomId: 'string' }, ({ roomId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.resetTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
                callback({ success: true, timer: room.timer });
            } else {
                callback({ success: false, message: 'Timer could not be reset', error: 'Timer could not be reset' });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    onPayload(socket, 'timer_switch_mode', { roomId: 'string', mode: 'string' }, ({ roomId, mode }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.switchMode(roomId, mode)) {
                io.to(roomId).emit('timer_sync', room.timer);
                callback({ success: true, timer: room.timer });
            } else {
                callback({ success: false, message: 'Failed to switch mode', error: 'Failed to switch mode' });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    // Configure the focus block length before it starts
    onPayload(socket, 'set_focus_duration', { roomId: 'string', minutes: 'number' }, ({ roomId, minutes }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (
            room &&
            room.participants.includes(socket.id) &&
            Number.isFinite(Number(minutes))
        ) {
            RoomManager.setFocusDuration(roomId, Number(minutes));
            io.to(roomId).emit('timer_sync', room.timer);
            callback({ success: true, timer: room.timer });
        } else {
            callback({ success: false, message: 'Unable to update duration', error: 'Unable to update duration' });
        }
    });

    // Background selection
    onPayload(socket, 'change_background', { roomId: 'string', background: 'string' }, ({ roomId, background }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            room.settings.background = background;
            io.to(roomId).emit('background_changed', background);
            callback({ success: true });
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    // Task management
    onPayload(socket, 'task_add', { roomId: 'string', text: 'string' }, ({ roomId, text }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.addTask(roomId, text);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
                callback({ success: true, tasks: updatedTasks });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    onPayload(socket, 'task_toggle', { roomId: 'string', taskId: { required: true } }, ({ roomId, taskId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.toggleTask(roomId, taskId);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
                callback({ success: true, tasks: updatedTasks });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    onPayload(socket, 'task_remove', { roomId: 'string', taskId: { required: true } }, ({ roomId, taskId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.removeTask(roomId, taskId);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
                callback({ success: true, tasks: updatedTasks });
            }
        } else {
            callback({ success: false, message: 'Unauthorized or room not found', error: 'Unauthorized or room not found' });
        }
    });

    // Chat management (shared rooms only)
    onPayload(socket, 'send_message', { roomId: 'string', sender: 'string', text: 'string' }, ({ roomId, sender, text }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (!room || room.isSolo) {
            callback({ success: false, message: 'Chat unavailable for this room', error: 'Chat unavailable for this room' });
            return;
        }

        // Auto-join if not already a participant (handles reconnect edge cases)
        if (!room.participants.includes(socket.id)) {
            RoomManager.joinRoom(roomId, socket.id);
            socket.join(roomId);
        }

        const updatedChat = RoomManager.addChatMessage(roomId, sender, text);
        if (updatedChat) {
            io.to(roomId).emit('chat_sync', updatedChat);
            callback({ success: true, chat: updatedChat });
        }
    });
});

export { app, httpServer, io };
