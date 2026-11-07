import test from 'node:test';
import assert from 'node:assert/strict';
import EventEmitter from 'events';
import RoomManager from './src/RoomManager.js';
import { onPayload } from './src/socketUtils.js';

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
  to() {
    return { emit: () => {} };
  }
}

test('Scenario 1: Normal connection - Room loads and works as expected', () => {
  const roomId = RoomManager.createRoom('socket-1', { isSolo: false });
  assert.ok(roomId, 'Room ID generated');
  
  const room = RoomManager.getRoom(roomId);
  assert.ok(room, 'Room exists in manager');
  assert.equal(room.id, roomId);
  assert.deepEqual(room.participants, ['socket-1']);
  assert.equal(room.timer.status, 'stopped');
  assert.equal(room.timer.mode, 'focus');

  // Clean up
  RoomManager.deleteRoom(roomId);
  assert.equal(RoomManager.getRoom(roomId), undefined);
});

test('Scenario 2 & 3: Temporary internet disconnection & recovery', () => {
  const roomId = RoomManager.createRoom('socket-1', { isSolo: false });
  RoomManager.addTask(roomId, 'Write test cases');

  // Timer started
  RoomManager.startTimer(roomId);
  const originalTimer = RoomManager.getRoom(roomId).timer;
  assert.equal(originalTimer.status, 'running');
  const originalEndTime = originalTimer.endTime;

  // Temporary disconnection occurs (socket-1 leaves)
  RoomManager.leaveRoom(roomId, 'socket-1');

  // Room must NOT be destroyed immediately
  const roomDuringDisconnect = RoomManager.getRoom(roomId);
  assert.ok(roomDuringDisconnect, 'Room is preserved during transient disconnect');
  assert.equal(RoomManager.cleanupTimers.has(roomId), true, 'Grace period timer is active');

  // Internet restored: user reconnects with new socket ID
  const reconnected = RoomManager.joinRoom(roomId, 'socket-2');
  assert.equal(reconnected, true, 'Rejoining room succeeds');

  const restoredRoom = RoomManager.getRoom(roomId);
  assert.deepEqual(restoredRoom.participants, ['socket-2']);
  assert.equal(restoredRoom.host, 'socket-2', 'Host reassigned to reconnected participant');
  assert.equal(RoomManager.cleanupTimers.has(roomId), false, 'Cleanup timer cleared on rejoin');
  assert.equal(restoredRoom.tasks.length, 1, 'Tasks preserved');
  assert.equal(restoredRoom.tasks[0].text, 'Write test cases');
  assert.equal(restoredRoom.timer.status, 'running', 'Timer is still running');
  assert.equal(restoredRoom.timer.endTime, originalEndTime, 'Timer endTime preserved without drift');

  // Clean up
  RoomManager.deleteRoom(roomId);
});

test('Scenario 4 & 5: Actual non-existent room returns false from check_room', (t, done) => {
  const nonExistent = RoomManager.getRoom('DOESNOTEXIST');
  assert.equal(nonExistent, undefined, 'Non-existent room is undefined');

  const socket = new MockSocket('socket-check-fail');
  onPayload(socket, 'check_room', { roomId: 'string' }, ({ roomId }, callback) => {
    const room = RoomManager.getRoom(roomId);
    if (room) {
      callback({ success: true, roomState: room });
    } else {
      callback({ success: false, message: 'Room not found', error: 'Room not found' });
    }
  });

  socket.emit('check_room', { roomId: 'NON_EXISTENT_ROOM' }, (response) => {
    assert.equal(response.success, false);
    assert.equal(response.message, 'Room not found');
    done();
  });
});

test('Scenario 6: Repeated disconnect/reconnect cycles with socket check_room and join_room_direct', (t, done) => {
  const roomId = RoomManager.createRoom('socket-initial', { isSolo: false });
  RoomManager.addTask(roomId, 'Repeated reconnect task');

  let currentSocketId = 'socket-initial';
  const cycles = 5;

  for (let i = 0; i < cycles; i++) {
    // 1. Transient disconnect
    RoomManager.leaveRoom(roomId, currentSocketId);
    assert.ok(RoomManager.getRoom(roomId), `Room kept alive in cycle ${i}`);
    assert.equal(RoomManager.cleanupTimers.has(roomId), true);

    // 2. New socket arrives on reconnect
    const nextSocketId = `socket-reconnected-${i}`;
    const nextSocket = new MockSocket(nextSocketId);

    // check_room succeeds
    const room = RoomManager.getRoom(roomId);
    assert.ok(room);
    assert.equal(room.id, roomId);

    // join_room_direct succeeds and clears timer
    const joined = RoomManager.joinRoom(roomId, nextSocketId);
    assert.equal(joined, true);
    assert.equal(RoomManager.cleanupTimers.has(roomId), false);
    assert.deepEqual(room.participants, [nextSocketId]);
    assert.equal(room.tasks.length, 1);
    assert.equal(room.tasks[0].text, 'Repeated reconnect task');

    currentSocketId = nextSocketId;
  }

  // Clean up
  RoomManager.deleteRoom(roomId);
  assert.equal(RoomManager.getRoom(roomId), undefined);
  done();
});
