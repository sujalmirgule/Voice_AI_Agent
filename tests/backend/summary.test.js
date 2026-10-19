import test from 'node:test';
import assert from 'node:assert';
import { generateDeterministicSummary } from '../../server/src/services/summaryService.js';

test('Post-Call Summary - Generates compliant JSON structure for ORD-101', () => {
  const transcript = [
    { speaker: 'Customer', text: 'Can you tell me where my order ORD-101 is?' },
    { speaker: 'Aria', text: 'Your order ORD-101 for Priya Sharma is Out for Delivery via BlueDart and is expected by 6 PM today.' }
  ];
  const summary = generateDeterministicSummary(transcript);
  assert.strictEqual(summary.customer_intent, 'ORDER_TRACKING');
  assert.strictEqual(summary.order_id, 'ORD-101');
  assert.strictEqual(summary.resolution_status, 'RESOLVED');
  assert.match(summary.call_summary, /ORD-101/);
  assert.strictEqual(summary.total_turns, 2);
  assert.strictEqual(typeof summary.timestamp, 'string');
});

test('Post-Call Summary - Assigns PENDING_CUSTOMER_ACTION when order ID is unknown', () => {
  const transcript = [
    { speaker: 'Customer', text: 'Can you check ORD-999?' },
    { speaker: 'Aria', text: "I couldn't locate an order with ID ORD-999. Could you please verify or repeat the ID?" }
  ];
  const summary = generateDeterministicSummary(transcript);
  assert.strictEqual(summary.customer_intent, 'ORDER_TRACKING');
  assert.strictEqual(summary.resolution_status, 'PENDING_CUSTOMER_ACTION');
  assert.match(summary.call_summary, /unrecognized/i);
});

test('Post-Call Summary - Assigns PENDING_CUSTOMER_ACTION for damaged item reporting', () => {
  const transcript = [
    { speaker: 'Customer', text: 'My package was damaged.' },
    { speaker: 'Aria', text: 'Please report damaged products within 48 hours of delivery with photos for a free replacement.' }
  ];
  const summary = generateDeterministicSummary(transcript);
  assert.strictEqual(summary.customer_intent, 'RETURN_REQUEST');
  assert.strictEqual(summary.resolution_status, 'PENDING_CUSTOMER_ACTION');
  assert.match(summary.call_summary, /48 hours/i);
});

test('Post-Call Summary - Empty transcript returns safe default summary', () => {
  const summary = generateDeterministicSummary([]);
  assert.strictEqual(summary.customer_intent, 'GENERAL_INQUIRY');
  assert.strictEqual(summary.order_id, null);
  assert.strictEqual(summary.resolution_status, 'RESOLVED');
  assert.strictEqual(summary.total_turns, 0);
});
