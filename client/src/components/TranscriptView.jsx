import React, { useEffect, useRef } from 'react';
import { MessageSquare, Wrench, User, Bot } from 'lucide-react';

export default function TranscriptView({ transcript }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '420px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="#10b981" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Live Conversation Transcript
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {transcript.length} turns recorded
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.25rem' }}>
        {transcript.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '0.5rem'
          }}>
            <Bot size={36} strokeWidth={1.5} color="#64748b" />
            <p style={{ fontSize: '0.85rem' }}>No active conversation yet.</p>
            <p style={{ fontSize: '0.75rem' }}>Click "Start Call" to begin speaking with Aria.</p>
          </div>
        ) : (
          transcript.map((msg, index) => {
            const isCustomer = msg.speaker.toLowerCase() === 'customer';
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  gap: '0.35rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)'
                }}>
                  {isCustomer ? <User size={12} /> : <Bot size={12} color="#10b981" />}
                  <span style={{ fontWeight: 600, color: isCustomer ? '#94a3b8' : '#34d399' }}>
                    {msg.speaker}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp || 'Just now'}</span>
                </div>

                <div style={{
                  background: isCustomer
                    ? 'linear-gradient(135deg, #1e3a8a, #1d4ed8)'
                    : 'var(--bg-surface-elevated)',
                  border: isCustomer
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: isCustomer ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  padding: '0.75rem 1rem',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {msg.text}
                </div>

                {/* Tool execution badge if agent called a tool */}
                {msg.tool_called && (
                  <div style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.72rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.15rem'
                  }}>
                    <Wrench size={12} />
                    <span>
                      Tool Executed: <strong>{msg.tool_called.name}({JSON.stringify(msg.tool_called.args)})</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
