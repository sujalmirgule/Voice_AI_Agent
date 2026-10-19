# Risk Register: Aura Skincare Voice CX

**Audit Date:** October 19, 2026  
**Auditor:** Antigravity Engineering Agent  
**Scope:** Customer, AI Behavior, Brand Policies, Backend/API, Frontend/State, Summary/Transcript, Admin (N/A), Security/Privacy, Deployment, Dependencies.

---

## Severity & Priority Definitions

- **P0 (Critical):** Security exposure, secret leakage, unauthorized actions, severe data corruption, or total application failure.
- **P1 (High):** Core call flow unavailable, incorrect order or policy decisions, major API failure, or serious accessibility/usability blocker.
- **P2 (Medium):** Recoverable functional defects, race conditions, or significant degraded behavior.
- **P3 (Low):** Minor usability, styling, or low-impact edge cases.

---

## Detailed Failure Mode Matrix

| Scenario ID | Category | Affected Component | Trigger / Precondition | Severity | Root Cause | Fix / Mitigation | Verification Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **SCEN-A01** | Customer | `client/src/App.jsx` | User clicks Start Call button repeatedly in rapid succession. | P2 | Lack of idempotent guard on `handleStartCall`. | Added `if (isCallActive) return;` guard. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-A02** | Customer | `client/src/App.jsx` | User ends call during the initial 2.8s greeting timeout. | P2 | Uncancelled timer firing after call ended, setting agent to `listening`. | Added `clearTimeout(greetingTimeoutRef.current)` and session ID checks on End Call. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-A03** | Customer | `client/src/App.jsx` | In-flight API turn resolves after user has already ended call. | P1 | Async promise resolving into unmounted/closed call state and resurrecting `speaking` state. | Added `callSessionIdRef` incrementing on end/start; discards responses from superseded sessions. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-A04** | Customer | `groqService.js` | User utterance is inaudible, unclear, or empty (`[unclear]`, `[inaudible]`). | P2 | Empty/inaudible audio causing confused model responses. | Deterministic deflection prompting user politely to repeat or speak louder. | **VERIFIED PASS** |
| **SCEN-A05** | Customer | `CallInterface.jsx` | Browser lacks Web Speech API or microphone permission is denied. | P1 | Missing browser SpeechRecognition or permission revoked. | Detected in `useEffect`; UI falls back to manual text input with helpful status banner. | **REQUIRES MANUAL BROWSER TEST / VERIFIED FALLBACK** |
| **SCEN-A06** | Customer | `groqService.js` | Customer asks to track/check order without providing an order ID. | P2 | Missing order ID parameter in customer query. | Assistant politely prompts customer for their specific order ID (e.g. ORD-101). | **VERIFIED PASS** |
| **SCEN-A07** | Customer | `orderTool.js` | Customer provides nonexistent order ID (e.g. ORD-999). | P1 | Order not found in mock store. | Tool returns `ORDER_NOT_FOUND`; agent explains order was not located and suggests test IDs. | **VERIFIED PASS** |
| **SCEN-A08** | Customer | `groqService.js` | Customer asks an out-of-scope question (flights, weather, bitcoin). | P2 | General query deflection. | Intercepted deterministically; agent politely upholds Aura Skincare support boundaries. | **VERIFIED PASS** |
| **SCEN-A09** | Customer | `CallInterface.jsx` | Call ends or component unmounts while speech recognition/synthesis active. | P2 | Hanging audio listeners or speech synthesis utterance continuing in background. | `recognition.stop()` and `synth.cancel()` called on call end and cleanup. | **VERIFIED PASS** |
| **SCEN-B01** | AI Behavior | `aiProvider.js` | Groq API key is unconfigured, invalid, or revoked. | P1 | Missing cloud API credentials in offline/local environments. | Automatic routing to `DeterministicProvider` with 100% brand policy compliance. | **VERIFIED PASS** |
| **SCEN-B02** | AI Behavior | `aiProvider.js` | LLM attempts to call an unknown tool (e.g. `book_flight`). | P1 | Model unconstrained tool generation returning null `agent_text`. | Rejected with explanatory clarification; system falls back safely without null text. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-B03** | AI Behavior | `orderTool.js` | Model passes object or non-string argument to `getOrderDetails`. | P2 | `searched_id` rendering as `[object Object]` in error responses. | Sanitized argument to extract string `order_id` or stringify safe identifier. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-B04** | AI Behavior | `orderTool.js` | Model attempts to hallucinate order tracking data. | P1 | Untrusted model generating synthetic tracking numbers. | Grounded strictly in `orders.json` fixtures with deterministic status checking. | **VERIFIED PASS** |
| **SCEN-B05** | AI Behavior | `groqService.js` | Prompt injection attempting to extract system prompt or API credentials. | P0 | Untrusted customer prompt containing "ignore instructions / reveal prompt". | Intercepted by regex pattern; assistant declines and upholds security boundaries. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-B06** | AI Behavior | `aiProvider.js` | Groq API endpoint times out (> 8s) or returns 5xx error. | P1 | Remote API latency or cloud outage. | `AbortSignal.timeout(8000)` triggers fallback to deterministic engine seamlessly. | **VERIFIED PASS** |
| **SCEN-C01** | Brand Policy | `brandPolicies.js`| Order value is exactly ₹499. | P2 | Canonical specification ambiguity: "above ₹499" vs "₹499 and above". | Evaluated as free shipping (₹0); flagged for canonical review without silent breaking change. | **VERIFIED PASS (FLAGGED FOR REVIEW)** |
| **SCEN-C02** | Brand Policy | `brandPolicies.js`| Non-numeric, negative, or NaN order amount passed to shipping calculator. | P2 | Negative value bypassing boundary checks. | Explicit `orderValue < 0` and `isNaN` guard returning `{ valid: false, fee: 50 }`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-C03** | Brand Policy | `brandPolicies.js`| Return requested: delivered 6 days vs 7 days vs 14 days ago; opened vs unopened. | P1 | Return policy boundary enforcement. | Strictly verifies `<= 7 days` and unopened condition; rejects > 7 days or opened products. | **VERIFIED PASS** |
| **SCEN-C04** | Brand Policy | `brandPolicies.js`| Damaged product: reported within 48h vs after 48h; photos provided vs missing. | P1 | Missing deterministic helper for damaged replacement verification. | Added `checkDamagedReportEligibility` helper with photos requirement check. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-C05** | Brand Policy | `brandPolicies.js`| Cancellation: Processing vs Out for Delivery vs Delivered. | P1 | Cancellation policy enforcement. | Permits cancellation only for Processing status; advises doorstep refusal for Out for Delivery. | **VERIFIED PASS** |
| **SCEN-C06** | Brand Policy | `brandPolicies.js`| Cash on Delivery (COD) threshold: <= ₹2,500 vs > ₹2,500. | P1 | Missing deterministic helper for COD boundary. | Added `checkCodEligibility` helper enforcing ₹2,500 maximum limit. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-C07** | Brand Policy | `orderTool.js` | Order ID normalization: handles lowercase, spaces ("ord 101"), missing hyphens ("ORD101"). | P2 | Customer speech transcription variances. | `normalizeOrderId` regex normalizes format to canonical `ORD-XXX`. | **VERIFIED PASS** |
| **SCEN-D01** | Backend/API | `validation.js` | Missing request body on `/api/voice/process-turn` or `/api/call/summary`. | P1 | Missing payload crashing controller. | Caught by `validateTurnInput` / `validateSummaryInput` returning 400 JSON. | **VERIFIED PASS** |
| **SCEN-D02** | Backend/API | `errorHandler.js`| Malformed JSON body in HTTP request. | P1 | Express SyntaxError leaking HTML or stack trace. | Caught in `errorHandler` and formatted as 400 `MALFORMED_JSON` JSON response. | **VERIFIED PASS** |
| **SCEN-D03** | Backend/API | `validation.js` | Excessive payload size (>4000 char turn text, >100 messages, >200 transcript turns). | P1 | Memory exhaustion / ReDoS from unbounded payloads. | Added explicit payload bounds returning 400 `PAYLOAD_TOO_LARGE` / `MESSAGES_TOO_LONG`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-D04** | Backend/API | `server.js` | Unmatched `/api/*` endpoint requested. | P2 | Missing route returning HTML instead of JSON. | `app.all('/api/*', notFoundHandler)` returns structured JSON 404. | **VERIFIED PASS** |
| **SCEN-D05** | Backend/API | `server.js` | Security headers verification. | P2 | Missing defense-in-depth HTTP headers. | Verified `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin` on all responses. | **VERIFIED PASS** |
| **SCEN-E01** | Frontend/UI | `App.jsx` | User clicks End Call while backend request is in flight. | P1 | Stale response writing to closed call. | Discarded via `callSessionIdRef` comparison. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-E02** | Frontend/UI | `App.jsx` | User clicks Start Call repeatedly. | P2 | Multiple rapid session initializations. | Idempotent guard `if (isCallActive) return;`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-E03** | Frontend/UI | `CallInterface.jsx`| Speech synthesis or recognition fails mid-call. | P2 | Audio hardware failure or permission revocation. | Error message displayed in banner; text fallback input remains operational. | **VERIFIED PASS** |
| **SCEN-E04** | Frontend/UI | `CallInterface.jsx`| Audio listeners left active after call end. | P2 | Microphone listening while call inactive. | Cleanup in `useEffect` and `onEndCall` invokes `recognition.stop()`. | **VERIFIED PASS** |
| **SCEN-E05** | Frontend/UI | `index.css` | Viewport resized to mobile screen width (< 768px). | P2 | Layout overflow or two-column collision. | Responsive grid stacks into single-column layout smoothly. | **VERIFIED PASS** |
| **SCEN-E06** | Frontend/UI | `CallInterface.jsx`| Keyboard navigation and screen reader accessibility. | P2 | Missing button IDs, focus rings, or aria attributes. | Added `id="start-call-btn"`, `id="end-call-btn"`, title tooltips, and `aria-live`. | **VERIFIED PASS** |
| **SCEN-F01** | Summary | `summaryService.js`| Empty or single-turn transcript passed to `/api/call/summary`. | P2 | Empty transcript causing summary parser crash. | Handled with safe default: intent `GENERAL_INQUIRY`, status `RESOLVED`, 0 turns. | **VERIFIED PASS** |
| **SCEN-F02** | Summary | `summaryService.js`| Transcript contains unrecognized order ID. | P1 | Summary incorrectly marking unresolved lookup as `RESOLVED`. | Regex matches order lookup failures and assigns `PENDING_CUSTOMER_ACTION`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-F03** | Summary | `summaryService.js`| Transcript contains damaged product claim without photos. | P1 | Summary incorrectly marking damaged claim as resolved. | Detects damaged item claims and assigns `PENDING_CUSTOMER_ACTION`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-F04** | Summary | `summaryService.js`| Malformed transcript turns containing null/undefined speaker or text. | P2 | Type error when joining turn text. | Filter and fallback mapping `t.speaker || 'Speaker'`, `t.text || ''`. | **DEFECT FIXED & REGRESSION-TESTED** |
| **SCEN-G01** | Admin/Operator| N/A | Administrator / operator portal or authentication. | N/A | Feature does not exist in application scope. | Classified as **NOT APPLICABLE** per directive. | **NOT APPLICABLE** |
| **SCEN-H01** | Security | Git / Bundles | Secret API keys committed to Git or exposed in client bundles. | P0 | Accidental secret exposure. | Verified `.env*` gitignored; `.env.example` has placeholders; client imports 0 server secrets. | **VERIFIED PASS** |
| **SCEN-H02** | Security | Frontend React | XSS via untrusted customer or model input. | P0 | Cross-site scripting injection. | React JSX automatically escapes all rendered transcript strings; 0 `dangerouslySetInnerHTML`. | **VERIFIED PASS** |
| **SCEN-I01** | Deployment | `server.js` | Serverless cold start and port binding in Vercel function. | P1 | Port collision or `app.listen()` blocking Vercel execution. | Guarded with `isDirectRun` checking `process.argv[1]`; `api/index.js` exports pure `app`. | **VERIFIED PASS** |
| **SCEN-I02** | Deployment | `vercel.json` | API route rewriting on Vercel. | P1 | SPA rewrite stealing `/api/*` requests. | Specific rewrite `/api/(.*)` -> `/api/index.js` precedes SPA `/(.*)` -> `/index.html`. | **VERIFIED PASS** |
| **SCEN-J01** | Build | `package.json` | Production build execution from clean checkout. | P1 | Missing build artifacts or Vite failure. | Verified `npm run build` runs `vite build` with 0 errors. | **VERIFIED PASS** |
