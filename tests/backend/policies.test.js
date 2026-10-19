import test from 'node:test';
import assert from 'node:assert';
import { calculateShippingFee, checkCancellationEligibility, checkReturnEligibility, BRAND_INFO } from '../../server/src/policies/brandPolicies.js';

test('Brand Policies - Shipping Fee Calculation Boundaries', () => {
  // Below 499 (498 INR)
  const below = calculateShippingFee(498);
  assert.strictEqual(below.fee, 50);
  assert.strictEqual(below.isFree, false);

  // Exactly 499 INR (Free threshold)
  const exact = calculateShippingFee(499);
  assert.strictEqual(exact.fee, 0);
  assert.strictEqual(exact.isFree, true);

  // Above 499 (850 INR)
  const above = calculateShippingFee(850);
  assert.strictEqual(above.fee, 0);
  assert.strictEqual(above.isFree, true);

  // Malformed or NaN input falls back to standard fee
  const invalid = calculateShippingFee('free');
  assert.strictEqual(invalid.fee, 50);
});

test('Brand Policies - Delivery Window and Brand Info', () => {
  assert.strictEqual(BRAND_INFO.policies.shipping.deliveryWindow, '3–5 business days');
  assert.strictEqual(BRAND_INFO.policies.cod.maxLimit, 2500);
});

test('Brand Policies - Cancellation Policy Guardrails', () => {
  // Processing order can cancel
  const processingOrder = { order_id: 'ORD-103', status: 'Processing' };
  const processingResult = checkCancellationEligibility(processingOrder);
  assert.strictEqual(processingResult.eligible, true);

  // Out for Delivery cannot cancel online (refusal at doorstep)
  const outOrder = { order_id: 'ORD-101', status: 'Out for Delivery' };
  const outResult = checkCancellationEligibility(outOrder);
  assert.strictEqual(outResult.eligible, false);
  assert.match(outResult.message, /refuse delivery at the doorstep/i);

  // Shipped cannot cancel online
  const shippedOrder = { order_id: 'ORD-104', status: 'Shipped' };
  const shippedResult = checkCancellationEligibility(shippedOrder);
  assert.strictEqual(shippedResult.eligible, false);

  // Delivered cannot cancel
  const deliveredOrder = { order_id: 'ORD-102', status: 'Delivered' };
  const deliveredResult = checkCancellationEligibility(deliveredOrder);
  assert.strictEqual(deliveredResult.eligible, false);
});

test('Brand Policies - Return Policy Guardrails', () => {
  // Delivered 14 days ago (> 7 days) cannot return
  const oldDelivered = { order_id: 'ORD-102', status: 'Delivered', delivered_days_ago: 14 };
  const oldResult = checkReturnEligibility(oldDelivered);
  assert.strictEqual(oldResult.eligible, false);
  assert.match(oldResult.message, /7 days/i);

  // Delivered 5 days ago (within 7 days) can return unopened
  const recentDelivered = { order_id: 'ORD-105', status: 'Delivered', delivered_days_ago: 5 };
  const recentResult = checkReturnEligibility(recentDelivered);
  assert.strictEqual(recentResult.eligible, true);

  // Non-delivered order cannot return
  const nonDelivered = { order_id: 'ORD-101', status: 'Out for Delivery', delivered_days_ago: null };
  const nonDeliveredResult = checkReturnEligibility(nonDelivered);
  assert.strictEqual(nonDeliveredResult.eligible, false);
});
