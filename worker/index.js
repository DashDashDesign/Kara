// Kara on Cloudflare Workers.
// Serves the page from ./public and the same /api routes as server.js.
// Open to everyone: each visitor brings their own Comfy (Comfy Router), KIE, fal or Magnific key, sent with each request only.
// The Worker keeps no provider key. One optional secret, LINK_SECRET (or the older APP_PASSWORD),
// signs the image links; without it, a random key per Worker instance is used.

import { buildPrompt } from '../lib/prompt.js';
import options from '../data/options.json';
import presets from '../data/presets.json';
import models from '../data/models.json';
import pkg from '../package.json';
import { resolveSize, refModeOf, packRefs } from '../lib/models.js';
import api from '../lib/magnific-api.js';
import kie from '../lib/kie.js';
import fal from '../lib/fal.js';
import router from '../lib/router.js';

const NIL_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_WORKFLOW = 'zimage_turbo_t2i.api.json';
const NO_KEY = 'No Magnific API key. Add yours in Keys.';


const encoder = new TextEncoder();

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const base = (env) => (env.MAGNIFIC_URL || 'https://api.magnific.com').replace(/\/+$/, '');
const apiKey = (env) => (env.MAGNIFIC_API_KEY || '').trim();
const headers = (env, extra = {}) => ({ 'x-magnific-api-key': apiKey(env), ...extra });


function problem(status) {
  if (status === 401 || status === 403) return { code: 'badkey', message: 'Magnific refused the API key. Check the MAGNIFIC_API_KEY secret.' };
  if (status === 402 || status === 429) return { code: 'credits', message: 'Magnific says there are not enough credits, or too many requests. Check your Magnific balance.' };
  return null;
}

// Same-length hex digests are compared in constant time.
async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

async function sameText(a, b) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Key that signs image links: the LINK_SECRET secret (or the older APP_PASSWORD), else random for this instance.
// (Workers forbid random values at load time, so it is made on first use.)
let instanceKey = null;
const linkSecret = (env) => env.LINK_SECRET || env.APP_PASSWORD || (instanceKey ||= crypto.getRandomValues(new Uint8Array(32)).join('.'));

// Image links are signed so /api/image can only fetch what Magnific, KIE or fal returned.
async function sign(env, text) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(linkSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function ping(env) {
  const url = base(env);
  if (!apiKey(env)) return { ok: false, mode: 'magnific', url, code: 'nokey', error: NO_KEY };
  try {
    // A task that cannot exist: a valid key gets "not found", a wrong key gets 401.
    const res = await fetch(`${url}${api.PING_ROUTE}/${NIL_ID}`, { headers: headers(env), signal: AbortSignal.timeout(8000) });
    const p = problem(res.status);
    if (p && p.code === 'badkey') return { ok: false, mode: 'magnific', url, code: p.code, error: p.message };
    if (res.status >= 500) return { ok: false, mode: 'magnific', url, code: 'http', error: `Magnific answered HTTP ${res.status}` };
    return { ok: true, mode: 'magnific', url, device: 'Magnific' };
  } catch (err) {
    return { ok: false, mode: 'magnific', url, code: 'unreachable', error: `Cannot reach Magnific at ${url}.` };
  }
}

async function queue(env, { prompt, seed, width, height, model, resolution, refs }) {
  if (!apiKey(env)) throw new Error(NO_KEY);
  const ask = api.request(model, { prompt, seed, width, height, resolution, refs });
  let res;
  try {
    res = await fetch(`${base(env)}${ask.route}`, {
      method: 'POST',
      headers: headers(env, { 'content-type': 'application/json' }),
      body: JSON.stringify(ask.body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    throw new Error(`Cannot reach Magnific at ${base(env)}.`);
  }
  const body = await res.json().catch(() => null);
  const p = problem(res.status);
  if (p) throw new Error(p.message);
  if (!res.ok) {
    const extra = body && body.invalid_params ? ` (${JSON.stringify(body.invalid_params)})` : '';
    throw new Error(`Magnific refused the job: ${(body && body.message) || `HTTP ${res.status}`}${extra}`);
  }
  const id = body && body.data && body.data.task_id;
  if (!id) throw new Error('Magnific did not return a task id.');
  return api.jobId(ask.model, id, ask.edit);
}

async function job(env, id) {
  const { route, taskId } = api.parseJobId(id);
  const res = await fetch(`${base(env)}${route}/${encodeURIComponent(taskId)}`, { headers: headers(env), signal: AbortSignal.timeout(10000) });
  const p = problem(res.status);
  if (p) return { status: 'error', images: [], error: p.message };
  if (!res.ok) return { status: 'queued', images: [], error: null };
  const data = ((await res.json()).data) || {};
  switch (data.status) {
    case 'IN_PROGRESS':
      return { status: 'running', images: [], error: null };
    case 'FAILED':
      return { status: 'error', images: [], error: 'Magnific could not generate this image. Try another seed or a different description.' };
    case 'COMPLETED': {
      const urls = (data.generated || []).filter((u) => typeof u === 'string' && (/^https:\/\//.test(u) || /^http:\/\/127\.0\.0\.1/.test(u)));
      const images = [];
      for (const u of urls) {
        const sig = await sign(env, u);
        images.push({ filename: u.split('?')[0].split('/').pop() || 'character.png', subfolder: '', type: 'url', url: `/api/image?${new URLSearchParams({ u, sig })}` });
      }
      return { status: 'done', images, error: null };
    }
    default:
      return { status: 'queued', images: [], error: null };
  }
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 40_000_000) throw new Error('Request too large');
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error('Invalid JSON');
  }
}

// Prompt from the menus; size from the sheet layout, or from "advanced render" when set.
function promptAndSize(body, provider) {
  const packed = packRefs(models, body, provider);
  const built = buildPrompt(options, body.selection, body.extra, refModeOf(models, body, provider), packed.counts);
  const size = resolveSize(models, body.model, provider, body.render, built.width, built.height);
  return { prompt: built.prompt, width: size.width, height: size.height, resolution: size.resolution, model: size.model, refs: packed.refs };
}

async function handleApi(request, env, url) {
  // The visitor picks a provider (header x-user-provider) and may send their own key (x-user-key).
  // Their key wins over the Worker's secret, for this request only. It lives in this request's copy of env:
  // never stored, never logged, never sent back, never shared between requests.
  const wanted = request.headers.get('x-user-provider');
  const provider = ['kie', 'fal', 'router'].includes(wanted) ? wanted : 'magnific';
  const own = (request.headers.get('x-user-key') || request.headers.get('x-user-magnific-key') || '').trim().slice(0, 200);
  // Only the visitor's key is used: any provider key left in the Worker's secrets is ignored.
  env = { ...env, MAGNIFIC_API_KEY: '', KIE_API_KEY: '', FAL_KEY: '', [{ kie: 'KIE_API_KEY', fal: 'FAL_KEY', magnific: 'MAGNIFIC_API_KEY' }[provider]]: own };
  const fc = fal.client({ key: (env.FAL_KEY || '').trim(), queue: env.FAL_QUEUE_URL || fal.QUEUE, api: env.FAL_API_URL || fal.API });
  const rc = router.client({ key: provider === 'router' ? own : '', api: env.COMFY_ROUTER_URL || router.API });
  const kc = kie.client({ key: (env.KIE_API_KEY || '').trim(), api: env.KIE_URL || kie.API, upload: env.KIE_UPLOAD_URL || kie.UPLOAD });
  const route = url.pathname;
  const method = request.method;

  if (method === 'GET' && route === '/api/config') {
    const settings = { editable: false, byok: true, provider, providers: ['router', 'kie', 'fal', 'magnific'], hasServerKey: { router: false, magnific: !!(env.MAGNIFIC_API_KEY || '').trim(), kie: !!(env.KIE_API_KEY || '').trim(), fal: !!(env.FAL_KEY || '').trim() } };
    return json(200, { options, presets, models, settings, workflows: [DEFAULT_WORKFLOW], defaultWorkflow: DEFAULT_WORKFLOW, comfyUrl: base(env), mode: provider, version: pkg.version });
  }
  // Balance of the provider named in x-user-provider, with the visitor's key or the site key. Magnific's API has none.
  if (method === 'GET' && route === '/api/balance') {
    const b = provider === 'kie' ? await kc.balance() : provider === 'fal' ? await fc.balance() : provider === 'router' ? await rc.balance() : { error: 'unsupported' };
    return json(200, { provider, ...b });
  }
  if (method === 'GET' && route === '/api/status') return json(200, provider === 'kie' ? await kc.ping() : provider === 'fal' ? await fc.ping() : provider === 'router' ? await rc.ping() : await ping(env));

  if (method === 'POST' && route === '/api/preview') {
    const body = await readBody(request);
    const { prompt, width, height } = promptAndSize(body, provider);
    return json(200, { prompt, width, height });
  }

  if (method === 'POST' && route === '/api/generate') {
    const body = await readBody(request);
    const { prompt, width, height, resolution, model, refs } = promptAndSize(body, provider);
    const seed = Number.isInteger(body.seed) && body.seed >= 0 ? body.seed : Math.floor(Math.random() * 2 ** 32);
    const ask = { prompt, seed, width, height, model, resolution, refs };
    const promptId = provider === 'kie' ? await kc.queue(ask) : provider === 'fal' ? await fc.queue(ask) : provider === 'router' ? await rc.queue(ask) : await queue(env, ask);
    return json(200, { promptId, seed, prompt, width, height });
  }

  if (method === 'GET' && route === '/api/job') {
    const id = url.searchParams.get('id') || '';
    if (!id) return json(400, { error: 'Missing id.' });
    if (id.startsWith('kie:') || id.startsWith('fal:') || id.startsWith('router:')) {
      const r = await (id.startsWith('fal:') ? fc : id.startsWith('router:') ? rc : kc).job(id);
      if (r.status !== 'done') return json(200, { status: r.status, images: [], error: r.error });
      const images = [];
      for (const u of r.urls) {
        const sig = await sign(env, u);
        images.push({ filename: u.split('?')[0].split('/').pop() || 'character.png', subfolder: '', type: 'url', url: `/api/image?${new URLSearchParams({ u, sig })}` });
      }
      // Comfy Router sends some images as bytes (Nano Banana, GPT Image): the Worker keeps nothing, so they go to the page as they are.
      for (const img of r.inline || []) {
        const ext = String(img.type).split('/')[1] || 'png';
        images.push({ filename: `character.${ext}`, subfolder: '', type: 'url', url: `data:${img.type};base64,${img.data}` });
      }
      return json(200, { status: 'done', images, error: null });
    }
    return json(200, await job(env, id));
  }

  if (method === 'GET' && route === '/api/image') {
    const target = url.searchParams.get('u') || '';
    const sig = url.searchParams.get('sig') || '';
    if (!target || !(await sameText(sig, await sign(env, target)))) return json(400, { error: 'Unknown image.' });
    const upstream = await fetch(target, { signal: AbortSignal.timeout(30000) });
    if (!upstream.ok) return json(upstream.status, { error: 'Image not found.' });
    return new Response(upstream.body, {
      headers: { 'content-type': upstream.headers.get('content-type') || 'image/png', 'cache-control': 'private, max-age=3600' },
    });
  }

  // Magnific jobs cannot be cancelled; the page still expects the route.
  if (method === 'POST' && route === '/api/cancel') return json(200, { ok: true });

  return json(404, { error: 'Not found.' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json(500, { error: err.message || 'Server error.' });
      }
    }
    // The page and its scripts are always checked again, so a new version shows up on the next reload.
    const asset = await env.ASSETS.fetch(request);
    const res = new Response(asset.body, asset);
    res.headers.set('cache-control', 'no-cache');
    return res;
  },
};
