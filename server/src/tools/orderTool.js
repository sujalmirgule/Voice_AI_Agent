import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkCancellationEligibility, checkReturnEligibility } from '../policies/brandPolicies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ordersFilePath = path.join(__dirname, '../data/orders.json');

/**
 * Loads all orders from orders.json
 */
export function getAllOrders() {
  try {
    const rawData = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to load orders.json:', error);
    return [];
  }
}

/**
 * Normalizes an order ID string (e.g. "ord 101", "ord-101", "ORD101" -> "ORD-101")
 */
export function normalizeOrderId(rawId) {
  if (!rawId || typeof rawId !== 'string') return null;
  const cleaned = rawId.trim().toUpperCase().replace(/\s+/g, '-');
  const match = cleaned.match(/ORD[-]?(\d+)/);
  if (match) {
    return `ORD-${match[1]}`;
  }
  return cleaned;
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

  const normalizedId = normalizeOrderId(orderId);
  const orders = getAllOrders();
  const foundOrder = orders.find(o => o.order_id === normalizedId);

  if (!foundOrder) {
    return {
      success: false,
      error: "ORDER_NOT_FOUND",
      searched_id: orderId,
      message: `I could not locate an order with ID "${orderId}". Available sample order IDs in our system are ORD-101, ORD-102, and ORD-103. Please ask the customer to verify or re-check the number.`
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
