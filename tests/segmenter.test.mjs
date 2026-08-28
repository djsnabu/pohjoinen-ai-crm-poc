import assert from "node:assert/strict";
import { customers, products, SCALE_TO_AUDIENCE } from "../src/customers.mjs";
import { generateCustomers } from "../src/generate.mjs";
import {
  buildPrompt,
  offlineBrief,
  segmentCustomers,
  estimateImpact,
  analyseOverlap,
  scoreSegment,
  SCORE_WEIGHTS
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

// --- Segment overlap ---------------------------------------------------------
// Segments are not mutually exclusive. The demo must not present the sum of
// segment sizes as if it were reachable audience.
const overlap = analyseOverlap(segments, customers.length);

assert.ok(
  overlap.sumOfSegments > overlap.uniqueCustomers,
  "segments should genuinely overlap in this dataset"
);
assert.equal(
  overlap.duplicateCount,
  overlap.sumOfSegments - overlap.uniqueCustomers,
  "duplicate count must reconcile sum vs unique"
);
assert.ok(
  overlap.uniqueCustomers <= customers.length,
  "unique covered customers cannot exceed the customer base"
);
assert.ok(
  overlap.estimatedUniqueAudience <= 180000,
  "deduplicated audience must stay within the real subscriber base"
);
assert.ok(
  overlap.customersInMultipleSegments > 0,
  "at least some customers should belong to several segments"
);
assert.ok(
  overlap.overlapRatio > 0 && overlap.overlapRatio < 1,
  "overlap ratio should be a meaningful fraction"
);
assert.ok(
  overlap.coverage > 0 && overlap.coverage <= 1,
  "coverage should be a fraction of the base"
);
assert.equal(
  overlap.uncoveredCustomers,
  customers.length - overlap.uniqueCustomers,
  "uncovered customers must reconcile with the base"
);

// --- First-kit buyers must be genuinely new ---------------------------------
// Regression guard: this segment previously used OR, which pulled frequent
// low-ticket buyers into a first-purchase onboarding flow.
const firstKit = segments.find((s) => s.id === "first-kit-buyers");
if (firstKit) {
  const members = customers.filter((c) => firstKit.memberIds.includes(c.id));
  assert.ok(
    members.every((c) => c.orders.length === 1 && c.ltv < 150),
    "first-kit buyers must have exactly one order AND low lifetime value"
  );
}

// --- Scoring -----------------------------------------------------------------
// Weights are product decisions, so pin the behaviour they are meant to encode.
assert.ok(
  scoreSegment({ estimatedAudience: 50000, avgLtv: 300, phase: "Phase 1 / next 30 days" }) >
    scoreSegment({ estimatedAudience: 50000, avgLtv: 300, phase: "Phase 2 / 60-90 days" }),
  "shipping inside the pilot window should rank higher"
);
assert.ok(
  scoreSegment({ estimatedAudience: 10000, avgLtv: 800, phase: "Phase 1 / next 30 days" }) >
    scoreSegment({ estimatedAudience: 20000, avgLtv: 60, phase: "Phase 1 / next 30 days" }),
  "a small high-value segment should beat a larger low-value one"
);
assert.ok(SCORE_WEIGHTS.LTV_WEIGHT > 0 && SCORE_WEIGHTS.AUDIENCE_WEIGHT > 0, "weights must be documented and positive");

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
  topRevenue: estimateImpact(segments[0]).estimatedRevenue,
  overlap: {
    sumOfSegments: overlap.sumOfSegments,
    uniqueCustomers: overlap.uniqueCustomers,
    overlapRatio: overlap.overlapRatio,
    inMultipleSegments: overlap.customersInMultipleSegments,
    coverage: overlap.coverage,
    dedupedAudience: overlap.estimatedUniqueAudience
  }
});
