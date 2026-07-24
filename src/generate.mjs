// Deterministic synthetic customer generator for the Pohjoinen CRM POC.
//
// Why this exists: a believable segmentation demo needs a realistic customer
// base, not 18 hand-written rows. This module generates a stable, seeded set of
// synthetic Shopify-style customers so segment sizes, LTV averages and scaling
// factors look plausible — while using zero real customer data.
//
// The generator is fully deterministic (seeded PRNG) so tests and the UI always
// see the same customers, and so the numbers in screenshots never drift.

import { products } from "./data.mjs";

// --- Seeded PRNG (mulberry32) -------------------------------------------------
// Small, fast, deterministic. Good enough for synthetic data; not for crypto.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(rng, entries) {
  // entries: [[value, weight], ...]
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

// --- Customer archetypes ------------------------------------------------------
// Each archetype biases category interest, order count and recency so the
// resulting base contains genuinely different behaviours (loyalists, dormant,
// one-timers, VIPs). Segmentation then has something real to separate.
const productsByCategory = products.reduce((map, product) => {
  (map[product.category] ||= []).push(product);
  return map;
}, {});

const CATEGORIES = Object.keys(productsByCategory);

const ARCHETYPES = [
  {
    id: "winter-loyalist",
    weight: 18,
    categories: ["winter apparel", "winter sports"],
    orderRange: [2, 5],
    ltvRange: [260, 900],
    recencyRange: [5, 200]
  },
  {
    id: "summer-adventurer",
    weight: 20,
    categories: ["hiking", "camping"],
    orderRange: [1, 4],
    ltvRange: [120, 640],
    recencyRange: [4, 240]
  },
  {
    id: "multi-season-vip",
    weight: 10,
    categories: CATEGORIES,
    orderRange: [4, 8],
    ltvRange: [600, 1400],
    recencyRange: [7, 120]
  },
  {
    id: "first-kit-buyer",
    weight: 26,
    categories: CATEGORIES,
    orderRange: [1, 1],
    ltvRange: [39, 180],
    recencyRange: [3, 320]
  },
  {
    id: "dormant-high-potential",
    weight: 14,
    categories: ["winter apparel", "hiking", "camping", "cycling"],
    orderRange: [2, 4],
    ltvRange: [210, 720],
    recencyRange: [185, 520]
  },
  {
    id: "casual-mixed",
    weight: 12,
    categories: CATEGORIES,
    orderRange: [1, 3],
    ltvRange: [70, 360],
    recencyRange: [10, 300]
  }
];

const COUNTRIES = [
  ["FI", 62],
  ["EE", 14],
  ["LV", 10],
  ["LT", 9],
  ["SE", 5]
];

function ordersForArchetype(rng, archetype) {
  const count =
    archetype.orderRange[0] +
    Math.floor(rng() * (archetype.orderRange[1] - archetype.orderRange[0] + 1));
  const orders = [];
  for (let i = 0; i < count; i++) {
    const category = pick(rng, archetype.categories);
    const pool = productsByCategory[category] || products;
    orders.push(pick(rng, pool).sku);
  }
  // Occasionally add an all-season accessory (realistic cross-sell noise).
  if (rng() < 0.35 && productsByCategory["accessories"]) {
    orders.push(pick(rng, productsByCategory["accessories"]).sku);
  }
  return orders;
}

/**
 * Generate a deterministic set of synthetic customers.
 * @param {number} count how many to generate
 * @param {number} seed PRNG seed (stable across runs)
 * @returns {Array<{id,country,ltv,lastPurchaseDays,orders,archetype}>}
 */
export function generateCustomers(count = 800, seed = 1337) {
  const rng = mulberry32(seed);
  const customers = [];
  for (let i = 0; i < count; i++) {
    const archetype = pickWeighted(
      rng,
      ARCHETYPES.map((a) => [a, a.weight])
    );
    const ltv = roundTo(
      archetype.ltvRange[0] +
        rng() * (archetype.ltvRange[1] - archetype.ltvRange[0]),
      1
    );
    const lastPurchaseDays = Math.round(
      archetype.recencyRange[0] +
        rng() * (archetype.recencyRange[1] - archetype.recencyRange[0])
    );
    customers.push({
      id: `S-${(10000 + i).toString()}`,
      country: pickWeighted(rng, COUNTRIES),
      ltv,
      lastPurchaseDays,
      orders: ordersForArchetype(rng, archetype),
      archetype: archetype.id
    });
  }
  return customers;
}

// A ready-made default base so callers can just import it.
export const generatedCustomers = generateCustomers(800, 1337);
