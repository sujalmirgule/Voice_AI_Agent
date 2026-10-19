import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Welcome Screen & Demo Entry Navigation Contracts', async (t) => {
  const clientSrcPath = path.resolve('client/src');
  const welcomeScreenCode = fs.readFileSync(path.join(clientSrcPath, 'components/WelcomeScreen.jsx'), 'utf8');
  const appCode = fs.readFileSync(path.join(clientSrcPath, 'App.jsx'), 'utf8');
  const headerCode = fs.readFileSync(path.join(clientSrcPath, 'components/Header.jsx'), 'utf8');

  await t.test('WelcomeScreen renders branded headline and product identity', () => {
    assert.ok(welcomeScreenCode.includes('Aura Skincare'), 'Includes Aura Skincare brand');
    assert.ok(welcomeScreenCode.includes('VOICE CX'), 'Includes VOICE CX product tag');
    assert.ok(
      welcomeScreenCode.includes('Meet Aria. Your AI Customer Support Specialist.'),
      'Includes designated evaluator headline'
    );
  });

  await t.test('WelcomeScreen provides primary and secondary CTAs with semantic IDs', () => {
    assert.ok(welcomeScreenCode.includes('id="enter-workspace-btn"'), 'Has enter-workspace-btn ID');
    assert.ok(welcomeScreenCode.includes('id="explore-scenarios-btn"'), 'Has explore-scenarios-btn ID');
    assert.ok(welcomeScreenCode.includes('Enter Demo Workspace'), 'Has Enter Demo Workspace CTA text');
    assert.ok(welcomeScreenCode.includes('Explore Test Scenarios'), 'Has Explore Test Scenarios CTA text');
  });

  await t.test('WelcomeScreen NEVER requests microphone permission on page load', () => {
    assert.ok(!welcomeScreenCode.includes('getUserMedia'), 'Must NOT call getUserMedia on welcome screen');
    assert.ok(!welcomeScreenCode.includes('SpeechRecognition'), 'Must NOT initialize SpeechRecognition on welcome screen');
  });

  await t.test('WelcomeScreen binds readiness badges to real backend API health', () => {
    assert.ok(welcomeScreenCode.includes('apiClient.getHealth()'), 'Fetches real backend health data');
    assert.ok(welcomeScreenCode.includes('groq_configured'), 'Reflects actual Groq LPU engine status');
    assert.ok(welcomeScreenCode.includes('Deterministic Guardrails Active'), 'Provides graceful fallback label');
  });

  await t.test('App.jsx provides seamless transition between WelcomeScreen and Workspace', () => {
    assert.ok(appCode.includes("const [currentView, setCurrentView] = useState('workspace')"), 'Initial view is workspace');
    assert.ok(appCode.includes('currentView === \'welcome\''), 'Renders WelcomeScreen conditionally');
    assert.ok(appCode.includes('onEnterWorkspace'), 'Provides workspace entry handler');
    assert.ok(appCode.includes('onExploreScenarios'), 'Provides scenario exploration handler');
    assert.ok(appCode.includes('onOpenWelcome'), 'Passes navigation callback to Header');
    assert.ok(appCode.includes('<CompactOrderSelector'), 'Renders CompactOrderSelector directly below Header in workspace');
  });

  await t.test('CompactOrderSelector provides immediate order access and disclaimer', () => {
    const selectorCode = fs.readFileSync(path.join(clientSrcPath, 'components/CompactOrderSelector.jsx'), 'utf8');
    assert.ok(selectorCode.includes('ORD-101'), 'Includes ORD-101');
    assert.ok(selectorCode.includes('ORD-102'), 'Includes ORD-102');
    assert.ok(selectorCode.includes('ORD-103'), 'Includes ORD-103');
    assert.ok(selectorCode.includes('Assessment demo data — not live customer records'), 'Displays required evaluator disclaimer');
    assert.ok(selectorCode.includes('onSelectOrderPrompt'), 'Provides click-to-test prompt trigger');
  });

  await t.test('Header allows evaluators to return to the Welcome overview', () => {
    assert.ok(headerCode.includes('onOpenWelcome'), 'Accepts onOpenWelcome prop');
    assert.ok(headerCode.includes('Overview') || headerCode.includes('Welcome'), 'Provides return button');
  });

  await t.test('Client source code contains zero exposed API keys or secrets', () => {
    const clientFiles = [
      'App.jsx',
      'components/CompactOrderSelector.jsx',
      'components/WelcomeScreen.jsx',
      'components/CallInterface.jsx',
      'components/Header.jsx',
      'components/OrdersHelper.jsx',
      'components/PostCallSummary.jsx',
      'components/TranscriptView.jsx',
      'lib/api.js'
    ];

    for (const relFile of clientFiles) {
      const code = fs.readFileSync(path.join(clientSrcPath, relFile), 'utf8');
      assert.ok(!code.includes('gsk_'), `${relFile} must not contain any Groq secret key`);
      assert.ok(!code.includes('process.env.GROQ_API_KEY'), `${relFile} must not reference backend env key directly`);
    }
  });
});
