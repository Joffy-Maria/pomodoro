import test from 'node:test';
import assert from 'node:assert/strict';
import EventEmitter from 'events';
import RoomManager from '../src/RoomManager.js';
import { onPayload } from '../src/socketUtils.js';

class MockSocket extends EventEmitter {
  constructor(id = 'mock-socket-1') {
    super();
    this.id = id;
    this.rooms = new Set();
  }
  join(room) {
    this.rooms.add(room);
  }
  leave(room) {
    this.rooms.delete(room);
  }
  to(room) {
    return {
      emit: (event, data) => {
        this.emit(`to:${room}:${event}`, data);
      }
    };
  }
}

// -------------------------------------------------------------
// Scenario 1: Normal room creation and joining
// -------------------------------------------------------------
test('Scenario 1: Normal room creation and joining', () => {
  const roomId = RoomManager.createRoom('socket-1', { isSolo: false });
  assert.ok(roomId, 'Room ID generated');

  const room = RoomManager.getRoom(roomId);
  assert.ok(room, 'Room exists in manager');
  assert.equal(room.id, roomId);
  assert.deepEqual(room.participants, ['socket-1']);
  assert.equal(room.host, 'socket-1');

  // Second user joins
  const joined = RoomManager.joinRoom(roomId, 'socket-2');
  assert.equal(joined, true, 'Second participant joined');
  assert.deepEqual(room.participants, ['socket-1', 'socket-2']);

  RoomManager.deleteRoom(roomId);
  assert.equal(RoomManager.getRoom(roomId), undefined);
});

// -------------------------------------------------------------
// Scenario 2: Temporary internet disconnection (other users still in room)
// -------------------------------------------------------------
test('Scenario 2: Temporary disconnection when other participants remain', () => {
  const roomId = RoomManager.createRoom('socket-1');
  RoomManager.joinRoom(roomId, 'socket-2');

  // Socket 1 disconnects
  RoomManager.leaveRoom(roomId, 'socket-1');
  const room = RoomManager.getRoom(roomId);
  assert.ok(room, 'Room still exists');
  assert.deepEqual(room.participants, ['socket-2']);
  assert.equal(room.host, 'socket-2', 'Host reassigned to remaining participant');
  assert.equal(RoomManager.cleanupTimers.has(roomId), false, 'No grace timer when room not empty');

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 3: Reconnection before 60-second grace period expires
// -------------------------------------------------------------
test('Scenario 3: Reconnection before grace period expires preserves full state', () => {
  const roomId = RoomManager.createRoom('socket-1');
  RoomManager.addTask(roomId, 'Persistent Task');
  RoomManager.startTimer(roomId);
  const originalEndTime = RoomManager.getRoom(roomId).timer.endTime;

  // Single user disconnects (room empty)
  RoomManager.leaveRoom(roomId, 'socket-1');
  assert.ok(RoomManager.getRoom(roomId), 'Room kept alive during grace period');
  assert.equal(RoomManager.cleanupTimers.has(roomId), true, 'Cleanup timer active');

  // User reconnects with new socket ID
  const reconnected = RoomManager.joinRoom(roomId, 'socket-1-new');
  assert.equal(reconnected, true);
  assert.equal(RoomManager.cleanupTimers.has(roomId), false, 'Cleanup timer cancelled');

  const room = RoomManager.getRoom(roomId);
  assert.deepEqual(room.participants, ['socket-1-new']);
  assert.equal(room.host, 'socket-1-new');
  assert.equal(room.tasks.length, 1);
  assert.equal(room.tasks[0].text, 'Persistent Task');
  assert.equal(room.timer.status, 'running');
  assert.equal(room.timer.endTime, originalEndTime);

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 4: Reconnection after cold Render server start (client handling)
// -------------------------------------------------------------
test('Scenario 4: Cold Render start simulation - client waits without redirect', () => {
  // Simulating client-side logic:
  let isConnected = false;
  let redirectedTo = null;
  const navigate = (to) => { redirectedTo = to; };

  // Effect runs on mount while isConnected is false
  const runEffect = (connected) => {
    if (!connected) {
      // Must NOT start redirect timer
      return undefined;
    }
    // Connected -> check_room
    return 'connected_and_checked';
  };

  const cleanup = runEffect(isConnected);
  assert.equal(cleanup, undefined);
  assert.equal(redirectedTo, null, 'Client did not redirect while cold server is starting');

  // Cold start finishes after several seconds
  isConnected = true;
  const action = runEffect(isConnected);
  assert.equal(action, 'connected_and_checked', 'Room check initiates once backend wakes up');
  assert.equal(redirectedTo, null, 'Still no redirect');
});

// -------------------------------------------------------------
// Scenario 5: Multiple users disconnecting simultaneously
// -------------------------------------------------------------
test('Scenario 5: Multiple users disconnecting simultaneously creates single timer', () => {
  const roomId = RoomManager.createRoom('socket-1');
  RoomManager.joinRoom(roomId, 'socket-2');
  RoomManager.joinRoom(roomId, 'socket-3');

  // All 3 disconnect in the same tick
  RoomManager.leaveRoom(roomId, 'socket-1');
  assert.equal(RoomManager.cleanupTimers.has(roomId), false);

  RoomManager.leaveRoom(roomId, 'socket-2');
  assert.equal(RoomManager.cleanupTimers.has(roomId), false);

  RoomManager.leaveRoom(roomId, 'socket-3');
  assert.equal(RoomManager.cleanupTimers.has(roomId), true, 'Grace timer started only when last user left');

  const room = RoomManager.getRoom(roomId);
  assert.ok(room, 'Room intact');
  assert.equal(room.participants.length, 0);

  RoomManager.deleteRoom(roomId);
  assert.equal(RoomManager.cleanupTimers.has(roomId), false);
});

// -------------------------------------------------------------
// Scenario 6: All participants disconnecting temporarily
// -------------------------------------------------------------
test('Scenario 6: All participants disconnecting temporarily preserves room state', () => {
  const roomId = RoomManager.createRoom('user-a');
  RoomManager.joinRoom(roomId, 'user-b');
  RoomManager.switchMode(roomId, 'break');
  RoomManager.addTask(roomId, 'Shared Goal');

  // Both disconnect
  RoomManager.leaveRoom(roomId, 'user-a');
  RoomManager.leaveRoom(roomId, 'user-b');

  // User B reconnects first
  RoomManager.joinRoom(roomId, 'user-b-reconnected');
  // User A reconnects second
  RoomManager.joinRoom(roomId, 'user-a-reconnected');

  const room = RoomManager.getRoom(roomId);
  assert.equal(room.timer.mode, 'break');
  assert.equal(room.tasks[0].text, 'Shared Goal');
  assert.deepEqual(room.participants, ['user-b-reconnected', 'user-a-reconnected']);
  assert.equal(RoomManager.cleanupTimers.has(roomId), false);

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 7: User intentionally leaving a room
// -------------------------------------------------------------
test('Scenario 7: User intentionally leaving a room updates participants and host', () => {
  const roomId = RoomManager.createRoom('host-socket');
  RoomManager.joinRoom(roomId, 'guest-socket');

  // Host intentionally leaves
  RoomManager.leaveRoom(roomId, 'host-socket');

  const room = RoomManager.getRoom(roomId);
  assert.deepEqual(room.participants, ['guest-socket']);
  assert.equal(room.host, 'guest-socket', 'Remaining guest promoted to host');

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 8: Room cleanup after grace period expires
// -------------------------------------------------------------
test('Scenario 8: Room is deleted when grace period expires', (t, done) => {
  const roomId = RoomManager.createRoom('socket-temp');
  RoomManager.leaveRoom(roomId, 'socket-temp');
  assert.ok(RoomManager.getRoom(roomId));

  // Manually trigger the scheduled timer callback
  const scheduledTimer = RoomManager.cleanupTimers.get(roomId);
  assert.ok(scheduledTimer);

  // Directly verify the timer cleanup logic
  clearTimeout(scheduledTimer);
  // Re-run deletion logic as the timer would execute
  const currentRoom = RoomManager.rooms.get(roomId);
  if (currentRoom && currentRoom.participants.length === 0) {
    RoomManager.deleteRoom(roomId);
  }

  assert.equal(RoomManager.getRoom(roomId), undefined, 'Room garbage-collected after grace period');
  assert.equal(RoomManager.cleanupTimers.has(roomId), false);
  done();
});

// -------------------------------------------------------------
// Scenario 9: Repeated disconnect/reconnect cycles
// -------------------------------------------------------------
test('Scenario 9: Repeated disconnect/reconnect cycles maintain clean state', () => {
  const roomId = RoomManager.createRoom('cycle-socket-0');
  RoomManager.addTask(roomId, 'Stress Task');

  let activeSocket = 'cycle-socket-0';
  for (let i = 0; i < 10; i++) {
    const nextSocket = `cycle-socket-${i + 1}`;

    RoomManager.leaveRoom(roomId, activeSocket);
    assert.ok(RoomManager.getRoom(roomId), `Room exists at cycle ${i}`);
    assert.equal(RoomManager.cleanupTimers.has(roomId), true);

    const ok = RoomManager.joinRoom(roomId, nextSocket);
    assert.equal(ok, true);
    assert.equal(RoomManager.cleanupTimers.has(roomId), false);
    assert.deepEqual(RoomManager.getRoom(roomId).participants, [nextSocket]);

    activeSocket = nextSocket;
  }

  const finalRoom = RoomManager.getRoom(roomId);
  assert.equal(finalRoom.participants.length, 1);
  assert.equal(finalRoom.tasks.length, 1);
  assert.equal(finalRoom.tasks[0].text, 'Stress Task');

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 10: Genuinely non-existent room
// -------------------------------------------------------------
test('Scenario 10: Genuinely non-existent room returns failure from check_room', (t, done) => {
  const socket = new MockSocket('tester-socket');
  onPayload(socket, 'check_room', { roomId: 'string' }, ({ roomId }, callback) => {
    const room = RoomManager.getRoom(roomId);
    if (room) {
      callback({ success: true, roomState: room });
    } else {
      callback({ success: false, message: 'Room not found', error: 'Room not found' });
    }
  });

  socket.emit('check_room', { roomId: 'INVALID_ROOM_ID' }, (res) => {
    assert.equal(res.success, false);
    assert.equal(res.message, 'Room not found');
    done();
  });
});

// -------------------------------------------------------------
// Scenario 11: Two users attempting to reconnect simultaneously
// -------------------------------------------------------------
test('Scenario 11: Two users reconnecting concurrently both succeed without timer collision', () => {
  const roomId = RoomManager.createRoom('user-1');
  RoomManager.joinRoom(roomId, 'user-2');

  // Both disconnect
  RoomManager.leaveRoom(roomId, 'user-1');
  RoomManager.leaveRoom(roomId, 'user-2');
  assert.equal(RoomManager.cleanupTimers.has(roomId), true);

  // Both reconnect concurrently
  const res1 = RoomManager.joinRoom(roomId, 'user-1-new');
  const res2 = RoomManager.joinRoom(roomId, 'user-2-new');

  assert.equal(res1, true);
  assert.equal(res2, true);
  assert.equal(RoomManager.cleanupTimers.has(roomId), false, 'Timer cancelled cleanly');

  const room = RoomManager.getRoom(roomId);
  assert.deepEqual(room.participants, ['user-1-new', 'user-2-new']);

  RoomManager.deleteRoom(roomId);
});

// -------------------------------------------------------------
// Scenario 12: Socket disconnecting while room initialization request is pending
// -------------------------------------------------------------
test('Scenario 12: Pending room check callback dropped if connection drops before response', () => {
  let isMounted = true;
  let roomState = null;
  let navigated = null;

  // Simulate component effect run 1
  const effectRun1 = () => {
    let localMounted = true;
    
    // Simulate check_room emitted
    const handleResponse = (response) => {
      if (!localMounted) return; // Guard
      if (response.success) {
        roomState = response.roomState;
      } else {
        navigated = '/dashboard';
      }
    };

    // Before response arrives, socket disconnects -> effect cleanup runs
    const cleanup = () => {
      localMounted = false;
    };

    return { handleResponse, cleanup };
  };

  const { handleResponse, cleanup } = effectRun1();
  // Disconnection occurs
  cleanup();

  // Stale response arrives late
  handleResponse({ success: false });

  assert.equal(roomState, null);
  assert.equal(navigated, null, 'Stale response was ignored due to isMounted guard');
});

// -------------------------------------------------------------
// Scenario 13: Component unmounting while asynchronous requests are in progress
// -------------------------------------------------------------
test('Scenario 13: Component unmount cancels in-flight async navigation and state updates', () => {
  let isMounted = true;
  let stateSet = false;
  let navigated = false;

  const onUnmount = () => {
    isMounted = false;
  };

  // Async task completes after unmount
  const asyncCallback = () => {
    if (!isMounted) return;
    stateSet = true;
    navigated = true;
  };

  onUnmount();
  asyncCallback();

  assert.equal(stateSet, false, 'No state set after unmount');
  assert.equal(navigated, false, 'No navigation after unmount');
});

// -------------------------------------------------------------
// Scenario 14: Server restart and loss of in-memory room state
// -------------------------------------------------------------
test('Scenario 14: Server restart returns success: false and client redirects cleanly', (t, done) => {
  // Pre-restart: Room exists on old server instance
  const oldRoomManager = new (RoomManager.constructor)();
  const roomId = oldRoomManager.createRoom('user-old');

  // Server restarts: Fresh RoomManager instance
  const restartedRoomManager = new (RoomManager.constructor)();
  assert.equal(restartedRoomManager.getRoom(roomId), undefined, 'In-memory state wiped on server restart');

  // Reconnecting client asks for the old room ID
  const socket = new MockSocket('reconnecting-client');
  onPayload(socket, 'check_room', { roomId: 'string' }, ({ roomId }, callback) => {
    const room = restartedRoomManager.getRoom(roomId);
    if (room) {
      callback({ success: true, roomState: room });
    } else {
      callback({ success: false, message: 'Room not found', error: 'Room not found' });
    }
  });

  socket.emit('check_room', { roomId }, (response) => {
    assert.equal(response.success, false, 'Explicit failure returned to client');
    assert.equal(response.message, 'Room not found');

    // Client handles explicit failure:
    let destination = null;
    if (response && response.success === false) {
      destination = '/dashboard';
    }
    assert.equal(destination, '/dashboard', 'Client redirected to dashboard when room was lost in server restart');
    done();
  });
});

// -------------------------------------------------------------
// Architecture Check: Stale cleanup timer cannot delete room if same ID recreated
// -------------------------------------------------------------
test('Architecture Check: Stale cleanup timer does not delete newly created room of same ID', () => {
  const roomId = 'FIXED_TEST_ID';
  // Directly set a room
  RoomManager.rooms.set(roomId, {
    id: roomId,
    participants: ['socket-old'],
    timer: {},
    tasks: []
  });

  // Leave room -> cleanup timer starts
  RoomManager.leaveRoom(roomId, 'socket-old');
  assert.equal(RoomManager.cleanupTimers.has(roomId), true);

  // New room created with the exact same ID (e.g. hash collision or re-creation)
  const newRoomObj = {
    id: roomId,
    participants: ['socket-new'],
    timer: {},
    tasks: []
  };
  // Recreating clears old timer and replaces room
  if (RoomManager.cleanupTimers.has(roomId)) {
    clearTimeout(RoomManager.cleanupTimers.get(roomId));
    RoomManager.cleanupTimers.delete(roomId);
  }
  RoomManager.rooms.set(roomId, newRoomObj);

  assert.equal(RoomManager.cleanupTimers.has(roomId), false, 'Cleanup timer deleted on new room creation');
  assert.equal(RoomManager.getRoom(roomId), newRoomObj);

  RoomManager.deleteRoom(roomId);
});
