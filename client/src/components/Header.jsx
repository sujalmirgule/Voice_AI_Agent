import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Radio } from 'lucide-react';

export default function Header() {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') setServerStatus('healthy');
        else setServerStatus('degraded');
      })
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 2rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 13, 14, 0.85)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)'
        }}>
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Aura Skincare
            </h1>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem'
            }}>
              VOICE CX
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            AI Voice Support Specialist • Persona: Aria (Indian English)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.8rem',
          color: serverStatus === 'healthy' ? '#34d399' : '#f59e0b',
          background: 'var(--bg-surface-elevated)',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: serverStatus === 'healthy' ? '#10b981' : '#f59e0b',
            boxShadow: serverStatus === 'healthy' ? '0 0 8px #10b981' : 'none'
          }} />
          <span style={{ fontWeight: 600 }}>
            {serverStatus === 'healthy' ? 'Express API Online' : 'Connecting to API...'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          background: 'var(--bg-surface-elevated)',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle)'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Brand Guardrails Active</span>
        </div>
      </div>
    </header>
  );
}
