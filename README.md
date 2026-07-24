# Pohjoinen AI CRM Segment Builder

[![CI](https://github.com/djsnabu/pohjoinen-ai-crm-poc/actions/workflows/ci.yml/badge.svg)](https://github.com/djsnabu/pohjoinen-ai-crm-poc/actions/workflows/ci.yml)

Proof of concept for Intentio's Marketing AI challenge.

## What it demonstrates

Opportunity #1 from Level 01: build a seasonal lifecycle and product-affinity CRM engine in Klaviyo.

This demo uses synthetic Shopify-style customer/order data to:

1. Generate practical Klaviyo segments for Pohjoinen.
2. Score the segments by estimated audience, LTV and speed-to-value.
3. Estimate the revenue impact of a segment with transparent assumptions.
4. Build an AI prompt from the selected segment and product feed.
5. Call an AI text endpoint to generate a campaign brief, subject lines, product block logic and review checklist.

No real customer data is used. The synthetic base is ~800 customers generated
deterministically from a seeded PRNG (see `src/generate.mjs`), on top of a small
set of hand-authored example rows.

## Local AI mode (no data leaves the machine)

The strongest version of this demo runs the AI **server-side against a local
model**, so no customer data and no model credentials ever reach the browser.

```text
Browser  --(segment id)-->  Node proxy  --(prompt)-->  local llama.cpp (Qwen)
                                 |
                          builds prompt from
                          trusted server-side data
```

Run it with a local llama.cpp OpenAI-compatible server on `:8080`:

```bash
node server.mjs
# open http://localhost:4173

# optional env:
#   LLAMA_BASE_URL  (default http://127.0.0.1:8080/v1)
#   LLAMA_MODEL     (default qwen36-hauhau-balanced-32k)
#   PORT            (default 4173)
```

`POST /api/generate` takes only a `segmentId`, builds the prompt on the server
from trusted data, calls the local model, and returns the brief. If the local
model is unreachable it returns a deterministic fallback brief and says so —
it never fabricates a model answer.

The public GitHub Pages demo has no backend, so it falls back to a public text
endpoint and then to the offline brief.

## Live demo

https://djsnabu.github.io/pohjoinen-ai-crm-poc/

## Brandbook

The repo now includes an Intentio-inspired visual system for the POC:

- `BRANDBOOK.md` — human-readable brandbook and UI rules.
- `DESIGN.md` — machine-readable design-token spec for agents.
- `tokens.json` — compact design tokens for implementation.
- `assets/intentio-logo-light.svg` — light logo asset supplied for the challenge context.

This is not an official Intentio brand guide. It is a respectful adaptation of visible public-site cues: dark canvas, crisp data-led layout, lime action color, tight typography, square panels and wireframe growth motifs.

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

Stack: static HTML/CSS/JavaScript, JavaScript modules, Pollinations text endpoint for AI generation, GitHub Pages deployment, Node assert tests, and a small Intentio-inspired brandbook in the repo.

### How it would scale

In production I would replace the synthetic data with Shopify Admin API data, run the AI call server-side using Claude/OpenAI with business data controls, write selected segments into Klaviyo, and keep Kaisa/Hanna approval before any campaign is sent. The first 30-day pilot would focus on 5–7 high-value segments: winter loyalists, hiking/camping buyers, first-time kit buyers, dormant high-potential customers and multi-season VIPs.

## Guardrails

- The public demo uses synthetic data only.
- The AI is asked to use only facts from the product feed.
- The app does not send emails or modify Klaviyo.
- The fallback brief exists only so the demo remains usable if the free text endpoint is slow or unavailable.
