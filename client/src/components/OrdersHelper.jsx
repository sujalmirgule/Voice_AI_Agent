import React from 'react';
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function OrdersHelper({ onSelectPrompt, isCallActive }) {
  const sampleOrders = [
    {
      id: "ORD-101",
      customer: "Priya Sharma",
      product: "Vitamin C Serum (30ml)",
      value: "₹699",
      status: "Out for Delivery",
      statusColor: "#38bdf8",
      courier: "BlueDart — BD-982103",
      eta: "Expected by 6 PM today",
      testPrompt: "Where is my order ORD-101?",
      notes: "Cannot cancel online; customer may refuse delivery at doorstep."
    },
    {
      id: "ORD-102",
      customer: "Rahul Verma",
      product: "Hydrating Sunscreen SPF 50",
      value: "₹499",
      status: "Delivered",
      statusColor: "#10b981",
      courier: "Delhivery — DL-441029",
      eta: "Delivered 14 days ago",
      testPrompt: "I bought ORD-102 14 days ago, can I return it?",
      notes: "Delivered > 7 days ago. Outside 7-day return policy."
    },
    {
      id: "ORD-103",
      customer: "Ananya Patel",
      product: "Green Tea Face Wash + Toner",
      value: "₹850",
      status: "Processing",
      statusColor: "#f59e0b",
      courier: "Pending Dispatch",
      eta: "Ordered 3 hours ago",
      testPrompt: "Can I cancel my order ORD-103?",
      notes: "In 'Processing' status. Fully eligible for immediate cancellation."
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} color="#10b981" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Test Orders Helper
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Mock Database
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
        Available sample order IDs for evaluators. Speak these order IDs during the call or click any prompt below to query immediately:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {sampleOrders.map(order => (
          <div
            key={order.id}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              transition: 'border-color 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  {order.id}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>
                  {order.customer}
                </span>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: order.statusColor,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: `${order.statusColor}15`,
                border: `1px solid ${order.statusColor}30`
              }}>
                {order.status}
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>{order.product}</span> • <span style={{ color: '#f8fafc', fontWeight: 600 }}>{order.value}</span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Truck size={12} />
              <span>{order.courier} ({order.eta})</span>
            </div>

            <div style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              borderLeft: `2px solid ${order.statusColor}`
            }}>
              💡 {order.notes}
            </div>

            <button
              onClick={() => onSelectPrompt(order.testPrompt)}
              disabled={!isCallActive}
              style={{
                marginTop: '0.35rem',
                background: isCallActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: isCallActive ? '#34d399' : '#64748b',
                border: isCallActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isCallActive ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <span>"{order.testPrompt}"</span>
              <span style={{ fontSize: '0.7rem' }}>{isCallActive ? 'Click to ask →' : '(Start Call to Test)'}</span>
            </button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '1.25rem',
        padding: '0.85rem',
        background: 'rgba(19, 34, 37, 0.5)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
          Aura Brand Guardrails Summary:
        </div>
        <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <li>Free delivery on orders ≥ ₹499 (₹50 fee below ₹499)</li>
          <li>Returns within 7 days of delivery for unopened items</li>
          <li>Cancellation permitted ONLY in 'Processing' status</li>
          <li>COD available up to ₹2,500 (Cash/UPI at doorstep)</li>
        </ul>
      </div>
    </div>
  );
}
