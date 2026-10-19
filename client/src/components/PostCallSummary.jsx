import React, { useState } from 'react';
import { FileJson, Check, Copy, RefreshCw, CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function PostCallSummary({ summary, transcript, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span style={{
            background: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success-border)',
            padding: '0.22rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <CheckCircle size={13} />
            <span>RESOLVED</span>
          </span>
        );
      case 'PENDING_CUSTOMER_ACTION':
        return (
          <span style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            border: '1px solid var(--warning-border)',
            padding: '0.22rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Clock size={13} />
            <span>PENDING_CUSTOMER_ACTION</span>
          </span>
        );
      default:
        return (
          <span style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            padding: '0.22rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="skincare-card" style={{
      marginTop: '1.5rem',
      padding: '1.75rem',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-surface)'
    }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.95rem',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(217, 130, 82, 0.12)',
            border: '1px solid rgba(217, 130, 82, 0.3)',
            borderRadius: '10px',
            color: 'var(--accent-copper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileJson size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: 'rgba(102, 184, 138, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(102, 184, 138, 0.28)',
                padding: '0.12rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.68rem',
                fontWeight: 750,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                <span>Call Concluded • Post-Call Summary Ready</span>
              </span>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', margin: 0 }}>
              Post-Call Intelligence Summary
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
              Structured schema extraction artifact generated deterministically from call dialogue
            </p>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            id="copy-json-btn"
            onClick={handleCopy}
            className="btn-secondary"
            title="Copy structured summary JSON to clipboard"
          >
            {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
            <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* 4-Metric Key Attribute Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        {/* Customer Intent */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{
            fontSize: '0.70rem',
            fontWeight: 750,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Customer Intent
          </div>
          <div style={{
            fontSize: '0.94rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.02em'
          }}>
            {summary.customer_intent || 'GENERAL_INQUIRY'}
          </div>
        </div>

        {/* Target Order ID */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{
            fontSize: '0.70rem',
            fontWeight: 750,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Target Order ID
          </div>
          <div style={{
            fontSize: '0.94rem',
            fontWeight: 800,
            color: summary.order_id ? 'var(--accent-copper)' : 'var(--text-secondary)',
            fontFamily: summary.order_id ? 'JetBrains Mono' : 'inherit'
          }}>
            {summary.order_id || 'None specified'}
          </div>
        </div>

        {/* Resolution Status */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{
            fontSize: '0.70rem',
            fontWeight: 750,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Resolution Status
          </div>
          <div>
            {getStatusBadge(summary.resolution_status || 'RESOLVED')}
          </div>
        </div>

        {/* Total Dialogue Turns */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{
            fontSize: '0.70rem',
            fontWeight: 750,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Dialogue Turns
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {transcript ? transcript.length : summary.total_turns || 0} turns
          </div>
        </div>
      </div>

      {/* Human-Readable Summary */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          fontSize: '0.74rem',
          fontWeight: 750,
          color: 'var(--accent-amber)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.45rem'
        }}>
          Human-Readable Call Summary
        </div>
        <p style={{
          fontSize: '0.90rem',
          color: 'var(--text-primary)',
          lineHeight: 1.65,
          margin: 0
        }}>
          {summary.call_summary}
        </p>
      </div>

      {/* Structured JSON Output Box */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.55rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 750,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Structured JSON Output
          </span>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
          >
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>
        </div>

        <pre style={{
          background: '#0D0C0B',
          color: 'var(--accent-amber)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          lineHeight: 1.55,
          overflowX: 'auto',
          border: '1px solid var(--border-color)',
          margin: 0,
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <code>{JSON.stringify(summary, null, 2)}</code>
        </pre>
      </div>

      {/* Bottom Action Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '1.25rem'
      }}>
        <button
          id="new-call-btn"
          onClick={onReset}
          className="btn-primary"
          style={{ padding: '0.85rem 2rem' }}
          title="Start New Call session"
        >
          <RefreshCw size={15} />
          <span>New Call</span>
        </button>

        <button
          onClick={handleCopy}
          className="btn-secondary"
          style={{ padding: '0.85rem 1.85rem' }}
          title="Copy structured summary JSON to clipboard"
        >
          <Copy size={15} />
          <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
        </button>
      </div>
    </div>
  );
}
