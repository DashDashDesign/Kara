'use strict';
// KIE API (kie.ai): one key, many models. Used when COMFY_MODE=kie, and by the Worker.
// Only plain fetch, so the same file runs in Node 18+ and on Cloudflare Workers.
// The key is sent only to KIE (Authorization: Bearer). Never to the browser, never to image links.
// Docs: https://docs.kie.ai/getting-started  https://docs.kie.ai/market/qwen2-1/image-to-image
//       https://docs.kie.ai/market/z-image/z-image  https://docs.kie.ai/file-upload-api/upload-file-base-64
//       https://docs.kie.ai/market/common/get-task-detail  https://docs.kie.ai/common-api/get-account-credits

const API = 'https://api.kie.ai';
const UPLOAD = 'https://kieai.redpandaai.co';

// Our model id -> what KIE expects (docs: https://docs.kie.ai/llms.txt, read 28 Oct 2026).
//   text / edit: KIE model names, edit is used when reference images are given (same name if it takes both)
//   refsField:   where the reference image links go; maxRefs: how many it takes
//   ratioField:  name of the ratio field (aspect_ratio unless said); ratios: the ones it knows
//   res:         the field that sets the size, and our resolution ids -> KIE values
//   seed:        takes a seed; extra: fixed fields
const K = (field, values) => ({ field, values });
const RES_124 = K('resolution', { '1k': '1K', '2k': '2K', '4k': '4K' });
const NB_RATIOS = ['1:1', '2:3', '3:2', '1:4', '4:1', '3:4', '4:3', '4:5', '5:4', '1:8', '8:1', '9:16', '16:9', '21:9'];
const GPT2_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '5:4', '4:5', '16:9', '9:16', '2:1', '1:2', '3:1', '1:3', '21:9', '9:21'];
const GPT25_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9', '27:16', '16:27', '9:8', '8:9'];
const SD5_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'];
const gpt = (name, ratios) => ({ text: `${name}-text-to-image`, edit: `${name}-image-to-image`, refsField: 'input_urls', ratios, res: RES_124, maxRefs: 16 });
const seedream = (name, res, maxRefs = 10) => ({ text: `seedream/${name}-text-to-image`, edit: `seedream/${name}-image-to-image`, refsField: 'image_urls', ratios: SD5_RATIOS, res, maxRefs, extra: { output_format: 'png' }, light: 'jpeg' });

// Qwen 3 Pro's names are not the pattern of the others: qwen3/pro-text-to-image (checked 31 Oct 2026).
const qwen3 = (text, edit) => ({ text, edit, refsField: 'image_urls', ratioField: 'image_size', ratios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'], res: K('resolution', { '1k': '1K', '2k': '2K' }), seed: true, maxRefs: 3, extra: { output_format: 'png', prompt_extend: false }, light: 'jpeg' });

const MODELS = {
  'z-image-turbo': { text: 'z-image', ratios: ['1:1', '4:3', '3:4', '16:9', '9:16'], maxRefs: 0 },
  'qwen-2-1': {
    text: 'qwen2-1/text-to-image',
    edit: 'qwen2-1/image-to-image',
    refsField: 'image_urls',
    ratios: ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', '9:21'],
    res: K('resolution', { '1k': '1K', '2k': '2K' }),
    seed: true,
    maxRefs: 10,
    extra: { output_format: 'png' },
  },
  // Qwen 3 and 3 Pro (docs read 29 Oct 2026): ratio in image_size, up to 3 images, prompt rewriting turned off.
  'qwen-3': qwen3('qwen3/text-to-image', 'qwen3/image-to-image'),
  'qwen-3-pro': qwen3('qwen3/pro-text-to-image', 'qwen3/pro-image-to-image'),
  'nano-banana': { text: 'google/nano-banana', edit: 'google/nano-banana-edit', refsField: 'image_urls', ratioField: 'image_size', ratios: ['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9'], maxRefs: 10, extra: { output_format: 'png' }, light: 'jpeg' },
  'nano-banana-2': { text: 'nano-banana-2', refsField: 'image_input', ratios: NB_RATIOS, res: RES_124, maxRefs: 10, extra: { output_format: 'png' }, light: 'jpg' },
  'nano-banana-2-1': { text: 'nano-banana-2-1', refsField: 'image_input', ratios: NB_RATIOS, res: RES_124, maxRefs: 10, extra: { output_format: 'png' }, light: 'jpg' },
  'nano-banana-2-lite': { text: 'nano-banana-2-lite', refsField: 'image_urls', ratios: NB_RATIOS, maxRefs: 10 },
  'nano-banana-pro': { text: 'nano-banana-pro', refsField: 'image_input', ratios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'], res: RES_124, maxRefs: 8, extra: { output_format: 'png' }, light: 'jpg' },
  'gpt-image-2': gpt('gpt-image-2', GPT2_RATIOS),
  'gpt-image-2-5-flare': gpt('gpt-image-2-5-flare', GPT25_RATIOS),
  'gpt-image-2-5-sunburst': gpt('gpt-image-2-5-sunburst', GPT25_RATIOS),
  'seedream-5-pro': seedream('5-pro', K('quality', { '1k': 'basic', '2k': 'high' })),
  'seedream-5-lite': seedream('5-lite', K('quality', { '2k': 'basic', '3k': 'high', '4k': 'ultra' }), 14),
  'seedream-5-flash': seedream('5-flash', K('size', { '1k': '1K', '1.5k': '1.5K', '2k': '2K' })),
  'flux-3-klein': {
    text: 'flux-3/klein-text-to-image',
    edit: 'flux-3/klein-edit-image',
    refsField: 'image_urls',
    ratios: ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', '9:21'],
    res: RES_124,
    seed: true,
    maxRefs: 10,
    extra: { output_format: 'png', enhance_prompt: false },
    light: 'jpeg',
  },
};

const has = (id) => Object.prototype.hasOwnProperty.call(MODELS, id);

// Closest ratio the model offers.
function pickRatio(modelId, width, height) {
  const want = Math.log(width / height);
  let best = MODELS[modelId].ratios[0];
  let bestD = Infinity;
  for (const r of MODELS[modelId].ratios) {
    const [w, h] = r.split(':').map(Number);
    const d = Math.abs(Math.log(w / h) - want);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

function problem(code, what) {
  if (code === 401 || code === 403) return { code: 'badkey', message: 'KIE refused the API key. Check your KIE key.' };
  if (code === 402) return { code: 'credits', message: 'Not enough KIE credits for this generation.' };
  if (code === 429) return { code: 'credits', message: 'KIE says there are too many requests. Wait a moment, then try again.' };
  return { code: 'http', message: `KIE could not ${what} (code ${code}).` };
}

// KIE answers HTTP 200 with an error code in the body: always read "code".
async function call(url, options, what) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw Object.assign(new Error('Cannot reach KIE. Check your internet connection.'), { code: 'unreachable' });
  }
  const body = await res.json().catch(() => null);
  const code = body && Number(body.code) ? Number(body.code) : res.status;
  if (code !== 200 || !res.ok) {
    const p = problem(code, what);
    const detail = body && body.msg && p.code === 'http' ? `: ${body.msg}` : '';
    throw Object.assign(new Error(`${p.message.replace(/\.$/, '')}${detail}.`), { code: p.code });
  }
  return body.data;
}

// key, api, upload: the KIE key and base URLs (the tests point them to a fake KIE).
function client({ key, api = API, upload = UPLOAD }) {
  const headers = (extra = {}) => ({ authorization: `Bearer ${key}`, ...extra });

  // A free call: the credit balance. A wrong key fails here, nothing is spent.
  async function ping() {
    if (!key) return { ok: false, mode: 'kie', url: api, code: 'nokey', error: 'No KIE API key.' };
    try {
      const credits = await call(`${api}/api/v1/chat/credit`, { headers: headers(), signal: AbortSignal.timeout(8000) }, 'read the balance');
      return { ok: true, mode: 'kie', url: api, device: `KIE · ${credits} credits`, credits: Number(credits) };
    } catch (err) {
      return { ok: false, mode: 'kie', url: api, code: err.code || 'http', error: err.message };
    }
  }

  // Reference images must be links: each one is uploaded to KIE's file storage first (deleted after 24 h).
  async function uploadRef(dataUrl, i) {
    const data = await call(
      `${upload}/api/file-base64-upload`,
      {
        method: 'POST',
        headers: headers({ 'content-type': 'application/json' }),
        body: JSON.stringify({ base64Data: dataUrl, uploadPath: 'kara', fileName: `reference-${Date.now()}-${i + 1}.jpg` }),
        signal: AbortSignal.timeout(60000),
      },
      'receive the reference image'
    );
    const url = data && (data.downloadUrl || data.fileUrl);
    if (!url) throw new Error('KIE did not return a link for the reference image.');
    return url;
  }

  // format 'jpeg' (tools/previews.js): a lighter file, for models that offer it (light: their name for it).
  async function queue({ prompt, seed, width, height, model, resolution, refs, format }) {
    if (!key) throw new Error('No KIE API key.');
    const id = has(model) ? model : 'z-image-turbo';
    const m = MODELS[id];
    const images = (Array.isArray(refs) ? refs : []).filter((r) => typeof r === 'string' && r.length < 40_000_000 && DATA_URL.test(r)).slice(0, m.maxRefs);
    const input = { prompt: String(prompt).slice(0, 4000), [m.ratioField || 'aspect_ratio']: pickRatio(id, width, height), ...(m.extra || {}) };
    if (m.seed) input.seed = Math.min(seed, 2147483647);
    if (m.res) {
      const values = m.res.values;
      input[m.res.field] = values[String(resolution).toLowerCase()] || values[Object.keys(values)[0]];
    }
    if (format === 'jpeg' && m.light) input.output_format = m.light;
    let kieModel = m.text;
    if (images.length && m.refsField) {
      input[m.refsField] = await Promise.all(images.map(uploadRef));
      kieModel = m.edit || m.text;
    }
    const data = await call(
      `${api}/api/v1/jobs/createTask`,
      { method: 'POST', headers: headers({ 'content-type': 'application/json' }), body: JSON.stringify({ model: kieModel, input }), signal: AbortSignal.timeout(30000) },
      'start the image'
    );
    if (!data || !data.taskId) throw new Error('KIE did not return a task id.');
    return `kie:${data.taskId}`;
  }

  async function job(id) {
    const taskId = String(id).replace(/^kie:/, '');
    let data;
    try {
      data = await call(`${api}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers: headers(), signal: AbortSignal.timeout(10000) }, 'read the task');
    } catch (err) {
      if (err.code === 'badkey' || err.code === 'credits') return { status: 'error', images: [], error: err.message };
      return { status: 'queued', images: [], error: null };
    }
    const state = data && data.state;
    if (state === 'fail') return { status: 'error', images: [], error: `KIE could not generate this image${data.failMsg ? `: ${data.failMsg}` : '.'}` };
    if (state === 'generating') return { status: 'running', images: [], error: null };
    if (state !== 'success') return { status: 'queued', images: [], error: null };
    let result = data.resultJson;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (err) {
        result = null;
      }
    }
    const urls = ((result && result.resultUrls) || []).filter((u) => typeof u === 'string' && (/^https:\/\//.test(u) || /^http:\/\/127\.0\.0\.1/.test(u)));
    return { status: 'done', urls, error: null };
  }

  async function balance() {
    const r = await ping();
    return r.ok ? { amount: r.credits, unit: 'credits' } : { error: r.code || 'http' };
  }

  return { ping, queue, job, balance };
}

module.exports = { client, MODELS, pickRatio, API, UPLOAD };
