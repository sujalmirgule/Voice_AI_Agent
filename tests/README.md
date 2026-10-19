# Aura Voice CX — Automated Test Suite

## Overview
This directory contains the isolated automated test suite for the **Aura Skincare Voice CX** application. All tests execute hermetically offline without requiring real API keys or incurring external AI inference costs.

---

## Directory Structure

```text
tests/
├── backend/                  # Unit tests for backend controllers, tools, and policies
│   ├── api.test.js           # Express route definitions, status codes, and payloads
│   ├── policies.test.js      # Deterministic brand policy boundary conditions
│   ├── order-tool.test.js    # Order normalization, retrieval, and error handling
│   ├── conversation.test.js  # Conversational turn dialog engine & guardrails
│   ├── summary.test.js       # Post-call structured JSON summary extraction
│   ├── validation.test.js    # Request body and parameter validation
│   └── errors.test.js        # Unknown routes and malformed input handling
├── integration/              # Multi-step integration tests
│   └── api-flow.test.js      # Full call lifecycle (Health -> Turn 1 -> Turn 2 -> Summary)
├── fixtures/                 # Static test fixtures
│   ├── orders.fixture.json   # Mock order database snapshot (ORD-101..103)
│   └── conversations.fixture.json # Sample customer dialogue scripts
├── mocks/                    # Mock provider implementations
│   └── ai-provider.mock.js   # Isolated MockAiProvider for simulated test turns
├── helpers/                  # Test harness utilities
│   └── test-server.js        # Ephemeral test server launcher
└── README.md                 # Test documentation
```

---

## Running Tests

From the project root:
```bash
npm test
```

To run individual test files:
```bash
node --test tests/backend/policies.test.js
node --test tests/backend/api.test.js
node --test tests/integration/api-flow.test.js
```

---

## Offline Testing Philosophy
1. **Zero External Billing:** Tests never make outbound network calls to paid AI endpoints (Groq, OpenAI, etc.).
2. **Deterministic Guardrails:** Brand policies (shipping thresholds, cancellation rules, 7-day return limits) are validated deterministically in code.
3. **Pluggable Mock Providers:** The `MockAiProvider` enables injecting custom LLM outputs and recording call payloads without external credentials.
