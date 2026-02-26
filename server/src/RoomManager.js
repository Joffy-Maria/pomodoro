class RoomManager {
  constructor() {
    // rooms key: roomId, value: roomData
    this.rooms = new Map();
  }

  createRoom(hostSocketId) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.rooms.set(roomId, {
      id: roomId,
      host: hostSocketId,
      participants: [hostSocketId],
      requests: [], // users asking to join
      tasks: [], // tasks for the session { id, text, completed }
      timer: {
        mode: 'focus', // focus or break
        status: 'stopped', // running, paused, stopped
        duration: 25 * 60, // 25 minutes in seconds
        startTime: null,
        timeRemaining: 25 * 60,
        endTime: null
      },
      settings: {
        focusDuration: 25 * 60,
        breakDuration: 5 * 60,
        background: 'BloomingGarden' // default background
      },
      chat: []
    });
    return roomId;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  joinRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (!room.participants.includes(socketId)) {
      room.participants.push(socketId);
    }
    return true;
  }

  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants = room.participants.filter(id => id !== socketId);
    if (room.participants.length === 0) {
      this.deleteRoom(roomId);
    } else if (room.host === socketId) {
      // Reassign host if host leaves
      room.host = room.participants[0];
    }
  }

  addJoinRequest(roomId, requestData) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.requests.push(requestData);
    return true;
  }

  removeJoinRequest(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.requests = room.requests.filter(req => req.socketId !== socketId);
  }

  // Timer controls
  startTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (room.timer.status !== 'running') {
      room.timer.status = 'running';
      room.timer.startTime = Date.now();
      room.timer.endTime = Date.now() + (room.timer.timeRemaining * 1000);
      return true;
    }
    return false;
  }

  pauseTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.timer.status !== 'running') return false;

    const now = Date.now();
    room.timer.status = 'paused';
    room.timer.timeRemaining = Math.max(0, Math.floor((room.timer.endTime - now) / 1000));
    room.timer.startTime = null;
    room.timer.endTime = null;
    return true;
  }

  resetTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.timer.status = 'stopped';
    room.timer.timeRemaining = room.timer.mode === 'focus' ? room.settings.focusDuration : room.settings.breakDuration;
    room.timer.duration = room.timer.timeRemaining;
    room.timer.startTime = null;
    room.timer.endTime = null;
    return true;
  }

  switchMode(roomId, mode) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.timer.mode = mode; // 'focus' or 'break'
    this.resetTimer(roomId);
    return true;
  }

  // Task Management
  addTask(roomId, taskText) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      text: taskText,
      completed: false
    };

    room.tasks.push(newTask);
    return room.tasks;
  }

  toggleTask(roomId, taskId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const task = room.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
    return room.tasks;
  }

  removeTask(roomId, taskId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.tasks = room.tasks.filter(t => t.id !== taskId);
    return room.tasks;
  }

  // --- CHAT SYSTEM ---
  addChatMessage(roomId, sender, text) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      sender,
      text,
      timestamp: Date.now()
    };

    room.chat.push(message);

    // Optional: limit history to 100 messages to save memory
    if (room.chat.length > 100) {
      room.chat.shift();
    }

    return room.chat;
  }
}

export default new RoomManager();
