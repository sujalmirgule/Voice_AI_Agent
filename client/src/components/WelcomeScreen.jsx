import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
  FileJson,
  Activity,
  CheckCircle2,
  Headphones,
  Layers,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../lib/api';
import VoiceAssistant3D from './VoiceAssistant3D';

export default function WelcomeScreen({ onEnterWorkspace, onExploreScenarios }) {
  const [healthData, setHealthData] = useState({ status: 'checking', groq_configured: false });

  useEffect(() => {
    // Only query real backend health. NEVER trigger mic permissions on landing page.
    apiClient.getHealth()
      .then(data => {
        setHealthData({ status: data.status, groq_configured: Boolean(data.groq_configured) });
      })
      .catch(() => {
        setHealthData({ status: 'offline', groq_configured: false });
      });
  }, []);

  const scrollToCapabilities = () => {
    const el = document.getElementById('capabilities-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onExploreScenarios) {
      onExploreScenarios();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#100F0E',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* ------------------------------------------------------------------ */}
      {/* CINEMATIC LAYERED BACKGROUND                                       */}
      {/* ------------------------------------------------------------------ */}

      {/* Layer B: Ambient Lighting Radial Glows */}
      <div className="cinematic-bg-lighting" />

      {/* Layer C: Atmospheric Depth - Oversized Abstract Orbital Arcs */}
      <svg
        className="cinematic-bg-arcs"
        viewBox="0 0 850 850"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="425" cy="425" r="380" stroke="url(#cinematic-ambient-arc)" strokeWidth="1.2" strokeDasharray="3 7" />
        <ellipse cx="425" cy="425" rx="420" ry="240" stroke="rgba(217, 130, 82, 0.18)" strokeWidth="1.4" transform="rotate(-28 425 425)" />
        <ellipse cx="425" cy="425" rx="340" ry="190" stroke="rgba(255, 182, 110, 0.12)" strokeWidth="1" transform="rotate(35 425 425)" />
        <defs>
          <linearGradient id="cinematic-ambient-arc" x1="0" y1="0" x2="850" y2="850" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB66E" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#D98252" stopOpacity="0.20" />
            <stop offset="1" stopColor="#100F0E" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer D: Cinematic Vignette Edge Gradient */}
      <div className="cinematic-vignette" />

      {/* ------------------------------------------------------------------ */}
      {/* 1. COMPACT PROFESSIONAL HEADER BAR                                 */}
      {/* ------------------------------------------------------------------ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(16, 15, 14, 0.95)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.85rem 2rem'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--grad-action)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF8F2',
              boxShadow: '0 2px 10px rgba(217, 119, 69, 0.3)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Aura Skincare
                </span>
                <span style={{
                  background: 'rgba(217, 130, 82, 0.14)',
                  color: 'var(--accent-copper)',
                  border: '1px solid rgba(217, 130, 82, 0.35)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.5rem',
                  letterSpacing: '0.04em'
                }}>
                  VOICE CX
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                Enterprise Voice Customer Care
              </p>
            </div>
          </div>

          {/* Real Backend Readiness Badges & Direct Launch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Express API status */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.74rem',
              background: healthData.status === 'healthy' ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: healthData.status === 'healthy' ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${healthData.status === 'healthy' ? 'var(--success-border)' : 'var(--warning-border)'}`,
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)'
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

            {/* Groq LPU engine status */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.74rem',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <Activity size={12} color="var(--accent-copper)" />
              <span style={{ fontWeight: 600 }}>
                {healthData.groq_configured ? 'Groq LPU Active' : 'Deterministic Guardrails Active'}
              </span>
            </div>

            {/* Quick Header CTA */}
            <button
              onClick={onEnterWorkspace}
              className="btn-primary"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
            >
              <span>Explore Demo</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. HERO SECTION: 55/45 BALANCED EDITORIAL COMPOSITION               */}
      {/* ------------------------------------------------------------------ */}
      <section className="welcome-hero-grid" style={{
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        padding: '3.75rem 2rem 4.5rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Column: Editorial Headline & Messaging */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            width: 'fit-content'
          }}>
            <Headphones size={14} color="var(--accent-copper)" />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 750,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)'
            }}>
              Aura Voice AI • Customer Support Specialist
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 4.4vw, 3.65rem)',
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Customer care,<br />
            reimagined for<br />
            <span style={{
              background: 'linear-gradient(135deg, #FFB66E 0%, #D98252 50%, #BD5E43 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>a brighter you.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.6vw, 1.12rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '560px'
          }}>
            Meet Aria. Your AI Customer Support Specialist. Conversational voice assistance with real-time speech processing, verified order lookups, and deterministic brand-policy guardrails.
          </p>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: '540px'
          }}>
            Engineered for pure organic Indian skincare customer support. Enforces strict ₹499 free shipping rules, 7-day return cutoffs, and verified order lookup tools without hallucination.
          </p>

          {/* CTA Buttons with Semantic IDs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            paddingTop: '0.4rem'
          }}>
            {/* Dominant Primary CTA */}
            <button
              id="enter-workspace-btn"
              onClick={onEnterWorkspace}
              className="btn-primary"
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 750,
                boxShadow: '0 4px 18px rgba(217, 130, 82, 0.38)'
              }}
              title="Enter Demo Workspace"
              aria-label="Explore Live Demo - Enter Demo Workspace"
            >
              <span>Explore Live Demo</span>
              <span style={{ display: 'none' }}>Enter Demo Workspace</span>
              <ArrowRight size={18} />
            </button>

            {/* Clear Secondary Action */}
            <button
              id="explore-scenarios-btn"
              onClick={scrollToCapabilities}
              className="btn-secondary"
              style={{
                padding: '1rem 1.9rem',
                fontSize: '0.92rem',
                fontWeight: 650
              }}
              title="Explore Test Scenarios"
            >
              <Layers size={16} color="var(--accent-copper)" />
              <span>Explore Test Scenarios</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>Groq LPU Voice Inference</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>Deterministic Guardrails</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>No Mic Request on Load</span>
            </span>
          </div>
        </div>

        {/* Right Column: Designed 3D Voice Orb Visual Stage */}
        <div className="hero-orb-stage">
          {/* Subtle Ambient Copper Glow Backdrop */}
          <div className="hero-orb-glow" />

          {/* Abstract Orbital Arc Ring Backdrop */}
          <svg
            style={{
              position: 'absolute',
              width: '120%',
              height: '120%',
              pointerEvents: 'none',
              zIndex: 0,
              opacity: 0.45
            }}
            viewBox="0 0 500 500"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="250" cy="250" r="210" stroke="url(#hero-stage-grad)" strokeWidth="1" strokeDasharray="4 8" />
            <ellipse cx="250" cy="250" rx="235" ry="140" stroke="rgba(217, 130, 82, 0.2)" strokeWidth="1" transform="rotate(-25 250 250)" />
            <defs>
              <linearGradient id="hero-stage-grad" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFB66E" stopOpacity="0.4" />
                <stop offset="0.5" stopColor="#D98252" stopOpacity="0.2" />
                <stop offset="1" stopColor="#100F0E" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* The Interactive 3D Voice Orb (Prominently Scaled) */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <VoiceAssistant3D size="hero" />
          </div>

          {/* Grounded Soft Elliptical Shadow */}
          <div className="hero-orb-shadow" />

          {/* Theme-Consistent Intentional Caption (No clunky rectangular debug badge) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            marginTop: '0.85rem',
            letterSpacing: '0.04em',
            zIndex: 2
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-copper)' }} />
            <span>Aria 3D Acoustic Sphere • Real-Time Voice Lifecycle Engine</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. THREE-FEATURE SECTION: CAPABILITY ARCHITECTURE                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="capabilities-section"
        style={{
          background: 'linear-gradient(180deg, #131211 0%, #161514 100%)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: '4.5rem 2rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.75rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-copper)'
            }}>
              Core Architecture
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.65rem' }}>
              Built for accuracy, speed, and trust.
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
              Unlike generic chatbot wrappers, Aura Voice CX combines live order tool calling with deterministic brand-policy guardrails.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Feature 1: Live Order Intelligence */}
            <div className="skincare-card" style={{ padding: '1.85rem', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(217, 130, 82, 0.12)',
                border: '1px solid rgba(217, 130, 82, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-copper)'
              }}>
                <Package size={22} />
              </div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live Order Intelligence
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Integrated function calling fetches real-time status for <code>ORD-101</code>, <code>ORD-102</code>, and <code>ORD-103</code>, providing verified courier updates without fabricated information.
              </p>
              <div style={{
                marginTop: 'auto',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem'
              }}>
                Integrated with <code>get_order_details</code> tool
              </div>
            </div>

            {/* Feature 2: Brand Policy Guardrails */}
            <div className="skincare-card" style={{ padding: '1.85rem', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(217, 130, 82, 0.12)',
                border: '1px solid rgba(217, 130, 82, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-copper)'
              }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Brand Policy Guardrails
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Deterministic business logic ensures compliance: free shipping boundary strictly at ₹499, return requests declined after 7 days, and damaged items approved within 48 hours.
              </p>
              <div style={{
                marginTop: 'auto',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem'
              }}>
                Deterministic business logic engine
              </div>
            </div>

            {/* Feature 3: Post-Call Intelligence */}
            <div className="skincare-card" style={{ padding: '1.85rem', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(217, 130, 82, 0.12)',
                border: '1px solid rgba(217, 130, 82, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-copper)'
              }}>
                <FileJson size={22} />
              </div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Post-Call Intelligence
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Automatically extracts structured JSON summaries containing customer intent, affected order ID, resolution status, and complete call transcripts with single-click copy.
              </p>
              <div style={{
                marginTop: 'auto',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem'
              }}>
                Structured schema artifact output
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW IT WORKS: SPEAK → RESOLVE → SUMMARIZE                       */}
      {/* ------------------------------------------------------------------ */}
      <section style={{
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        padding: '5rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.25rem auto' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-copper)'
          }}>
            Interactive Workflow
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.65rem' }}>
            Speak. Resolve. Summarize.
          </h2>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            A frictionless conversational support journey in three seamless phases.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          position: 'relative'
        }}>
          {/* Step 1 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.25rem 2rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--grad-action)',
              color: '#FFF8F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 2px 10px rgba(217, 130, 82, 0.3)'
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Speak
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Customer speaks naturally. Dual-engine Web Speech API and Whisper audio fallback transcribe speech in real-time with automatic pause detection.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.25rem 2rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--grad-action)',
              color: '#FFF8F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 2px 10px rgba(217, 130, 82, 0.3)'
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Resolve
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Aria executes tool calling for live carrier data, enforces brand policies, and responds verbally with natural Indian English cadence.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.25rem 2rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--grad-action)',
              color: '#FFF8F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 2px 10px rgba(217, 130, 82, 0.3)'
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Summarize
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Once concluded, the conversation is distilled into a structured schema artifact with intent, order reference, resolution code, and JSON export.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. PRODUCT WORKSPACE PREVIEW / DEMO ENTRY ACTION                   */}
      {/* ------------------------------------------------------------------ */}
      <section style={{
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto 4.5rem auto',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1A1816 0%, #221E1B 50%, #27211D 100%)',
          border: '1px solid rgba(217, 130, 82, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '3.25rem 2.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-copper)' }}>
              Ready for Evaluation
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Experience the live customer conversation.
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
              Launch the full workspace to test order lookups, policy boundary queries, and speech recognition with zero setup.
            </p>
          </div>

          <button
            onClick={onEnterWorkspace}
            className="btn-primary"
            style={{ padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 750 }}
          >
            <span>Launch Live Demo Workspace</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. RESTRAINED FOOTER WITH ASSESSMENT DISCLOSURE                    */}
      {/* ------------------------------------------------------------------ */}
      <footer style={{
        marginTop: 'auto',
        background: '#0E0D0C',
        borderTop: '1px solid var(--border-color)',
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Aura Voice CX</strong> • Built for AI Voice Customer Support Hiring Assignment
          </div>

          <div style={{ color: 'var(--text-muted)' }}>
            <strong>Assessment Notice:</strong> Sample orders (ORD-101, ORD-102, ORD-103) are static demonstration fixtures.
          </div>
        </div>
      </footer>
    </div>
  );
}
