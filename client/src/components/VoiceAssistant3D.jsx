import React, { useEffect, useRef } from 'react';

/**
 * VoiceAssistant3D
 * High-performance 3D Acoustic Metallic Voice Orb rendered with Canvas 2D
 * Features:
 * - Multi-stop metallic copper, terracotta, and amber material shading
 * - Dual-pass depth-sorted 3D orbital rings with orbiting satellite nodes
 * - Radial highlights, Fresnel rim sheen, and pointer-responsive parallax
 * - Voice lifecycle reactivity: idle, listening, thinking, speaking
 * - Multi-frequency acoustic soundwave equalizer inside the metallic core
 */
export default function VoiceAssistant3D({
  agentState = 'idle',
  isCallActive = false,
  isUserSpeaking = false,
  isRecordingAudio = false,
  size = 'default' // 'compact' | 'default' | 'large'
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Store lifecycle props in refs so animation loop reads latest state without re-attaching canvas
  const stateRef = useRef({ agentState, isCallActive, isUserSpeaking, isRecordingAudio });
  useEffect(() => {
    stateRef.current = { agentState, isCallActive, isUserSpeaking, isRecordingAudio };
  }, [agentState, isCallActive, isUserSpeaking, isRecordingAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let time = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax tracking
    const handleMouseMove = (e) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = nx * 32;
      mouseRef.current.targetY = ny * 32;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Smooth mouse parallax easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const { agentState: curState, isCallActive: curActive, isUserSpeaking: curUserSpeaking, isRecordingAudio: curRecording } = stateRef.current;

      const isListening = curActive && curState === 'listening';
      const isSpeaking = curActive && curState === 'speaking';
      const isThinking = curActive && curState === 'thinking';
      const isUserActive = isListening && (curUserSpeaking || curRecording);

      // Animation speed scaling by lifecycle state
      let speedMult = 1.0;
      if (isThinking) speedMult = 1.8;
      else if (isSpeaking) speedMult = 1.4;
      else if (isUserActive) speedMult = 1.5;
      else if (!curActive) speedMult = 0.8;

      if (!prefersReducedMotion) {
        time += 0.016 * speedMult;
      }

      const centerX = width / 2 + mouseRef.current.x;
      const centerY = height / 2 + mouseRef.current.y;

      // Base radius calculation relative to container
      const minDim = Math.min(width, height);
      const isHero = size === 'hero' || size === 'large';
      const radiusFraction = size === 'compact' ? 0.28 : isHero ? 0.34 : 0.27;
      const baseRadius = minDim * radiusFraction;

      // Breathing scale
      const breathePeriod = isUserActive ? 3.0 : isSpeaking ? 2.5 : 1.6;
      const breatheAmp = isUserActive ? 5 : isSpeaking ? 4.5 : isThinking ? 2 : 3;
      const breathe = Math.sin(time * breathePeriod) * breatheAmp;
      const orbRadius = Math.max(30, baseRadius + breathe);

      // -----------------------------------------------------------
      // 1. Ambient Background Glow Aura (Metallic Copper & Amber)
      // -----------------------------------------------------------
      const glowMultiplier = isSpeaking ? 2.3 : isUserActive ? 2.4 : isListening ? 2.0 : isThinking ? 2.1 : 1.75;
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, orbRadius * 0.3,
        centerX, centerY, orbRadius * glowMultiplier
      );

      if (isUserActive) {
        glowGrad.addColorStop(0, 'rgba(255, 182, 110, 0.40)');
        glowGrad.addColorStop(0.45, 'rgba(217, 130, 82, 0.22)');
        glowGrad.addColorStop(0.8, 'rgba(189, 94, 67, 0.08)');
        glowGrad.addColorStop(1, 'rgba(16, 15, 14, 0)');
      } else if (isSpeaking) {
        glowGrad.addColorStop(0, 'rgba(255, 196, 136, 0.42)');
        glowGrad.addColorStop(0.4, 'rgba(217, 130, 82, 0.24)');
        glowGrad.addColorStop(0.8, 'rgba(189, 94, 67, 0.08)');
        glowGrad.addColorStop(1, 'rgba(16, 15, 14, 0)');
      } else if (isThinking) {
        glowGrad.addColorStop(0, 'rgba(230, 174, 88, 0.32)');
        glowGrad.addColorStop(0.5, 'rgba(217, 130, 82, 0.16)');
        glowGrad.addColorStop(1, 'rgba(16, 15, 14, 0)');
      } else if (isListening) {
        glowGrad.addColorStop(0, 'rgba(217, 130, 82, 0.28)');
        glowGrad.addColorStop(0.5, 'rgba(189, 94, 67, 0.14)');
        glowGrad.addColorStop(1, 'rgba(16, 15, 14, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(217, 130, 82, 0.18)');
        glowGrad.addColorStop(0.5, 'rgba(189, 94, 67, 0.08)');
        glowGrad.addColorStop(1, 'rgba(16, 15, 14, 0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius * glowMultiplier, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------
      // 2. Concentric Acoustic Sonic Wavefield Ripples
      // -----------------------------------------------------------
      const rippleCount = isSpeaking ? 3 : isUserActive ? 3 : isListening ? 2 : 1;
      for (let i = 1; i <= rippleCount; i++) {
        const rippleSpeed = isSpeaking ? 1.1 : isUserActive ? 1.0 : 0.65;
        const waveProgress = ((time * rippleSpeed + i * 0.5) % 1.6) / 1.6;
        const waveRadius = orbRadius + waveProgress * (orbRadius * 0.9);
        const waveAlpha = Math.max(0, (1 - waveProgress) * (isSpeaking ? 0.35 : isUserActive ? 0.32 : 0.16));

        ctx.strokeStyle = `rgba(255, 182, 110, ${waveAlpha})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // -----------------------------------------------------------
      // 3. BACK HALVES of 3D Metallic Orbital Rings (Depth-sorted behind sphere)
      // -----------------------------------------------------------
      drawRing(ctx, centerX, centerY, orbRadius * 1.48, 0.40, time * 0.85, -0.42, false, isSpeaking || isUserActive);
      drawRing(ctx, centerX, centerY, orbRadius * 1.76, 0.34, -time * 0.65 + 1.2, 0.54, false, isSpeaking || isUserActive);
      drawRing(ctx, centerX, centerY, orbRadius * 1.28, 0.48, time * 0.50 + 2.1, 0.18, false, isSpeaking || isUserActive);

      // -----------------------------------------------------------
      // 4. Central 3D Metallic Copper Sphere
      // -----------------------------------------------------------
      const lightOffsetX = -orbRadius * 0.32 + mouseRef.current.x * 0.22;
      const lightOffsetY = -orbRadius * 0.32 + mouseRef.current.y * 0.22;

      const sphereGrad = ctx.createRadialGradient(
        centerX + lightOffsetX, centerY + lightOffsetY, orbRadius * 0.08,
        centerX, centerY, orbRadius
      );

      // Curated obsidian-copper metallic palette
      sphereGrad.addColorStop(0, '#FFF5EA');    // Warm ivory specular highlight apex
      sphereGrad.addColorStop(0.18, '#FFC688'); // Luminous amber sheen
      sphereGrad.addColorStop(0.42, '#E68A55'); // Rich metallic copper core
      sphereGrad.addColorStop(0.72, '#BD5E43'); // Deep terracotta mantle
      sphereGrad.addColorStop(0.92, '#6B2A18'); // Warm shadow falloff
      sphereGrad.addColorStop(1, '#241008');    // Ambient occlusion edge

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------
      // 5. Acoustic Soundwave Equalizer (Vocal Waveform Core)
      // -----------------------------------------------------------
      const barCount = 9;
      const barSpacing = orbRadius * 0.125;
      const totalBarWidth = (barCount - 1) * barSpacing;
      const startX = centerX - totalBarWidth / 2;

      ctx.save();
      for (let i = 0; i < barCount; i++) {
        const bx = startX + i * barSpacing;
        const normDist = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const envelope = 1 - normDist * 0.52; // Centered bell curve envelope

        let barHeight;
        if (isSpeaking) {
          // Aria speaking: multi-frequency vocal cadence modulation
          const w1 = Math.sin(time * 6.2 + i * 0.85);
          const w2 = Math.cos(time * 3.7 - i * 0.55);
          const combined = Math.max(0.1, (w1 * 0.6 + w2 * 0.4) * 0.5 + 0.5);
          barHeight = Math.max(10, orbRadius * 0.72 * envelope * (0.35 + combined * 0.65));
        } else if (isUserActive) {
          // User speaking / recording: active responsive wave
          const w = Math.sin(time * 7.5 + i * 1.1) * 0.5 + 0.5;
          barHeight = Math.max(10, orbRadius * 0.68 * envelope * (0.32 + w * 0.68));
        } else if (isThinking) {
          // Thinking: focused rhythmic pulse
          const w = Math.sin(time * 4.0 + i * 0.35) * 0.5 + 0.5;
          barHeight = Math.max(8, orbRadius * 0.38 * envelope * (0.5 + w * 0.5));
        } else if (isListening) {
          // Listening quietly: receptive subtle wave
          const w = Math.sin(time * 2.4 + i * 0.6) * 0.5 + 0.5;
          barHeight = Math.max(7, orbRadius * 0.35 * envelope * (0.35 + w * 0.45));
        } else {
          // Idle / Inactive: calm baseline heartbeat
          const w = Math.sin(time * 1.8 + i * 0.5) * 0.5 + 0.5;
          barHeight = Math.max(6, orbRadius * 0.30 * envelope * (0.3 + w * 0.35));
        }

        // Outer warm copper aura on equalizer bars
        ctx.strokeStyle = isSpeaking || isUserActive
          ? 'rgba(255, 196, 136, 0.65)'
          : 'rgba(217, 130, 82, 0.45)';
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, centerY - barHeight / 2);
        ctx.lineTo(bx, centerY + barHeight / 2);
        ctx.stroke();

        // Inner bright white/ivory core
        ctx.strokeStyle = isSpeaking || isUserActive ? '#FFFFFF' : '#FFF5EA';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(bx, centerY - barHeight / 2);
        ctx.lineTo(bx, centerY + barHeight / 2);
        ctx.stroke();
      }
      ctx.restore();

      // -----------------------------------------------------------
      // 6. Dynamic Specular Sheen (Curved Parallax Reflection)
      // -----------------------------------------------------------
      const specX = centerX + lightOffsetX * 1.12;
      const specY = centerY + lightOffsetY * 1.12;
      const specRadius = orbRadius * 0.38;

      const specGrad = ctx.createRadialGradient(
        specX, specY, 1,
        specX, specY, specRadius
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      specGrad.addColorStop(0.3, 'rgba(255, 235, 215, 0.45)');
      specGrad.addColorStop(0.7, 'rgba(255, 182, 110, 0.12)');
      specGrad.addColorStop(1, 'rgba(217, 130, 82, 0)');

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(specX, specY, specRadius, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------
      // 7. Fresnel Rim Sheen (Metallic Sphere Edge Sheen)
      // -----------------------------------------------------------
      const rimGrad = ctx.createRadialGradient(
        centerX, centerY, orbRadius * 0.86,
        centerX, centerY, orbRadius
      );
      rimGrad.addColorStop(0, 'rgba(217, 130, 82, 0)');
      rimGrad.addColorStop(0.75, 'rgba(255, 182, 110, 0.28)');
      rimGrad.addColorStop(1, 'rgba(255, 240, 220, 0.55)');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------
      // 8. FRONT HALVES of 3D Metallic Orbital Rings (Depth-sorted in front)
      // -----------------------------------------------------------
      drawRing(ctx, centerX, centerY, orbRadius * 1.48, 0.40, time * 0.85, -0.42, true, isSpeaking || isUserActive);
      drawRing(ctx, centerX, centerY, orbRadius * 1.76, 0.34, -time * 0.65 + 1.2, 0.54, true, isSpeaking || isUserActive);
      drawRing(ctx, centerX, centerY, orbRadius * 1.28, 0.48, time * 0.50 + 2.1, 0.18, true, isSpeaking || isUserActive);

      // -----------------------------------------------------------
      // 9. Orbiting Satellite Energy Nodes
      // -----------------------------------------------------------
      drawNode(ctx, centerX, centerY, orbRadius * 1.48, 0.40, time * 0.85 + Math.PI * 0.35, -0.42, isSpeaking || isUserActive);
      drawNode(ctx, centerX, centerY, orbRadius * 1.76, 0.34, -time * 0.65 + Math.PI * 1.25, 0.54, isSpeaking || isUserActive);

      animId = requestAnimationFrame(render);
    };

    // Helper: Draw 3D Tilted Ring (Split into front/back segments for true spherical occlusion)
    function drawRing(ctx, cx, cy, radius, flatten, rotAngle, tiltAngle, isFront, isExcited) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tiltAngle);

      const segments = 64;
      const startSeg = isFront ? 0 : Math.PI;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = startSeg + (i / segments) * Math.PI;
        const x = Math.cos(theta + rotAngle) * radius;
        const y = Math.sin(theta + rotAngle) * radius * flatten;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (isFront) {
        ctx.strokeStyle = isExcited
          ? 'rgba(255, 196, 136, 0.85)'
          : 'rgba(245, 165, 116, 0.65)';
        ctx.lineWidth = isExcited ? 2.0 : 1.7;
      } else {
        ctx.strokeStyle = isExcited
          ? 'rgba(217, 130, 82, 0.40)'
          : 'rgba(189, 94, 67, 0.24)';
        ctx.lineWidth = 1.1;
      }
      ctx.stroke();

      ctx.restore();
    }

    // Helper: Draw metallic satellite node along ring
    function drawNode(ctx, cx, cy, radius, flatten, angle, tiltAngle, isExcited) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tiltAngle);

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * flatten;

      const glowRadius = isExcited ? 12 : 9;
      const nodeGlow = ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
      nodeGlow.addColorStop(0, 'rgba(255, 245, 235, 0.98)');
      nodeGlow.addColorStop(0.35, 'rgba(255, 182, 110, 0.75)');
      nodeGlow.addColorStop(0.8, 'rgba(217, 130, 82, 0.25)');
      nodeGlow.addColorStop(1, 'rgba(217, 130, 82, 0)');

      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Satellite core
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, isExcited ? 3.0 : 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [size]);

  const isHeroSize = size === 'hero' || size === 'large';
  const minHeight = size === 'compact' ? '240px' : isHeroSize ? '400px' : '280px';
  const maxHeight = size === 'compact' ? '280px' : isHeroSize ? '480px' : '340px';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight,
        maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        userSelect: 'none'
      }}
      aria-label="Aura Voice AI 3D Acoustic Sphere"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
