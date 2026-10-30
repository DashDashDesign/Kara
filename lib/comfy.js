'use strict';
// Small client for the ComfyUI HTTP API. Uses only what Node 18+ ships with.
// Two modes, chosen with COMFY_MODE:
//   local (default)  your own ComfyUI, at COMFY_URL (http://127.0.0.1:8188)
//   cloud            Comfy Cloud, with COMFY_CLOUD_API_KEY (needs a paid Comfy Cloud plan)
// The API key stays in this process. It is never sent to the browser.

const crypto = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const magnific = require('./magnific');
const kie = require('./kie');
const fal = require('./fal');
const router = require('./router');

const CLIENT_ID = crypto.randomUUID();
const CLOUD_URL = 'https://cloud.comfy.org';

// local | cloud | router | magnific | kie | fal (the last four are not ComfyUI: they take prompt, seed, size and images)
// Each request may name its provider (the page sends it with every call): it applies to that request only,
// through everything it awaits, and never leaks into another request. Without it: COMFY_MODE.
const PROVIDERS = ['local', 'cloud', 'router', 'magnific', 'kie', 'fal'];
const perRequest = new AsyncLocalStorage();

function withProvider(provider, fn) {
  return PROVIDERS.includes(provider) ? perRequest.run({ provider }, fn) : fn();
}

function mode() {
  const asked = perRequest.getStore();
  if (asked) return asked.provider;
  const m = String(process.env.COMFY_MODE || 'local').trim().toLowerCase();
  return PROVIDERS.includes(m) ? m : 'local';
}

function isFal() {
  return mode() === 'fal';
}

function isRouter() {
  return mode() === 'router';
}

// Comfy Router uses the same Comfy key as Comfy Cloud.
function routerClient() {
  return router.client({ key: (process.env.COMFY_CLOUD_API_KEY || '').trim(), api: process.env.COMFY_ROUTER_URL || router.API });
}

// Images Comfy Router sent back as bytes: kept here (last 40) and served by /api/image under a short name.
const routerImages = new Map();
function keepInline(img) {
  const name = `router-${crypto.randomUUID()}`;
  routerImages.set(name, { type: img.type, buf: Buffer.from(img.data, 'base64') });
  while (routerImages.size > 40) routerImages.delete(routerImages.keys().next().value);
  return name;
}

function falClient() {
  return fal.client({ key: (process.env.FAL_KEY || '').trim(), queue: process.env.FAL_QUEUE_URL || fal.QUEUE, api: process.env.FAL_API_URL || fal.API });
}

// Remaining balance of one provider, with the key saved for it. Magnific's API has no balance call.
async function balance(provider) {
  if (provider === 'kie') return kie.client({ key: (process.env.KIE_API_KEY || '').trim(), api: process.env.KIE_URL || kie.API, upload: process.env.KIE_UPLOAD_URL || kie.UPLOAD }).balance();
  if (provider === 'fal') return falClient().balance();
  if (provider === 'router') return routerClient().balance();
  if (provider === 'local') return { free: true };
  return { error: 'unsupported' };
}

function isMagnific() {
  return mode() === 'magnific';
}

function isKie() {
  return mode() === 'kie';
}

// KIE and fal images we were given back: only these can be fetched through /api/image.
const kieImages = new Set();
function kieClient() {
  return kie.client({ key: (process.env.KIE_API_KEY || '').trim(), api: process.env.KIE_URL || kie.API, upload: process.env.KIE_UPLOAD_URL || kie.UPLOAD });
}

function isCloud() {
  return mode() === 'cloud';
}

function apiKey() {
  return (process.env.COMFY_CLOUD_API_KEY || '').trim();
}

function base() {
  if (isMagnific()) return magnific.base();
  if (isKie()) return (process.env.KIE_URL || kie.API).replace(/\/+$/, '');
  if (isFal()) return (process.env.FAL_QUEUE_URL || fal.QUEUE).replace(/\/+$/, '');
  if (isRouter()) return (process.env.COMFY_ROUTER_URL || router.API).replace(/\/+$/, '');
  if (isCloud()) return (process.env.COMFY_CLOUD_URL || CLOUD_URL).replace(/\/+$/, '');
  return (process.env.COMFY_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
}

// Comfy Cloud serves the same routes under /api.
function endpoint(route) {
  return `${base()}${isCloud() ? '/api' : ''}${route}`;
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (isCloud() && apiKey()) headers['X-API-Key'] = apiKey();
  return headers;
}

const NO_KEY = 'No Comfy Cloud API key. Put COMFY_CLOUD_API_KEY=... in the .env file, then restart the app.';

function cloudHttpProblem(status) {
  if (status === 401 || status === 403) return { code: 'badkey', message: 'Comfy Cloud refused the API key. Check COMFY_CLOUD_API_KEY in the .env file.' };
  if (status === 402) return { code: 'credits', message: 'Not enough Comfy Cloud credits for this generation.' };
  if (status === 429) return { code: 'nosub', message: 'Comfy Cloud says the subscription is not active. The API needs a paid Comfy Cloud plan.' };
  return null;
}

async function ping() {
  if (isMagnific()) return magnific.ping();
  if (isFal()) {
    const r = await falClient().ping();
    if (r.code === 'nokey') r.error = 'No fal API key. Add it in Provider, or put FAL_KEY=... in the .env file.';
    return r;
  }
  if (isRouter()) {
    const r = await routerClient().ping();
    if (r.code === 'nokey') r.error = 'No Comfy API key. Add it in Keys, or put COMFY_CLOUD_API_KEY=... in the .env file.';
    return r;
  }
  if (isKie()) {
    const r = await kieClient().ping();
    if (r.code === 'nokey') r.error = 'No KIE API key. Add it in Provider, or put KIE_API_KEY=... in the .env file.';
    return r;
  }
  if (isCloud()) {
    if (!apiKey()) return { ok: false, mode: 'cloud', url: base(), code: 'nokey', error: NO_KEY };
    try {
      const res = await fetch(endpoint('/user'), { headers: authHeaders(), signal: AbortSignal.timeout(6000) });
      const problem = cloudHttpProblem(res.status);
      if (problem) return { ok: false, mode: 'cloud', url: base(), code: problem.code, error: problem.message };
      if (!res.ok) return { ok: false, mode: 'cloud', url: base(), code: 'http', error: `Comfy Cloud answered HTTP ${res.status}` };
      const account = await res.json().catch(() => ({}));
      if (account && account.status && account.status !== 'active') {
        return { ok: false, mode: 'cloud', url: base(), code: 'nosub', error: `Your Comfy Cloud account is "${account.status}", not active.` };
      }
      return { ok: true, mode: 'cloud', url: base(), device: 'Comfy Cloud' };
    } catch (err) {
      return { ok: false, mode: 'cloud', url: base(), code: 'unreachable', error: `Cannot reach Comfy Cloud at ${base()}. Check your internet connection.` };
    }
  }
  try {
    const res = await fetch(`${base()}/system_stats`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return { ok: false, mode: 'local', url: base(), error: `ComfyUI answered HTTP ${res.status}` };
    const stats = await res.json();
    const device = stats && stats.devices && stats.devices[0] ? stats.devices[0].name : '';
    return { ok: true, mode: 'local', url: base(), device };
  } catch (err) {
    return { ok: false, mode: 'local', url: base(), code: 'unreachable', error: `Cannot reach ComfyUI at ${base()}. Is it running?` };
  }
}

// Walks back from a conditioning link to the node that holds the text.
function findTextNode(workflow, nodeId, seen = new Set()) {
  if (seen.has(nodeId)) return null;
  seen.add(nodeId);
  const node = workflow[nodeId];
  if (!node || !node.inputs) return null;
  if (typeof node.inputs.text === 'string') return node;
  // A text encoder fed by other nodes (an LLM that rewrites the prompt, a preview...): our prompt goes straight in.
  // Its field is "text", or "prompt" for some (TextEncodeQwenImage21).
  if (/TextEncode/.test(node.class_type || '') && ('text' in node.inputs || 'prompt' in node.inputs)) return node;
  for (const value of Object.values(node.inputs)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      const found = findTextNode(workflow, value[0], seen);
      if (found) return found;
    }
  }
  return null;
}

// Puts our values into a workflow in ComfyUI "API format".
// It finds the right nodes by what they are, so any similar workflow works.
// Image inputs of an editing workflow: "images.image0", "images.image1"... (FLUX 3) or "images.image_1"... (Qwen 2.1).
const IMAGE_SLOT = /^images\.image(_?)(\d+)$/;
const takesImages = (template) => Object.values(template || {}).some((n) => n && n.inputs && Object.keys(n.inputs).some((k) => IMAGE_SLOT.test(k)));

// Sends reference images (data URLs) to ComfyUI's input folder; returns the names to put in LoadImage nodes.
async function uploadImages(refs) {
  const names = [];
  for (const [i, ref] of (refs || []).entries()) {
    const m = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(String(ref));
    if (!m) continue;
    const form = new FormData();
    form.append('image', new Blob([Buffer.from(m[3], 'base64')], { type: m[1] }), `kara_ref_${Date.now()}_${i}.${m[2] === 'jpeg' ? 'jpg' : m[2]}`);
    form.append('overwrite', 'true');
    let res;
    try {
      res = await fetch(endpoint('/upload/image'), { method: 'POST', headers: authHeaders(), body: form, signal: AbortSignal.timeout(60000) });
    } catch (err) {
      throw new Error(`Cannot reach ComfyUI at ${base()}. Is it running?`);
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || !body.name) throw new Error('ComfyUI did not accept the reference image.');
    names.push(body.subfolder ? `${body.subfolder}/${body.name}` : body.name);
  }
  return names;
}

// Each node with image slots gets one LoadImage per uploaded image, in order, numbered like the template.
function wireImages(wf, images) {
  for (const node of Object.values(wf)) {
    const slots = Object.keys(node.inputs || {}).filter((k) => IMAGE_SLOT.test(k));
    if (!slots.length) continue;
    const sep = IMAGE_SLOT.exec(slots[0])[1];
    const start = Math.min(...slots.map((k) => Number(IMAGE_SLOT.exec(k)[2])));
    for (const k of slots) delete node.inputs[k];
    images.forEach((name, i) => {
      const id = `cd_ref_${i}`;
      wf[id] = { class_type: 'LoadImage', inputs: { image: name }, _meta: { title: `Reference ${i + 1}` } };
      node.inputs[`images.image${sep}${start + i}`] = [id, 0];
    });
  }
}

// guide: the uploaded face drawing, for a ControlNet workflow (its LoadImage holds "GUIDE", its "Guide size" node follows the image size).
function inject(template, { prompt, seed, width, height, model, resolution, refs, images, guide, guideStrength }) {
  if (isMagnific() || isKie() || isFal() || isRouter()) return { prompt, seed, width, height, model, resolution, refs };
  const wf = JSON.parse(JSON.stringify(template));
  if (images && images.length) wireImages(wf, images);
  const nodes = Object.entries(wf);

  let promptNode = null;
  for (const [, node] of nodes) {
    if (/^KSampler/.test(node.class_type) && Array.isArray(node.inputs.positive)) {
      promptNode = findTextNode(wf, node.inputs.positive[0]);
      if (promptNode) break;
    }
  }
  if (!promptNode) {
    const fallback = nodes.find(([, n]) => n.class_type === 'CLIPTextEncode');
    promptNode = fallback ? fallback[1] : null;
  }
  if (!promptNode) throw new Error('This workflow has no text prompt node I can fill.');
  promptNode.inputs['text' in promptNode.inputs || !('prompt' in promptNode.inputs) ? 'text' : 'prompt'] = prompt;

  for (const [, node] of nodes) {
    if (typeof node.inputs.seed === 'number') node.inputs.seed = seed;
    if (typeof node.inputs.noise_seed === 'number') node.inputs.noise_seed = seed;
    if (/^Empty.*Latent/.test(node.class_type) && 'width' in node.inputs && 'height' in node.inputs) {
      node.inputs.width = width;
      node.inputs.height = height;
    }
    if (guide && node.class_type === 'LoadImage' && node.inputs.image === 'GUIDE') node.inputs.image = guide;
    // How closely the ControlNet follows the drawing (the page's "strength" slider).
    if (guide && guideStrength !== undefined && node.class_type === 'QwenImageDiffsynthControlnet' && 'strength' in node.inputs) node.inputs.strength = guideStrength;
    // How closely the ControlNet follows the drawing (the page's "strength" slider).
    if (guide && guideStrength !== undefined && node.class_type === 'QwenImageDiffsynthControlnet' && 'strength' in node.inputs) node.inputs.strength = guideStrength;
    if (node._meta && node._meta.title === 'Guide size') {
      node.inputs.width = width;
      node.inputs.height = height;
    }
  }
  return prune(wf);
}

// Keeps only the nodes the saved image depends on. Nodes left aside by our values
// (a size picker, an LLM that rewrote the prompt, a text preview) would still run otherwise.
function prune(wf) {
  const outputs = Object.keys(wf).filter((id) => /^SaveImage/.test(wf[id].class_type || ''));
  if (!outputs.length) return wf;
  const keep = new Set();
  const visit = (id) => {
    if (keep.has(id) || !wf[id]) return;
    keep.add(id);
    for (const v of Object.values(wf[id].inputs || {})) if (Array.isArray(v) && typeof v[0] === 'string') visit(v[0]);
  };
  outputs.forEach(visit);
  for (const id of Object.keys(wf)) if (!keep.has(id)) delete wf[id];
  return wf;
}

function explainError(body) {
  const who = isCloud() ? 'Comfy Cloud' : 'ComfyUI';
  if (!body) return `${who} refused the job.`;
  const lines = [];
  if (typeof body.error === 'string') lines.push(body.error);
  if (body.error && body.error.message) lines.push(body.error.message);
  if (body.error && body.error.details) lines.push(body.error.details);
  if (typeof body.message === 'string') lines.push(body.message);
  if (body.node_errors) {
    for (const [id, info] of Object.entries(body.node_errors)) {
      const name = info.class_type || `node ${id}`;
      for (const e of info.errors || []) lines.push(`${name}: ${e.message}${e.details ? ` (${e.details})` : ''}`);
    }
  }
  return lines.length ? lines.join(' | ') : `${who} refused the job.`;
}

async function queue(workflow) {
  if (isMagnific()) return magnific.queue(workflow);
  if (isKie()) return kieClient().queue(workflow);
  if (isFal()) return falClient().queue(workflow);
  if (isRouter()) return routerClient().queue(workflow);
  if (isCloud() && !apiKey()) throw new Error(NO_KEY);
  let res;
  try {
    res = await fetch(endpoint('/prompt'), {
      method: 'POST',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify(isCloud() ? { prompt: workflow } : { prompt: workflow, client_id: CLIENT_ID }),
      signal: AbortSignal.timeout(isCloud() ? 30000 : 15000),
    });
  } catch (err) {
    if (isCloud()) throw new Error(`Cannot reach Comfy Cloud at ${base()}. Check your internet connection.`);
    throw new Error(`Cannot reach ComfyUI at ${base()}. Is it running?`);
  }
  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    body = null;
  }
  if (isCloud()) {
    if (body && body.error && body.error.type === 'FREE_TIER_NOT_ALLOWED') {
      throw new Error('Your Comfy Cloud account is on the free tier, and the API needs a paid plan. Your key is fine: subscribe at comfy.org/cloud, then try again.');
    }
    const problem = cloudHttpProblem(res.status);
    if (problem) throw new Error(problem.message);
  }
  if (!res.ok) throw new Error(explainError(body));
  if (isCloud() && body && body.error) throw new Error(explainError(body));
  if (!body || !body.prompt_id) throw new Error(`${isCloud() ? 'Comfy Cloud' : 'ComfyUI'} did not return a job id.`);
  return body.prompt_id;
}

// Finds every image a ComfyUI-style payload lists, wherever it sits in the JSON.
function collectImages(payload) {
  const found = [];
  const seen = new Set();
  (function walk(value, key) {
    if (!value || typeof value !== 'object') return;
    if (key === 'images' && Array.isArray(value)) {
      for (const img of value) {
        if (img && typeof img.filename === 'string' && (img.type === 'output' || !img.type)) {
          const id = `${img.subfolder || ''}/${img.filename}`;
          if (!seen.has(id)) {
            seen.add(id);
            found.push({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
          }
        }
      }
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(v, k);
  })(payload, '');
  return found;
}

async function cloudOutputs(id) {
  // The job detail route is the current one. history_v2 is the older fallback.
  for (const route of [`/jobs/${encodeURIComponent(id)}`, `/history_v2/${encodeURIComponent(id)}`]) {
    try {
      const res = await fetch(endpoint(route), { headers: authHeaders(), signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const images = collectImages(await res.json());
      if (images.length) return images;
    } catch (err) {
      // try the next route
    }
  }
  return [];
}

async function cloudJob(promptId) {
  const res = await fetch(endpoint(`/job/${encodeURIComponent(promptId)}/status`), { headers: authHeaders(), signal: AbortSignal.timeout(10000) });
  if (res.status === 404) return { status: 'queued', images: [], error: null };
  const problem = cloudHttpProblem(res.status);
  if (problem) return { status: 'error', images: [], error: problem.message };
  if (!res.ok) return { status: 'queued', images: [], error: null };
  const info = await res.json();
  switch (info.status) {
    case 'in_progress':
      return { status: 'running', images: [], error: null };
    case 'error':
      return { status: 'error', images: [], error: info.error_message || 'Generation failed in Comfy Cloud.' };
    case 'cancelled':
      return { status: 'error', images: [], error: 'The job was cancelled.' };
    case 'completed':
      return { status: 'done', images: await cloudOutputs(promptId), error: null };
    default:
      return { status: 'queued', images: [], error: null };
  }
}

// Returns { status: 'queued' | 'running' | 'done' | 'error', images, error }
async function job(promptId) {
  if (isMagnific()) return magnific.job(promptId);
  if (isKie() || isFal()) {
    const r = await (isFal() ? falClient() : kieClient()).job(promptId);
    if (r.status !== 'done') return { status: r.status, images: [], error: r.error };
    r.urls.forEach((u) => kieImages.add(u));
    return { status: 'done', images: r.urls.map((u) => ({ filename: u, subfolder: '', type: 'url' })), error: null };
  }
  if (isRouter()) {
    const r = await routerClient().job(promptId);
    if (r.status !== 'done') return { status: r.status, images: [], error: r.error };
    r.urls.forEach((u) => kieImages.add(u));
    const names = [...r.urls, ...r.inline.map(keepInline)];
    return { status: 'done', images: names.map((u) => ({ filename: u, subfolder: '', type: 'url' })), error: null };
  }
  if (isCloud()) return cloudJob(promptId);

  const res = await fetch(`${base()}/history/${encodeURIComponent(promptId)}`, { signal: AbortSignal.timeout(8000) });
  const history = res.ok ? await res.json() : {};
  const entry = history[promptId];

  if (entry) {
    const status = entry.status || {};
    if (status.status_str === 'error') {
      const failed = (status.messages || []).find((m) => m[0] === 'execution_error');
      const detail = failed && failed[1] ? `${failed[1].node_type || 'a node'}: ${failed[1].exception_message || 'failed'}` : 'Generation failed in ComfyUI.';
      return { status: 'error', images: [], error: detail.trim() };
    }
    const images = [];
    for (const out of Object.values(entry.outputs || {})) {
      for (const img of out.images || []) {
        if (img.type === 'output' || !img.type) images.push({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      }
    }
    if (images.length || status.completed) return { status: 'done', images, error: null };
  }

  try {
    const q = await fetch(`${base()}/queue`, { signal: AbortSignal.timeout(8000) });
    const queue = q.ok ? await q.json() : {};
    const running = (queue.queue_running || []).some((item) => item[1] === promptId);
    return { status: running ? 'running' : 'queued', images: [], error: null };
  } catch (err) {
    return { status: 'queued', images: [], error: null };
  }
}

async function view({ filename, subfolder, type }) {
  if (isMagnific()) return magnific.view({ filename });
  if (isRouter() && routerImages.has(filename)) {
    const img = routerImages.get(filename);
    return new Response(img.buf, { headers: { 'content-type': img.type } });
  }
  if (isKie() || isFal() || isRouter()) {
    // The generated image is a plain link on the provider's storage. No key is sent to it.
    if (!kieImages.has(filename)) throw new Error('Unknown image.');
    return fetch(filename, { signal: AbortSignal.timeout(30000) });
  }
  const qs = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  if (!isCloud()) return fetch(`${base()}/view?${qs}`, { signal: AbortSignal.timeout(30000) });

  // Comfy Cloud answers with a redirect to a signed storage link.
  // That link is fetched WITHOUT the API key, which must not leave for another host.
  const first = await fetch(endpoint(`/view?${qs}`), { headers: authHeaders(), redirect: 'manual', signal: AbortSignal.timeout(30000) });
  if (first.status >= 300 && first.status < 400) {
    const location = first.headers.get('location');
    if (!location) throw new Error('Comfy Cloud sent a redirect without a destination.');
    return fetch(new URL(location, base()).href, { signal: AbortSignal.timeout(30000) });
  }
  return first;
}

async function interrupt() {
  if (isMagnific() || isKie() || isFal() || isRouter()) return; // these tasks are not cancelled from here
  await fetch(endpoint('/interrupt'), { method: 'POST', headers: authHeaders(), signal: AbortSignal.timeout(5000) });
}

module.exports = { ping, inject, queue, job, view, interrupt, base, mode, collectImages, balance, withProvider, takesImages, uploadImages, PROVIDERS };
