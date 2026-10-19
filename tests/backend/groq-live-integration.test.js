import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from '../helpers/test-server.js';
import { isGroqConfigured } from '../../server/src/config/index.js';

let testEnv;

test.before(async () => {
  testEnv = await createTestServer();
});

test.after(async () => {
  if (testEnv) await testEnv.closeServer();
});

test('Live Groq API Integration Suite', async (t) => {
  await t.test('Environment verification - Groq API key is configured and valid', () => {
    assert.equal(isGroqConfigured(), true, 'Groq API key should be active and configured in environment');
  });

  await t.test('GET /api/health confirms groq_configured is true', async () => {
    const res = await fetch(`${testEnv.baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.groq_configured, true);
  });

  await t.test('POST /api/voice/process-turn generates live AI response via Groq LPU', async () => {
    const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello Aria, what is Aura Skincare?',
        messages: []
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.agent_text);
    assert.ok(data.provider);
    assert.match(data.provider, /groq-/i);
    assert.match(data.agent_text, /Aura Skincare|organic|skincare/i);
  });

  await t.test('POST /api/voice/process-turn with audio file executes live Whisper STT transcription', async () => {
    // Generate minimal valid WAV buffer
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = sampleRate * numChannels * (bitsPerSample / 8);
    const wavBuffer = Buffer.alloc(44 + dataSize);
    wavBuffer.write("RIFF", 0);
    wavBuffer.writeUInt32LE(36 + dataSize, 4);
    wavBuffer.write("WAVE", 8);
    wavBuffer.write("fmt ", 12);
    wavBuffer.writeUInt32LE(16, 16);
    wavBuffer.writeUInt16LE(1, 20);
    wavBuffer.writeUInt16LE(numChannels, 22);
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    wavBuffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    wavBuffer.writeUInt16LE(bitsPerSample, 34);
    wavBuffer.write("data", 36);
    wavBuffer.writeUInt32LE(dataSize, 40);

    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'turn.wav');
    formData.append('messages', JSON.stringify([]));

    const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.user_text, 'Should contain recognized transcript from Whisper');
    assert.ok(data.agent_text);
  });

  await t.test('POST /api/voice/process-turn executes tool-call for order ORD-101', async () => {
    const res = await fetch(`${testEnv.baseUrl}/api/voice/process-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Where is my order ORD-101?',
        messages: []
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.agent_text);
    assert.ok(data.tool_called);
    assert.equal(data.tool_called.name, 'get_order_details');
    assert.match(data.agent_text, /Priya Sharma|Out for Delivery|BlueDart/i);
  });

  await t.test('POST /api/voice/tts handles speech synthesis request', async () => {
    const res = await fetch(`${testEnv.baseUrl}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Namaste! Welcome to Aura Skincare.'
      })
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio')) {
      // Audio returned directly
      const buffer = await res.arrayBuffer();
      assert.ok(buffer.byteLength > 0);
    } else {
      // JSON response indicating status or terms requirement fallback
      const data = await res.json();
      assert.equal(data.fallback, 'browser_synthesis');
      assert.ok(data.reason);
    }
  });

  await t.test('POST /api/voice/tts rejects missing text with 400 MISSING_TEXT', async () => {
    const res = await fetch(`${testEnv.baseUrl}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'MISSING_TEXT');
  });
});
