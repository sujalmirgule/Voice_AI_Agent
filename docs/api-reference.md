# Aura Skincare Voice CX — API Reference Specification

**Base URL (Local):** `http://localhost:3000/api`  
**Base URL (Production/Vercel):** `https://<your-vercel-deployment>.vercel.app/api`  
**Format:** JSON (UTF-8) / Multipart Form Data for audio uploads  

---

## 1. System & Health

### `GET /api/health`
Checks backend service availability, uptime, environment, and AI provider configuration status.

- **Request:** None
- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "service": "Aura Skincare Voice CX API",
    "uptime": 142.3,
    "timestamp": "2026-10-19T13:45:00.000Z",
    "environment": "production",
    "groq_configured": true
  }
  ```

---

## 2. Orders Database

### `GET /api/orders`
Retrieves all sample orders in the mock database.

- **Request:** None
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "orders": [
      {
        "order_id": "ORD-101",
        "customer": "Priya Sharma",
        "product": "Vitamin C Serum (30ml)",
        "value": 699,
        "status": "Out for Delivery",
        "courier": "BlueDart",
        "tracking_number": "BD-982103",
        "eta": "Expected by 6 PM today",
        "can_cancel": false,
        "can_return": false
      }
    ]
  }
  ```

### `GET /api/orders/:id`
Retrieves details and deterministic policy eligibility for a specific order.

- **URL Parameter:** `id` (e.g. `ORD-101`, `ord101`, `ORD-102`)
- **Response (200 OK - Found):**
  ```json
  {
    "success": true,
    "order_id": "ORD-101",
    "customer": "Priya Sharma",
    "product": "Vitamin C Serum (30ml)",
    "value": 699,
    "status": "Out for Delivery",
    "courier": "BlueDart",
    "tracking_number": "BD-982103",
    "eta": "Expected by 6 PM today",
    "can_cancel": false,
    "cancellation_info": "Order ORD-101 is currently Out for Delivery...",
    "can_return": false,
    "return_info": "Product has not yet been delivered."
  }
  ```
- **Response (404 Not Found):**
  ```json
  {
    "success": false,
    "error": "ORDER_NOT_FOUND",
    "searched_id": "ORD-999",
    "message": "I could not locate an order with ID \"ORD-999\"..."
  }
  ```

---

## 3. Brand Policies Reference

### `GET /api/policies`
Returns authoritative brand knowledge and customer support policies for Aura Skincare.

- **Request:** None
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "brand": {
      "name": "Aura Skincare",
      "persona": {
        "name": "Aria",
        "role": "Aura Skincare Customer Support Specialist"
      },
      "policies": {
        "shipping": {
          "freeShippingThreshold": 499,
          "standardFee": 50,
          "deliveryWindow": "3–5 business days"
        },
        "returns": {
          "windowDays": 7,
          "damagedReportHours": 48
        },
        "cancellation": {
          "allowedStatus": "Processing"
        },
        "cod": {
          "maxLimit": 2500
        }
      }
    }
  }
  ```

---

## 4. Voice Conversation

### `POST /api/voice/process-turn`
Processes an individual user turn. Accepts JSON with user text and conversation history, or multipart/form-data with recorded audio.

- **Content-Type:** `application/json` or `multipart/form-data`
- **JSON Request Body:**
  ```json
  {
    "text": "Where is my order ORD-101?",
    "messages": [
      { "role": "assistant", "content": "Namaste! I am Aria from Aura Skincare." }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user_text": "Where is my order ORD-101?",
    "agent_text": "Your order ORD-101 for Priya Sharma (Vitamin C Serum (30ml)) is Out for Delivery via BlueDart and is expected by 6 PM today.",
    "tool_called": {
      "name": "get_order_details",
      "args": { "order_id": "ORD-101" },
      "result": { "success": true, "order_id": "ORD-101", ... }
    },
    "provider": "groq-llama-3.3-70b"
  }
  ```
- **Error (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "MISSING_USER_INPUT",
    "message": "No user speech or text was provided."
  }
  ```

### `POST /api/voice/tts`
Generates spoken audio response via Groq Speech API (`canopylabs/orpheus-v1-english`) with automated fallback negotiation for client-side Web Speech synthesis when model terms acceptance is pending.

- **Request Body:**
  ```json
  {
    "text": "Hello! I can help you with your skincare orders.",
    "voice": "troy"
  }
  ```
- **Response (200 OK - Audio Generation):**
  - Content-Type: `audio/wav`
  - Body: Binary WAV audio data
- **Response (200 OK - Browser Fallback Graceful Negotiation):**
  ```json
  {
    "success": false,
    "fallback": "browser_synthesis",
    "reason": "model_terms_required",
    "message": "Please accept terms in Groq console to enable direct server TTS audio: https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english"
  }
  ```
- **Error (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "MISSING_TEXT",
    "message": "Text is required for speech synthesis."
  }
  ```

---

## 5. Post-Call Summary

### `POST /api/call/summary`
Generates a structured post-call summary and outcome from full conversation transcript turns.

- **Request Body:**
  ```json
  {
    "transcript": [
      { "speaker": "Customer", "text": "Can you check my order ORD-101?" },
      { "speaker": "Aria", "text": "Order ORD-101 is out for delivery and expected by 6 PM today." }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "customer_intent": "ORDER_TRACKING",
      "order_id": "ORD-101",
      "resolution_status": "RESOLVED",
      "call_summary": "Customer asked about the delivery status of ORD-101. The order is out for delivery and expected by 6 PM today.",
      "timestamp": "2026-10-19T13:45:00.000Z",
      "total_turns": 2
    }
  }
  ```
- **Error (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "INVALID_TRANSCRIPT",
    "message": "A valid array of conversation transcript turns is required."
  }
  ```
