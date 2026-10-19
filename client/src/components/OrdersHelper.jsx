import React, { useState } from 'react';
import { Package, Shield, Truck, CornerDownRight, ChevronRight, Clock, CheckCircle2, ChevronDown } from 'lucide-react';

export default function OrdersHelper({ onSelectPrompt, isCallActive }) {
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Order Tracking' | 'Returns' | 'Cancellation' | 'Policies'
  const [expandedSection, setExpandedSection] = useState('prompts'); // 'prompts' | 'orders' | 'policies'

  const sampleOrders = [
    {
      id: "ORD-101",
      customer: "Priya Sharma",
      product: "Vitamin C Serum (30ml)",
      value: "₹699",
      status: "Out for Delivery",
      pillClass: "pill-out-for-delivery",
      courier: "BlueDart",
      trackingNumber: "BD-982103",
      eta: "By 6 PM today",
      testPrompt: "Where is my order ORD-101?",
      evaluatorFocus: "Verifies function calling get_order_details and cancellation decline (cannot cancel online once Out for Delivery)."
    },
    {
      id: "ORD-102",
      customer: "Rahul Verma",
      product: "Hydrating Sunscreen SPF 50",
      value: "₹499",
      status: "Delivered",
      pillClass: "pill-delivered",
      courier: "Delhivery",
      trackingNumber: "DL-441029",
      eta: "Delivered 14 days ago",
      testPrompt: "I bought ORD-102 14 days ago, can I return it?",
      evaluatorFocus: "Verifies 7-day return policy enforcement (delivered 14 days ago, so return is politely declined)."
    },
    {
      id: "ORD-103",
      customer: "Ananya Patel",
      product: "Green Tea Face Wash + Toner",
      value: "₹850",
      status: "Processing",
      pillClass: "pill-processing",
      courier: "Pending Dispatch",
      trackingNumber: "WH-55019",
      eta: "Estimated 3-5 days",
      testPrompt: "Can I cancel my order ORD-103?",
      evaluatorFocus: "Verifies cancellation policy: orders in Processing status are eligible for immediate cancellation."
    }
  ];

  const quickScenarios = [
    {
      category: 'Order Tracking',
      icon: Clock,
      prompt: "Where is my order ORD-101?",
      note: "BlueDart • Arriving today by 7 PM",
      target: "ORD-101"
    },
    {
      category: 'Cancellation',
      icon: Clock,
      prompt: "Can I cancel my order ORD-103?",
      note: "Processing state • Eligible for cancellation",
      target: "ORD-103"
    },
    {
      category: 'Returns',
      icon: Clock,
      prompt: "I bought ORD-102 14 days ago, can I return it?",
      note: "Delivered 14 days ago • Policy decline",
      target: "ORD-102"
    },
    {
      category: 'Returns',
      icon: Shield,
      prompt: "What is your return policy?",
      note: "7-day unopened policy window",
      target: "Policy"
    },
    {
      category: 'Policies',
      icon: Shield,
      prompt: "What is your shipping policy?",
      note: "Free shipping > ₹499 boundary",
      target: "Policy"
    },
    {
      category: 'Returns',
      icon: Shield,
      prompt: "My product arrived damaged, what should I do?",
      note: "48-hour damage reporting rule",
      target: "Policy"
    },
    {
      category: 'Policies',
      icon: Shield,
      prompt: "Can you book me a flight to Goa?",
      note: "Out-of-scope deflection check",
      target: "Boundary"
    }
  ];

  const policyScenarios = [
    {
      title: "Shipping Fee Calculation",
      prompt: "What is your shipping policy?",
      rule: "Free delivery above ₹499; ₹50 fee below ₹499; 3–5 business days."
    },
    {
      title: "Damaged Product (48h)",
      prompt: "My package arrived damaged with broken bottle, can I get a replacement?",
      rule: "Approved if reported within 48h with photographs."
    },
    {
      title: "Unknown Order Lookup",
      prompt: "What is the status of order ORD-9999?",
      rule: "Must not hallucinate; politely prompts customer to re-check ID."
    },
    {
      title: "Out-of-Scope Deflection",
      prompt: "Can you book me a flight to Goa?",
      rule: "Politely declines and redirects to Aura Skincare products."
    }
  ];

  const handlePromptClick = (prompt) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
  };

  const filteredScenarios = quickScenarios.filter(scen =>
    activeTab === 'All' || scen.category === activeTab
  );

  return (
    <div
      id="guided-scenarios-panel"
      className="skincare-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'var(--bg-surface)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={17} color="var(--accent-copper)" />
          <h2 style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0
          }}>
            Test Scenarios & Guardrails
          </h2>
        </div>

        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--accent-copper)',
          background: 'rgba(217, 130, 82, 0.12)',
          border: '1px solid rgba(217, 130, 82, 0.28)',
          padding: '0.15rem 0.55rem',
          borderRadius: 'var(--radius-full)'
        }}>
          Deterministic Rules Active
        </span>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {[
          { key: 'All', label: 'All' },
          { key: 'Order Tracking', label: 'Tracking' },
          { key: 'Cancellation', label: 'Cancel' },
          { key: 'Returns', label: 'Returns' },
          { key: 'Policies', label: 'Policies' }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? 'var(--accent-copper)' : 'var(--bg-elevated)',
                color: isActive ? '#100F0E' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-copper)' : 'var(--border-color)'}`,
                padding: '0.28rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                fontWeight: isActive ? 750 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Quick Prompts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {filteredScenarios.map((scen, idx) => {
          const IconComp = scen.icon;
          return (
            <div
              key={idx}
              onClick={() => handlePromptClick(scen.prompt)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-copper)';
                e.currentTarget.style.backgroundColor = '#25211E';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              }}
              title={`Click to test: "${scen.prompt}"`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                <IconComp size={14} color="var(--accent-copper)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.80rem',
                    fontWeight: 650,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {scen.prompt}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    {scen.note}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--accent-copper)',
                fontSize: '0.70rem',
                fontWeight: 700,
                flexShrink: 0,
                marginLeft: '0.5rem'
              }}>
                <span>Ask</span>
                <ChevronRight size={13} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accordion / Secondary Details Section */}
      <div style={{
        marginTop: '0.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.85rem'
      }}>
        {/* Toggle 1: Sample Order Records Reference */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setExpandedSection(prev => prev === 'orders' ? null : 'orders')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 700
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Package size={14} color="var(--accent-copper)" />
              <span>Sample Order Records Reference</span>
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: expandedSection === 'orders' ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease'
              }}
            />
          </button>

          {expandedSection === 'orders' && (
            <div style={{
              padding: '0 0.85rem 0.85rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              {sampleOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        color: 'var(--accent-copper)',
                        background: 'rgba(217, 130, 82, 0.12)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px'
                      }}>
                        {order.id}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {order.customer}
                      </span>
                    </div>

                    <span className={`pill-badge ${order.pillClass}`}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    <span>{order.product}</span> • <strong style={{ color: 'var(--text-primary)' }}>{order.value}</strong>
                  </div>

                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    Courier: {order.courier} • {order.eta}
                  </div>

                  <div style={{
                    fontSize: '0.70rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated)',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '4px',
                    borderLeft: '2px solid var(--accent-copper)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Guardrail Target:</strong> {order.evaluatorFocus}
                  </div>

                  <button
                    onClick={() => handlePromptClick(order.testPrompt)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '0.15rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-copper)',
                      padding: '0.22rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-copper)';
                      e.currentTarget.style.backgroundColor = '#25211E';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    }}
                  >
                    <CornerDownRight size={11} />
                    <span>Ask: "{order.testPrompt}"</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toggle 2: Brand Policies & Boundary Checks */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setExpandedSection(prev => prev === 'policies' ? null : 'policies')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 700
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Shield size={14} color="var(--accent-copper)" />
              <span>Brand Policy & Guardrail Rules</span>
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: expandedSection === 'policies' ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease'
              }}
            />
          </button>

          {expandedSection === 'policies' && (
            <div style={{
              padding: '0 0.85rem 0.85rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {policyScenarios.map((scen, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.7rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {scen.title}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--accent-copper)',
                      background: 'rgba(217, 130, 82, 0.1)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      Enforced
                    </span>
                  </div>

                  <p style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {scen.rule}
                  </p>

                  <button
                    onClick={() => handlePromptClick(scen.prompt)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '0.1rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-copper)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-copper)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <CornerDownRight size={11} />
                    <span>Test rule: "{scen.prompt}"</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Disclaimer Footer */}
      <div style={{
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.65rem'
      }}>
        Aura Skincare assessment fixtures • Zero fabricated commerce data
      </div>
    </div>
  );
}
