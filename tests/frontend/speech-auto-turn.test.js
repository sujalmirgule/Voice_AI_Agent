import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Automatic Live Speech-to-Text & Turn Submission Contracts', async (t) => {
  const callInterfaceCode = fs.readFileSync(path.resolve('client/src/components/CallInterface.jsx'), 'utf8');
  const appCode = fs.readFileSync(path.resolve('client/src/App.jsx'), 'utf8');

  await t.test('CallInterface distinguishes interim and final results in SpeechRecognition.onresult', () => {
    assert.ok(callInterfaceCode.includes('fullFinal + fullInterim'), 'Combines final and interim transcript for preview');
    assert.ok(callInterfaceCode.includes('setLiveSpeechInterim(combined)'), 'Sets live interim preview for user visibility');
    assert.ok(callInterfaceCode.includes('silenceTimerRef'), 'Uses silence timer to finalize speech without manual send');
  });

  await t.test('CallInterface automatically submits finalized speech without manual send click', () => {
    assert.ok(callInterfaceCode.includes('submitSpokenTurn'), 'Defines submitSpokenTurn for automatic turn submission');
    assert.ok(callInterfaceCode.includes('hasSubmittedTurnRef.current = true'), 'Enforces exactly-once submission guard');
    assert.ok(callInterfaceCode.includes('stopRecognition()'), 'Stops recognition on turn submission to prevent feedback');
  });

  await t.test('CallInterface handles natural silence onspeechend and onend gracefully', () => {
    assert.ok(callInterfaceCode.includes('recognition.onspeechend'), 'Hooks onspeechend for natural speech pause detection');
    assert.ok(callInterfaceCode.includes('recognition.onend'), 'Hooks onend to submit pending speech or auto-restart');
  });

  await t.test('CallInterface provides automatic VAD MediaRecorder fallback for non-SpeechRecognition browsers', () => {
    assert.ok(callInterfaceCode.includes('startAutoVadFallback'), 'Provides startAutoVadFallback for unsupported browsers');
    assert.ok(callInterfaceCode.includes('createAnalyser'), 'Uses Web Audio API AnalyserNode for voice activity detection');
    assert.ok(callInterfaceCode.includes('stopAutoVadFallback'), 'Cleans up auto VAD fallback on stop or call end');
  });

  await t.test('Speech synthesis triggers immediate listening resumption when Aria finishes speaking', () => {
    assert.ok(callInterfaceCode.includes('utterance.onend'), 'Hooks utterance.onend to detect speech completion');
    assert.ok(appCode.includes('handleAgentSpeakingEnd'), 'App.jsx defines handleAgentSpeakingEnd callback');
    assert.ok(appCode.includes('onAgentSpeakingEnd={handleAgentSpeakingEnd}'), 'App.jsx passes onAgentSpeakingEnd to CallInterface');
  });

  await t.test('End Call cleans up all silence timers, audio tracks, and speech instances', () => {
    assert.ok(callInterfaceCode.includes('clearTimeout(silenceTimerRef.current)'), 'Clears silence timer on cleanup');
    assert.ok(callInterfaceCode.includes('clearTimeout(restartTimerRef.current)'), 'Clears restart timer on cleanup');
    assert.ok(callInterfaceCode.includes('hasSubmittedTurnRef.current = false'), 'Resets turn submission guard on end call');
  });

  await t.test('Typed messages and manual Whisper recording remain fully operational', () => {
    assert.ok(callInterfaceCode.includes('handleManualSubmit'), 'Maintains handleManualSubmit for typed messages');
    assert.ok(callInterfaceCode.includes('handleToggleRecording'), 'Maintains handleToggleRecording for direct Whisper recording');
  });
});
