import RoomManager from '../src/RoomManager.js';

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
  console.log('Testing RoomManager timer lifecycle...');

  // Test 1: Timer completes on server and fires callback
  await new Promise((resolve) => {
    const roomId = RoomManager.createRoom('socket-host-1');
    const room = RoomManager.getRoom(roomId);
    
    // Set short duration for test (0.05 seconds)
    room.timer.timeRemaining = 0.05;
    room.timer.duration = 0.05;

    let fired = false;
    RoomManager.startTimer(roomId, (data) => {
      fired = true;
      assert(data.roomId === roomId, 'Completion event has matching roomId');
      assert(data.completedMode === 'focus', 'Completion event reports completed mode as focus');
      assert(data.nextMode === 'break', 'Completion event reports next mode as break');
      assert(Boolean(data.completionId), 'Completion event provides unique completionId');
      assert(room.timer.status === 'stopped', 'Room timer status is reset to stopped');
      assert(room.timer.mode === 'break', 'Room timer mode transitioned to break');
      assert(room.timer.timeRemaining === room.settings.breakDuration, 'Room timer remaining time set to breakDuration');
      resolve();
    });

    assert(RoomManager.timerTimeouts.has(roomId), 'Timeout scheduled on startTimer');
  });

  // Test 2: pauseTimer cancels scheduled timeout
  {
    const roomId = RoomManager.createRoom('socket-host-2');
    const room = RoomManager.getRoom(roomId);
    room.timer.timeRemaining = 10;
    
    RoomManager.startTimer(roomId, () => {
      failed++;
      console.error('✗ Timer should not have completed after pause');
    });

    assert(RoomManager.timerTimeouts.has(roomId), 'Timeout active after startTimer');
    RoomManager.pauseTimer(roomId);
    assert(!RoomManager.timerTimeouts.has(roomId), 'Timeout cleared after pauseTimer');
    assert(room.timer.status === 'paused', 'Status updated to paused');
  }

  // Test 3: resetTimer cancels scheduled timeout
  {
    const roomId = RoomManager.createRoom('socket-host-3');
    const room = RoomManager.getRoom(roomId);
    room.timer.timeRemaining = 10;
    
    RoomManager.startTimer(roomId, () => {
      failed++;
      console.error('✗ Timer should not have completed after reset');
    });

    assert(RoomManager.timerTimeouts.has(roomId), 'Timeout active after startTimer');
    RoomManager.resetTimer(roomId);
    assert(!RoomManager.timerTimeouts.has(roomId), 'Timeout cleared after resetTimer');
    assert(room.timer.status === 'stopped', 'Status reset to stopped');
    assert(room.timer.timeRemaining === room.settings.focusDuration, 'Time remaining reset to focusDuration');
  }

  // Test 4: deleteRoom cancels scheduled timeout
  {
    const roomId = RoomManager.createRoom('socket-host-4');
    const room = RoomManager.getRoom(roomId);
    room.timer.timeRemaining = 10;
    
    RoomManager.startTimer(roomId, () => {
      failed++;
      console.error('✗ Timer should not have completed after delete');
    });

    assert(RoomManager.timerTimeouts.has(roomId), 'Timeout active after startTimer');
    RoomManager.deleteRoom(roomId);
    assert(!RoomManager.timerTimeouts.has(roomId), 'Timeout cleared after deleteRoom');
    assert(!RoomManager.getRoom(roomId), 'Room deleted');
  }

  // Test 5: startTimer when timeRemaining <= 0 resets duration (prevents 00:00 lock)
  {
    const roomId = RoomManager.createRoom('socket-host-5');
    const room = RoomManager.getRoom(roomId);
    room.timer.timeRemaining = 0;
    
    RoomManager.startTimer(roomId);
    assert(room.timer.status === 'running', 'Timer starts running');
    assert(room.timer.timeRemaining === room.settings.focusDuration, 'timeRemaining reset from 0 to full duration');
    assert(room.timer.endTime > Date.now(), 'endTime set in the future');
    RoomManager.resetTimer(roomId);
  }

  console.log(`\nLifecycle tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});

