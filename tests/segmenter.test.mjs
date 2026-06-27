import assert from "node:assert/strict";
import { customers, products } from "../src/data.mjs";
import { buildPrompt, offlineBrief, segmentCustomers } from "../src/segmenter.mjs";

const segments = segmentCustomers(customers, products);

assert.ok(segments.length >= 4, "expected multiple CRM segments");
assert.equal(segments[0].phase, "Phase 1 / next 30 days", "best segment should be an immediate pilot");
assert.ok(segments[0].estimatedAudience > 0, "segment should scale to an estimated audience");
assert.ok(segments.some((s) => s.id === "dormant-high-potential"), "should include winback segment");

const prompt = buildPrompt(segments[0]);
assert.ok(prompt.includes("Pohjoinen"), "prompt should include company context");
assert.ok(prompt.includes("Klaviyo"), "prompt should include target tool");
assert.ok(prompt.includes(segments[0].name), "prompt should include selected segment");
assert.ok(segments[0].topProducts.every((p) => prompt.includes(p.name)), "prompt should include product feed facts");

const fallback = offlineBrief(segments[0]);
assert.ok(fallback.includes("Revenue per recipient"), "fallback should include a KPI");

console.log("segmenter tests passed", { segments: segments.map((s) => [s.id, s.estimatedAudience, s.score]) });
