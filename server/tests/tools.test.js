import test from 'node:test';
import assert from 'node:assert';
import { getOrderDetails, normalizeOrderId } from '../src/tools/orderTool.js';

test('Order Tool - normalizeOrderId handles formatting variations', () => {
  assert.strictEqual(normalizeOrderId('ord-101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ORD 101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ord101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ORD-102'), 'ORD-102');
  assert.strictEqual(normalizeOrderId('ord 103'), 'ORD-103');
  assert.strictEqual(normalizeOrderId(null), null);
});

test('Order Tool - getOrderDetails retrieves ORD-101', () => {
  const result = getOrderDetails('ORD-101');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-101');
  assert.strictEqual(result.customer, 'Priya Sharma');
  assert.strictEqual(result.product, 'Vitamin C Serum (30ml)');
  assert.strictEqual(result.status, 'Out for Delivery');
  assert.strictEqual(result.courier, 'BlueDart');
  assert.strictEqual(result.can_cancel, false);
});

test('Order Tool - getOrderDetails retrieves ORD-102', () => {
  const result = getOrderDetails('ORD-102');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-102');
  assert.strictEqual(result.customer, 'Rahul Verma');
  assert.strictEqual(result.status, 'Delivered');
  assert.strictEqual(result.can_return, false);
});

test('Order Tool - getOrderDetails retrieves ORD-103', () => {
  const result = getOrderDetails('ORD-103');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-103');
  assert.strictEqual(result.customer, 'Ananya Patel');
  assert.strictEqual(result.status, 'Processing');
  assert.strictEqual(result.can_cancel, true);
});

test('Order Tool - Graceful degradation on missing or invalid order ID', () => {
  const missing = getOrderDetails('');
  assert.strictEqual(missing.success, false);
  assert.strictEqual(missing.error, 'MISSING_ORDER_ID');

  const notFound = getOrderDetails('ORD-999');
  assert.strictEqual(notFound.success, false);
  assert.strictEqual(notFound.error, 'ORDER_NOT_FOUND');
  assert.match(notFound.message, /could not locate/i);
});
