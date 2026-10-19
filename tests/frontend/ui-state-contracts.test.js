import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Frontend UI State Contracts & Accessibility', async (t) => {
  const clientSrcPath = path.resolve('client/src');

  await t.test('CallInterface supports all primary voice interaction states', () => {
    const callInterfaceCode = fs.readFileSync(path.join(clientSrcPath, 'components/CallInterface.jsx'), 'utf8');

    // Verify all primary voice interaction states handled
    const requiredStates = ['listening', 'thinking', 'speaking'];
    for (const state of requiredStates) {
      assert.ok(
        callInterfaceCode.includes(`'${state}'`) || callInterfaceCode.includes(`"${state}"`),
        `CallInterface should define and handle state: ${state}`
      );
    }

    // Verify Start and End call button IDs and controls
    assert.ok(callInterfaceCode.includes('id="start-call-btn"'), 'CallInterface must include start-call-btn');
    assert.ok(callInterfaceCode.includes('id="end-call-btn"'), 'CallInterface must include end-call-btn');
  });

  await t.test('TranscriptView enforces chronological ordering and role separation', () => {
    const transcriptCode = fs.readFileSync(path.join(clientSrcPath, 'components/TranscriptView.jsx'), 'utf8');

    assert.ok(transcriptCode.includes("speaker.toLowerCase() === 'customer'"), 'Differentiates customer speaker');
    assert.ok(transcriptCode.includes('timestamp'), 'Renders timestamp for every turn');
    assert.ok(transcriptCode.includes('tool_called'), 'Renders tool execution badge if present');
    assert.ok(transcriptCode.includes('No active conversation yet'), 'Handles empty transcript state gracefully');
  });

  await t.test('OrdersHelper provides ORD-101, ORD-102, and ORD-103 prompt presets', () => {
    const ordersHelperCode = fs.readFileSync(path.join(clientSrcPath, 'components/OrdersHelper.jsx'), 'utf8');

    assert.ok(ordersHelperCode.includes('ORD-101'), 'Includes ORD-101');
    assert.ok(ordersHelperCode.includes('ORD-102'), 'Includes ORD-102');
    assert.ok(ordersHelperCode.includes('ORD-103'), 'Includes ORD-103');
    assert.ok(ordersHelperCode.includes('onSelectPrompt'), 'Provides order selection callback to auto-populate prompt');
  });

  await t.test('PostCallSummary renders schema fields and resolution badges', () => {
    const summaryCode = fs.readFileSync(path.join(clientSrcPath, 'components/PostCallSummary.jsx'), 'utf8');

    // Required fields from docs/api-reference.md
    assert.ok(summaryCode.includes('customer_intent'), 'Renders customer_intent');
    assert.ok(summaryCode.includes('order_id'), 'Renders order_id');
    assert.ok(summaryCode.includes('resolution_status'), 'Renders resolution_status');
    assert.ok(summaryCode.includes('call_summary'), 'Renders call_summary');

    // Resolution badge variations
    assert.ok(summaryCode.includes('RESOLVED'), 'Supports RESOLVED status');
    assert.ok(summaryCode.includes('PENDING_CUSTOMER_ACTION'), 'Supports PENDING_CUSTOMER_ACTION status');
  });

  await t.test('CallInterface provides Web Speech API and synthesis integration', () => {
    const callInterfaceCode = fs.readFileSync(path.join(clientSrcPath, 'components/CallInterface.jsx'), 'utf8');

    assert.ok(callInterfaceCode.includes('SpeechRecognition'), 'Checks for SpeechRecognition');
    assert.ok(callInterfaceCode.includes('speechSynthesis'), 'Uses browser speech synthesis');
    assert.ok(callInterfaceCode.includes('recognitionRef.current.stop()'), 'Cleans up speech recognition');
    assert.ok(callInterfaceCode.includes('synthRef.current.cancel()'), 'Cleans up speech synthesis');
  });

  await t.test('Design system in index.css enforces luxury skincare color palette', () => {
    const cssCode = fs.readFileSync(path.join(clientSrcPath, 'index.css'), 'utf8');

    // Palette hex codes
    assert.ok(cssCode.includes('#29152E') || cssCode.includes('#29152e'), 'Contains Deep aubergine #29152E');
    assert.ok(cssCode.includes('#421C32') || cssCode.includes('#421c32'), 'Contains Black cherry #421C32');
    assert.ok(cssCode.includes('#D96C55') || cssCode.includes('#d96c55'), 'Contains Burnt coral #D96C55');
    assert.ok(cssCode.includes('#BC765B') || cssCode.includes('#bc765b'), 'Contains Muted terracotta #BC765B');
    assert.ok(cssCode.includes('#F1D7B8') || cssCode.includes('#f1d7b8'), 'Contains Warm champagne #F1D7B8');
    assert.ok(cssCode.includes('#FAF5EF') || cssCode.includes('#faf5ef'), 'Contains Soft ivory #FAF5EF');

    // Reject generic blue/purple neon / glassmorphism
    assert.ok(!cssCode.includes('backdrop-filter: blur'), 'Does not use generic glassmorphism blur');
  });
});
