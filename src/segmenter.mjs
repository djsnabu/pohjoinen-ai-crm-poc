import { products } from "./data.mjs";

const SCALE_TO_180K = 180000 / 18;

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
      klaviyoLogic: "1 order OR lifetime value < €150, category-specific onboarding",
      phase: "Phase 1 / next 30 days",
      why: "Occasional buyers can become repeat buyers if Pohjoinen helps them complete the kit after the first purchase.",
      trigger: "Post-purchase onboarding and next-best-accessory flow",
      test: (c) => c.orderCount === 1 || c.ltv < 150
    }
  ];

  return definitions
    .map((definition) => {
      const members = enriched.filter(definition.test);
      const avgLtv = members.length ? members.reduce((sum, c) => sum + c.ltv, 0) / members.length : 0;
      const estimatedAudience = Math.round(members.length * SCALE_TO_180K);
      const score = Math.round((estimatedAudience / 1000) * 0.55 + avgLtv * 0.08 + (definition.phase.startsWith("Phase 1") ? 15 : 5));
      return {
        ...definition,
        sampleSize: members.length,
        estimatedAudience,
        avgLtv: Math.round(avgLtv),
        score,
        topProducts: topProductsFor(members, productBySku)
      };
    })
    .filter((segment) => segment.sampleSize > 0)
    .sort((a, b) => b.score - a.score);
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
