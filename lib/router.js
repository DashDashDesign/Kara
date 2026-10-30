'use strict';
// Comfy Router (api.comfy.org): one Comfy key, many image models, paid in Comfy credits.
// This is Comfy's Developer Platform API, next to ComfyUI on this PC and Comfy Cloud.
// Only plain fetch, so the same file runs in Node 18+ and on Cloudflare Workers.
// The key is sent only to Comfy (X-API-Key). Never to the browser, never to image links.
// Docs (read 30 Oct 2026): https://docs.comfy.org/development/comfy-router/queue.md
//   one page per model: https://docs.comfy.org/development/comfy-router/models/<provider>/<model>/code.md
// Each model takes its own native body and returns its own native result, so each family below
// says how to build the body and where the image is in the answer.

const API = 'https://api.comfy.org';

const RES_124 = { '1k': '1K', '2k': '2K', '4k': '4K' };
const GEMINI_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const FLUX3_RATIOS = ['21:9', '2:1', '16:9', '3:2', '7:5', '4:3', '5:4', '1:1', '4:5', '3:4', '5:7', '2:3', '9:16', '1:2', '9:21'];
const KREA_RATIOS = ['1:1', '4:5', '3:4', '2:3', '9:16', '5:4', '4:3', '3:2', '16:9', '21:9'];

// Our model id -> Router model id and family. maxRefs: reference images it takes.
const MODELS = {
  'nano-banana-pro': { route: 'vertexai/gemini-3-pro-image', family: 'gemini', maxRefs: 8, res: RES_124 },
  'nano-banana-2-1': { route: 'vertexai/gemini-nano-banana-2.1', family: 'gemini', maxRefs: 10, res: RES_124 },
  'nano-banana-2': { route: 'vertexai/gemini-3.1-flash-image', family: 'gemini', maxRefs: 10, res: RES_124 },
  'nano-banana-2-lite': { route: 'vertexai/gemini-3.1-flash-lite-image', family: 'gemini', maxRefs: 10 },
  'nano-banana': { route: 'vertexai/gemini-2.5-flash-image', family: 'gemini', maxRefs: 3 },
  'gpt-image-2': { route: 'openai/gpt-image-2', family: 'openai', maxRefs: 16 },
  'gpt-image-2-5-flare': { route: 'openai/gpt-image-2.5-flare', family: 'openai', maxRefs: 16 },
  'gpt-image-2-5-sunburst': { route: 'openai/gpt-image-2.5-sunburst', family: 'openai', maxRefs: 16 },
  'seedream-5-pro': { route: 'byteplus/seedream-5-0-pro-260628', family: 'seedream', maxRefs: 10, res: { '1k': '1K', '2k': '2K' } },
  'seedream-5-lite': { route: 'byteplus/seedream-5-0-260128', family: 'seedream', maxRefs: 14, res: { '2k': '2K', '3k': '3K', '4k': '4K' } },
  'seedream-5-flash': { route: 'byteplus/seedream-5-0-flash-260915', family: 'seedream', maxRefs: 10, res: { '1k': '1K', '2k': '2K' } },
  'flux-3': { route: 'bfl/flux-3-image', family: 'flux3', maxRefs: 10, res: { '1k': '1k', '1.5k': '1.5k', '2k': '2k', '4k': '4k' } },
  'krea-3': { route: 'krea/krea-3', family: 'krea', maxRefs: 0, res: { '1k': '1k', '2k': '2k' } },
  'ideogram-4-5': { route: 'ideogram/ideogram-4-5', family: 'ideogram', maxRefs: 5 },
};

const has = (id) => Object.prototype.hasOwnProperty.call(MODELS, id);
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+=*)$/;

function pickRatio(ratios, width, height) {
  const want = Math.log(width / height);
  let best = ratios[0];
  let bestD = Infinity;
  for (const r of ratios) {
    const [w, h] = r.split(':').map(Number);
    const d = Math.abs(Math.log(w / h) - want);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

// Width x height kept in proportion, both multiples of 16, about one megapixel per "1k" (GPT Image and Ideogram take an exact size).
function exactSize(width, height, scale = 1) {
  const ratio = width / height;
  const area = 1024 * 1024 * scale * scale;
  const w = Math.round(Math.sqrt(area * ratio) / 16) * 16;
  const h = Math.round(Math.sqrt(area / ratio) / 16) * 16;
  return `${w}x${h}`;
}

function resValue(m, resolution) {
  if (!m.res) return null;
  return m.res[String(resolution || '').toLowerCase()] || m.res[Object.keys(m.res)[0]];
}

// The model's own request body.
function body(id, { prompt, seed, width, height, resolution, refs }) {
  const m = MODELS[id];
  const text = String(prompt).slice(0, 4000);
  const images = refs.slice(0, m.maxRefs);
  const res = resValue(m, resolution);
  switch (m.family) {
    case 'gemini': {
      const parts = [{ text }];
      for (const r of images) {
        const [, type, data] = r.match(DATA_URL);
        parts.push({ inlineData: { mimeType: `image/${type}`, data } });
      }
      const imageConfig = { aspectRatio: pickRatio(GEMINI_RATIOS, width, height) };
      if (res) imageConfig.imageSize = res;
      return { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig } };
    }
    case 'openai': {
      const out = { prompt: text, quality: 'high', size: exactSize(width, height), output_format: 'png' };
      if (images.length) out.image = images;
      return out;
    }
    case 'seedream': {
      const out = { prompt: text, response_format: 'url', watermark: false, output_format: 'png', seed: Math.min(seed, 2147483647) };
      if (res) out.size = res;
      if (images.length) out.image = images;
      return out;
    }
    case 'flux3': {
      const out = { prompt: text, aspect_ratio: pickRatio(FLUX3_RATIOS, width, height), resolution: res || '1k', grounding: false };
      if (images.length) out.images = images;
      return out;
    }
    case 'krea':
      return { prompt: text, aspect_ratio: pickRatio(KREA_RATIOS, width, height), resolution: res || '1k', seed: Math.min(seed, 2147483647) };
    case 'ideogram': {
      const out = { prompt: text, quality: 'high', magic_prompt: 'off', seed: Math.min(seed, 2147483647) };
      if (images.length) out.images = images;
      else out.size = exactSize(width, height);
      return out;
    }
    default:
      throw new Error(`Unknown Comfy Router model family: ${m.family}`);
  }
}

// Where the image is in each model's answer: links, or bytes inline.
function results(family, result) {
  const urls = [];
  const inline = [];
  const link = (u) => typeof u === 'string' && (/^https:\/\//.test(u) || /^http:\/\/127\.0\.0\.1/.test(u)) && urls.push(u);
  if (!result || typeof result !== 'object') return { urls, inline };
  if (family === 'gemini') {
    for (const c of result.candidates || []) {
      for (const p of (c.content && c.content.parts) || []) {
        if (p.inlineData && p.inlineData.data) inline.push({ type: p.inlineData.mimeType || 'image/png', data: p.inlineData.data });
        if (p.fileData && p.fileData.fileUri) link(p.fileData.fileUri);
      }
    }
  } else if (family === 'flux3') {
    link(result.result && result.result.sample);
  } else if (family === 'krea') {
    for (const u of (result.result && result.result.urls) || []) link(u);
  } else {
    for (const d of result.data || []) {
      if (d.url) link(d.url);
      else if (d.b64_json) inline.push({ type: `image/${result.output_format || d.output_format || 'png'}`, data: d.b64_json });
    }
  }
  return { urls, inline };
}

function problem(status, errorType) {
  if (status === 401 || status === 403) {
    if (errorType === 'not_enabled') return { code: 'badkey', message: 'This Comfy key cannot use Comfy Router yet (not enabled).' };
    return { code: 'badkey', message: 'Comfy refused the API key. Check your Comfy API key (platform.comfy.org).' };
  }
  if (status === 402) return { code: 'credits', message: 'Not enough Comfy credits for this generation. Add credits on platform.comfy.org.' };
  if (status === 429) return { code: 'credits', message: 'Comfy Router says there are too many requests. Wait a moment, then try again.' };
  return null;
}

// The job id carries the Router model id and the request id: both address the request.
const pack = (route, requestId) => `router:${route}|${requestId}`;
function unpack(id) {
  const m = /^router:([a-z0-9._-]+\/[a-z0-9._-]+)\|([A-Za-z0-9-]{8,80})$/.exec(String(id));
  return m ? { route: m[1], requestId: m[2] } : null;
}
const familyOf = (route) => {
  const hit = Object.values(MODELS).find((m) => m.route === route);
  return hit ? hit.family : null;
};

// key, api: the Comfy key and base URL (the tests point it to a fake Router).
function client({ key, api = API }) {
  const base = String(api).replace(/\/+$/, '');
  const headers = (extra = {}) => ({ 'X-API-Key': key, ...extra });

  // A free call: one model's schema needs a valid key, and nothing is charged.
  async function ping() {
    if (!key) return { ok: false, mode: 'router', url: base, code: 'nokey', error: 'No Comfy API key.' };
    try {
      const res = await fetch(`${base}/v2/models/bfl/flux-3-image/openapi.json`, { headers: headers(), signal: AbortSignal.timeout(8000) });
      const errorType = res.headers.get('x-comfy-error-type');
      const p = problem(res.status, errorType);
      if (p) return { ok: false, mode: 'router', url: base, code: p.code, error: p.message };
      if (!res.ok) return { ok: false, mode: 'router', url: base, code: 'http', error: `Comfy Router answered HTTP ${res.status}` };
      return { ok: true, mode: 'router', url: base, device: 'Comfy Router' };
    } catch (err) {
      return { ok: false, mode: 'router', url: base, code: 'unreachable', error: 'Cannot reach Comfy Router. Check your internet connection.' };
    }
  }

  async function queue({ prompt, seed, width, height, model, resolution, refs }) {
    if (!key) throw new Error('No Comfy API key.');
    if (!has(model)) throw new Error(`Comfy Router does not offer ${model} in Kara.`);
    const m = MODELS[model];
    const images = (Array.isArray(refs) ? refs : []).filter((r) => typeof r === 'string' && r.length < 30_000_000 && DATA_URL.test(r));
    const payload = body(model, { prompt, seed, width, height, resolution, refs: images });
    let res;
    try {
      res = await fetch(`${base}/v2/models/${m.route}/requests`, {
        method: 'POST',
        headers: headers({ 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      throw new Error('Cannot reach Comfy Router. Check your internet connection.');
    }
    const answer = await res.json().catch(() => null);
    const p = problem(res.status, (answer && answer.error_type) || res.headers.get('x-comfy-error-type'));
    if (p) throw new Error(p.message);
    if (!res.ok) {
      const detail = answer && (answer.detail ? JSON.stringify(answer.detail) : answer.message || answer.error_type);
      throw new Error(`Comfy Router refused the job: ${detail || `HTTP ${res.status}`}`);
    }
    if (!answer || !answer.request_id) throw new Error('Comfy Router did not return a request id.');
    return pack(m.route, answer.request_id);
  }

  // { status, urls, inline: [{ type, data }], error }
  async function job(jobId) {
    const ids = unpack(jobId);
    const family = ids && familyOf(ids.route);
    if (!family) return { status: 'error', urls: [], inline: [], error: 'Unknown Comfy Router request.' };
    const at = `${base}/v2/models/${ids.route}/requests/${encodeURIComponent(ids.requestId)}`;
    let res;
    try {
      res = await fetch(`${at}/status`, { headers: headers(), signal: AbortSignal.timeout(10000) });
    } catch (err) {
      return { status: 'queued', urls: [], inline: [], error: null };
    }
    const st = await res.json().catch(() => ({}));
    const p = problem(res.status, st.error_type);
    if (p) return { status: 'error', urls: [], inline: [], error: p.message };
    if (st.status === 'IN_PROGRESS') return { status: 'running', urls: [], inline: [], error: null };
    if (st.status !== 'COMPLETED') return { status: 'queued', urls: [], inline: [], error: null };
    if (st.error_type) return { status: 'error', urls: [], inline: [], error: `Comfy Router could not generate this image (${st.error_type}).` };
    const out = await fetch(at, { headers: headers(), signal: AbortSignal.timeout(60000) });
    const result = await out.json().catch(() => null);
    if (!out.ok) {
      const kind = out.headers.get('x-comfy-error-type') || (result && result.error_type) || `HTTP ${out.status}`;
      return { status: 'error', urls: [], inline: [], error: `Comfy Router could not generate this image (${kind}).` };
    }
    const found = results(family, result);
    if (!found.urls.length && !found.inline.length) return { status: 'error', urls: [], inline: [], error: 'Comfy Router finished without an image (maybe refused by the model).' };
    return { status: 'done', urls: found.urls, inline: found.inline, error: null };
  }

  // Router has no balance call in its docs.
  async function balance() {
    return { error: 'unsupported' };
  }

  return { ping, queue, job, balance };
}

module.exports = { client, MODELS, API, pickRatio, body, results };
