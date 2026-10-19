import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Frontend Failure Modes - Concurrency & Race Condition Safeguards (SCEN-A01, A03, E01, E02)', async (t) => {
  const appCode = fs.readFileSync(path.resolve('client/src/App.jsx'), 'utf8');

  await t.test('App.jsx protects against duplicate rapid Start Call clicks', () => {
    assert.ok(appCode.includes('if (isCallActive) return'), 'handleStartCall must be guarded against duplicate calls');
  });

  await t.test('App.jsx tracks callSessionId to discard late async responses after call end', () => {
    assert.ok(appCode.includes('callSessionIdRef'), 'App.jsx must use callSessionIdRef to track active call session');
    assert.ok(
      appCode.includes('callSessionIdRef.current !== currentSessionId') ||
      appCode.includes('callSessionIdRef.current !== sessionId'),
      'App.jsx must discard late responses arriving after call termination'
    );
  });

  await t.test('App.jsx clears active timers when ending or resetting a call', () => {
    assert.ok(appCode.includes('clearTimeout(greetingTimeoutRef.current)'), 'Clears greeting timeout on end call');
    assert.ok(appCode.includes('clearTimeout(speakingTimeoutRef.current)'), 'Clears speaking timeout on end call');
  });
});

test('Frontend Failure Modes - Audio Device & Speech Cleanup (SCEN-A09, E04)', async (t) => {
  const callInterfaceCode = fs.readFileSync(path.resolve('client/src/components/CallInterface.jsx'), 'utf8');

  await t.test('CallInterface stops recognition and cancels speech synthesis on cleanup', () => {
    assert.ok(callInterfaceCode.includes('recognitionRef.current.stop()'), 'Stops recognition stream on cleanup');
    assert.ok(callInterfaceCode.includes('synthRef.current.cancel()'), 'Cancels active speech synthesis on cleanup');
  });

  await t.test('CallInterface provides fallback text input when speech recognition is unavailable', () => {
    assert.ok(callInterfaceCode.includes('<form'), 'Includes text fallback form');
    assert.ok(callInterfaceCode.includes('setSpeechSupported(false)'), 'Detects unsupported speech API');
  });
});

test('Frontend Failure Modes - Keyboard Accessibility & Semantic Controls (SCEN-E06)', async (t) => {
  const callInterfaceCode = fs.readFileSync(path.resolve('client/src/components/CallInterface.jsx'), 'utf8');
  const summaryCode = fs.readFileSync(path.resolve('client/src/components/PostCallSummary.jsx'), 'utf8');

  await t.test('Interactive buttons have unique descriptive IDs and accessible titles', () => {
    assert.ok(callInterfaceCode.includes('id="start-call-btn"'), 'Has start-call-btn id');
    assert.ok(callInterfaceCode.includes('id="end-call-btn"'), 'Has end-call-btn id');
    assert.ok(callInterfaceCode.includes('title='), 'Mute button has descriptive title tooltip');
  });

  await t.test('PostCallSummary includes Copy JSON and New Call action buttons', () => {
    assert.ok(summaryCode.includes('Copy JSON') || summaryCode.includes('Copied JSON!'), 'Includes Copy JSON button');
    assert.ok(summaryCode.includes('New Call'), 'Includes New Call reset button');
  });
});
