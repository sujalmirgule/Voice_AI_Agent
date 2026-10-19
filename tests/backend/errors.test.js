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

test('Errors - Unmatched /api/* route returns 404 with structured JSON', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/non-existent-route`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'NOT_FOUND');
  assert.match(data.message, /does not exist/i);
});

test('Errors - Malformed JSON body returns 400 without crashing', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"invalidJson":'
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'MALFORMED_JSON');
});
