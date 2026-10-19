import test from 'node:test';
import assert from 'node:assert';
import { executeLocalFallbackTurn } from '../src/services/groqService.js';
import { generateDeterministicSummary } from '../src/services/summaryService.js';

test('Conversational Guardrails - Out-of-scope request deflection', () => {
  const messages = [{ role: 'user', content: 'Can you book me a flight to Goa?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /Aura Skincare/i);
});

test('Conversational Guardrails - Order lookup turn (ORD-101)', () => {
  const messages = [{ role: 'user', content: 'Can you tell me where my order ORD-101 is?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.notStrictEqual(result.tool_called, null);
  assert.strictEqual(result.tool_called.name, 'get_order_details');
  assert.strictEqual(result.tool_called.args.order_id, 'ORD-101');
  assert.match(result.agent_text, /Out for Delivery/i);
  assert.match(result.agent_text, /BlueDart/i);
});

test('Conversational Guardrails - Policy question: Return of opened item after 20 days', () => {
  const messages = [{ role: 'user', content: 'I bought this 20 days ago and have opened it. Can I return it?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /7 days/i);
  assert.match(result.agent_text, /cannot be returned/i);
});

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
});
