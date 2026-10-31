'use strict';
// fal.ai Model APIs, through the queue. Used when COMFY_MODE=fal, and by the Worker.
// Only plain fetch, so the same file runs in Node 18+ and on Cloudflare Workers.
// The key is sent only to fal (Authorization: Key ...). Never to the browser, never to image links.
// Docs: https://fal.ai/docs/api-reference/inference-api/queue/submit  .../queue/status  .../queue/result
//       https://fal.ai/models/fal-ai/z-image/turbo  https://fal.ai/models/blackforestlabs/flux-3/klein/text-to-image

const QUEUE = 'https://queue.fal.run';
const API = 'https://api.fal.ai';

// Our model id -> fal endpoints (read on fal's model pages, 28 Oct 2026). The edit endpoint is used when reference images are given.
//   size:  'exact' sends image_size {width, height} (multiple of 16 when snap is set); 'ratio' sends aspect_ratio from ratios
//   res:   the field that sets the size, and our resolution ids -> fal values
//   max / maxArea: longest side / total pixels the model accepts, the size is shrunk in proportion to fit
//   seed:  takes a seed; png: takes output_format; extra: fixed fields
const RES_124 = { field: 'resolution', values: { '1k': '1K', '2k': '2K', '4k': '4K' } };
const GEMINI_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '4:1', '1:4', '8:1', '1:8'];
const MODELS = {
  'z-image-turbo': { text: 'fal-ai/z-image/turbo', maxRefs: 0, size: 'exact', seed: true, png: true, extra: { enable_prompt_expansion: false } },
  'nano-banana-pro': { text: 'fal-ai/nano-banana-pro', edit: 'fal-ai/nano-banana-pro/edit', maxRefs: 8, size: 'ratio', ratios: GEMINI_RATIOS, res: RES_124, seed: true, png: true },
  'nano-banana-2': { text: 'fal-ai/nano-banana-2', edit: 'fal-ai/nano-banana-2/edit', maxRefs: 10, size: 'ratio', ratios: GEMINI_RATIOS, res: RES_124, seed: true, png: true },
  'gpt-image-2': { text: 'openai/gpt-image-2', edit: 'openai/gpt-image-2/edit', maxRefs: 16, size: 'exact', snap: 16, png: true, extra: { quality: 'high' } },
  'seedream-5-pro': { text: 'bytedance/seedream/v5/pro/text-to-image', edit: 'bytedance/seedream/v5/pro/edit', maxRefs: 10, size: 'exact', png: true, extra: { enhance_prompt_mode: 'standard' } },
  'krea-3': { text: 'krea/v3/text-to-image', edit: 'krea/v3/edit', maxRefs: 8, size: 'exact', snap: 16, seed: true, png: true },
  'flux-3': { text: 'blackforestlabs/flux-3/text-to-image', edit: 'blackforestlabs/flux-3/edit-image', maxRefs: 10, size: 'ratio', ratios: ['21:9', '2:1', '16:9', '3:2', '7:5', '4:3', '5:4', '1:1', '4:5', '3:4', '5:7', '2:3', '9:16', '1:2'], res: { field: 'resolution', values: { '1k': '1k', '1.5k': '1.5k', '2k': '2k', '4k': '4k' } }, png: true, formats: ['jpeg', 'png'], extra: { enable_prompt_expansion: false } },
  'flux-3-klein': { text: 'blackforestlabs/flux-3/klein/text-to-image', edit: 'blackforestlabs/flux-3/klein/edit-image', maxRefs: 10, size: 'exact', snap: 16, seed: true, png: true, extra: { enable_prompt_expansion: false } },
  'gpt-image-2-5-flare': { text: 'openai/gpt-image-2.5/flare/text-to-image', edit: 'openai/gpt-image-2.5/flare/edit', maxRefs: 16, size: 'exact', snap: 16, png: true, extra: { quality: 'high' } },
  'gpt-image-2-5-sunburst': { text: 'openai/gpt-image-2.5/sunburst/text-to-image', edit: 'openai/gpt-image-2.5/sunburst/edit', maxRefs: 16, size: 'exact', snap: 16, png: true, extra: { quality: 'high' } },
  'nano-banana-2-1': { text: 'google/nano-banana-2.1', edit: 'google/nano-banana-2.1/edit', maxRefs: 10, size: 'ratio', ratios: GEMINI_RATIOS, res: RES_124, seed: true, png: true },
  'nano-banana-2-lite': { text: 'google/nano-banana-2-lite', maxRefs: 0, size: 'ratio', ratios: GEMINI_RATIOS, seed: true, png: true },
  'nano-banana': { text: 'fal-ai/nano-banana', edit: 'fal-ai/nano-banana/edit', maxRefs: 10, size: 'ratio', ratios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'], seed: true, png: true },
  'seedream-5-lite': { text: 'bytedance/seedream/v5/lite/text-to-image', edit: 'bytedance/seedream/v5/lite/edit', maxRefs: 10, size: 'exact', png: true },
  'seedream-5-flash': { text: 'bytedance/seedream/v5/flash/text-to-image', edit: 'bytedance/seedream/v5/flash/edit', maxRefs: 10, size: 'exact', png: true },
  // Read on fal's model pages, 31 Oct 2026 (the edit endpoints of FLUX 2 Pro and Qwen 3 are the usual names, not read; fal has no Qwen 3 Pro that works: both names tried were refused)
  'flux-2-pro': { text: 'fal-ai/flux-2-pro', edit: 'fal-ai/flux-2-pro/edit', maxRefs: 9, size: 'exact', snap: 16, max: 2048, seed: true, png: true, formats: ['jpeg', 'png'] },
  'flux-2-max': { text: 'fal-ai/flux-2-max', edit: 'fal-ai/flux-2-max/edit', maxRefs: 9, size: 'exact', snap: 16, max: 2048, seed: true, png: true, formats: ['jpeg', 'png'] },
  'qwen-3': { text: 'alibaba/qwen-image-3/text-to-image', edit: 'alibaba/qwen-image-3/edit', maxRefs: 3, size: 'exact', snap: 16, maxArea: 2048 * 2048, seed: true, png: true, extra: { enable_prompt_expansion: false } },
  'krea-2-turbo': { text: 'fal-ai/krea-2/turbo', maxRefs: 0, size: 'exact', snap: 16, seed: true, png: true, formats: ['jpeg', 'png'], extra: { enable_prompt_expansion: false } },
  // Open-weight models served by fal (pages read 31 Oct 2026; prices from fal's pricing API, per megapixel)
  'hidream-i1': { text: 'fal-ai/hidream-i1-full', maxRefs: 0, size: 'exact', snap: 16, max: 2048, seed: true, png: true, formats: ['jpeg', 'png'] },
  'z-image-base': { text: 'fal-ai/z-image/base', maxRefs: 0, size: 'exact', snap: 16, max: 2048, seed: true, png: true },
  'flux-2-dev': { text: 'fal-ai/flux-2', maxRefs: 0, size: 'exact', snap: 16, max: 2048, seed: true, png: true },
  'moss-image': { text: 'fal-ai/moss-image', maxRefs: 0, size: 'exact', snap: 16, seed: true, png: true, extra: { enable_prompt_expansion: false } },
  'ideogram-4-5': { text: 'ideogram/v4.5', maxRefs: 0, size: 'exact', seed: true, extra: { quality: 'medium', enable_prompt_expansion: false } },
};

// Closest ratio the model offers.
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

// fal accepts a Base64 data URI wherever it takes a file URL.
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

function problem(status) {
  if (status === 401 || status === 403) return { code: 'badkey', message: 'fal refused the API key. Check your fal key.' };
  if (status === 402) return { code: 'credits', message: 'Not enough fal balance for this generation.' };
  if (status === 429) return { code: 'credits', message: 'fal says there are too many requests. Wait a moment, then try again.' };
  return null;
}

// Job ids carry fal's own status and result links (base64url JSON), checked against the queue host before use.
const toB64 = (s) => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'));
const fromB64 = (s) => (typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'));
const pack = (o) => `fal:${toB64(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
function unpack(id) {
  try {
    const b = String(id).replace(/^fal:/, '').replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(fromB64(b + '='.repeat((4 - (b.length % 4)) % 4)));
  } catch (err) {
    return null;
  }
}

function client({ key, queue = QUEUE, api = API }) {
  const base = queue.replace(/\/+$/, '');
  const headers = (extra = {}) => ({ authorization: `Key ${key}`, ...extra });
  const ours = (u) => typeof u === 'string' && u.startsWith(`${base}/`);

  // No free "who am I" call is documented: ask for the status of a request that cannot exist.
  // A valid key gets "not found", a wrong key gets 401 or 403. Nothing is spent.
  async function ping() {
    if (!key) return { ok: false, mode: 'fal', url: base, code: 'nokey', error: 'No fal API key.' };
    try {
      const res = await fetch(`${base}/fal-ai/z-image/requests/00000000-0000-0000-0000-000000000000/status`, { headers: headers(), signal: AbortSignal.timeout(8000) });
      const p = problem(res.status);
      if (p && p.code === 'badkey') return { ok: false, mode: 'fal', url: base, code: p.code, error: p.message };
      if (res.status >= 500) return { ok: false, mode: 'fal', url: base, code: 'http', error: `fal answered HTTP ${res.status}` };
      return { ok: true, mode: 'fal', url: base, device: 'fal' };
    } catch (err) {
      return { ok: false, mode: 'fal', url: base, code: 'unreachable', error: 'Cannot reach fal. Check your internet connection.' };
    }
  }

  // format: output format, png unless asked (tools/previews.js asks for webp, lighter).
  async function queueJob({ prompt, seed, width, height, model, resolution, refs, format }) {
    if (!key) throw new Error('No fal API key.');
    const id = Object.prototype.hasOwnProperty.call(MODELS, model) ? model : 'z-image-turbo';
    const m = MODELS[id];
    const images = (Array.isArray(refs) ? refs : []).filter((r) => typeof r === 'string' && r.length < 14_000_000 && DATA_URL.test(r)).slice(0, m.maxRefs);
    const input = { prompt: String(prompt).slice(0, 4000), num_images: 1, ...(m.extra || {}) };
    if (m.size === 'ratio') input.aspect_ratio = pickRatio(m.ratios, width, height);
    else {
      const snap = (v) => (m.snap ? Math.max(m.snap, Math.floor(v / m.snap) * m.snap) : v);
      let k = 1;
      if (m.max) k = Math.min(k, m.max / Math.max(width, height));
      if (m.maxArea) k = Math.min(k, Math.sqrt(m.maxArea / (width * height)));
      input.image_size = { width: snap(width * k), height: snap(height * k) };
    }
    if (m.res) input[m.res.field] = m.res.values[String(resolution).toLowerCase()] || m.res.values[Object.keys(m.res.values)[0]];
    if (m.seed) input.seed = Math.min(seed, 2147483647);
    if (format && (m.formats || ['png', 'jpeg', 'webp']).includes(format)) input.output_format = format;
    else if (format === 'webp' && m.formats) input.output_format = 'jpeg';
    else if (m.png) input.output_format = 'png';
    let endpoint = m.text;
    if (images.length && m.edit) {
      endpoint = m.edit;
      input.image_urls = images;
    }
    let res;
    try {
      res = await fetch(`${base}/${endpoint}`, { method: 'POST', headers: headers({ 'content-type': 'application/json' }), body: JSON.stringify(input), signal: AbortSignal.timeout(60000) });
    } catch (err) {
      throw new Error('Cannot reach fal. Check your internet connection.');
    }
    const body = await res.json().catch(() => null);
    const p = problem(res.status);
    if (p) throw new Error(p.message);
    if (!res.ok) throw new Error(`fal refused the job: ${(body && (body.detail ? JSON.stringify(body.detail) : body.message)) || `HTTP ${res.status}`}`);
    if (!body || !ours(body.status_url) || !ours(body.response_url)) throw new Error('fal did not return a request id.');
    return pack({ s: body.status_url, r: body.response_url });
  }

  async function job(jobId) {
    const links = unpack(jobId);
    if (!links || !ours(links.s) || !ours(links.r)) return { status: 'error', urls: [], error: 'Unknown fal request.' };
    let res;
    try {
      res = await fetch(links.s, { headers: headers(), signal: AbortSignal.timeout(10000) });
    } catch (err) {
      return { status: 'queued', urls: [], error: null };
    }
    const p = problem(res.status);
    if (p) return { status: 'error', urls: [], error: p.message };
    const st = await res.json().catch(() => ({}));
    if (st.status === 'IN_PROGRESS') return { status: 'running', urls: [], error: null };
    if (st.status !== 'COMPLETED') return { status: 'queued', urls: [], error: null };
    const out = await fetch(links.r, { headers: headers(), signal: AbortSignal.timeout(20000) });
    const result = await out.json().catch(() => null);
    if (!out.ok) {
      const detail = result && result.detail ? (typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail)) : `HTTP ${out.status}`;
      return { status: 'error', urls: [], error: `fal could not generate this image: ${detail}` };
    }
    const urls = ((result && result.images) || []).map((i) => i && i.url).filter((u) => typeof u === 'string' && (/^https:\/\//.test(u) || /^http:\/\/127\.0\.0\.1/.test(u)));
    return { status: 'done', urls, error: null };
  }

  // Balance in dollars. Needs a key allowed to read billing (presets BILLING, READONLY, FULL).
  // Docs: https://fal.ai/docs/platform-apis/v1/account/billing
  async function balance() {
    if (!key) return { error: 'nokey' };
    try {
      const res = await fetch(`${api.replace(/\/+$/, '')}/v1/account/billing?expand=credits`, { headers: headers(), signal: AbortSignal.timeout(8000) });
      if (res.status === 401 || res.status === 403) return { error: 'noright' };
      if (!res.ok) return { error: 'http' };
      const body = await res.json().catch(() => null);
      const credits = body && body.credits;
      if (!credits || !Number.isFinite(Number(credits.current_balance))) return { error: 'http' };
      return { amount: Number(credits.current_balance), unit: String(credits.currency || 'USD') };
    } catch (err) {
      return { error: 'unreachable' };
    }
  }

  return { ping, queue: queueJob, job, balance };
}

module.exports = { client, MODELS, QUEUE, API, pickRatio };
