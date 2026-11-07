import { io as Client } from 'socket.io-client';
import { httpServer } from '../src/app.js';

async function runTests() {
  const server = httpServer.listen(0);
  const port = server.address().port;
  const socket = Client(`http://localhost:${port}`);

  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Test client connected');

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

  // Test 1: emit timer_start with NO payload at all
  await new Promise((resolve) => {
    socket.emit('timer_start', (res) => {
      assert(res && res.success === false && res.error.includes('Missing required field: \'roomId\''), 'Emitting timer_start with no payload returns missing roomId error');
      resolve();
    });
  });

  // Test 2: emit timer_start with null
  await new Promise((resolve) => {
    socket.emit('timer_start', null, (res) => {
      assert(res && res.success === false && res.error.includes('Missing required field: \'roomId\''), 'Emitting timer_start with null payload returns missing roomId error');
      resolve();
    });
  });

  // Test 3: emit set_focus_duration with string instead of number
  await new Promise((resolve) => {
    socket.emit('set_focus_duration', { roomId: 'TEST12', minutes: 'abc' }, (res) => {
      assert(res && res.success === false && res.error.includes('Invalid type for \'minutes\''), 'Emitting set_focus_duration with string minutes returns invalid type error');
      resolve();
    });
  });

  // Test 4: emit create_room with no args (callback only)
  let createdRoomId;
  await new Promise((resolve) => {
    socket.emit('create_room', (res) => {
      assert(res && res.success === true && Boolean(res.roomId), 'Emitting create_room with only callback creates a room successfully');
      createdRoomId = res.roomId;
      resolve();
    });
  });

  // Test 5: emit check_room with valid payload
  await new Promise((resolve) => {
    socket.emit('check_room', { roomId: createdRoomId }, (res) => {
      assert(res && res.success === true && res.roomState.id === createdRoomId, 'Emitting check_room with valid payload succeeds');
      resolve();
    });
  });

  // Test 6: emit timer_start with valid roomId
  await new Promise((resolve) => {
    socket.emit('timer_start', { roomId: createdRoomId }, (res) => {
      assert(res && res.success === true, 'Emitting timer_start with valid roomId starts timer');
      resolve();
    });
  });

  socket.disconnect();
  server.close();

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});

