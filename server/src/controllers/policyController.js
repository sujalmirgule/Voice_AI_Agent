import { BRAND_INFO } from '../policies/brandPolicies.js';

export function getPolicies(req, res) {
  res.json({
    success: true,
    brand: BRAND_INFO
  });
}
