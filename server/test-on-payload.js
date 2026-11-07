import EventEmitter from 'events';
import { onPayload } from './src/socketUtils.js';

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.id = 'mock-socket-123';
  }
}

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

// 1. Emitting with undefined payload (e.g. socket.emit('timer_start'))
{
  const socket = new MockSocket();
  let executed = false;
  let receivedError = null;

  onPayload(socket, 'timer_start', { roomId: 'string' }, ({ roomId }, ack) => {
    executed = true;
  });

  socket.emit('timer_start', undefined, (res) => {
    receivedError = res;
  });

  assert(!executed, 'Handler does not execute when roomId is missing');
  assert(receivedError && receivedError.success === false, 'Ack called with failure when payload is undefined');
  assert(receivedError && receivedError.error.includes("Missing required field: 'roomId'"), 'Reports missing required field');
}

// 2. Emitting with no args at all (no callback, no payload)
{
  const socket = new MockSocket();
  let threw = false;

  onPayload(socket, 'timer_start', { roomId: 'string' }, ({ roomId }) => {});

  try {
    socket.emit('timer_start');
  } catch (e) {
    threw = true;
  }

  assert(!threw, 'Emitting with no arguments does not throw unhandled exception');
}

// 3. Emitting with null payload
{
  const socket = new MockSocket();
  let receivedError = null;

  onPayload(socket, 'test_event', { roomId: 'string' }, (payload, ack) => {});

  socket.emit('test_event', null, (res) => {
    receivedError = res;
  });

  assert(receivedError && receivedError.success === false, 'Ack called with failure when payload is null');
}

// 4. Emitting with wrong data type (e.g. number expected, got string)
{
  const socket = new MockSocket();
  let receivedError = null;

  onPayload(socket, 'set_duration', { roomId: 'string', minutes: 'number' }, (payload, ack) => {});

  socket.emit('set_duration', { roomId: 'room1', minutes: 'not-a-number' }, (res) => {
    receivedError = res;
  });

  assert(receivedError && receivedError.success === false, 'Ack called with failure on type mismatch');
  assert(receivedError && receivedError.error.includes("Invalid type for 'minutes'"), 'Error identifies the mismatched field');
}

// 5. Emitting with valid payload
{
  const socket = new MockSocket();
  let receivedPayload = null;
  let receivedAck = null;

  onPayload(socket, 'timer_start', { roomId: 'string' }, ({ roomId }, ack) => {
    receivedPayload = { roomId };
    ack({ success: true });
  });

  socket.emit('timer_start', { roomId: 'room-abc' }, (res) => {
    receivedAck = res;
  });

  assert(receivedPayload && receivedPayload.roomId === 'room-abc', 'Valid payload passed to handler');
  assert(receivedAck && receivedAck.success === true, 'Handler acknowledgment executed');
}

// 6. Callback passed as first argument (no payload, only callback)
{
  const socket = new MockSocket();
  let receivedPayload = null;
  let receivedAck = null;

  onPayload(socket, 'create_room', { isSolo: { type: 'boolean', required: false } }, (payload, ack) => {
    receivedPayload = payload;
    ack({ success: true, roomId: 'NEW_ROOM' });
  });

  socket.emit('create_room', (res) => {
    receivedAck = res;
  });

  assert(receivedPayload && typeof receivedPayload === 'object', 'Payload defaults to empty object');
  assert(receivedAck && receivedAck.roomId === 'NEW_ROOM', 'Ack received when passed as first argument');
}

// 7. Handler throwing an unexpected exception
{
  const socket = new MockSocket();
  let threw = false;
  let receivedAck = null;

  onPayload(socket, 'faulty_event', null, (payload, ack) => {
    throw new Error('Something broke inside handler');
  });

  try {
    socket.emit('faulty_event', {}, (res) => {
      receivedAck = res;
    });
  } catch (err) {
    threw = true;
  }

  assert(!threw, 'Exceptions inside handler are caught and do not crash server');
  assert(receivedAck && receivedAck.success === false && receivedAck.error === 'Something broke inside handler', 'Ack called with thrown error message');
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}

