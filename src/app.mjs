import { products, customers } from "./customers.mjs";
import { buildPrompt, offlineBrief, segmentCustomers, estimateImpact } from "./segmenter.mjs";

const els = {
  sampleCount: document.querySelector("#sample-count"),
  productCount: document.querySelector("#product-count"),
  run: document.querySelector("#run-segmentation"),
  ai: document.querySelector("#generate-ai"),
  segments: document.querySelector("#segments"),
  output: document.querySelector("#ai-output"),
  status: document.querySelector("#ai-status"),
  impact: document.querySelector("#impact")
};

let segments = [];
let selected = null;

els.sampleCount.textContent = customers.length;
els.productCount.textContent = products.length;

function renderImpact() {
  if (!selected) {
    els.impact.classList.add("empty");
    els.impact.textContent = "Select a segment to estimate its revenue impact.";
    return;
  }
  const i = estimateImpact(selected);
  const eur = (n) => `€${n.toLocaleString("en-US")}`;
  els.impact.classList.remove("empty");
  els.impact.innerHTML = `
    <div class="impact-grid">
      <article>
        <span class="label">Reach</span>
        <strong>${i.reach.toLocaleString("en-US")}</strong>
      </article>
      <article>
        <span class="label">Est. buyers</span>
        <strong>${i.estimatedBuyers.toLocaleString("en-US")}</strong>
      </article>
      <article>
        <span class="label">Avg. order value</span>
        <strong>${eur(i.avgOrderValue)}</strong>
      </article>
      <article class="impact-highlight">
        <span class="label">Est. campaign revenue</span>
        <strong>${eur(i.estimatedRevenue)}</strong>
      </article>
      <article>
        <span class="label">Revenue / recipient</span>
        <strong>${eur(i.revenuePerRecipient)}</strong>
      </article>
    </div>
    <p class="impact-assumptions">
      Assumptions: ${Math.round(i.assumptions.openRate * 100)}% open ·
      ${Math.round(i.assumptions.conversionRate * 100)}% of openers buy ·
      AOV ≈ ${Math.round(i.assumptions.aovFactor * 100)}% of segment LTV.
      One campaign, conservative. Segments overlap, so per-segment reach does not sum to total list size.
    </p>
  `;
}

function renderSegments() {
  els.segments.classList.remove("empty");
  els.segments.innerHTML = "";
  segments.forEach((segment) => {
    const button = document.createElement("button");
    button.className = `segment ${selected?.id === segment.id ? "active" : ""}`;
    button.innerHTML = `
      <div>
        <span class="badge">${segment.phase}</span>
        <h3>${segment.name}</h3>
        <p>${segment.klaviyoLogic}</p>
      </div>
      <div>
        <span class="label">Estimated audience</span>
        <strong>${segment.estimatedAudience.toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span class="label">Avg. LTV</span>
        <strong>€${segment.avgLtv}</strong>
      </div>
      <div>
        <span class="label">Opportunity score</span>
        <span class="score">${segment.score}</span>
        <p>${segment.why}</p>
      </div>
    `;
    button.addEventListener("click", () => {
      selected = segment;
      els.ai.disabled = false;
      els.status.textContent = `Selected: ${segment.name}`;
      els.output.textContent = buildPrompt(segment);
      renderSegments();
      renderImpact();
    });
    els.segments.appendChild(button);
  });
}

// Prefer the local server-side proxy (/api/generate). It builds the prompt and
// calls a local model, so no customer data or credentials touch the browser.
// If the proxy is not available (e.g. the static GitHub Pages demo), fall back
// to the public text endpoint, and finally to a deterministic offline brief.
async function callLocalProxy(segment) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ segmentId: segment.id })
    });
    if (!res.ok) throw new Error(`proxy returned ${res.status}`);
    const data = await res.json();
    if (!data.brief) throw new Error("proxy returned no brief");
    return data; // { source, model, brief, ... }
  } finally {
    clearTimeout(timeout);
  }
}

async function callPollinations(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=42`;
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

els.run.addEventListener("click", () => {
  segments = segmentCustomers(customers, products);
  selected = segments[0];
  els.ai.disabled = false;
  els.status.textContent = `Selected best segment: ${selected.name}`;
  els.output.textContent = buildPrompt(selected);
  renderSegments();
  renderImpact();
});

els.ai.addEventListener("click", async () => {
  if (!selected) return;
  els.status.textContent = "Generating campaign brief…";
  els.ai.disabled = true;
  els.output.textContent = "Generating campaign brief from segment data…";

  // 1) Local server-side proxy + local model (best: no data leaves the host).
  try {
    const result = await callLocalProxy(selected);
    els.output.textContent = result.brief;
    if (result.source === "local-model") {
      els.status.textContent = `Brief generated by local model (${result.model}). No customer data left the machine.`;
    } else {
      els.status.textContent = `Local model unavailable — showing deterministic fallback brief.`;
    }
    return;
  } catch (proxyErr) {
    // 2) Public text endpoint (used by the static GitHub Pages demo).
    try {
      const text = await callPollinations(buildPrompt(selected));
      els.output.textContent = text.trim();
      els.status.textContent = "Brief generated via public AI endpoint (static demo mode).";
      return;
    } catch (aiErr) {
      // 3) Deterministic offline fallback so the workflow still demonstrates.
      els.output.textContent = `${offlineBrief(selected)}\n\nNote: no AI backend was reachable (proxy: ${proxyErr.message}; public: ${aiErr.message}). This deterministic fallback keeps the segment-to-brief handoff demonstrable.`;
      els.status.textContent = "No AI backend reachable; showing fallback brief.";
    }
  } finally {
    els.ai.disabled = false;
  }
});
