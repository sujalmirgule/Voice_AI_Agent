import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Activity, Compass, ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function Header({ onOpenWelcome }) {
  const [healthData, setHealthData] = useState({ status: 'checking', groq_configured: false });

  useEffect(() => {
    apiClient.getHealth()
      .then(data => {
        setHealthData({ status: data.status, groq_configured: Boolean(data.groq_configured) });
      })
      .catch(() => {
        setHealthData({ status: 'offline', groq_configured: false });
      });
  }, []);

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'var(--grad-action)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#FFF8F2',
            boxShadow: '0 2px 8px rgba(217, 119, 69, 0.3)'
          }}>
            <Sparkles size={17} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase'
              }}>
                Aura Skincare
              </span>
              <span style={{
                background: 'rgba(217, 119, 69, 0.12)',
                color: 'var(--accent-copper)',
                border: '1px solid rgba(217, 119, 69, 0.35)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.5rem',
                letterSpacing: '0.04em'
              }}>
                VOICE CX
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
              AI Customer Support Specialist • Aria (Indian English)
            </p>
          </div>
        </div>

        {/* Real-time System Connectivity Status & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {/* Welcome Screen / Overview Toggle Button */}
          {onOpenWelcome && (
            <button
              onClick={onOpenWelcome}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.72rem'
              }}
              title="Return to Welcome Screen & Overview"
            >
              <ArrowLeft size={12} />
              <span>Overview</span>
            </button>
          )}

          {/* API Health */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            background: healthData.status === 'healthy' ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: healthData.status === 'healthy' ? 'var(--success)' : 'var(--warning)',
            padding: '0.24rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${healthData.status === 'healthy' ? 'var(--success-border)' : 'var(--warning-border)'}`
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: healthData.status === 'healthy' ? 'var(--success)' : 'var(--warning)'
            }} />
            <span style={{ fontWeight: 600 }}>
              {healthData.status === 'healthy' ? 'Express API Online' : 'Connecting to API...'}
            </span>
          </div>

          {/* AI Engine Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '0.24rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <Activity size={12} color="var(--accent-copper)" />
            <span style={{ fontWeight: 600 }}>
              {healthData.groq_configured ? 'Groq LPU Active' : 'Deterministic Guardrails Active'}
            </span>
          </div>

          {/* Policy Guardrails Enforced */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '0.24rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <ShieldCheck size={12} color="var(--success)" />
            <span style={{ fontWeight: 600 }}>Policies Enforced</span>
          </div>
        </div>
      </div>
    </header>
  );
}
