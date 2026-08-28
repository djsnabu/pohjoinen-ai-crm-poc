# AI CRM Segment Builder

[![CI](https://github.com/djsnabu/pohjoinen-ai-crm-poc/actions/workflows/ci.yml/badge.svg)](https://github.com/djsnabu/pohjoinen-ai-crm-poc/actions/workflows/ci.yml)

A working proof of concept for AI-assisted ecommerce CRM segmentation.

"Pohjoinen" is a fictional Finnish outdoor gear retailer used as the demo
scenario. No real company data is involved.

## The idea

An ecommerce retailer has a large email list and years of Shopify purchase
history, but sends broadly the same campaign to everyone. Personalising CRM is
usually the fastest practical AI pilot: it uses tools the business already has,
needs no extra media spend, and directly supports repeat purchase.

This demo takes synthetic Shopify-style order data and:

1. Builds practical Klaviyo-style segments with transparent rules.
2. Scores them by reach, lifetime value and speed-to-value.
3. Measures how much the segments overlap.
4. Estimates revenue impact with assumptions stated on screen.
5. Builds a prompt from the selected segment and product feed.
6. Calls a language model to produce a campaign brief.

## The design decision that matters

**Segmentation is deterministic. Only the copywriting is generative.**

Segment membership is plain, testable rule logic — the same data always
produces the same segments, and every segment can be explained to a client
line by line. The language model never decides who is in an audience; it only
writes the brief for an audience the rules already selected.

This split is deliberate. Audience selection needs to be auditable and
reproducible. Campaign copy benefits from variation. Mixing the two would make
the important half unexplainable.

## Segment overlap

Segments are **not** mutually exclusive. One customer can be a winter loyalist,
a multi-season VIP and a hiking buyer at once. That is normal in CRM, but it
means segment sizes cannot be added together.

The demo measures this explicitly instead of presenting an inflated number.
With the current synthetic base:

| Metric | Value |
|---|---|
| Sum of segment reach | ~291,000 |
| Actual unique reach | ~158,000 |
| Overlap | 46% |
| Customers in 2+ segments | 408 of 818 |
| Base covered by any segment | 88% |

Adding the segments up would overstate reach by more than 80%. In production
this has to be resolved with priority or suppression rules so one person does
not receive several campaigns in the same week.

## Data

No real customer data is used anywhere. The base is ~800 customers generated
deterministically from a seeded PRNG (`src/generate.mjs`) on top of a small set
of hand-authored example rows. Tests assert that the generator is deterministic:
the same seed always produces identical output.

## Local AI mode (no data leaves the machine)

The strongest version runs the model **server-side against a local model**, so
no customer data and no model credentials ever reach the browser.

```text
Browser  --(segment id)-->  Node proxy  --(prompt)-->  local llama.cpp
                                 |
                          builds prompt from
                          trusted server-side data
```

```bash
node server.mjs
# open http://localhost:4173

# optional env:
#   LLAMA_BASE_URL  (default http://127.0.0.1:8080/v1)
#   LLAMA_MODEL     (default qwen36-hauhau-balanced-32k)
#   PORT            (default 4173)
```

`POST /api/generate` takes only a `segmentId`, builds the prompt server-side
from trusted data, calls the local model, and returns the brief. If the model
is unreachable it returns a deterministic fallback and says so — it never
fabricates a model answer or presents a fallback as live AI output.

## Live demo

https://djsnabu.github.io/pohjoinen-ai-crm-poc/

The public demo has no backend, so it falls back to a public text endpoint and
then to the offline brief.

## Run locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Tests:

```bash
node tests/segmenter.test.mjs
```

## Scoring

Segments are ranked by a simple weighted score (`SCORE_WEIGHTS` in
`src/segmenter.mjs`). The weights are deliberate product decisions, not a
fitted model, and they are documented in code:

- Reach contributes 0.55 per 1,000 people.
- Average lifetime value contributes 0.08 per euro, so a €300 segment is worth
  roughly the same as 44,000 extra recipients. This keeps value and volume in
  the same order of magnitude.
- Segments deliverable inside a 30-day pilot get a flat bonus, because
  speed-to-value was an explicit goal.

The score orders a shortlist. It is not revenue.

## Revenue estimates

`estimateImpact()` uses stated defaults — 42% open rate, 3% of openers buy,
average order value ≈ 35% of segment LTV. These are **planning assumptions,
not measured results and not a forecast**. They are surfaced in the UI and are
parameters, so a client's real numbers can be substituted. Tests assert that
lowering the conversion assumption lowers the estimate.

## Production version

| Demo | Production |
|---|---|
| Synthetic seeded data | Shopify Admin API orders, products, customer events |
| Segments computed in-page | Segments written to Klaviyo Lists/Segments and Flows |
| Public text endpoint fallback | Server-side Claude/OpenAI call with business data controls |
| No dedupe handling | Priority and suppression rules across overlapping segments |
| No approval step | Approval queue before any send |
| No measurement | GA4 + Klaviyo reporting on revenue per recipient and repeat purchase |

## Guardrails

- Synthetic data only; the app never touches real customer records.
- The model is instructed to use only facts from the product feed and not to
  invent product claims. Instructions reduce fabrication but do not eliminate
  it, so human review stays part of the workflow.
- The app does not send email and does not modify Klaviyo.
- The deterministic fallback exists so the workflow stays demonstrable when no
  model is reachable. It is always labelled as a fallback.

## Status

This is a **tested proof of concept**, not a production system. Real
integrations, authentication, monitoring and output-quality evaluation would
all be production work.

## Files

- `src/segmenter.mjs` — segmentation rules, scoring, overlap analysis, prompt building
- `src/generate.mjs` — deterministic synthetic customer generation
- `src/app.mjs` — browser UI
- `server.mjs` — local proxy for server-side model calls
- `tests/segmenter.test.mjs` — assertions for segmentation, overlap, scoring and impact
- `STYLEGUIDE.md`, `DESIGN.md`, `tokens.json` — visual system for the demo
