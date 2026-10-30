'use strict';
// Models and image sizes. Shared by the local server and the Worker.
// Default size comes from the sheet layout; "advanced render" may pick a ratio and a resolution
// among those the model offers with the current engine (local ComfyUI, Comfy Cloud or Magnific).

function engineOf(models, modelId, mode) {
  const model = models.models.find((m) => m.id === modelId && !m.soon) || models.models.find((m) => m.id === models.default);
  const engine = model && model.engines ? model.engines[mode] : null;
  return { model, engine };
}

function ratiosOf(models, engine) {
  if (!engine) return [];
  return engine.ratios === 'all' ? models.ratios : models.ratios.filter((r) => engine.ratios.includes(r.id));
}

// Width and height, multiples of 16, for a ratio and an area in megapixels.
function dims(ratio, mp) {
  const area = mp * 1024 * 1024;
  const w = Math.sqrt((area * ratio.w) / ratio.h);
  const round = (n) => Math.max(256, Math.round(n / 16) * 16);
  return [round(w), round(area / w)];
}

// render: { ratio: '16:9' | 'auto', resolution: '1mp' } or nothing. Unknown values fall back to the layout size.
function resolveSize(models, modelId, mode, render, width, height) {
  const { model, engine } = engineOf(models, modelId, mode);
  return sizeFor(models, model, engine, render, width, height);
}

function sizeFor(models, model, engine, render, width, height) {
  const out = { model: model ? model.id : null, width, height };
  if (!render || !engine) return out;
  const res = engine.resolutions.find((r) => r.id === render.resolution);
  // Ratio "auto": the sheet layout's proportions, at the chosen resolution.
  if (!render.ratio || render.ratio === 'auto') {
    if (!res) return out;
    [out.width, out.height] = dims({ w: width, h: height }, res.mp);
    out.resolution = res.id;
    return out;
  }
  const ratio = ratiosOf(models, engine).find((r) => r.id === render.ratio);
  if (!ratio) return out;
  const chosen = res || engine.resolutions[0];
  [out.width, out.height] = dims(ratio, chosen.mp);
  out.resolution = chosen.id;
  return out;
}

// All reference images of a request, in the order they are sent: starting images, the face drawing (guide), then outfit, accessories, style (look),
// cut to what the model takes (starting images keep priority). For a preview the page sends counts, not images.
// mode: the provider; its engine may take fewer images than the model (maxRefs 0: text only, like a local workflow).
function maxRefsOf(model, mode) {
  if (!model || !model.refs) return 0;
  const engine = mode && model.engines ? model.engines[mode] : null;
  return engine && engine.maxRefs !== undefined ? engine.maxRefs : model.maxRefs || 4;
}

function packRefs(models, body, mode) {
  const model = models.models.find((m) => m.id === body.model && !m.soon);
  const max = maxRefsOf(model, mode);
  const group = (body.groupRefs && typeof body.groupRefs === 'object') ? body.groupRefs : {};
  const lists = {
    main: Array.isArray(body.refs) ? body.refs : [],
    guide: typeof body.guide === 'string' ? [body.guide] : [],
    outfit: Array.isArray(group.outfit) ? group.outfit : [],
    accessories: Array.isArray(group.accessories) ? group.accessories : [],
    look: Array.isArray(group.look) ? group.look : [],
  };
  const wanted = {};
  for (const k of Object.keys(lists)) {
    const n = body.refCounts && Number.isInteger(body.refCounts[k]) ? body.refCounts[k] : lists[k].length;
    wanted[k] = Math.max(0, Math.min(n, k === 'guide' ? 1 : 20));
  }
  const counts = { main: 0, guide: 0, outfit: 0, accessories: 0, look: 0 };
  const refs = [];
  let room = max;
  for (const k of ['main', 'guide', 'outfit', 'accessories', 'look']) {
    counts[k] = Math.min(wanted[k], room);
    room -= counts[k];
    refs.push(...lists[k].slice(0, counts[k]));
  }
  return { refs, counts };
}

// Reference images change the prompt only for a model that takes them.
// The page sends hasRefs for the preview, and the images themselves to generate.
function refModeOf(models, body, mode) {
  const model = models.models.find((m) => m.id === body.model && !m.soon);
  const counts = packRefs(models, body, mode).counts;
  const hasRefs = counts.main > 0 || (body.hasRefs === true && maxRefsOf(model, mode) > 0);
  if (!model || !hasRefs) return null;
  return body.refMode === 'inspire' ? 'inspire' : 'sheet';
}

module.exports = { resolveSize, refModeOf, packRefs, maxRefsOf, ratiosOf, engineOf };
