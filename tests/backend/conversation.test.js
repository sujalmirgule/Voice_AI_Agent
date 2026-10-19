import test from 'node:test';
import assert from 'node:assert';
import { executeLocalFallbackTurn } from '../../server/src/services/groqService.js';
import { MockAiProvider } from '../mocks/ai-provider.mock.js';

test('Conversation - Out-of-scope query deflection', () => {
  const messages = [{ role: 'user', content: 'Can you book me a flight to Goa?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /Aura Skincare/i);
});

test('Conversation - Live order lookup turn (ORD-101)', () => {
  const messages = [{ role: 'user', content: 'Can you tell me where my order ORD-101 is?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.notStrictEqual(result.tool_called, null);
  assert.strictEqual(result.tool_called.name, 'get_order_details');
  assert.strictEqual(result.tool_called.args.order_id, 'ORD-101');
  assert.match(result.agent_text, /Out for Delivery/i);
  assert.match(result.agent_text, /BlueDart/i);
});

test('Conversation - Policy question: Return of opened item after 20 days', () => {
  const messages = [{ role: 'user', content: 'I bought this 20 days ago and have opened it. Can I return it?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /7 days/i);
  assert.match(result.agent_text, /cannot be returned/i);
});

test('Conversation - Unclear or muffled speech handling', () => {
  const messages = [{ role: 'user', content: '[unclear]' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /couldn't hear that clearly/i);
});

test('Conversation - Order tracking inquiry without order ID', () => {
  const messages = [{ role: 'user', content: 'Can you please track my order?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /provide your.*order ID/i);
});

test('Conversation - Damaged product 48h reporting rule', () => {
  const messages = [{ role: 'user', content: 'My product arrived broken in the package, what should I do?' }];
  const result = executeLocalFallbackTurn(messages);
  assert.strictEqual(result.tool_called, null);
  assert.match(result.agent_text, /48 hours/i);
  assert.match(result.agent_text, /photos/i);
});

test('Conversation - Hermetic Mock AI Provider execution', async () => {
  const mockProvider = new MockAiProvider({
    'Hello Aria': { agent_text: 'Namaste! Welcome to Aura Skincare.' }
  });
  const turnResult = await mockProvider.processTurn({
    messages: [{ role: 'user', content: 'Hello Aria' }]
  });
  assert.strictEqual(turnResult.agent_text, 'Namaste! Welcome to Aura Skincare.');
  assert.strictEqual(turnResult.provider, 'mock-ai-provider');
});
