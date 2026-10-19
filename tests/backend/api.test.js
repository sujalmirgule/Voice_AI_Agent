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

test('API - GET /api/health returns 200 and healthy metadata', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
  assert.strictEqual(data.service, 'Aura Skincare Voice CX API');
  assert.strictEqual(typeof data.uptime, 'number');
});

test('API - GET /api/orders returns all sample orders', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/orders`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(Array.isArray(data.orders), true);
  assert.strictEqual(data.orders.length, 3);
});

test('API - GET /api/orders/ORD-101 returns 200 and order details', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/orders/ORD-101`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.order_id, 'ORD-101');
  assert.strictEqual(data.customer, 'Priya Sharma');
  assert.strictEqual(data.status, 'Out for Delivery');
});

test('API - GET /api/orders/ORD-999 returns 404 for unknown order', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/orders/ORD-999`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'ORDER_NOT_FOUND');
});

test('API - GET /api/policies returns brand information and policies', async () => {
  const res = await fetch(`${testEnv.baseUrl}/api/policies`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.brand.name, 'Aura Skincare');
  assert.strictEqual(data.brand.policies.shipping.freeShippingThreshold, 499);
});
