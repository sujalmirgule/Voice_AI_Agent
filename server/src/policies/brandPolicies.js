/**
 * Aura Skincare - Deterministic Brand Policies & Knowledge Engine
 */

export const BRAND_INFO = {
  name: "Aura Skincare",
  tagline: "Pure, Organic & Thoughtful Indian Skincare",
  overview: "Aura Skincare is a premium organic Indian skincare brand focused on simple, effective skincare products made with thoughtfully selected ingredients.",
  persona: {
    name: "Aria",
    role: "Aura Skincare Customer Support Specialist",
    tone: "Friendly, warm, professional, respectful, concise (Indian English conversational style). Always introduces herself when greeting, speaks crisply without rambling, and upholds brand policies politely.",
  },
  policies: {
    shipping: {
      freeShippingThreshold: 499, // Orders >= ₹499 qualify for free delivery
      standardFee: 50, // Below ₹499
      deliveryWindow: "3–5 business days",
      description: "Free delivery on orders of ₹499 and above. Orders below ₹499 have a ₹50 shipping fee. Standard delivery takes 3–5 business days across India."
    },
    returns: {
      windowDays: 7,
      condition: "Unopened and unused products in original packaging",
      damagedReportHours: 48,
      damagedProof: "Photographs required for immediate replacement",
      description: "Returns are accepted within 7 days of delivery for unopened, unused products in original packaging. If an item arrived damaged or defective, please report it within 48 hours of delivery with photos for a free replacement."
    },
    cancellation: {
      allowedStatus: "Processing",
      disallowedStatus: ["Shipped", "Out for Delivery", "Delivered"],
      doorstepRefusal: "Customers may refuse delivery at the doorstep if already shipped or out for delivery.",
      description: "Orders can only be cancelled while their status is 'Processing'. Once an order is Shipped or Out for Delivery, it cannot be cancelled in our system, but customers may refuse delivery at the doorstep."
    },
    cod: {
      maxLimit: 2500,
      paymentModes: "Cash or UPI at doorstep",
      description: "Cash on Delivery is available for orders up to ₹2,500. Customers can conveniently pay via Cash or UPI at their doorstep upon arrival."
    }
  }
};

/**
 * Evaluates shipping fee for an order amount
 */
export function calculateShippingFee(orderValue) {
  if (typeof orderValue !== 'number' || isNaN(orderValue) || orderValue < 0) {
    return { fee: 50, isFree: false, valid: false, message: "Invalid order amount. Standard shipping fee of ₹50 applies." };
  }
  if (orderValue >= BRAND_INFO.policies.shipping.freeShippingThreshold) {
    return { fee: 0, isFree: true, valid: true, message: `Free delivery applied! Orders ₹${BRAND_INFO.policies.shipping.freeShippingThreshold} and above ship free.` };
  }
  return { fee: 50, isFree: false, valid: true, message: `Shipping fee is ₹50 for orders below ₹${BRAND_INFO.policies.shipping.freeShippingThreshold}. Standard delivery takes 3–5 business days.` };
}

/**
 * Checks cancellation eligibility
 */
export function checkCancellationEligibility(order) {
  if (!order) return { eligible: false, message: "Order not found." };
  if (order.status && order.status.toLowerCase() === 'processing') {
    return {
      eligible: true,
      message: `Order ${order.order_id} is currently in Processing and can be cancelled immediately.`
    };
  }
  return {
    eligible: false,
    message: `Order ${order.order_id} is currently ${order.status || 'unknown'}. Under Aura Skincare policy, orders can only be cancelled while in Processing. However, you may refuse delivery at the doorstep.`
  };
}

/**
 * Checks return eligibility
 */
export function checkReturnEligibility(order, daysSinceDelivery = null) {
  if (!order) return { eligible: false, message: "Order not found." };
  if (!order.status || order.status.toLowerCase() !== 'delivered') {
    return {
      eligible: false,
      message: `Order ${order.order_id} is currently ${order.status || 'unknown'}. Returns only apply to delivered items within 7 days.`
    };
  }
  const days = daysSinceDelivery !== null ? daysSinceDelivery : order.delivered_days_ago;
  if (typeof days === 'number' && days > 7) {
    return {
      eligible: false,
      message: `Order ${order.order_id} was delivered ${days} days ago. Aura Skincare accepts returns within 7 days of delivery for unopened products in original packaging, so this order is no longer eligible for return.`
    };
  }
  return {
    eligible: true,
    message: `Order ${order.order_id} is within our 7-day return window. You can return unopened, unused products in their original packaging.`
  };
}

/**
 * Checks Cash on Delivery (COD) eligibility
 */
export function checkCodEligibility(orderValue) {
  if (typeof orderValue !== 'number' || isNaN(orderValue) || orderValue < 0) {
    return {
      eligible: false,
      message: "Invalid order amount for Cash on Delivery evaluation."
    };
  }
  if (orderValue <= BRAND_INFO.policies.cod.maxLimit) {
    return {
      eligible: true,
      maxLimit: BRAND_INFO.policies.cod.maxLimit,
      message: `Cash on Delivery is available for this order of ₹${orderValue}. You can pay via Cash or UPI at your doorstep.`
    };
  }
  return {
    eligible: false,
    maxLimit: BRAND_INFO.policies.cod.maxLimit,
    message: `Cash on Delivery is available for orders up to ₹2,500. For orders of ₹${orderValue}, please use online prepaid payment.`
  };
}

/**
 * Checks damaged or defective item report eligibility
 */
export function checkDamagedReportEligibility(hoursSinceDelivery, hasPhotos = false) {
  if (typeof hoursSinceDelivery !== 'number' || isNaN(hoursSinceDelivery) || hoursSinceDelivery < 0) {
    return {
      eligible: false,
      message: "Valid hours since delivery is required to assess damaged item claims."
    };
  }
  if (hoursSinceDelivery <= BRAND_INFO.policies.returns.damagedReportHours) {
    if (hasPhotos) {
      return {
        eligible: true,
        replacementApproved: true,
        message: "Your damaged item report is within the 48-hour window with photos verified. A free replacement has been approved."
      };
    }
    return {
      eligible: true,
      replacementApproved: false,
      pendingPhotos: true,
      message: "Your report is within the 48-hour window. Please provide photos of the damaged product and box to approve your free replacement."
    };
  }
  return {
    eligible: false,
    replacementApproved: false,
    message: `The 48-hour reporting window has expired (${hoursSinceDelivery} hours since delivery). Damaged products must be reported within 48 hours.`
  };
}
