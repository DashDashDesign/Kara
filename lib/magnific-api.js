'use strict';
// How to ask Magnific for an image, per model. Shared by lib/magnific.js (local server)
// and worker/index.js (Cloudflare), so both versions talk to Magnific the same way.
// Docs: https://docs.magnific.com/llms-full.txt (one page per model, each with its OpenAPI description)

// Each model: its route (and the route that takes reference images), how it names the aspect ratio,
// the resolution and the reference images, and what else it needs. Read on docs.magnific.com (29/10),
// from the OpenAPI description of each endpoint.
const NAMED = ['square_1_1', 'classic_4_3', 'traditional_3_4', 'widescreen_16_9', 'social_story_9_16', 'film_horizontal_21_9', 'standard_3_2', 'portrait_2_3', 'horizontal_2_1', 'banner_3_1'];
const SEEDREAM = ['square_1_1', 'widescreen_16_9', 'social_story_9_16', 'portrait_2_3', 'traditional_3_4', 'standard_3_2', 'classic_4_3', 'cinematic_21_9'];
// "widescreen_16_9" -> "16:9"; "4:5" stays "4:5".
const byRatio = (names) => Object.fromEntries(names.map((n) => [/^\d+:\d+$/.test(n) ? n : n.replace(/^.*_(\d+)_(\d+)$/, '$1:$2'), n]));
const GEMINI = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const UPPER = { '1k': '1K', '2k': '2K', '4k': '4K' };

const MODELS = {
  'z-image-turbo': {
    route: '/v1/ai/text-to-image/z-image',
    sizeField: 'image_size',
    sizes: { '1:1': 'square_hd', '3:4': 'portrait_3_4', '9:16': 'portrait_9_16', '4:3': 'landscape_4_3', '16:9': 'landscape_16_9' },
    maxRefs: 0,
    seed: true,
    extra: { output_format: 'png' },
  },
  // Google: reference images as { image, mime_type }, resolution in capitals, no seed.
  'nano-banana-pro': {
    route: '/v1/ai/text-to-image/nano-banana-pro',
    sizeField: 'aspect_ratio',
    sizes: byRatio(GEMINI),
    maxRefs: 14,
    refs: 'objects',
    resolution: UPPER,
  },
  'nano-banana-2-1': {
    route: '/v1/ai/text-to-image/nano-banana-2-1',
    sizeField: 'aspect_ratio',
    sizes: byRatio([...GEMINI, '1:4', '4:1']),
    maxRefs: 14,
    refs: 'objects',
    resolution: UPPER,
  },
  // Called "Nano Banana Pro Flash" by Magnific: the Nano Banana 2 of the app.
  'nano-banana-2': {
    route: '/v1/ai/text-to-image/nano-banana-pro-flash',
    sizeField: 'aspect_ratio',
    sizes: byRatio(GEMINI),
    maxRefs: 14,
    refs: 'objects',
    resolution: UPPER,
  },
  // The first Nano Banana (Gemini 2.5 Flash Image): prompt and up to 3 images, nothing else.
  'nano-banana': {
    route: '/v1/ai/gemini-2-5-flash-image-preview',
    maxRefs: 3,
    refs: 'strings',
  },
  // OpenAI: a separate route for editing with images, named ratios, quality tier.
  'gpt-image-2': {
    route: '/v1/ai/text-to-image/gpt-image-2',
    editRoute: '/v1/ai/text-to-image/gpt-image-2-edit',
    sizeField: 'aspect_ratio',
    sizes: byRatio(NAMED),
    maxRefs: 16,
    refs: 'strings',
    resolution: { '1k': '1k', '2k': '2k', '4k': '4k' },
    extra: { quality: 'medium', output_format: 'png' },
  },
  'gpt-image-2-5-flare': {
    route: '/v1/ai/text-to-image/gpt-image-2-5',
    editRoute: '/v1/ai/text-to-image/gpt-image-2-5-edit',
    sizeField: 'aspect_ratio',
    sizes: byRatio(NAMED),
    maxRefs: 16,
    refs: 'strings',
    resolution: { '1k': '1k', '2k': '2k', '4k': '4k' },
    extra: { variant: 'flare', quality: 'medium', output_format: 'png' },
  },
  'gpt-image-2-5-sunburst': {
    route: '/v1/ai/text-to-image/gpt-image-2-5',
    editRoute: '/v1/ai/text-to-image/gpt-image-2-5-edit',
    sizeField: 'aspect_ratio',
    sizes: byRatio(NAMED),
    maxRefs: 16,
    refs: 'strings',
    resolution: { '1k': '1k', '2k': '2k', '4k': '4k' },
    extra: { variant: 'sunburst', quality: 'medium', output_format: 'png' },
  },
  // ByteDance: separate editing route, named ratios, seed.
  'seedream-5-pro': {
    route: '/v1/ai/text-to-image/seedream-v5-pro',
    editRoute: '/v1/ai/text-to-image/seedream-v5-pro-edit',
    sizeField: 'aspect_ratio',
    sizes: byRatio(SEEDREAM),
    maxRefs: 10,
    refs: 'strings',
    resolution: { '1.5k': '1.5k', '2k': '2k' },
    seed: true,
  },
  'seedream-5-lite': {
    route: '/v1/ai/text-to-image/seedream-v5-lite',
    editRoute: '/v1/ai/text-to-image/seedream-v5-lite-edit',
    sizeField: 'aspect_ratio',
    sizes: byRatio(SEEDREAM),
    maxRefs: 5,
    refs: 'strings',
    seed: true,
  },
  // Ideogram 4.5: text only in the app (its images field edits the first image).
  'ideogram-4-5': {
    route: '/v1/ai/text-to-image/ideogram-4-5',
    sizeField: 'aspect_ratio',
    sizes: byRatio(['1:1', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2', '9:16', '16:9', '1:2', '2:1', '1:3', '3:1']),
    maxRefs: 0,
    seedMax: 2147483647,
    seed: true,
    extra: { quality: 'medium' },
  },
};
const DEFAULT = 'z-image-turbo';

function modelOf(id) {
  return MODELS[id] ? id : DEFAULT;
}

// Closest size the model offers, by aspect ratio.
function pickSize(modelId, width, height) {
  const sizes = MODELS[modelOf(modelId)].sizes;
  const want = Math.log(width / height);
  let best = null;
  let bestD = Infinity;
  for (const [ratio, name] of Object.entries(sizes)) {
    const [w, h] = ratio.split(':').map(Number);
    const d = Math.abs(Math.log(w / h) - want);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

// Only real PNG or JPEG data URLs, at most 6 MB each; Magnific takes the bare base64 part.
const DATA_URL = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+=*)$/;
function cleanRefs(refs, max) {
  if (!Array.isArray(refs)) return [];
  const out = [];
  for (const r of refs) {
    if (out.length >= max) break;
    const m = typeof r === 'string' && r.length < 8_000_000 ? DATA_URL.exec(r) : null;
    if (m) out.push({ data: m[2], mime: `image/${m[1]}` });
  }
  return out;
}

// The request for one image. Throws a readable error when the model cannot do it.
function request(modelId, { prompt, seed, width, height, resolution, refs }) {
  const id = modelOf(modelId);
  const m = MODELS[id];
  const images = cleanRefs(refs, m.maxRefs);
  const edit = images.length > 0 && !!m.editRoute;
  const body = { prompt: String(prompt).slice(0, 4096) };
  if (m.seed) body.seed = Math.min(seed, m.seedMax || 4294967295);
  if (m.sizeField) body[m.sizeField] = pickSize(id, width, height);
  if (m.resolution && m.resolution[resolution]) body.resolution = m.resolution[resolution];
  Object.assign(body, m.extra || {});
  if (images.length) body.reference_images = m.refs === 'objects' ? images.map((i) => ({ image: i.data, mime_type: i.mime })) : images.map((i) => i.data);
  return { model: id, route: edit ? m.editRoute : m.route, edit, body };
}

// Our job id carries the model, and "+edit" when the editing route was used, so polling knows which
// route to ask: "seedream-5-pro+edit:<task id>". Old ids without a model still go to Z-Image.
function jobId(modelId, taskId, edit) {
  return `${modelOf(modelId)}${edit ? '+edit' : ''}:${taskId}`;
}

function parseJobId(id) {
  const at = String(id).indexOf(':');
  const head = at > 0 ? String(id).slice(0, at) : '';
  const [model, kind] = head.split('+');
  if (MODELS[model]) return { route: kind === 'edit' && MODELS[model].editRoute ? MODELS[model].editRoute : MODELS[model].route, taskId: String(id).slice(at + 1) };
  return { route: MODELS[DEFAULT].route, taskId: String(id) };
}

const PING_ROUTE = MODELS[DEFAULT].route;

module.exports = { MODELS, request, jobId, parseJobId, pickSize, PING_ROUTE };
