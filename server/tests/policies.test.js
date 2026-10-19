import test from 'node:test';
import assert from 'node:assert';
import { calculateShippingFee, checkCancellationEligibility, checkReturnEligibility, BRAND_INFO } from '../src/policies/brandPolicies.js';

test('Brand Policies - Shipping Fee Calculation', () => {
  // Orders below ₹499 must incur ₹50 fee
  const below = calculateShippingFee(400);
  assert.strictEqual(below.fee, 50);
  assert.strictEqual(below.isFree, false);

  // Orders equal to ₹499 must be Free Delivery
  const exactly499 = calculateShippingFee(499);
  assert.strictEqual(exactly499.fee, 0);
  assert.strictEqual(exactly499.isFree, true);

  // Orders above ₹499 must be Free Delivery
  const above = calculateShippingFee(850);
  assert.strictEqual(above.fee, 0);
  assert.strictEqual(above.isFree, true);
});

test('Brand Policies - Cancellation Policy Guardrails', () => {
  // Processing order can be cancelled
  const processingOrder = { order_id: 'ORD-103', status: 'Processing' };
  const processingResult = checkCancellationEligibility(processingOrder);
  assert.strictEqual(processingResult.eligible, true);

  // Out for Delivery cannot be cancelled online
  const outOrder = { order_id: 'ORD-101', status: 'Out for Delivery' };
  const outResult = checkCancellationEligibility(outOrder);
  assert.strictEqual(outResult.eligible, false);
  assert.match(outResult.message, /doorstep/i);

  // Delivered cannot be cancelled
  const deliveredOrder = { order_id: 'ORD-102', status: 'Delivered' };
  const deliveredResult = checkCancellationEligibility(deliveredOrder);
  assert.strictEqual(deliveredResult.eligible, false);
});

test('Brand Policies - Return Policy Guardrails', () => {
  // Delivered 14 days ago cannot be returned (> 7 days)
  const deliveredOld = { order_id: 'ORD-102', status: 'Delivered', delivered_days_ago: 14 };
  const oldResult = checkReturnEligibility(deliveredOld);
  assert.strictEqual(oldResult.eligible, false);
  assert.match(oldResult.message, /7 days/i);

  // Delivered 3 days ago is within 7-day window
  const deliveredRecent = { order_id: 'ORD-104', status: 'Delivered', delivered_days_ago: 3 };
  const recentResult = checkReturnEligibility(deliveredRecent);
  assert.strictEqual(recentResult.eligible, true);

  // Non-delivered item cannot be returned
  const notDelivered = { order_id: 'ORD-101', status: 'Out for Delivery', delivered_days_ago: null };
  const notDeliveredResult = checkReturnEligibility(notDelivered);
  assert.strictEqual(notDeliveredResult.eligible, false);
});
