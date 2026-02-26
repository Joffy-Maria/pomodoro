import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import RoomManager from './RoomManager.js';

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

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room
    socket.on('create_room', (callback) => {
        const roomId = RoomManager.createRoom(socket.id);
        socket.join(roomId);

        if (typeof callback === 'function') {
            callback({ success: true, roomId, roomState: RoomManager.getRoom(roomId) });
        }
    });

    // Request to join a room
    socket.on('request_join', ({ roomId, username }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (!room) {
            if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
            return;
        }

        // Add request and notify host
        RoomManager.addJoinRequest(roomId, { socketId: socket.id, username });
        io.to(room.host).emit('join_request', { socketId: socket.id, username });

        if (typeof callback === 'function') callback({ success: true });
    });

    // Host approves join request
    socket.on('approve_request', ({ roomId, targetSocketId }, callback) => {
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

            if (typeof callback === 'function') callback({ success: true });
        }
    });

    // Host rejects join request
    socket.on('reject_request', ({ roomId, targetSocketId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.host === socket.id) {
            RoomManager.removeJoinRequest(roomId, targetSocketId);
            io.to(targetSocketId).emit('join_rejected', { roomId });
            if (typeof callback === 'function') callback({ success: true });
        }
    });

    // Directly join room using link (no approval for demo simplicity, or we can enforce)
    socket.on('join_room_direct', ({ roomId }, callback) => {
        const success = RoomManager.joinRoom(roomId, socket.id);
        if (success) {
            socket.join(roomId);
            const room = RoomManager.getRoom(roomId);
            socket.to(roomId).emit('participant_joined', { socketId: socket.id });
            if (typeof callback === 'function') callback({ success: true, roomState: room });
        } else {
            if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
        }
    });

    // Check room validity without joining (prevents duplicate join bugs)
    socket.on('check_room', ({ roomId }, callback) => {
        const room = RoomManager.getRoom(roomId);
        if (room) {
            if (typeof callback === 'function') callback({ success: true, roomState: room });
        } else {
            if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
        }
    });

    // Leave room manually
    socket.on('leave_room', ({ roomId }) => {
        socket.leave(roomId);
        RoomManager.leaveRoom(roomId, socket.id);
        io.to(roomId).emit('participant_left', { socketId: socket.id });
    });

    // Timer controls
    socket.on('timer_start', ({ roomId }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.startTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
            }
        }
    });

    socket.on('timer_pause', ({ roomId }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.pauseTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
            }
        }
    });

    socket.on('timer_reset', ({ roomId }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.resetTimer(roomId)) {
                io.to(roomId).emit('timer_sync', room.timer);
            }
        }
    });

    socket.on('timer_switch_mode', ({ roomId, mode }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && (room.host === socket.id || room.participants.includes(socket.id))) {
            if (RoomManager.switchMode(roomId, mode)) {
                io.to(roomId).emit('timer_sync', room.timer);
            }
        }
    });

    // Background selection
    socket.on('change_background', ({ roomId, background }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            room.settings.background = background;
            io.to(roomId).emit('background_changed', background);
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

    // Task management
    socket.on('task_add', ({ roomId, text }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.addTask(roomId, text);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
            }
        }
    });

    socket.on('task_toggle', ({ roomId, taskId }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.toggleTask(roomId, taskId);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
            }
        }
    });

    socket.on('task_remove', ({ roomId, taskId }) => {
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedTasks = RoomManager.removeTask(roomId, taskId);
            if (updatedTasks) {
                io.to(roomId).emit('tasks_sync', updatedTasks);
            }
        }
    });

    // Chat management
    socket.on('send_message', ({ roomId, sender, text }) => {
        console.log("Server received message from", sender, "in room", roomId, ":", text);
        const room = RoomManager.getRoom(roomId);
        if (room && room.participants.includes(socket.id)) {
            const updatedChat = RoomManager.addChatMessage(roomId, sender, text);
            console.log("Updated chat array:", updatedChat);
            if (updatedChat) {
                console.log("Broadcasting chat_sync to room", roomId);
                io.to(roomId).emit('chat_sync', updatedChat);
            }
        } else {
            console.log("Server error: Room not found or sender not participant.", { roomData: room, participant: socket.id });
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
