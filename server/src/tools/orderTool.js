import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkCancellationEligibility, checkReturnEligibility } from '../policies/brandPolicies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ordersFilePath = path.join(__dirname, '../data/orders.json');

const DEFAULT_ORDERS = [
  {
    order_id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    value: 699,
    status: "Out for Delivery",
    courier: "BlueDart",
    tracking_number: "BD-982103",
    eta: "Expected by 6 PM today",
    delivered_days_ago: null,
    notes: "BlueDart — BD-982103. Expected by 6 PM today",
    can_cancel: false,
    cancellation_reason: "Order is already Out for Delivery and cannot be cancelled online. You may politely refuse delivery at the doorstep if you no longer want the package.",
    can_return: false,
    return_reason: "Product has not yet been delivered."
  },
  {
    order_id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    value: 499,
    status: "Delivered",
    courier: "Delhivery",
    tracking_number: "DL-441029",
    eta: "Delivered 14 days ago",
    delivered_days_ago: 14,
    notes: "Delhivery — DL-441029. Delivered 14 days ago",
    can_cancel: false,
    cancellation_reason: "Order has already been delivered and cannot be cancelled.",
    can_return: false,
    return_reason: "Aura Skincare return policy allows returns within 7 days of delivery for unopened, unused items. This order was delivered 14 days ago, so it falls outside our return window."
  },
  {
    order_id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    value: 850,
    status: "Processing",
    courier: null,
    tracking_number: null,
    eta: "Standard delivery takes 3-5 business days",
    delivered_days_ago: null,
    notes: "Ordered 3 hours ago. Eligible for cancellation",
    can_cancel: true,
    cancellation_reason: "Order is currently in Processing status and is eligible for immediate cancellation.",
    can_return: false,
    return_reason: "Product has not yet been shipped or delivered."
  }
];

/**
 * Loads all orders from orders.json with guaranteed fallback for serverless deployments
 */
export function getAllOrders() {
  try {
    if (fs.existsSync(ordersFilePath)) {
      const rawData = fs.readFileSync(ordersFilePath, 'utf8');
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Falling back to embedded orders dataset:', error.message);
  }
  return DEFAULT_ORDERS;
}

/**
 * Normalizes an order ID string (e.g. "ord 101", "ord-101", "ORD101" -> "ORD-101")
 */
export function normalizeOrderId(rawId) {
  if (!rawId || typeof rawId !== 'string') return null;
  const strId = rawId.trim().toUpperCase().replace(/\s+/g, '-');
  const match = strId.match(/(?:ORD|ORDER)[-]?(\d+)/i);
  if (match) {
    return `ORD-${match[1]}`;
  }
  return strId;
}

/**
 * Tool definition for LLM function calling
 */
export const orderToolDefinition = {
  type: "function",
  function: {
    name: "get_order_details",
    description: "Look up real-time Aura Skincare order information, delivery status, courier tracking, and return/cancellation eligibility by Order ID.",
    parameters: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The unique order identifier, e.g. ORD-101, ORD-102, or ORD-103."
        }
      },
      required: ["order_id"]
    }
  }
};

/**
 * Tool execution handler: get_order_details
 */
export function getOrderDetails(orderId) {
  if (!orderId) {
    return {
      success: false,
      error: "MISSING_ORDER_ID",
      message: "No order ID was provided. Please ask the customer for their Aura Skincare order ID (for example, ORD-101)."
    };
  }

  const safeIdString = typeof orderId === 'string'
    ? orderId
    : typeof orderId === 'object' && orderId !== null && orderId.order_id
      ? String(orderId.order_id)
      : String(orderId);

  const normalizedId = normalizeOrderId(safeIdString);
  const orders = getAllOrders();
  const foundOrder = orders.find(o => o.order_id === normalizedId);

  if (!foundOrder) {
    return {
      success: false,
      error: "ORDER_NOT_FOUND",
      searched_id: safeIdString,
      message: `I could not locate an order with ID "${safeIdString}". Available sample order IDs in our system are ORD-101, ORD-102, and ORD-103. Please ask the customer to verify or re-check the number.`
    };
  }

  // Enrich with policy checks
  const cancellationStatus = checkCancellationEligibility(foundOrder);
  const returnStatus = checkReturnEligibility(foundOrder);

  return {
    success: true,
    order_id: foundOrder.order_id,
    customer: foundOrder.customer,
    product: foundOrder.product,
    value: foundOrder.value,
    status: foundOrder.status,
    courier: foundOrder.courier,
    tracking_number: foundOrder.tracking_number,
    eta: foundOrder.eta,
    notes: foundOrder.notes,
    can_cancel: foundOrder.can_cancel,
    cancellation_info: cancellationStatus.message,
    can_return: foundOrder.can_return,
    return_info: returnStatus.message,
    raw_order: foundOrder
  };
}
