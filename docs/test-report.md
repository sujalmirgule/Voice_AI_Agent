# Test Report: Aura Skincare Voice CX Application

**Date:** October 19, 2026  
**Environment:** Windows PowerShell, Node.js v24.14.0, Express 4.21.2, React 18.3.1  
**Overall Status:** **12/12 AUTOMATED TESTS PASSED (100%)**

---

## 1. Automated Test Suite Results

Test execution command: `npm --prefix server test`

| Test Suite / Category | Test Case Description | Execution Result | Duration |
| :--- | :--- | :---: | :---: |
| **Brand Policies** | Shipping fee: orders < ₹499 incur ₹50 fee; orders ≥ ₹499 receive Free Delivery | **PASS** | 0.89ms |
| **Brand Policies** | Cancellation: ORD-103 (Processing) can cancel; ORD-101 (Out for delivery) cannot cancel online | **PASS** | 0.81ms |
| **Brand Policies** | Returns: ORD-102 (Delivered 14 days ago) rejected (> 7 days); unopened within 7 days accepted | **PASS** | 0.33ms |
| **Order Tool** | `normalizeOrderId` handles casing, spaces, hyphens (`ord 101`, `ord101` -> `ORD-101`) | **PASS** | 1.77ms |
| **Order Tool** | `getOrderDetails` retrieves ORD-101 (Priya Sharma, Vitamin C Serum, BlueDart) | **PASS** | 1.12ms |
| **Order Tool** | `getOrderDetails` retrieves ORD-102 (Rahul Verma, Hydrating Sunscreen, Delivered) | **PASS** | 0.42ms |
| **Order Tool** | `getOrderDetails` retrieves ORD-103 (Ananya Patel, Green Tea Face Wash, Processing) | **PASS** | 0.31ms |
| **Order Tool** | Graceful handling of invalid or non-existent order IDs (`ORD-999`) without crashing | **PASS** | 0.95ms |
| **Conversational Guardrails** | Out-of-scope query ("Can you book me a flight to Goa?") politely deflected | **PASS** | 1.23ms |
| **Conversational Guardrails** | Voice order lookup turn for ORD-101 triggers tool and reports live tracking info | **PASS** | 0.86ms |
| **Conversational Guardrails** | Return inquiry for opened item 20 days ago politely rejected under brand policy | **PASS** | 0.22ms |
| **Post-Call Summary** | Chronological transcript turns parsed into compliant structured JSON summary | **PASS** | 1.18ms |

**Total Tests:** 12  
**Passing:** 12  
**Failing:** 0  
**Execution Time:** ~270 ms  

---

## 2. Live HTTP Endpoint Verification

Executed via `Invoke-RestMethod` on active local server (`http://localhost:3000`):

| Endpoint | Method | Payload / Target | Expected Output | Actual Observed Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `/api/health` | GET | None | `{ status: "healthy" }` | `{ status: "healthy", service: "Aura Skincare Voice CX API", uptime: ... }` | **PASS** |
| `/api/orders/ORD-101` | GET | ORD-101 | Customer: Priya Sharma, Out for Delivery | Returned full order object with courier: BlueDart, tracking: BD-982103 | **PASS** |
| `/api/voice/process-turn` | POST | "Can you tell me where my order ORD-101 is?" | Tool executed: `get_order_details('ORD-101')` | Returned tool execution with ETA "Expected by 6 PM today" | **PASS** |
| `/api/voice/process-turn` | POST | "I bought this 20 days ago and have opened it. Can I return it?" | Policy enforcement refusal | Returned: "I am sorry, but our return policy only accepts returns within 7 days of delivery..." | **PASS** |
| `/api/voice/process-turn` | POST | "Can you book me a flight to Goa?" | Out-of-scope polite deflection | Returned: "I can only help with Aura Skincare orders, shipping, and product return policies..." | **PASS** |
| `/api/call/summary` | POST | 2-turn transcript for ORD-101 | Structured JSON with intent & order_id | `{ customer_intent: "ORDER_TRACKING", order_id: "ORD-101", resolution_status: "RESOLVED", ... }` | **PASS** |
| `/` (Root Web Route) | GET | None | Compiled React index.html (Status 200) | `StatusCode 200`, Served React single-page application bundle | **PASS** |
