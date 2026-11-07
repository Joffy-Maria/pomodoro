class RoomManager {
  constructor() {
    // rooms key: roomId, value: roomData
    this.rooms = new Map();
    this.timerTimeouts = new Map(); // roomId -> timeoutId
    this.onTimerComplete = null; // optional callback: ({ roomId, completedMode, duration, completionId, nextMode, timer }) => void
  }

  createRoom(hostSocketId, { isSolo = false } = {}) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.rooms.set(roomId, {
      id: roomId,
      host: hostSocketId,
      isSolo: Boolean(isSolo),
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
    this.clearRoomTimeout(roomId);
    this.rooms.delete(roomId);
  }

  clearRoomTimeout(roomId) {
    if (this.timerTimeouts.has(roomId)) {
      clearTimeout(this.timerTimeouts.get(roomId));
      this.timerTimeouts.delete(roomId);
    }
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
  startTimer(roomId, onComplete) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (room.timer.status !== 'running') {
      // Ensure positive remaining seconds before running to prevent 00:00 lock
      if (room.timer.timeRemaining <= 0) {
        room.timer.timeRemaining = room.timer.mode === 'focus' ? room.settings.focusDuration : room.settings.breakDuration;
        room.timer.duration = room.timer.timeRemaining;
      }

      room.timer.status = 'running';
      const now = Date.now();
      room.timer.startTime = now;
      room.timer.endTime = now + (room.timer.timeRemaining * 1000);

      this.clearRoomTimeout(roomId);
      const delayMs = Math.max(0, room.timer.timeRemaining * 1000);
      const timeoutId = setTimeout(() => {
        this.timerTimeouts.delete(roomId);
        this.handleTimerCompletion(roomId, onComplete);
      }, delayMs);

      this.timerTimeouts.set(roomId, timeoutId);

      return true;
    }
    return false;
  }

  handleTimerCompletion(roomId, onComplete) {
    const room = this.rooms.get(roomId);
    if (!room || room.timer.status !== 'running') return;

    const completedMode = room.timer.mode;
    const completedDuration = room.timer.duration;
    const completionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Transition mode: focus -> break, break -> focus
    const nextMode = completedMode === 'focus' ? 'break' : 'focus';
    room.timer.mode = nextMode;
    room.timer.status = 'stopped';
    const nextDuration = nextMode === 'focus' ? room.settings.focusDuration : room.settings.breakDuration;
    room.timer.duration = nextDuration;
    room.timer.timeRemaining = nextDuration;
    room.timer.startTime = null;
    room.timer.endTime = null;

    const completionData = {
      roomId,
      completedMode,
      duration: completedDuration,
      completionId,
      nextMode,
      timer: room.timer
    };

    if (typeof onComplete === 'function') {
      onComplete(completionData);
    } else if (typeof this.onTimerComplete === 'function') {
      this.onTimerComplete(completionData);
    }
  }

  pauseTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.timer.status !== 'running') return false;

    this.clearRoomTimeout(roomId);
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

    this.clearRoomTimeout(roomId);
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

    this.clearRoomTimeout(roomId);
    room.timer.mode = mode; // 'focus' or 'break'
    this.resetTimer(roomId);
    return true;
  }

  setFocusDuration(roomId, minutes) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const seconds = Math.min(180, Math.max(1, Math.round(minutes))) * 60;
    room.settings.focusDuration = seconds;

    // Only resize the clock if a focus block hasn't started yet.
    if (room.timer.mode === 'focus' && room.timer.status === 'stopped') {
      room.timer.duration = seconds;
      room.timer.timeRemaining = seconds;
    }
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
    if (!room || room.isSolo) return null;

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
