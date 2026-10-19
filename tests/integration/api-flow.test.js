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

test('Integration Flow - Full Call Lifecycle (Health -> Orders -> Turn -> Policy -> Summary)', async () => {
  // Step 1: Health check
  const healthRes = await fetch(`${testEnv.baseUrl}/api/health`);
  assert.strictEqual(healthRes.status, 200);

  // Step 2: Retrieve mock orders helper
  const ordersRes = await fetch(`${testEnv.baseUrl}/api/orders`);
  assert.strictEqual(ordersRes.status, 200);
  const ordersData = await ordersRes.json();
  assert.strictEqual(ordersData.orders.some(o => o.order_id === 'ORD-101'), true);

  // Step 3: Turn 1 - Order tracking request
  const turn1Res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Where is my order ORD-101?',
      messages: []
    })
  });
  assert.strictEqual(turn1Res.status, 200);
  const turn1Data = await turn1Res.json();
  assert.strictEqual(turn1Data.success, true);
  assert.notStrictEqual(turn1Data.tool_called, null);
  assert.strictEqual(turn1Data.tool_called.name, 'get_order_details');
  assert.strictEqual(turn1Data.tool_called.args.order_id, 'ORD-101');
  assert.match(turn1Data.agent_text, /BlueDart/i);

  // Step 4: Turn 2 - Policy query on the same order
  const turn2Res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Can I cancel order ORD-101?',
      messages: [
        { role: 'user', content: 'Where is my order ORD-101?' },
        { role: 'assistant', content: turn1Data.agent_text }
      ]
    })
  });
  assert.strictEqual(turn2Res.status, 200);
  const turn2Data = await turn2Res.json();
  assert.strictEqual(turn2Data.success, true);
  assert.match(turn2Data.agent_text, /Out for Delivery/i);
  assert.match(turn2Data.agent_text, /refuse.*(doorstep|arrives|package|delivery)/i);

  // Step 5: Conclude call and generate post-call summary
  const transcript = [
    { speaker: 'Customer', text: 'Where is my order ORD-101?' },
    { speaker: 'Aria', text: turn1Data.agent_text },
    { speaker: 'Customer', text: 'Can I cancel order ORD-101?' },
    { speaker: 'Aria', text: turn2Data.agent_text }
  ];

  const summaryRes = await fetch(`${testEnv.baseUrl}/api/call/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript })
  });
  assert.strictEqual(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  assert.strictEqual(summaryData.success, true);
  assert.strictEqual(summaryData.summary.customer_intent, 'CANCELLATION_REQUEST');
  assert.strictEqual(summaryData.summary.order_id, 'ORD-101');
  assert.ok(['RESOLVED', 'PENDING_CUSTOMER_ACTION'].includes(summaryData.summary.resolution_status));
  assert.match(summaryData.summary.call_summary, /ORD-101/);
});
