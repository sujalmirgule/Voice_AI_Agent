import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, Send, ShieldAlert } from 'lucide-react';

export default function CallInterface({
  isCallActive,
  onStartCall,
  onEndCall,
  agentState,
  onUserSpeech,
  latestAgentText
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveSpeechInterim, setLiveSpeechInterim] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize SpeechSynthesis and SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          setLiveSpeechInterim(interim);

          if (final.trim().length > 0) {
            setLiveSpeechInterim('');
            onUserSpeech(final.trim());
          }
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceAvailable(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setVoiceAvailable(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch (e) {}
      }
    };
  }, []);

  // Control speech recognition when call starts/ends or state changes
  useEffect(() => {
    if (isCallActive && !micMuted) {
      if (agentState === 'listening' && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already running or starting
        }
      } else if (agentState === 'speaking' || agentState === 'thinking') {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    }
  }, [isCallActive, agentState, micMuted]);

  // Voice synthesis when agent speaks
  useEffect(() => {
    if (agentState === 'speaking' && latestAgentText && synthRef.current) {
      synthRef.current.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(latestAgentText);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Prefer Indian English voice if available
      const voices = synthRef.current.getVoices();
      const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india') || v.name.includes('Neerja') || v.name.includes('Heera'));
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      synthRef.current.speak(utterance);
    }
  }, [agentState, latestAgentText]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onUserSpeech(inputText.trim());
    setInputText('');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Visualizer / Call State Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, rgba(13, 23, 25, 0.6) 70%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glowing Orb & Waves */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isCallActive && agentState === 'listening' && (
            <div className="pulsing-ring" style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%)'
            }} />
          )}

          {isCallActive && agentState === 'thinking' && (
            <div className="pulsing-ring" style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0) 70%)'
            }} />
          )}

          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: isCallActive
              ? agentState === 'listening'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : agentState === 'thinking'
                ? 'linear-gradient(135deg, #06b6d4, #0284c7)'
                : 'linear-gradient(135deg, #8b5cf6, #6366f1)'
              : 'linear-gradient(135deg, #334155, #1e293b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCallActive ? 'var(--shadow-glow)' : 'none',
            transition: 'all 0.3s ease',
            zIndex: 2
          }}>
            {isCallActive ? (
              agentState === 'listening' ? (
                <Mic size={36} color="#ffffff" />
              ) : agentState === 'thinking' ? (
                <Sparkles size={36} color="#ffffff" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                  <span className="wave-bar" style={{ background: '#ffffff' }}></span>
                  <span className="wave-bar" style={{ background: '#ffffff' }}></span>
                  <span className="wave-bar" style={{ background: '#ffffff' }}></span>
                  <span className="wave-bar" style={{ background: '#ffffff' }}></span>
                  <span className="wave-bar" style={{ background: '#ffffff' }}></span>
                </div>
              )
            ) : (
              <PhoneOff size={32} color="#94a3b8" />
            )}
          </div>
        </div>

        {/* Live State Badge */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: !isCallActive ? '#64748b' : agentState === 'listening' ? '#10b981' : agentState === 'thinking' ? '#06b6d4' : '#a855f7'
            }} />
            <span style={{
              color: !isCallActive ? 'var(--text-muted)' : agentState === 'listening' ? '#34d399' : agentState === 'thinking' ? '#38bdf8' : '#c084fc',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {!isCallActive ? 'Call Idle' : agentState === 'listening' ? 'Listening to You...' : agentState === 'thinking' ? 'Aria Thinking & Reasoning...' : 'Aria Speaking...'}
            </span>
          </div>

          {liveSpeechInterim && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#38bdf8', fontStyle: 'italic' }}>
              "{liveSpeechInterim}..."
            </p>
          )}

          {!isCallActive && (
            <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click <strong>Start Call</strong> to speak with Aria naturally using your microphone.
            </p>
          )}
        </div>
      </div>

      {/* Main Call Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        {!isCallActive ? (
          <button id="start-call-btn" onClick={onStartCall} className="btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
            <Phone size={20} />
            <span>Start Call</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setMicMuted(!micMuted)}
              style={{
                background: micMuted ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface-elevated)',
                color: micMuted ? '#ef4444' : '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button id="end-call-btn" onClick={onEndCall} className="btn-danger" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
              <PhoneOff size={20} />
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Test Voice Prompts Bar */}
      {isCallActive && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Quick Prompts (Click to Speak to Agent):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {[
              "Where is my order ORD-101?",
              "Can I return ORD-102?",
              "I bought this 20 days ago and opened it, can I return it?",
              "What is your shipping policy?",
              "Can you book me a flight to Goa?",
              "Can I cancel ORD-103?"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onUserSpeech(prompt)}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#34d399'; e.currentTarget.style.borderColor = '#10b981'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text fallback input */}
      {isCallActive && (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type or speak a message to Aria..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={agentState === 'thinking'}
            style={{
              flex: 1,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || agentState === 'thinking'}
            style={{
              background: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0 1.15rem',
              color: '#ffffff',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              opacity: inputText.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
