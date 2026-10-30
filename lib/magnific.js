'use strict';
// Magnific API (Z-Image Turbo). Used when COMFY_MODE=magnific.
// What each model expects lives in lib/magnific-api.js, shared with the Worker.
// The key stays in this process, sent only to Magnific in the x-magnific-api-key header.
// Docs: https://docs.magnific.com/api-reference/text-to-image/post-z-image

const BASE = () => (process.env.MAGNIFIC_URL || 'https://api.magnific.com').replace(/\/+$/, '');
const api = require('./magnific-api');
const NIL_ID = '00000000-0000-0000-0000-000000000000';

// Image URLs that Magnific gave us. Only these can be fetched through /api/image.
const allowed = new Set();

function apiKey() {
  return (process.env.MAGNIFIC_API_KEY || '').trim();
}

const NO_KEY = 'No Magnific API key. Put MAGNIFIC_API_KEY=... in the .env file, then restart the app.';

function headers(extra = {}) {
  return { 'x-magnific-api-key': apiKey(), ...extra };
}

function problem(status) {
  if (status === 401 || status === 403) return { code: 'badkey', message: 'Magnific refused the API key. Check MAGNIFIC_API_KEY in the .env file.' };
  if (status === 402 || status === 429) return { code: 'credits', message: 'Magnific says there are not enough credits, or too many requests. Check your Magnific balance.' };
  return null;
}

async function ping() {
  const base = BASE();
  if (!apiKey()) return { ok: false, mode: 'magnific', url: base, code: 'nokey', error: NO_KEY };
  try {
    // No free "who am I" call is documented, so ask for a task that cannot exist:
    // a valid key gets "not found", a wrong key gets 401.
    const res = await fetch(`${base}${api.PING_ROUTE}/${NIL_ID}`, { headers: headers(), signal: AbortSignal.timeout(8000) });
    const p = problem(res.status);
    if (p && p.code === 'badkey') return { ok: false, mode: 'magnific', url: base, code: p.code, error: p.message };
    if (res.status >= 500) return { ok: false, mode: 'magnific', url: base, code: 'http', error: `Magnific answered HTTP ${res.status}` };
    return { ok: true, mode: 'magnific', url: base, device: 'Magnific' };
  } catch (err) {
    return { ok: false, mode: 'magnific', url: base, code: 'unreachable', error: `Cannot reach Magnific at ${base}. Check your internet connection.` };
  }
}

async function queue({ prompt, seed, width, height, model, resolution, refs }) {
  if (!apiKey()) throw new Error(NO_KEY);
  const ask = api.request(model, { prompt, seed, width, height, resolution, refs });
  let res;
  try {
    res = await fetch(`${BASE()}${ask.route}`, {
      method: 'POST',
      headers: headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(ask.body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    throw new Error(`Cannot reach Magnific at ${BASE()}. Check your internet connection.`);
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

async function job(id) {
  const { route, taskId } = api.parseJobId(id);
  const res = await fetch(`${BASE()}${route}/${encodeURIComponent(taskId)}`, { headers: headers(), signal: AbortSignal.timeout(10000) });
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
      const images = (data.generated || []).filter((u) => typeof u === 'string' && (/^https:\/\//.test(u) || /^http:\/\/127\.0\.0\.1/.test(u)));
      images.forEach((u) => allowed.add(u));
      return { status: 'done', images: images.map((u) => ({ filename: u, subfolder: '', type: 'url' })), error: null };
    }
    default:
      return { status: 'queued', images: [], error: null };
  }
}

// The generated image is a plain link on Magnific's storage. No key is sent to it.
async function view({ filename }) {
  if (!allowed.has(filename)) throw new Error('Unknown image.');
  return fetch(filename, { signal: AbortSignal.timeout(30000) });
}

module.exports = { ping, queue, job, view, base: BASE };
