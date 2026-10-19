# Phase A1: Backend Readiness Audit & Gap Analysis

**Project:** Aura Skincare AI Voice Support Agent (**Aura Voice CX**)  
**Audit Date:** October 19, 2026  
**Auditor:** Automated Engineering Subsystem  
**Target Architecture:** Vercel-compatible Full-Stack Application (Express Serverless API + Vite React SPA)

---

## 1. Existing Server Implementation Inventory

| File Path | Current Role | Strengths | Gaps & Defects Identified |
| :--- | :--- | :--- | :--- |
| `server/src/server.js` | Express app & HTTP listener | Serves API and static client; includes basic security headers. | Needs export compatibility for Vercel Functions (`api/index.js`); lacks centralized modular error handling middleware; route handling mixed with static serving. |
| `server/src/routes/api.js` | Express route definitions | Defines `/health`, `/orders`, `/orders/:id`, `/policies`, `/voice/process-turn`, `/call/summary`. | Route handlers contain inlined controller logic; lacks isolated schema validation middleware; unknown 404 handler for invalid `/api/*` subroutes is missing. |
| `server/src/policies/brandPolicies.js` | Deterministic policy functions | Free shipping threshold (₹499), 7-day returns, processing cancellations, COD limit (₹2,500). | Solid foundation. Needs explicit boundary case handling and export of clear policy constants for validation. |
| `server/src/tools/orderTool.js` | `get_order_details` function | Normalized regex for `ORD-101..103`, policy enrichment. | Hardcoded JSON read on every invocation (`fs.readFileSync`) without in-memory caching or fixture isolation for tests. |
| `server/src/services/groqService.js` | Groq LPU API + fallback | Dual execution mode; 8s timeout via `AbortSignal`. | AI provider adapter is tightly coupled with Groq; lacks pluggable mock interface for hermetic test execution without network requests. |
| `server/src/services/summaryService.js` | JSON summary generator | Standardized schema; distinguishes `RESOLVED` vs `PENDING_CUSTOMER_ACTION`. | Relies on keyword heuristics when offline; needs schema validation guarding against missing keys. |
| `server/src/data/orders.json` | Mock orders database | Accurate fixture values for Priya, Rahul, Ananya. | Works as expected; should have an isolated mirror in `tests/fixtures/` so tests do not touch runtime data. |
| `server/tests/` (existing) | Unit and integration tests | 24 passing tests. | Located inside `server/tests/` instead of an isolated root `tests/` directory; lacks mock provider abstractions. |

---

## 2. Identified Backend Deficiencies & Action Items

1. **Vercel Serverless Function Compatibility:**
   - Vercel routes `/api/*` requests to serverless functions in the `api/` directory.
   - We must provide `api/index.js` that imports and re-exports the Express `app` without calling `listen()`.
   - `vercel.json` must be configured with appropriate builds and rewrites for both static client assets and `/api` serverless execution.
2. **Modular Architecture Separation:**
   - Extract controller functions out of `server/src/routes/api.js` into `server/src/controllers/`.
   - Introduce `server/src/middleware/validation.js` to validate query params, JSON bodies, and file uploads.
   - Introduce `server/src/middleware/errorHandler.js` to handle all 4xx/5xx errors consistently without leaking internal stack traces.
   - Introduce `server/src/config/index.js` to encapsulate environment variables (`PORT`, `GROQ_API_KEY`, `GROQ_MODEL`, `NODE_ENV`).
3. **Pluggable AI Provider Adapter:**
   - Refactor `groqService.js` into an adapter pattern (`aiProvider.js`) that supports `GroqProvider` (production/staging) and `MockAiProvider` (testing).
   - In offline test mode, `MockAiProvider` deterministically simulates tool calls without network calls or fake credentials.
4. **Isolated Test Structure:**
   - Relocate tests from `server/tests/` into a root-level `tests/` directory with `backend/`, `integration/`, `fixtures/`, `mocks/`, and `helpers/`.
   - Ensure `npm test` runs all backend and integration tests without network dependencies.
5. **API Documentation:**
   - Create `docs/api-reference.md` documenting every endpoint, request/response schema, status codes, and error payloads.

---

## 3. Phase A Readiness Gate

- [x] Full source code inspection completed.
- [ ] Modular controllers, validation, and error middleware implemented.
- [ ] Vercel entrypoint (`api/index.js`) and `vercel.json` configured.
- [ ] Pluggable AI provider adapter with mock provider for tests implemented.
- [ ] Isolated `tests/` directory established and verified.
- [ ] `docs/api-reference.md` published.
