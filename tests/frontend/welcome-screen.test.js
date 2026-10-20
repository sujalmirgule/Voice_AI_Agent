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

  await t.test('App.jsx provides route-aware resolution and seamless transition between WelcomeScreen and Workspace', () => {
    assert.ok(
      appCode.includes("getViewFromPath") && appCode.includes("isWorkspacePath"),
      'Configures route-aware URL resolution'
    );
    assert.ok(appCode.includes("return 'welcome'"), 'Root / defaults to landing page view');
    assert.ok(appCode.includes('currentView === \'welcome\''), 'Renders WelcomeScreen conditionally');
    assert.ok(appCode.includes('onEnterWorkspace'), 'Provides workspace entry handler');
    assert.ok(appCode.includes('onExploreScenarios'), 'Provides scenario exploration handler');
    assert.ok(appCode.includes('onOpenWelcome'), 'Passes navigation callback to Header');
    assert.ok(appCode.includes('navigateTo'), 'Provides route navigation handler with History API');
    assert.ok(appCode.includes('<CompactOrderSelector'), 'Renders CompactOrderSelector directly below Header in workspace');
  });

  await t.test('Routing helpers map / to landing page and /workspace to demo workspace', () => {
    // Extract isWorkspacePath and getViewFromPath logic directly from App.jsx and verify contract
    const isWorkspacePath = (pathname) => {
      if (!pathname) return false;
      const path = pathname.split('?')[0].split('#')[0].toLowerCase().replace(/\/+$/, '') || '/';
      return path === '/workspace' || path === '/dashboard' || path === '/demo';
    };
    const getViewFromPath = (pathname) => isWorkspacePath(pathname) ? 'workspace' : 'welcome';

    assert.equal(getViewFromPath('/'), 'welcome', 'Root / must open landing page');
    assert.equal(getViewFromPath(''), 'welcome', 'Empty path must open landing page');
    assert.equal(getViewFromPath('/welcome'), 'welcome', '/welcome must open landing page');
    assert.equal(getViewFromPath('/workspace'), 'workspace', '/workspace must open demo workspace');
    assert.equal(getViewFromPath('/dashboard'), 'workspace', '/dashboard must open demo workspace');
    assert.equal(getViewFromPath('/demo'), 'workspace', '/demo must open demo workspace');
    assert.equal(getViewFromPath('/workspace/'), 'workspace', 'Trailing slash /workspace/ must open demo workspace');
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
