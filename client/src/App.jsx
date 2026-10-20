import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CallInterface from './components/CallInterface';
import OrdersHelper from './components/OrdersHelper';
import TranscriptView from './components/TranscriptView';
import PostCallSummary from './components/PostCallSummary';
import WelcomeScreen from './components/WelcomeScreen';
import CompactOrderSelector from './components/CompactOrderSelector';
import { apiClient } from './lib/api';
import { Sparkles, Phone, CheckCircle2, ShieldCheck, Compass, Home, Mic, Package as PackageIcon, Shield, History } from 'lucide-react';

/**
 * Route resolution helpers for Aura Voice CX
 * Maps root / and /welcome to the Landing Page.
 * Maps /workspace, /dashboard, and /demo to the interactive workspace.
 */
export function isWorkspacePath(pathname) {
  if (!pathname) return false;
  const path = pathname.split('?')[0].split('#')[0].toLowerCase().replace(/\/+$/, '') || '/';
  return path === '/workspace' || path === '/dashboard' || path === '/demo';
}

export function getViewFromPath(pathname) {
  return isWorkspacePath(pathname) ? 'workspace' : 'welcome';
}

export default function App() {
  // Route-aware initial view: default to 'welcome' on /; render 'workspace' on /workspace or /dashboard
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      return getViewFromPath(window.location.pathname);
    }
    return 'welcome';
  });
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentState, setAgentState] = useState('idle'); // idle | listening | thinking | speaking | error
  const [transcript, setTranscript] = useState([]);
  const [latestAgentText, setLatestAgentText] = useState('');
  const [postCallSummary, setPostCallSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const callSessionIdRef = React.useRef(0);
  const greetingTimeoutRef = React.useRef(null);
  const speakingTimeoutRef = React.useRef(null);

  // Start Call lifecycle with explicit mic verification
  const handleStartCall = async () => {
    if (isCallActive) return;

    clearTimeout(greetingTimeoutRef.current);
    clearTimeout(speakingTimeoutRef.current);
    const newSessionId = callSessionIdRef.current + 1;
    callSessionIdRef.current = newSessionId;
    setErrorMessage('');

    // Pre-flight check: Verify microphone access directly on user gesture
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn('Microphone permission check failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Microphone access denied. Please click the lock icon in your browser address bar and allow microphone access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No microphone device found. Please connect a microphone and try again.');
        } else {
          setErrorMessage(`Microphone error: ${err.message || 'Could not access audio device.'}`);
        }
        setAgentState('error');
        setIsCallActive(false);
        return;
      }
    }

    setIsCallActive(true);
    setPostCallSummary(null);
    setTranscript([]);

    const greeting = "Namaste! I'm Aria from Aura Skincare. How can I assist you with your orders, shipping, or returns today?";
    const initialTurn = {
      speaker: "Aria",
      text: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tool_called: null
    };

    setTranscript([initialTurn]);
    setLatestAgentText(greeting);
    setAgentState('speaking');

    // Return to listening after initial greeting
    greetingTimeoutRef.current = setTimeout(() => {
      if (callSessionIdRef.current === newSessionId) {
        setAgentState('listening');
      }
    }, 2800);
  };

  // Immediate transition to listening when Aria finishes speaking aloud
  const handleAgentSpeakingEnd = () => {
    if (isCallActive) {
      clearTimeout(greetingTimeoutRef.current);
      clearTimeout(speakingTimeoutRef.current);
      setAgentState(prev => prev === 'speaking' ? 'listening' : prev);
    }
  };

  // End Call lifecycle
  const handleEndCall = async () => {
    callSessionIdRef.current += 1;
    clearTimeout(greetingTimeoutRef.current);
    clearTimeout(speakingTimeoutRef.current);

    setIsCallActive(false);
    setAgentState('idle');

    if (transcript.length === 0) return;

    try {
      const data = await apiClient.generateSummary(transcript);
      if (data.success && data.summary) {
        setPostCallSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to generate post-call summary:', err);
      setErrorMessage('Could not generate post-call summary from server.');
    }
  };

  // Process user speech turn
  const handleUserSpeech = async (userText, audioBlob = null) => {
    if ((!userText || !userText.trim()) && !audioBlob) return;
    if (!isCallActive && !userText) return;
    setErrorMessage('');

    // If evaluator clicked a scenario prompt while call is inactive, auto-start call to fulfill inquiry
    let activeSession = callSessionIdRef.current;
    let baseTranscript = transcript;

    if (!isCallActive) {
      setIsCallActive(true);
      setPostCallSummary(null);
      activeSession = callSessionIdRef.current + 1;
      callSessionIdRef.current = activeSession;
      baseTranscript = [];
    }

    const currentSessionId = activeSession;

    let updatedTranscript = baseTranscript;
    if (userText && userText.trim()) {
      const userTurn = {
        speaker: "Customer",
        text: userText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updatedTranscript = [...baseTranscript, userTurn];
      setTranscript(updatedTranscript);
    }

    setAgentState('thinking');

    try {
      const data = await apiClient.processVoiceTurn({
        text: userText || undefined,
        audioBlob: audioBlob || undefined,
        messages: updatedTranscript.map(t => ({
          role: t.speaker.toLowerCase() === 'customer' ? 'user' : 'assistant',
          content: t.text
        }))
      });

      if (callSessionIdRef.current !== currentSessionId) {
        return;
      }

      if (data.success) {
        let currentTranscript = updatedTranscript;
        if (audioBlob && data.user_text) {
          const userTurn = {
            speaker: "Customer",
            text: data.user_text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          currentTranscript = [...updatedTranscript, userTurn];
        }

        const agentTurn = {
          speaker: "Aria",
          text: data.agent_text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tool_called: data.tool_called
        };

        setTranscript([...currentTranscript, agentTurn]);
        setLatestAgentText(data.agent_text);
        setAgentState('speaking');

        const estimatedSpeakMs = Math.max(2200, data.agent_text.split(' ').length * 320);
        clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          if (callSessionIdRef.current === currentSessionId) {
            setAgentState(prevState => prevState === 'speaking' ? 'listening' : prevState);
          }
        }, estimatedSpeakMs);
      } else {
        throw new Error(data.message || 'Error processing response');
      }
    } catch (err) {
      if (callSessionIdRef.current !== currentSessionId) return;

      console.error('Turn processing failed:', err);
      setErrorMessage(err.message || 'Voice turn request failed.');
      const fallbackTurn = {
        speaker: "Aria",
        text: "I apologize, could you please repeat that? I want to make sure I assist you accurately.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_called: null
      };
      setTranscript([...updatedTranscript, fallbackTurn]);
      setLatestAgentText(fallbackTurn.text);
      setAgentState('speaking');
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = setTimeout(() => {
        if (callSessionIdRef.current === currentSessionId) {
          setAgentState('listening');
        }
      }, 2500);
    }
  };

  const handleResetCall = () => {
    callSessionIdRef.current += 1;
    clearTimeout(greetingTimeoutRef.current);
    clearTimeout(speakingTimeoutRef.current);
    setPostCallSummary(null);
    setTranscript([]);
    setAgentState('idle');
    setIsCallActive(false);
    setErrorMessage('');
  };

  // Synchronize route navigation with browser History API
  const navigateTo = (view, targetPath) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const path = targetPath || (view === 'workspace' ? '/workspace' : '/');
      if (window.location.pathname !== path) {
        window.history.pushState({ view }, '', path);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const nextView = getViewFromPath(window.location.pathname);
        setCurrentView(nextView);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentView === 'welcome') {
    return (
      <WelcomeScreen
        onEnterWorkspace={() => navigateTo('workspace', '/workspace')}
        onExploreScenarios={() => {
          navigateTo('workspace', '/workspace');
          setTimeout(() => {
            const el = document.getElementById('guided-scenarios-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 120);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header onOpenWelcome={() => navigateTo('welcome', '/')} />

      <div style={{
        display: 'flex',
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Left Navigation Sidebar (from Reference Image) */}
        <aside
          className="desktop-sidebar"
          aria-label="Workspace Navigation"
          style={{
            width: '68px',
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.25rem 0',
            gap: '1.5rem',
            flexShrink: 0
          }}
        >
          <button
            onClick={() => navigateTo('welcome', '/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-copper)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 700
            }}
            title="Return to Welcome Screen"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(217, 130, 82, 0.15)',
              border: '1px solid var(--accent-copper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-copper)'
            }}>
              <Home size={18} />
            </div>
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('start-call-btn') || document.getElementById('end-call-btn');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
            title="Voice Assistant Stage"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mic size={18} />
            </div>
            <span>Voice</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('compact-order-selector');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
            title="Sample Order Scenarios"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PackageIcon size={18} />
            </div>
            <span>Orders</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('guided-scenarios-panel');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
            title="Guided Policy Scenarios"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={18} />
            </div>
            <span>Policies</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('post-call-summary-panel');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
            title="Call History & Summaries"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={18} />
            </div>
            <span>History</span>
          </button>
        </aside>

        {/* Main Workspace Area */}
        <main style={{
          flex: 1,
          width: '100%',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          overflowX: 'hidden'
        }}>
          {/* Compact Order Selector — Immediately Below Header */}
          <CompactOrderSelector
            onSelectOrderPrompt={handleUserSpeech}
            isCallActive={isCallActive}
          />

          {/* Main Grid: Voice Interaction + Scenario Helper */}
          <div className="responsive-main-grid">
            {/* Left Column: Voice Call Interface + Live Transcript */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <CallInterface
                isCallActive={isCallActive}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                agentState={agentState}
                onUserSpeech={handleUserSpeech}
                latestAgentText={latestAgentText}
                errorMessage={errorMessage}
                onAgentSpeakingEnd={handleAgentSpeakingEnd}
              />

              <TranscriptView transcript={transcript} />
            </div>

            {/* Right Column: Guided Scenario Panel & Assessment Orders */}
            <div>
              <OrdersHelper
                onSelectPrompt={handleUserSpeech}
                isCallActive={isCallActive}
              />
            </div>
          </div>

          {/* Post-Call Summary Drawer */}
          {postCallSummary && (
            <div id="post-call-summary-panel">
              <PostCallSummary
                summary={postCallSummary}
                transcript={transcript}
                onReset={handleResetCall}
              />
            </div>
          )}
        </main>
      </div>

      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Aura Skincare AI Voice CX • DataStraw Assessment</span>
          <span style={{ color: 'var(--text-muted)' }}>Pure Organic Indian Skincare • Free Shipping above ₹499 • 7-Day Returns</span>
        </div>
      </footer>
    </div>
  );
}
