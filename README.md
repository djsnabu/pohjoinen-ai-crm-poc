# Pohjoinen AI CRM Segment Builder

Proof of concept for Intentio's Marketing AI challenge.

## What it demonstrates

Opportunity #1 from Level 01: build a seasonal lifecycle and product-affinity CRM engine in Klaviyo.

This demo uses synthetic Shopify-style customer/order data to:

1. Generate practical Klaviyo segments for Pohjoinen.
2. Score the segments by estimated audience, LTV and speed-to-value.
3. Build an AI prompt from the selected segment and product feed.
4. Call an AI text endpoint to generate a campaign brief, subject lines, product block logic and review checklist.

No real customer data is used.

## Live demo

GitHub Pages URL after deployment:

https://djsnabu.github.io/pohjoinen-ai-crm-poc/

## Why this opportunity

Pohjoinen has 180,000 subscribers and Shopify purchase history, but sends mostly the same campaign to everyone. CRM personalization is the fastest practical AI pilot because it uses tools they already have, avoids extra media spend, and directly supports repeat purchase across seasonal categories.

## Tools and stack

- Static HTML/CSS/JavaScript so the demo is easy to inspect and deploy.
- Synthetic Shopify-style product and order data in `src/data.mjs`.
- Segmentation/scoring logic in `src/segmenter.mjs`.
- Pollinations text endpoint as the live AI building block.
- GitHub Pages for deployment.
- Node assert tests for the segmentation/prompt logic.

The production version would use:

- Shopify Admin API for products, orders and customer events.
- Klaviyo API for segment/flow creation or activation.
- Claude API/OpenAI API behind a server-side proxy, not directly from the browser.
- Google Sheets/Airtable as the approval queue.
- GA4 + Klaviyo reporting for revenue per recipient and repeat purchase rate.

## Run locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Run tests:

```bash
node tests/segmenter.test.mjs
```

## Challenge form answers

### Which opportunity from Level 01 are you building for?

Opportunity #1 — seasonal lifecycle and product-affinity CRM engine in Klaviyo.

### Tools & stack

I built a small browser-based CRM segmentation prototype. It uses synthetic Shopify-style customer/order data, JavaScript segmentation logic, and an AI text endpoint to generate a Klaviyo-ready campaign brief for the selected segment. The demo is intentionally simple: no backend, no real customer data, and no auto-send. It shows the core workflow Pohjoinen would need: Shopify data → customer segments → AI-generated CRM campaign brief → human approval → Klaviyo execution.

Stack: static HTML/CSS/JavaScript, JavaScript modules, Pollinations text endpoint for AI generation, GitHub Pages deployment, Node assert tests.

### How it would scale

In production I would replace the synthetic data with Shopify Admin API data, run the AI call server-side using Claude/OpenAI with business data controls, write selected segments into Klaviyo, and keep Kaisa/Hanna approval before any campaign is sent. The first 30-day pilot would focus on 5–7 high-value segments: winter loyalists, hiking/camping buyers, first-time kit buyers, dormant high-potential customers and multi-season VIPs.

## Guardrails

- The public demo uses synthetic data only.
- The AI is asked to use only facts from the product feed.
- The app does not send emails or modify Klaviyo.
- The fallback brief exists only so the demo remains usable if the free text endpoint is slow or unavailable.
