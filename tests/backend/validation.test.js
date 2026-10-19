import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from '../helpers/test-server.js';

let testEnv;

test.before(async () => {
  testEnv = await createTestServer();
});

test.after(async () => {
  if (testEnv) await testEnv.closeServer();
});

test('Validation - POST /api/voice/process-turn missing body returns 400', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'MISSING_USER_INPUT');
});

test('Validation - POST /api/voice/process-turn with empty text string returns 400', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '   ' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'MISSING_USER_INPUT');
});

test('Validation - POST /api/voice/process-turn with invalid messages format returns 400', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello', messages: 'not-an-array-json' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'INVALID_MESSAGES_FORMAT');
});

test('Validation - POST /api/call/summary with non-array transcript returns 400', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/call/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'invalid' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'INVALID_TRANSCRIPT');
});
