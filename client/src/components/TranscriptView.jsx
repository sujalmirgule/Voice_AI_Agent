import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Wrench, User, Bot, ArrowDown } from 'lucide-react';

/**
 * Parses conversational text with safe formatting (bold, code, bullets)
 * without exposing raw Markdown markers (*, **, `).
 */
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lIdx} style={{ height: '0.45rem' }} />;

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
    const lineContent = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;

    // Split for inline markdown: bold, code, italics
    const parts = lineContent.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const parsed = parts.map((chunk, cIdx) => {
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return (
          <code key={cIdx} style={{
            background: 'rgba(217, 130, 82, 0.16)',
            color: 'var(--accent-amber)',
            padding: '0.12rem 0.42rem',
            borderRadius: '4px',
            fontFamily: 'JetBrains Mono',
            fontSize: '0.85em'
          }}>
            {chunk.slice(1, -1)}
          </code>
        );
      }
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return (
          <strong key={cIdx} style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      if (chunk.startsWith('*') && chunk.endsWith('*')) {
        return <em key={cIdx} style={{ color: 'var(--text-primary)' }}>{chunk.slice(1, -1)}</em>;
      }
      return chunk;
    });

    if (isBullet) {
      return (
        <div key={lIdx} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', margin: '0.2rem 0' }}>
          <span style={{ color: 'var(--accent-copper)', fontSize: '0.8rem', lineHeight: '1.6' }}>•</span>
          <span style={{ flex: 1, lineHeight: '1.6' }}>{parsed}</span>
        </div>
      );
    }

    return (
      <p key={lIdx} style={{ margin: lIdx > 0 ? '0.45rem 0 0 0' : 0, lineHeight: '1.6' }}>
        {parsed}
      </p>
    );
  });
}

export default function TranscriptView({ transcript = [] }) {
  const scrollContainerRef = useRef(null);
  const endRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Preserve user scroll position without forcibly jumping while reading older messages
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Consider scrolled up if more than 75px from bottom
    const scrolledUp = distanceToBottom > 75;
    setIsUserScrolledUp(scrolledUp);
  };

  useEffect(() => {
    // Only auto-scroll down if user is already near the bottom
    if (!isUserScrolledUp) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isUserScrolledUp]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserScrolledUp(false);
  };

  return (
    <div className="skincare-card" style={{
      padding: '1.25rem 1.4rem',
      display: 'flex',
      flexDirection: 'column',
      height: '460px',
      background: 'var(--bg-surface)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.85rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <MessageSquare size={17} color="var(--accent-copper)" />
          <h2 style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0
          }}>
            Live Conversation Transcript
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            padding: '0.15rem 0.65rem',
            borderRadius: 'var(--radius-full)'
          }}>
            {transcript.length} turns recorded
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingRight: '0.45rem'
        }}
      >
        {transcript.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '0.65rem'
          }}>
            <Bot size={34} strokeWidth={1.4} color="var(--accent-copper)" />
            <div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                No active conversation yet.
              </p>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: 0 }}>
                Click "Start Call" or select an assessment prompt to begin speaking with Aria.
              </p>
            </div>
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
                  maxWidth: isCustomer ? '80%' : '88%',
                  gap: '0.35rem'
                }}
              >
                {/* Speaker Label & Timestamp Metadata */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)'
                }}>
                  {isCustomer ? (
                    <User size={12} color="var(--accent-copper)" />
                  ) : (
                    <Bot size={12} color="var(--accent-amber)" />
                  )}
                  <span style={{
                    fontWeight: 700,
                    color: isCustomer ? 'var(--accent-copper)' : 'var(--accent-amber)'
                  }}>
                    {msg.speaker}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp || 'Just now'}</span>
                </div>

                {/* Message Bubble */}
                <div style={{
                  background: isCustomer ? 'var(--bg-elevated)' : '#191716',
                  color: 'var(--text-primary)',
                  border: `1px solid ${isCustomer ? 'var(--border-color)' : 'var(--border-subtle)'}`,
                  borderLeft: isCustomer ? '1px solid var(--border-color)' : '3px solid var(--accent-copper)',
                  borderRadius: isCustomer ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                  padding: '0.85rem 1.15rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.65,
                  boxShadow: 'var(--shadow-sm)',
                  wordBreak: 'break-word'
                }}>
                  {renderFormattedMessage(msg.text)}
                </div>

                {/* Tool Execution Event Row */}
                {msg.tool_called && (
                  <div style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(102, 184, 138, 0.10)',
                    border: '1px solid rgba(102, 184, 138, 0.25)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Wrench size={12} color="var(--success)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Function:</span>
                    <strong style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.8em'
                    }}>
                      {msg.tool_called.name || 'get_order_details'}({msg.tool_called.args?.order_id ? `"${msg.tool_called.args.order_id}"` : ''})
                    </strong>
                    <span style={{ color: 'var(--success)', fontWeight: 800, marginLeft: '0.2rem' }}>
                      ✓ Verified
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Floating Pill: Resume Scrolling to Bottom when scrolled up */}
      {isUserScrolledUp && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-elevated)',
            color: 'var(--accent-copper)',
            border: '1px solid var(--accent-copper)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 0.95rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.55)',
            zIndex: 10,
            transition: 'all 0.15s ease'
          }}
          title="Scroll to latest message"
        >
          <span>Latest message</span>
          <ArrowDown size={13} />
        </button>
      )}
    </div>
  );
}
