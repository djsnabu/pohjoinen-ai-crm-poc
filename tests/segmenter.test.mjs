import assert from "node:assert/strict";
import { customers, products, SCALE_TO_AUDIENCE } from "../src/customers.mjs";
import { generateCustomers } from "../src/generate.mjs";
import {
  buildPrompt,
  offlineBrief,
  segmentCustomers,
  estimateImpact
} from "../src/segmenter.mjs";

// --- Data base ---------------------------------------------------------------
assert.ok(customers.length > 500, "expected a realistic synthetic base (>500)");
assert.ok(SCALE_TO_AUDIENCE > 1, "scaling factor should be derived from base size");

// Generator must be deterministic: same seed -> identical output.
const a = generateCustomers(50, 42);
const b = generateCustomers(50, 42);
assert.deepEqual(a, b, "generator must be deterministic for a fixed seed");
assert.notDeepEqual(
  generateCustomers(50, 1),
  generateCustomers(50, 2),
  "different seeds should produce different customers"
);

// --- Segmentation ------------------------------------------------------------
const segments = segmentCustomers(customers, products);

assert.ok(segments.length >= 4, "expected multiple CRM segments");
assert.equal(segments[0].phase, "Phase 1 / next 30 days", "best segment should be an immediate pilot");
assert.ok(segments[0].estimatedAudience > 0, "segment should scale to an estimated audience");
assert.ok(segments.some((s) => s.id === "dormant-high-potential"), "should include winback segment");
assert.ok(
  segments.every((s) => s.estimatedAudience <= 180000),
  "no single segment should exceed the total audience"
);

// --- Prompt ------------------------------------------------------------------
const prompt = buildPrompt(segments[0]);
assert.ok(prompt.includes("Pohjoinen"), "prompt should include company context");
assert.ok(prompt.includes("Klaviyo"), "prompt should include target tool");
assert.ok(prompt.includes(segments[0].name), "prompt should include selected segment");
assert.ok(segments[0].topProducts.every((p) => prompt.includes(p.name)), "prompt should include product feed facts");

// --- Fallback ----------------------------------------------------------------
const fallback = offlineBrief(segments[0]);
assert.ok(fallback.includes("Revenue per recipient"), "fallback should include a KPI");

// --- Business-case impact ----------------------------------------------------
const impact = estimateImpact(segments[0]);
assert.ok(impact.estimatedRevenue > 0, "impact should estimate positive revenue");
assert.ok(impact.estimatedBuyers > 0, "impact should estimate buyers");
assert.ok(impact.revenuePerRecipient > 0, "impact should include revenue per recipient");
assert.ok(
  impact.estimatedBuyers <= impact.reach,
  "buyers cannot exceed reach"
);
// Custom assumptions must flow through.
const conservative = estimateImpact(segments[0], { conversionRate: 0.01 });
assert.ok(
  conservative.estimatedRevenue < impact.estimatedRevenue,
  "lower conversion assumption should lower revenue"
);

console.log("all tests passed", {
  customers: customers.length,
  scale: Math.round(SCALE_TO_AUDIENCE),
  segments: segments.map((s) => [s.id, s.estimatedAudience, s.score]),
  topRevenue: estimateImpact(segments[0]).estimatedRevenue
});
