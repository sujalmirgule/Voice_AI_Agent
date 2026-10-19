import React, { useState } from 'react';
import { FileJson, Check, Copy, Award, ArrowRight, RefreshCw } from 'lucide-react';

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
        return <span className="pill-badge pill-success">Resolved</span>;
      case 'ESCALATED':
        return <span className="pill-badge pill-warning">Escalated</span>;
      default:
        return <span className="pill-badge pill-info">{status}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{
      marginTop: '1.5rem',
      padding: '1.75rem',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      background: 'linear-gradient(180deg, rgba(19, 34, 37, 0.85) 0%, rgba(13, 23, 25, 0.95) 100%)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '0.45rem',
            borderRadius: '10px',
            color: '#34d399'
          }}>
            <FileJson size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Post-Call Summary & Structured Outcome
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Call concluded • Auto-generated structured JSON artifact
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={handleCopy}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: copied ? '#34d399' : 'var(--text-secondary)',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onReset}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>New Call</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Outcomes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
            Customer Intent
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
            {summary.customer_intent || 'GENERAL_INQUIRY'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
            Target Order ID
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: summary.order_id ? '#34d399' : 'var(--text-muted)' }}>
            {summary.order_id || 'N/A'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
            Resolution Status
          </div>
          <div style={{ marginTop: '0.15rem' }}>
            {getStatusBadge(summary.resolution_status)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
            Total Dialogue Turns
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
            {summary.total_turns || transcript.length} turns
          </div>
        </div>
      </div>

      {/* Summary Text Callout */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        marginBottom: '1.25rem',
        fontSize: '0.85rem',
        color: '#e2e8f0',
        lineHeight: 1.5
      }}>
        <strong style={{ color: '#34d399' }}>Call Summary: </strong>
        {summary.call_summary}
      </div>

      {/* Structured JSON Output Box */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
          Raw Structured JSON Output (Assessment Requirement D.2):
        </div>
        <pre style={{
          background: '#040809',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: '0.82rem',
          color: '#34d399',
          overflowX: 'auto',
          lineHeight: 1.5
        }}>
          {JSON.stringify({
            customer_intent: summary.customer_intent,
            order_id: summary.order_id,
            resolution_status: summary.resolution_status,
            call_summary: summary.call_summary
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
