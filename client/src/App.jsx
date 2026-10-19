import React, { useState } from 'react';
import Header from './components/Header';
import CallInterface from './components/CallInterface';
import OrdersHelper from './components/OrdersHelper';
import TranscriptView from './components/TranscriptView';
import PostCallSummary from './components/PostCallSummary';

export default function App() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentState, setAgentState] = useState('idle'); // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState([]);
  const [latestAgentText, setLatestAgentText] = useState('');
  const [postCallSummary, setPostCallSummary] = useState(null);

  // Start Call lifecycle
  const handleStartCall = () => {
    setIsCallActive(true);
    setPostCallSummary(null);
    setTranscript([]);

    const greeting = "Namaste! I'm Aria from Aura Skincare. How can I assist you with your orders, shipping, or products today?";
    const initialTurn = {
      speaker: "Aria",
      text: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tool_called: null
    };

    setTranscript([initialTurn]);
    setLatestAgentText(greeting);
    setAgentState('speaking');

    // After greeting completes, switch to listening
    setTimeout(() => {
      setAgentState('listening');
    }, 2800);
  };

  // End Call lifecycle
  const handleEndCall = async () => {
    setIsCallActive(false);
    setAgentState('idle');

    if (transcript.length === 0) return;

    try {
      const res = await fetch('/api/call/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setPostCallSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to generate post-call summary:', err);
    }
  };

  // Process user speech turn
  const handleUserSpeech = async (userText) => {
    if (!userText.trim() || !isCallActive || agentState === 'thinking') return;

    const userTurn = {
      speaker: "Customer",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTranscript = [...transcript, userTurn];
    setTranscript(updatedTranscript);
    setAgentState('thinking');

    try {
      const res = await fetch('/api/voice/process-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          messages: updatedTranscript.map(t => ({
            role: t.speaker.toLowerCase() === 'customer' ? 'user' : 'assistant',
            content: t.text
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        const agentTurn = {
          speaker: "Aria",
          text: data.agent_text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tool_called: data.tool_called
        };

        setTranscript([...updatedTranscript, agentTurn]);
        setLatestAgentText(data.agent_text);
        setAgentState('speaking');

        // Estimate speaking duration and return to listening
        const estimatedSpeakMs = Math.max(2000, data.agent_text.split(' ').length * 320);
        setTimeout(() => {
          setAgentState(prevState => prevState === 'speaking' ? 'listening' : prevState);
        }, estimatedSpeakMs);
      } else {
        throw new Error(data.message || 'Error processing response');
      }
    } catch (err) {
      console.error('Turn processing failed:', err);
      const fallbackTurn = {
        speaker: "Aria",
        text: "I apologize, could you please repeat that? I want to make sure I assist you accurately.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_called: null
      };
      setTranscript([...updatedTranscript, fallbackTurn]);
      setLatestAgentText(fallbackTurn.text);
      setAgentState('speaking');
      setTimeout(() => setAgentState('listening'), 2500);
    }
  };

  const handleResetCall = () => {
    setPostCallSummary(null);
    setTranscript([]);
    setAgentState('idle');
    setIsCallActive(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header />

      <main style={{
        flex: 1,
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Main Grid: Call Voice Center + Orders Helper */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.95fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          {/* Left Column: Voice Call Interface + Transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CallInterface
              isCallActive={isCallActive}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              agentState={agentState}
              onUserSpeech={handleUserSpeech}
              latestAgentText={latestAgentText}
            />

            <TranscriptView transcript={transcript} />
          </div>

          {/* Right Column: Test Orders Helper & Policy Guide */}
          <div>
            <OrdersHelper
              onSelectPrompt={handleUserSpeech}
              isCallActive={isCallActive}
            />
          </div>
        </div>

        {/* Post-Call Summary Section */}
        {postCallSummary && (
          <PostCallSummary
            summary={postCallSummary}
            transcript={transcript}
            onReset={handleResetCall}
          />
        )}
      </main>

      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        background: 'rgba(7, 13, 14, 0.9)'
      }}>
        Aura Skincare AI Voice Agent • Built for DataStraw Technologies Assessment • Pure Organic Indian Skincare
      </footer>
    </div>
  );
}
