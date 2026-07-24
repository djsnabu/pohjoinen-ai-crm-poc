// Local server-side proxy for the Pohjoinen CRM POC.
//
// Purpose: keep the AI call OFF the browser. The browser sends a selected
// segment id; this server builds the prompt from trusted server-side data and
// calls a local llama.cpp OpenAI-compatible endpoint (Qwen). No customer data
// and no model credentials ever reach the client.
//
// This mirrors the intended production shape (Cloudflare Worker -> Claude/OpenAI
// behind a proxy) but runs entirely on the local machine against a local model,
// which is the strongest possible answer to the "no customer PII in the
// browser" guardrail: the data never leaves the host at all.
//
// Run:  node server.mjs
// Then: http://localhost:4173
//
// Env:
//   LLAMA_BASE_URL  (default http://127.0.0.1:8080/v1)
//   LLAMA_MODEL     (default qwen36-hauhau-balanced-32k)
//   PORT            (default 4173)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { customers, products } from "./src/customers.mjs";
import { segmentCustomers, buildPrompt, offlineBrief } from "./src/segmenter.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const LLAMA_BASE_URL = process.env.LLAMA_BASE_URL || "http://127.0.0.1:8080/v1";
const LLAMA_MODEL = process.env.LLAMA_MODEL || "qwen36-hauhau-balanced-32k";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

// Segments are computed once at startup from trusted server-side data.
const segments = segmentCustomers(customers, products);
const segmentById = new Map(segments.map((s) => [s.id, s]));

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

async function callLocalModel(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${LLAMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: LLAMA_MODEL,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are a precise ecommerce CRM strategist. Use only the facts provided. Never invent product claims, prices or discounts."
          },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!res.ok) {
      throw new Error(`local model returned ${res.status}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("local model returned empty content");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleGenerate(req, res) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let segmentId;
  try {
    segmentId = JSON.parse(raw || "{}").segmentId;
  } catch {
    return sendJson(res, 400, { error: "invalid JSON body" });
  }

  const segment = segmentById.get(segmentId);
  if (!segment) {
    return sendJson(res, 404, {
      error: "unknown segment",
      available: [...segmentById.keys()]
    });
  }

  // Prompt is built here, server-side, from trusted data.
  const prompt = buildPrompt(segment);
  try {
    const brief = await callLocalModel(prompt);
    return sendJson(res, 200, {
      source: "local-model",
      model: LLAMA_MODEL,
      segment: segment.name,
      brief
    });
  } catch (err) {
    // Deterministic fallback keeps the workflow demonstrable if the local
    // model is down. We say so explicitly rather than faking a model answer.
    return sendJson(res, 200, {
      source: "offline-fallback",
      model: null,
      segment: segment.name,
      error: String(err.message || err),
      brief: offlineBrief(segment)
    });
  }
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const safe = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath)] || "application/octet-stream"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/generate") {
    return handleGenerate(req, res);
  }
  if (req.method === "GET" && req.url === "/api/segments") {
    return sendJson(res, 200, {
      count: segments.length,
      customers: customers.length,
      segments: segments.map((s) => ({
        id: s.id,
        name: s.name,
        estimatedAudience: s.estimatedAudience,
        avgLtv: s.avgLtv,
        score: s.score
      }))
    });
  }
  if (req.method === "GET") return serveStatic(req, res);
  res.writeHead(405, { "content-type": "text/plain" }).end("method not allowed");
});

server.listen(PORT, () => {
  console.log(`Pohjoinen CRM POC running at http://localhost:${PORT}`);
  console.log(`Local model: ${LLAMA_MODEL} via ${LLAMA_BASE_URL}`);
  console.log(`Customers: ${customers.length} | Segments: ${segments.length}`);
});
