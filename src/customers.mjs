// Combined customer base: hand-authored "verified" rows + deterministic
// synthetic bulk. This is the single source the app and tests read from, so
// segment sizes and scaling factors reflect a realistic base (not 18 rows).
//
// No real customer data is used anywhere in this demo.

import { seedCustomers } from "./data.mjs";
import { generatedCustomers } from "./generate.mjs";

export { products } from "./data.mjs";

export const customers = [...seedCustomers, ...generatedCustomers];

// Scaling factor from the synthetic sample up to Pohjoinen's ~180k subscriber
// base. Derived from the actual sample size so it stays honest if the base
// size changes.
export const TOTAL_AUDIENCE = 180000;
export const SCALE_TO_AUDIENCE = TOTAL_AUDIENCE / customers.length;
