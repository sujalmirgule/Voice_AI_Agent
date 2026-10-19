import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function CompactOrderSelector({ onSelectOrderPrompt, isCallActive }) {
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-101');

  const orders = [
    {
      id: 'ORD-101',
      customer: 'Priya Sharma',
      product: 'Vitamin C Serum (30ml)',
      value: '₹699',
      status: 'Out for Delivery',
      pillClass: 'pill-out-for-delivery',
      statusIcon: Truck,
      courier: 'BlueDart (BD-982103)',
      detail: 'Arriving today by 7 PM • Cannot cancel once out for delivery',
      testPrompt: 'Where is my order ORD-101?'
    },
    {
      id: 'ORD-102',
      customer: 'Rahul Verma',
      product: 'Hydrating Sunscreen SPF 50',
      value: '₹499',
      status: 'Delivered',
      pillClass: 'pill-delivered',
      statusIcon: CheckCircle2,
      courier: 'Delhivery (DL-441029)',
      detail: 'Delivered 14 days ago • Return declined (exceeds 7-day window)',
      testPrompt: 'I bought ORD-102 14 days ago, can I return it?'
    },
    {
      id: 'ORD-103',
      customer: 'Ananya Patel',
      product: 'Green Tea Face Wash + Toner',
      value: '₹850',
      status: 'Processing',
      pillClass: 'pill-processing',
      statusIcon: Clock,
      courier: 'Pending Dispatch',
      detail: 'Warehouse processing • Eligible for immediate cancellation',
      testPrompt: 'Can I cancel my order ORD-103?'
    }
  ];

  const handleCardClick = (order) => {
    setSelectedOrderId(order.id);
    if (onSelectOrderPrompt) {
      onSelectOrderPrompt(order.testPrompt);
    }
  };

  return (
    <section
      id="compact-order-selector"
      aria-label="Sample Order Records"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        width: '100%'
      }}
    >
      {/* Top Label & Small Disclaimer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0 0.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={15} color="var(--accent-copper)" />
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-primary)'
          }}>
            Sample Order Scenarios (Click to test with Aria):
          </span>
        </div>

        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          padding: '0.15rem 0.65rem',
          borderRadius: 'var(--radius-full)'
        }}>
          Assessment demo data — not live customer records
        </span>
      </div>

      {/* 3 Compact Responsive Cards in Single Row */}
      <div className="compact-order-bar">
        {orders.map((ord) => {
          const isSelected = selectedOrderId === ord.id;
          const IconComponent = ord.statusIcon;

          return (
            <div
              key={ord.id}
              onClick={() => handleCardClick(ord)}
              className="skincare-card"
              style={{
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: isSelected ? '1px solid var(--accent-copper)' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 4px 14px rgba(217, 119, 69, 0.2)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                position: 'relative'
              }}
              title={`Click to test: "${ord.testPrompt}"`}
            >
              {/* Order ID & Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: isSelected ? 'var(--accent-copper)' : 'var(--text-primary)',
                  letterSpacing: '0.02em',
                  fontFamily: 'JetBrains Mono'
                }}>
                  {ord.id}
                </span>

                <span className={`pill-badge ${ord.pillClass}`}>
                  <IconComponent size={11} />
                  <span>{ord.status}</span>
                </span>
              </div>

              {/* Customer & Product */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{ord.customer}</strong> • {ord.product}
              </div>

              {/* Concise Relevant Detail */}
              <div style={{
                fontSize: '0.73rem',
                color: 'var(--text-muted)',
                lineHeight: 1.3,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.35rem'
              }}>
                <span>{ord.detail}</span>
                <ArrowRight size={12} color={isSelected ? 'var(--accent-copper)' : 'var(--border-color)'} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
