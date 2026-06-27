import { products, customers } from "./data.mjs";
import { buildPrompt, offlineBrief, segmentCustomers } from "./segmenter.mjs";

const els = {
  sampleCount: document.querySelector("#sample-count"),
  productCount: document.querySelector("#product-count"),
  run: document.querySelector("#run-segmentation"),
  ai: document.querySelector("#generate-ai"),
  segments: document.querySelector("#segments"),
  output: document.querySelector("#ai-output"),
  status: document.querySelector("#ai-status")
};

let segments = [];
let selected = null;

els.sampleCount.textContent = customers.length;
els.productCount.textContent = products.length;

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
    });
    els.segments.appendChild(button);
  });
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
});

els.ai.addEventListener("click", async () => {
  if (!selected) return;
  const prompt = buildPrompt(selected);
  els.status.textContent = "Calling AI text endpoint…";
  els.ai.disabled = true;
  els.output.textContent = "Generating campaign brief from segment data…";
  try {
    const text = await callPollinations(prompt);
    els.output.textContent = text.trim();
    els.status.textContent = "AI brief generated from selected segment.";
  } catch (err) {
    els.output.textContent = `${offlineBrief(selected)}\n\nNote: live AI call failed in this browser session (${err.message}). The app keeps a deterministic fallback so the workflow still demonstrates the segment-to-brief handoff.`;
    els.status.textContent = "AI endpoint unavailable; showing fallback brief.";
  } finally {
    els.ai.disabled = false;
  }
});
