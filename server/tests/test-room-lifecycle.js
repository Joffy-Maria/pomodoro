import RoomManager from '../src/RoomManager.js';
import { onPayload } from '../src/socketUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('Testing Room auto-leave & GC lifecycle on server...');

  const mockSocketA = {
    id: 'mock-socket-user-A',
    roomsJoined: new Set(),
    join(r) { this.roomsJoined.add(r); },
    leave(r) { this.roomsJoined.delete(r); },
    emit(event, data) {},
  };

  // Test 1: User A creates Room 1 (solo)
  const room1Id = RoomManager.createRoom(mockSocketA.id, { isSolo: true });
  mockSocketA.join(room1Id);
  assert(RoomManager.getRoom(room1Id) !== undefined, 'Room 1 created and exists in RoomManager');
  assert(RoomManager.getRoom(room1Id).participants.includes(mockSocketA.id), 'User A is in Room 1');

  // Test 2: User A leaves Room 1 -> Grace timer started for empty room
  RoomManager.leaveRoom(room1Id, mockSocketA.id);
  mockSocketA.leave(room1Id);
  const room1 = RoomManager.getRoom(room1Id);
  assert(room1 && room1.participants.length === 0, 'User A removed from Room 1 participants');
  assert(RoomManager.cleanupTimers.has(room1Id), 'Room 1 cleanup grace timer active');

  RoomManager.deleteRoom(room1Id);
  assert(RoomManager.getRoom(room1Id) === undefined, 'Room 1 deleted after cleanup');

  // Test 3: Multiple participants and host reassignment
  const mockSocketB = {
    id: 'mock-socket-user-B',
    roomsJoined: new Set(),
    join(r) { this.roomsJoined.add(r); },
    leave(r) { this.roomsJoined.delete(r); },
  };

  const sharedRoomId = RoomManager.createRoom(mockSocketA.id, { isSolo: false });
  mockSocketA.join(sharedRoomId);
  RoomManager.joinRoom(sharedRoomId, mockSocketB.id);
  mockSocketB.join(sharedRoomId);

  const sharedRoom = RoomManager.getRoom(sharedRoomId);
  assert(sharedRoom.participants.length === 2, 'Shared room has 2 participants');
  assert(sharedRoom.host === mockSocketA.id, 'User A is initial host');

  // Host A leaves -> Host reassigned to B
  RoomManager.leaveRoom(sharedRoomId, mockSocketA.id);
  mockSocketA.leave(sharedRoomId);

  assert(sharedRoom.participants.length === 1, 'Shared room now has 1 participant');
  assert(sharedRoom.host === mockSocketB.id, 'Host correctly reassigned to User B');

  // User B leaves -> Grace timer started
  RoomManager.leaveRoom(sharedRoomId, mockSocketB.id);
  mockSocketB.leave(sharedRoomId);
  assert(RoomManager.cleanupTimers.has(sharedRoomId), 'Shared room cleanup timer active when empty');

  RoomManager.deleteRoom(sharedRoomId);
  assert(RoomManager.getRoom(sharedRoomId) === undefined, 'Shared room deleted');

  // Test 4: Timer lifecycle with leaveRoom
  const timedRoomId = RoomManager.createRoom(mockSocketA.id, { isSolo: true });
  RoomManager.startTimer(timedRoomId);
  assert(RoomManager.timerTimeouts.has(timedRoomId), 'Timer timeout is active');

  RoomManager.deleteRoom(timedRoomId);
  assert(!RoomManager.timerTimeouts.has(timedRoomId), 'Timer timeout cancelled upon room deletion');
  assert(RoomManager.getRoom(timedRoomId) === undefined, 'Timed room cleaned up');

  console.log(`\nRoom lifecycle tests finished: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

