# Remediation Log: Aura Skincare Voice CX

**Audit Date:** October 19, 2026  
**Status:** All Confirmed Defects Remediated & Regression-Tested

---

## Remediated Defects & Code Changes

### 1. Defect REM-01: Call End Concurrency & Stale Async Resurrection (SCEN-A01, SCEN-A02, SCEN-A03)
- **Component:** `client/src/App.jsx`
- **Severity:** P1 (High)
- **Root Cause:** When a user clicked "End Call" while an async turn request was in-flight, or during the initial 2.8s greeting timeout, the promise resolution or timer would set `agentState('speaking')` / `agentState('listening')`, resurrecting the closed call into active state and appending late turns into the closed session. Additionally, rapid repeated clicks on "Start Call" reset the call state repeatedly.
- **Fix:**
  - Added `callSessionIdRef` in `App.jsx`, incrementing on both `handleStartCall` and `handleEndCall`.
  - Added session ID comparison: any async response whose session ID does not match `callSessionIdRef.current` is silently dropped.
  - Cleared `greetingTimeoutRef` and `speakingTimeoutRef` immediately on `handleEndCall` and `handleResetCall`.
  - Added idempotent guard `if (isCallActive) return;` in `handleStartCall`.
- **Regression Test:** `tests/frontend/failure-modes.test.js`

---

### 2. Defect REM-02: Unknown Tool Call Crash in LLM Provider (SCEN-B02)
- **Component:** `server/src/services/aiProvider.js`
- **Severity:** P1 (High)
- **Root Cause:** In `GroqProvider.processTurn()`, if the LLM attempted to call any tool other than `get_order_details` (e.g. `book_flight` or an unconstrained function), the execution fell through without executing or handling it. When the model emitted tool calls with empty/null `message.content`, `agent_text` was returned as null or undefined.
- **Fix:** Added an explicit `else` branch rejecting unknown tool calls gracefully, logging a warning, and returning a polite brand scope clarification: *"I can only assist with Aura Skincare order lookups, returns, and brand policies. How may I help you with your order?"*
- **Regression Test:** `tests/backend/failure-scenarios.test.js`

---

### 3. Defect REM-03: Missing Deterministic COD & Damaged Report Helpers (SCEN-C02, SCEN-C04, SCEN-C06)
- **Component:** `server/src/policies/brandPolicies.js`
- **Severity:** P1 (High)
- **Root Cause:** `brandPolicies.js` lacked dedicated deterministic evaluation functions for Cash on Delivery (COD) limits (<= ₹2,500) and damaged product replacement claims (48 hours + photo requirement). Furthermore, `calculateShippingFee` did not explicitly validate negative or non-numeric numbers.
- **Fix:**
  - Added `checkCodEligibility(orderValue)` enforcing the ₹2,500 threshold.
  - Added `checkDamagedReportEligibility(hoursSinceDelivery, hasPhotos)` enforcing 48-hour replacement window and photo evidence.
  - Added negative and NaN validation to `calculateShippingFee()`.
- **Regression Test:** `tests/backend/failure-scenarios.test.js`

---

### 4. Defect REM-04: Prompt Injection & Credential Exfiltration Vulnerability (SCEN-B05 / SCEN-H03)
- **Component:** `server/src/services/groqService.js`
- **Severity:** P0 (Critical)
- **Root Cause:** Customer prompts attempting to extract system instructions, API keys, credentials, or private customer records were not intercepted by the deterministic reasoning engine, allowing potential exfiltration or unexpected behavior.
- **Fix:** Implemented `securityInjectionPatterns` regex interceptor in `executeLocalFallbackTurn` that immediately deflects injection attempts with: *"I cannot share internal system instructions, credentials, or other customers' personal records. I am dedicated to assisting you with your own Aura Skincare orders and brand policies."*
- **Regression Test:** `tests/backend/failure-scenarios.test.js`

---

### 5. Defect REM-05: Unbounded Request Payload & History Size (SCEN-D03)
- **Component:** `server/src/middleware/validation.js`
- **Severity:** P1 (High)
- **Root Cause:** `validateTurnInput` did not check character bounds on `text` or turn limits on `messages`. An oversized payload (e.g. 100,000 characters) could trigger memory exhaustion or ReDoS.
- **Fix:**
  - Enforced `req.body.text.length <= 4000` (returning 400 `PAYLOAD_TOO_LARGE`).
  - Enforced `req.body.messages.length <= 100` (returning 400 `MESSAGES_TOO_LONG`).
  - Enforced `req.body.transcript.length <= 200` in `validateSummaryInput` (returning 400 `TRANSCRIPT_TOO_LARGE`).
  - Enforced `id.length <= 50` in `validateOrderIdParam`.
- **Regression Test:** `tests/backend/failure-scenarios.test.js`

---

### 6. Defect REM-06: Order Tool Object Argument Serialization (SCEN-B03)
- **Component:** `server/src/tools/orderTool.js`
- **Severity:** P2 (Medium)
- **Root Cause:** When an object argument was passed to `getOrderDetails({ order_id: 'ORD-999' })`, `searched_id` rendered as `[object Object]` in user-facing error messages.
- **Fix:** Extracted `safeIdString` checking whether `orderId` is a string or an object containing `order_id`, ensuring clean string formatting in all error responses.
- **Regression Test:** `tests/backend/failure-scenarios.test.js`

---

### 7. Defect REM-07: Summary Order Not Found Regex Matching (SCEN-F02, SCEN-F04)
- **Component:** `server/src/services/summaryService.js`
- **Severity:** P1 (High)
- **Root Cause:** `orderNotFound` boolean check only matched exact substrings `"couldn't locate an order"`. Alternative phrases like `"unable to find order"` or `"order not found"` could mistakenly leave an unresolved order lookup marked as `RESOLVED`.
- **Fix:** Replaced substring check with comprehensive regex `/(?:could\s*not|couldn't|unable\s*to)\s*(?:locate|find)\s*(?:an?\s*)?order|order.*not\s*found|unrecognized\s*order/i` and added null-safe turn filtering.
- **Regression Test:** `tests/backend/failure-scenarios.test.js`
