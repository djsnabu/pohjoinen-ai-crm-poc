import { products } from "./data.mjs";
import { SCALE_TO_AUDIENCE } from "./customers.mjs";

const SCALE_TO_180K = SCALE_TO_AUDIENCE;

function categoriesFor(customer, productBySku) {
  return new Set(customer.orders.map((sku) => productBySku.get(sku)?.category).filter(Boolean));
}

function seasonsFor(customer, productBySku) {
  return new Set(customer.orders.map((sku) => productBySku.get(sku)?.season).filter(Boolean));
}

function topProductsFor(members, productBySku) {
  const counts = new Map();
  for (const customer of members) {
    for (const sku of customer.orders) counts.set(sku, (counts.get(sku) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([sku, count]) => ({ ...productBySku.get(sku), count }));
}

export function segmentCustomers(customers, productFeed = products) {
  const productBySku = new Map(productFeed.map((product) => [product.sku, product]));
  const enriched = customers.map((customer) => ({
    ...customer,
    categories: categoriesFor(customer, productBySku),
    seasons: seasonsFor(customer, productBySku),
    orderCount: customer.orders.length
  }));

  const definitions = [
    {
      id: "winter-loyalists",
      name: "Winter loyalists",
      klaviyoLogic: "Placed order where category contains winter in last 730 days AND lifetime value > €250",
      phase: "Phase 1 / next 30 days",
      why: "Autumn/winter gear is seasonal, high-ticket and repeatable. This group is ready for pre-season cross-sell and replenishment.",
      trigger: "Pre-season winter readiness flow + category-specific product blocks",
      test: (c) => (c.categories.has("winter apparel") || c.categories.has("winter sports")) && c.ltv >= 250
    },
    {
      id: "hiking-camping-season",
      name: "Hiking & camping season buyers",
      klaviyoLogic: "Bought hiking/camping products in last 730 days OR browsed matching category recently",
      phase: "Phase 1 / next 30 days",
      why: "Spring/summer demand can be captured with buying guides, kit bundles and accessory cross-sell.",
      trigger: "Seasonal guide campaign + post-purchase accessory flow",
      test: (c) => c.categories.has("hiking") || c.categories.has("camping")
    },
    {
      id: "multi-season-vips",
      name: "Multi-season VIPs",
      klaviyoLogic: "Bought from 3+ category groups OR lifetime value > €600",
      phase: "Phase 1 / next 30 days",
      why: "These customers already buy across seasons. They should receive early access, premium bundles and loyalty messaging.",
      trigger: "VIP early access flow before seasonal launches",
      test: (c) => c.categories.size >= 3 || c.ltv > 600
    },
    {
      id: "dormant-high-potential",
      name: "Dormant high-potential customers",
      klaviyoLogic: "No purchase in 180+ days AND lifetime value > €200",
      phase: "Phase 2 / 60-90 days",
      why: "A winback flow is cheaper than reacquiring similar customers through paid media.",
      trigger: "Winback flow with category-specific reason to return",
      test: (c) => c.lastPurchaseDays >= 180 && c.ltv > 200
    },
    {
      id: "first-kit-buyers",
      name: "First-kit buyers",
      klaviyoLogic: "Exactly 1 order AND lifetime value < €150, category-specific onboarding",
      phase: "Phase 1 / next 30 days",
      why: "Occasional buyers can become repeat buyers if Pohjoinen helps them complete the kit after the first purchase.",
      trigger: "Post-purchase onboarding and next-best-accessory flow",
      // AND, not OR: a customer with 5 small orders is a frequent low-ticket
      // buyer, not a first-kit buyer, and should not enter onboarding.
      test: (c) => c.orderCount === 1 && c.ltv < 150
    }
  ];

  return definitions
    .map((definition) => {
      const members = enriched.filter(definition.test);
      const avgLtv = members.length ? members.reduce((sum, c) => sum + c.ltv, 0) / members.length : 0;
      const estimatedAudience = Math.round(members.length * SCALE_TO_180K);
      const score = scoreSegment({ estimatedAudience, avgLtv, phase: definition.phase });
      return {
        ...definition,
        sampleSize: members.length,
        memberIds: members.map((c) => c.id),
        estimatedAudience,
        avgLtv: Math.round(avgLtv),
        score,
        topProducts: topProductsFor(members, productBySku)
      };
    })
    .filter((segment) => segment.sampleSize > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Priority score used only to order segments for a pilot shortlist.
 *
 * The weights are deliberate product decisions, not a fitted model:
 * - AUDIENCE_WEIGHT: each 1,000 reachable people adds 0.55. Reach matters, but
 *   a large low-value list should not outrank a small high-value one.
 * - LTV_WEIGHT: each €1 of average lifetime value adds 0.08, so a €300 segment
 *   contributes ~24 points — roughly comparable to 44,000 reachable people.
 *   This is what keeps value and volume in the same order of magnitude.
 * - PHASE_BONUS: a flat bonus for segments that can ship inside the 30-day
 *   pilot, because speed-to-value was an explicit goal.
 *
 * The output is a ranking aid. It is not revenue and not a forecast.
 */
export const SCORE_WEIGHTS = {
  AUDIENCE_WEIGHT: 0.55,
  LTV_WEIGHT: 0.08,
  PHASE_1_BONUS: 15,
  LATER_PHASE_BONUS: 5
};

export function scoreSegment({ estimatedAudience, avgLtv, phase }) {
  const { AUDIENCE_WEIGHT, LTV_WEIGHT, PHASE_1_BONUS, LATER_PHASE_BONUS } = SCORE_WEIGHTS;
  const phaseBonus = phase.startsWith("Phase 1") ? PHASE_1_BONUS : LATER_PHASE_BONUS;
  return Math.round((estimatedAudience / 1000) * AUDIENCE_WEIGHT + avgLtv * LTV_WEIGHT + phaseBonus);
}

/**
 * Segments are intentionally NOT mutually exclusive — a single customer can be
 * a winter loyalist, a multi-season VIP and a hiking buyer at the same time.
 * That is normal in CRM, but it means the segment audiences cannot simply be
 * added up: the sum will exceed the real reachable audience.
 *
 * This measures the overlap explicitly so the UI can show the true deduplicated
 * reach instead of an inflated total.
 *
 * @param {object[]} segments output of segmentCustomers
 * @param {number} totalCustomers size of the synthetic base
 */
export function analyseOverlap(segments, totalCustomers) {
  const unique = new Set();
  let sumOfSegments = 0;
  const timesSegmented = new Map();

  for (const segment of segments) {
    sumOfSegments += segment.sampleSize;
    for (const id of segment.memberIds) {
      unique.add(id);
      timesSegmented.set(id, (timesSegmented.get(id) || 0) + 1);
    }
  }

  const inMultiple = [...timesSegmented.values()].filter((n) => n > 1).length;
  const uniqueCovered = unique.size;

  return {
    sumOfSegments,
    uniqueCustomers: uniqueCovered,
    duplicateCount: sumOfSegments - uniqueCovered,
    overlapRatio: sumOfSegments > 0 ? Math.round(((sumOfSegments - uniqueCovered) / sumOfSegments) * 100) / 100 : 0,
    customersInMultipleSegments: inMultiple,
    uncoveredCustomers: totalCustomers - uniqueCovered,
    coverage: totalCustomers > 0 ? Math.round((uniqueCovered / totalCustomers) * 100) / 100 : 0,
    estimatedUniqueAudience: Math.round(uniqueCovered * SCALE_TO_180K)
  };
}

export function buildPrompt(segment) {
  const productLines = segment.topProducts
    .map((p) => `- ${p.name} (${p.category}, ${p.season}, €${p.price})`)
    .join("\n");

  return `You are an ecommerce CRM strategist for Pohjoinen, a Finnish outdoor gear retailer.\n\nCreate a Klaviyo campaign brief for this segment.\n\nSegment: ${segment.name}\nEstimated audience: ${segment.estimatedAudience}\nAverage LTV: €${segment.avgLtv}\nKlaviyo logic: ${segment.klaviyoLogic}\nWhy now: ${segment.why}\nFlow trigger: ${segment.trigger}\nRelevant products from Shopify feed:\n${productLines}\n\nReturn a concise practical brief with:\n1. Campaign angle\n2. 3 subject lines\n3. 1 short email intro paragraph\n4. Dynamic product block logic\n5. Primary KPI\n6. Human review checklist\n\nDo not invent product claims. Use only the products above.`;
}

export function offlineBrief(segment) {
  const products = segment.topProducts.map((p) => p.name).join(", ");
  return `Offline fallback brief for ${segment.name}\n\nCampaign angle:\nUse ${segment.why.toLowerCase()}\n\nSubject lines:\n- Your next ${segment.name.toLowerCase()} kit, ready before the season shifts\n- Pohjoinen picks based on what you bought before\n- Complete your setup: ${segment.topProducts[0]?.name || "seasonal gear"}\n\nEmail intro:\nBased on your previous Pohjoinen purchases, this is a timely moment to prepare for the next outdoor season. We picked practical gear that matches your category interest and helps complete your setup.\n\nDynamic product block logic:\nPrioritise: ${products}. Exclude out-of-stock SKUs and avoid showing items the customer already bought unless they are replenishable accessories.\n\nPrimary KPI:\nRevenue per recipient and repeat purchase rate.\n\nHuman review checklist:\nCheck product availability, discounts, claims, tone of voice and unsubscribe risk before launch.`;
}

/**
 * Rough revenue-impact estimate for a segment, using transparent assumptions.
 * This is intentionally simple and conservative — it is a planning aid to show
 * why segmentation matters, not a forecast. All assumptions are surfaced in the
 * UI so nobody mistakes it for a promise.
 *
 * @param {object} segment segment produced by segmentCustomers
 * @param {object} [assumptions]
 * @param {number} [assumptions.openRate] share who open (0..1)
 * @param {number} [assumptions.conversionRate] share of openers who buy (0..1)
 * @param {number} [assumptions.aovFactor] avg order value as a fraction of avgLtv
 */
export function estimateImpact(segment, assumptions = {}) {
  const openRate = assumptions.openRate ?? 0.42;
  const conversionRate = assumptions.conversionRate ?? 0.03;
  const aovFactor = assumptions.aovFactor ?? 0.35;

  const reach = segment.estimatedAudience;
  const opens = reach * openRate;
  const buyers = opens * conversionRate;
  const avgOrderValue = Math.max(30, Math.round(segment.avgLtv * aovFactor));
  const revenue = Math.round(buyers * avgOrderValue);
  const revenuePerRecipient = reach > 0 ? revenue / reach : 0;

  return {
    reach,
    estimatedBuyers: Math.round(buyers),
    avgOrderValue,
    estimatedRevenue: revenue,
    revenuePerRecipient: Math.round(revenuePerRecipient * 100) / 100,
    assumptions: { openRate, conversionRate, aovFactor }
  };
}
