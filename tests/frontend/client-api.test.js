import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../client/src/lib/api.js';
import { createTestServer } from '../helpers/test-server.js';

test('Frontend API Client - Contract Verification', async (t) => {
  const { baseUrl, closeServer } = await createTestServer();
  const client = createApiClient(baseUrl);

  t.after(async () => {
    await closeServer();
  });

  await t.test('client.getHealth returns backend status and environment info', async () => {
    const data = await client.getHealth();
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'Aura Skincare Voice CX API');
    assert.equal(typeof data.uptime, 'number');
  });

  await t.test('client.getOrders returns available sample orders', async () => {
    const data = await client.getOrders();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.orders));
    assert.equal(data.orders.length, 3);
    const orderIds = data.orders.map(o => o.order_id);
    assert.ok(orderIds.includes('ORD-101'));
    assert.ok(orderIds.includes('ORD-102'));
    assert.ok(orderIds.includes('ORD-103'));
  });

  await t.test('client.getOrderById retrieves exact order ORD-101 details', async () => {
    const data = await client.getOrderById('ORD-101');
    assert.equal(data.success, true);
    assert.equal(data.order_id, 'ORD-101');
    assert.equal(data.customer, 'Priya Sharma');
    assert.equal(data.status, 'Out for Delivery');
  });

  await t.test('client.getOrderById throws descriptive error for unknown order', async () => {
    await assert.rejects(
      async () => {
        await client.getOrderById('ORD-UNKNOWN');
      },
      (err) => {
        assert.equal(err.status, 404);
        assert.match(err.message, /could not locate/i);
        return true;
      }
    );
  });

  await t.test('client.getPolicies returns Aura return, shipping, and brand info', async () => {
    const data = await client.getPolicies();
    assert.equal(data.success, true);
    assert.equal(data.brand.name, 'Aura Skincare');
    assert.equal(data.brand.policies.shipping.freeShippingThreshold, 499);
    assert.equal(data.brand.policies.returns.windowDays, 7);
  });

  await t.test('client.processVoiceTurn executes turn and returns assistant response', async () => {
    const response = await client.processVoiceTurn({
      text: 'Where is my order ORD-101?',
      messages: []
    });
    assert.equal(response.success, true);
    assert.ok(response.agent_text);
    assert.match(response.agent_text, /Priya Sharma|Out for Delivery|Vitamin C Serum/i);
  });

  await t.test('client.generateSummary produces structured resolution status', async () => {
    const res = await client.generateSummary([
      { speaker: 'customer', text: 'Where is my order ORD-101?' },
      { speaker: 'assistant', text: 'Your order ORD-101 for Priya Sharma is Out for Delivery.' }
    ]);
    assert.equal(res.success, true);
    assert.ok(res.summary);
    assert.equal(res.summary.order_id, 'ORD-101');
    assert.equal(res.summary.resolution_status, 'RESOLVED');
    assert.ok(res.summary.customer_intent);
  });
});

test('Frontend API Client - Network and Timeout Resilience', async (t) => {
  await t.test('client request aborts with error when destination unavailable', async () => {
    // Point to non-routable address with immediate abortion
    const controller = new AbortController();
    controller.abort();
    const client = createApiClient('http://127.0.0.1:9999');
    await assert.rejects(
      async () => {
        await client.getHealth();
      },
      (err) => {
        assert.ok(err);
        return true;
      }
    );
  });
});
