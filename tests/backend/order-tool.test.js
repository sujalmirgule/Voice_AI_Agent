import test from 'node:test';
import assert from 'node:assert';
import { getOrderDetails, normalizeOrderId } from '../../server/src/tools/orderTool.js';

test('Order Tool - normalizeOrderId handles formatting variations', () => {
  assert.strictEqual(normalizeOrderId('ord 101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ORD 101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('order 101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ORDER-101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ord101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('ORD-101'), 'ORD-101');
  assert.strictEqual(normalizeOrderId('  ord-102  '), 'ORD-102');
  assert.strictEqual(normalizeOrderId('ord103'), 'ORD-103');
  assert.strictEqual(normalizeOrderId(null), null);
  assert.strictEqual(normalizeOrderId(''), null);
});

test('Order Tool - handles object argument with spoken variation', () => {
  const result = getOrderDetails({ order_id: 'order 101' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-101');
  assert.strictEqual(result.customer, 'Priya Sharma');
});

test('Order Tool - ORD-101 order lookup verification', () => {
  const result = getOrderDetails('ORD-101');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-101');
  assert.strictEqual(result.customer, 'Priya Sharma');
  assert.strictEqual(result.product, 'Vitamin C Serum (30ml)');
  assert.strictEqual(result.value, 699);
  assert.strictEqual(result.status, 'Out for Delivery');
  assert.strictEqual(result.courier, 'BlueDart');
  assert.strictEqual(result.tracking_number, 'BD-982103');
  assert.strictEqual(result.can_cancel, false);
});

test('Order Tool - ORD-102 order lookup verification', () => {
  const result = getOrderDetails('ORD-102');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-102');
  assert.strictEqual(result.customer, 'Rahul Verma');
  assert.strictEqual(result.product, 'Hydrating Sunscreen SPF 50');
  assert.strictEqual(result.value, 499);
  assert.strictEqual(result.status, 'Delivered');
  assert.strictEqual(result.can_return, false);
});

test('Order Tool - ORD-103 order lookup verification', () => {
  const result = getOrderDetails('ORD-103');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order_id, 'ORD-103');
  assert.strictEqual(result.customer, 'Ananya Patel');
  assert.strictEqual(result.product, 'Green Tea Face Wash + Toner');
  assert.strictEqual(result.value, 850);
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
