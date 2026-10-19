import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Sparkles, Send, AlertCircle, Radio, Disc } from 'lucide-react';
import VoiceAssistant3D from './VoiceAssistant3D';

export default function CallInterface({
  isCallActive,
  onStartCall,
  onEndCall,
  agentState,
  onUserSpeech,
  latestAgentText,
  errorMessage,
  onAgentSpeakingEnd
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveSpeechInterim, setLiveSpeechInterim] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef(null);

  // Turn Submission & Silence Detection Refs
  const onUserSpeechRef = useRef(onUserSpeech);
  const onAgentSpeakingEndRef = useRef(onAgentSpeakingEnd);
  const latestSpeechRef = useRef('');
  const hasSubmittedTurnRef = useRef(false);
  const silenceTimerRef = useRef(null);

  // Auto VAD Fallback Refs (for non-SpeechRecognition browsers)
  const autoVadRecorderRef = useRef(null);
  const autoVadChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const vadIntervalRef = useRef(null);

  const agentStateRef = useRef(agentState);
  const isCallActiveRef = useRef(isCallActive);
  const micMutedRef = useRef(micMuted);

  // Keep refs in sync for event listeners
  useEffect(() => {
    agentStateRef.current = agentState;
    isCallActiveRef.current = isCallActive;
    micMutedRef.current = micMuted;
    onUserSpeechRef.current = onUserSpeech;
    onAgentSpeakingEndRef.current = onAgentSpeakingEnd;
  }, [agentState, isCallActive, micMuted, onUserSpeech, onAgentSpeakingEnd]);

  // Safe recognition control methods
  const startRecognition = () => {
    if (!recognitionRef.current || !isCallActiveRef.current || micMutedRef.current) return;
    if (agentStateRef.current !== 'listening') return;
    if (isListeningRef.current) return;

    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
    } catch (err) {
      if (err.name === 'InvalidStateError' || err.message?.includes('already started')) {
        isListeningRef.current = true;
      } else {
        console.warn('SpeechRecognition start notice:', err.message);
      }
    }
  };

  const stopRecognition = () => {
    clearTimeout(restartTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      isListeningRef.current = false;
    }
  };

  // Centralized Exactly-Once Turn Submission
  const submitSpokenTurn = (forcedText) => {
    const textToSubmit = (typeof forcedText === 'string' ? forcedText : latestSpeechRef.current || '').trim();
    if (!textToSubmit) return;
    if (hasSubmittedTurnRef.current) return;
    if (!isCallActiveRef.current) return;
    if (agentStateRef.current !== 'listening') return;

    hasSubmittedTurnRef.current = true;
    clearTimeout(silenceTimerRef.current);
    clearTimeout(restartTimerRef.current);

    setLiveSpeechInterim('');
    setIsUserSpeaking(false);
    latestSpeechRef.current = '';

    stopRecognition();
    stopAutoVadFallback();

    if (onUserSpeechRef.current) {
      onUserSpeechRef.current(textToSubmit);
    }
  };

  // Automatic Voice Activity Detection (VAD) Fallback when SpeechRecognition is unavailable
  const startAutoVadFallback = async () => {
    if (speechSupported || !isCallActiveRef.current || micMutedRef.current || agentStateRef.current !== 'listening') {
      return;
    }
    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 512;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      autoVadChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          autoVadChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(autoVadChunksRef.current, { type: mimeType });
        autoVadChunksRef.current = [];
        if (blob.size > 800 && isCallActiveRef.current && agentStateRef.current === 'listening') {
          if (!hasSubmittedTurnRef.current && onUserSpeechRef.current) {
            hasSubmittedTurnRef.current = true;
            setLiveSpeechInterim('');
            setIsUserSpeaking(false);
            onUserSpeechRef.current(null, blob);
          }
        }
      };

      autoVadRecorderRef.current = recorder;
      recorder.start(200);

      let voiceDetected = false;
      let silenceCounter = 0;
      const buffer = new Uint8Array(analyser.frequencyBinCount);

      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = setInterval(() => {
        if (agentStateRef.current !== 'listening' || !isCallActiveRef.current) {
          clearInterval(vadIntervalRef.current);
          if (recorder.state === 'recording') recorder.stop();
          return;
        }

        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const average = sum / buffer.length;

        if (average > 14) {
          voiceDetected = true;
          silenceCounter = 0;
          setIsUserSpeaking(true);
          setLiveSpeechInterim('Listening (Whisper auto-transcription)...');
        } else if (voiceDetected) {
          silenceCounter += 100;
          if (silenceCounter >= 1200) {
            clearInterval(vadIntervalRef.current);
            setIsUserSpeaking(false);
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
        }
      }, 100);
    } catch (err) {
      console.warn('Auto VAD fallback notice:', err);
    }
  };

  const stopAutoVadFallback = () => {
    clearInterval(vadIntervalRef.current);
    if (autoVadRecorderRef.current && autoVadRecorderRef.current.state === 'recording') {
      try {
        autoVadRecorderRef.current.stop();
      } catch (e) {}
    }
    autoVadRecorderRef.current = null;
    autoVadChunksRef.current = [];
  };

  // Initialize Speech APIs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          isListeningRef.current = true;
        };

        recognition.onspeechstart = () => {
          setIsUserSpeaking(true);
        };

        recognition.onspeechend = () => {
          setIsUserSpeaking(false);
          if (latestSpeechRef.current && latestSpeechRef.current.trim().length > 0 && !hasSubmittedTurnRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              submitSpokenTurn(latestSpeechRef.current);
            }, 450);
          }
        };

        recognition.onresult = (event) => {
          if (hasSubmittedTurnRef.current || agentStateRef.current !== 'listening') {
            return;
          }

          let fullFinal = '';
          let fullInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              fullFinal += (result[0]?.transcript || '') + ' ';
            } else {
              fullInterim += (result[0]?.transcript || '');
            }
          }

          const combined = (fullFinal + fullInterim).trim();
          if (!combined) return;

          setLiveSpeechInterim(combined);
          latestSpeechRef.current = combined;
          setIsUserSpeaking(true);

          clearTimeout(silenceTimerRef.current);

          const isFinalizedPhrase = fullFinal.trim().length > 0 && fullInterim.trim().length === 0;
          const silenceDelay = isFinalizedPhrase ? 750 : 1100;

          silenceTimerRef.current = setTimeout(() => {
            if (latestSpeechRef.current && latestSpeechRef.current.trim().length > 0) {
              submitSpokenTurn(latestSpeechRef.current);
            }
          }, silenceDelay);
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition event error:', event.error);
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechSupported(false);
          }
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          setIsUserSpeaking(false);

          if (latestSpeechRef.current && latestSpeechRef.current.trim().length > 0 && !hasSubmittedTurnRef.current) {
            submitSpokenTurn(latestSpeechRef.current);
            return;
          }

          if (isCallActiveRef.current && !micMutedRef.current && agentStateRef.current === 'listening') {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (
                isCallActiveRef.current &&
                !micMutedRef.current &&
                agentStateRef.current === 'listening' &&
                !isListeningRef.current
              ) {
                startRecognition();
              }
            }, 120);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      stopRecognition();
      stopAutoVadFallback();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Persistent microphone stream when call is active
  useEffect(() => {
    if (isCallActive) {
      if (navigator?.mediaDevices?.getUserMedia && !streamRef.current) {
        navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        })
          .then(stream => {
            streamRef.current = stream;
          })
          .catch(err => {
            console.warn('Persistent audio stream notice:', err.message);
          });
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }, [isCallActive]);

  // Sync mute state to tracks
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted]);

  // Control speech recognition state transitions
  useEffect(() => {
    if (isCallActive && !micMuted) {
      if (agentState === 'listening') {
        hasSubmittedTurnRef.current = false;
        latestSpeechRef.current = '';
        setLiveSpeechInterim('');
        setIsUserSpeaking(false);
        clearTimeout(silenceTimerRef.current);

        if (speechSupported) {
          startRecognition();
        } else {
          startAutoVadFallback();
        }
      } else if (agentState === 'speaking' || agentState === 'thinking') {
        stopRecognition();
        stopAutoVadFallback();
        setLiveSpeechInterim('');
        setIsUserSpeaking(false);
      }
    } else {
      stopRecognition();
      stopAutoVadFallback();
    }
  }, [isCallActive, agentState, micMuted, speechSupported]);

  // Voice synthesis when Aria responds
  useEffect(() => {
    if (agentState === 'speaking' && latestAgentText && synthRef.current) {
      synthRef.current.cancel();

      const spokenText = latestAgentText
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/#+\s+/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .trim();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'en-IN';
      utterance.rate = 1.02;
      utterance.pitch = 1.05;

      const voices = synthRef.current.getVoices();
      const indianVoice = voices.find(v =>
        v.lang.includes('en-IN') ||
        v.name.toLowerCase().includes('india') ||
        v.name.includes('Neerja') ||
        v.name.includes('Heera')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      utterance.onend = () => {
        if (onAgentSpeakingEndRef.current) {
          onAgentSpeakingEndRef.current();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance notice:', e);
        if (onAgentSpeakingEndRef.current) {
          onAgentSpeakingEndRef.current();
        }
      };

      synthRef.current.speak(utterance);
    }
  }, [agentState, latestAgentText]);

  // Cleanup on call end
  useEffect(() => {
    if (!isCallActive) {
      stopRecognition();
      stopAutoVadFallback();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      clearTimeout(silenceTimerRef.current);
      clearTimeout(restartTimerRef.current);
      hasSubmittedTurnRef.current = false;
      latestSpeechRef.current = '';
      setLiveSpeechInterim('');
      setIsUserSpeaking(false);
      setIsRecordingAudio(false);
    }
  }, [isCallActive]);

  // Direct Audio Recording via MediaRecorder (for Whisper STT)
  const handleToggleRecording = async () => {
    if (!isCallActive || micMuted || agentState !== 'listening') return;

    if (isRecordingAudio) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    } else {
      try {
        stopRecognition();
        stopAutoVadFallback();
        let stream = streamRef.current;
        if (!stream || !stream.active) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
        }

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

        const recorder = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setIsRecordingAudio(false);
          if (blob.size > 500) {
            onUserSpeech(null, blob);
          } else {
            startRecognition();
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(200);
        setIsRecordingAudio(true);
      } catch (err) {
        console.error('MediaRecorder start failed:', err);
        setIsRecordingAudio(false);
        startRecognition();
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onUserSpeech(inputText.trim());
    setInputText('');
  };

  // Status message rendering
  const getStatusText = () => {
    if (!isCallActive) return 'Ready to start';
    if (agentState === 'error') return 'Microphone Access Error';
    if (agentState === 'listening') {
      if (isRecordingAudio) return 'Recording Audio for Whisper...';
      if (isUserSpeaking) return 'Hearing Your Voice...';
      return 'Aria Listening... (Speak Naturally)';
    }
    if (agentState === 'thinking') return 'Aria Checking Policies & Orders...';
    if (agentState === 'speaking') return 'Aria Speaking...';
    return 'Ready to start';
  };

  return (
    <div className="skincare-card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)'
    }}>
      {/* Voice Call Stage: Warm Graphite Multi-Stop Gradient */}
      <div className="skincare-stage" style={{
        padding: '1.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Prominent 3D Voice Assistant Orb */}
        <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>
          <VoiceAssistant3D
            agentState={agentState}
            isCallActive={isCallActive}
            isUserSpeaking={isUserSpeaking}
            isRecordingAudio={isRecordingAudio}
            size="compact"
          />
        </div>

        {/* State Badge */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(32, 32, 32, 0.95)',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.03em'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: !isCallActive
                ? 'var(--accent-copper)'
                : agentState === 'error'
                ? 'var(--danger)'
                : agentState === 'listening'
                ? isUserSpeaking
                  ? 'var(--accent-terracotta)'
                  : 'var(--accent-copper)'
                : agentState === 'thinking'
                ? 'var(--warning)'
                : '#F4F0E8'
            }} />
            <span style={{
              color: !isCallActive
                ? 'var(--accent-copper)'
                : agentState === 'error'
                ? 'var(--danger)'
                : agentState === 'listening'
                ? isUserSpeaking
                  ? 'var(--accent-terracotta)'
                  : 'var(--accent-copper)'
                : agentState === 'thinking'
                ? 'var(--warning)'
                : '#F4F0E8'
            }}>
              {getStatusText()}
            </span>
          </div>

          {/* Live Interim Speech Preview */}
          {liveSpeechInterim && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--accent-copper)', fontStyle: 'italic', margin: '0.75rem 0 0 0' }}>
              "{liveSpeechInterim}..."
            </p>
          )}

          {errorMessage && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#F87171', fontSize: '0.82rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {!speechSupported && isCallActive && (
            <p style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--warning)', margin: '0.65rem 0 0 0' }}>
              Browser Speech API unavailable. Automatic Whisper audio recording is active.
            </p>
          )}

          {!isCallActive && (
            <p style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.65rem 0 0 0' }}>
              Click <strong>Start Call</strong> to enable natural voice interaction with Aria.
            </p>
          )}
        </div>
      </div>

      {/* Main Call Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        {!isCallActive ? (
          <button id="start-call-btn" onClick={onStartCall} className="btn-primary" style={{ padding: '0.85rem 2.25rem' }}>
            <Phone size={18} />
            <span>Start Call</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Mute Toggle */}
            <button
              onClick={() => setMicMuted(!micMuted)}
              style={{
                background: micMuted ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                color: micMuted ? 'var(--danger)' : 'var(--text-primary)',
                border: `1px solid ${micMuted ? 'var(--danger-border)' : 'var(--border-color)'}`,
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Direct Whisper Audio Recorder */}
            <button
              onClick={handleToggleRecording}
              disabled={agentState !== 'listening'}
              style={{
                background: isRecordingAudio ? 'var(--danger)' : 'var(--bg-elevated)',
                color: isRecordingAudio ? '#FFFFFF' : 'var(--text-primary)',
                border: `1px solid ${isRecordingAudio ? 'var(--danger)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '0.6rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: agentState === 'listening' ? 'pointer' : 'not-allowed',
                opacity: agentState === 'listening' ? 1 : 0.6,
                transition: 'background-color 0.15s ease'
              }}
              title="Record audio clip directly for Groq Whisper transcription"
            >
              {isRecordingAudio ? <Disc size={15} className="animate-spin" /> : <Radio size={15} />}
              <span>{isRecordingAudio ? 'Stop & Send Audio' : 'Record for Whisper'}</span>
            </button>

            {/* End Call Button */}
            <button id="end-call-btn" onClick={onEndCall} className="btn-danger" style={{ padding: '0.85rem 2rem' }}>
              <PhoneOff size={18} />
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      {isCallActive && (
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Assessment Prompts (Click to Query):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {[
              "Where is my order ORD-101?",
              "Can I return order ORD-102?",
              "I bought this 20 days ago and opened it, can I return it?",
              "What is your shipping policy?",
              "Can you book me a flight to Goa?",
              "Can I cancel ORD-103?"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onUserSpeech(prompt)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, color 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; e.currentTarget.style.color = 'var(--accent-amber)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Input Form (Always Accessible) */}
      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.55rem', marginTop: '0.25rem' }}>
        <input
          type="text"
          placeholder={isCallActive ? "Type or speak a message to Aria..." : "Type a question for Aria (e.g., Where is ORD-101?)..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={agentState === 'thinking'}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '0.75rem 1.25rem',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-copper)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || agentState === 'thinking'}
          style={{
            background: 'var(--grad-action)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '0 1.35rem',
            color: 'var(--text-inverse)',
            cursor: inputText.trim() && agentState !== 'thinking' ? 'pointer' : 'not-allowed',
            opacity: inputText.trim() && agentState !== 'thinking' ? 1 : 0.45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(240, 106, 66, 0.3)',
            transition: 'background 0.15s ease'
          }}
          title="Send typed message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
