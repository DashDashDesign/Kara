'use strict';
// Measures how long one image takes with each model and provider, and writes it as "secs" in data/models.json
// (shown under each model in the models window). One image per model and provider, 1024 x 1024, text only.
// Keys from .env. The images are kept in notes/timings/ (not in the repository).
//   node tools/timings.js fal kie router      the providers to measure (default: these three)
//   node tools/timings.js magnific            Magnific, on its own (costs credits: about 625 for everything)
//   node tools/timings.js fal --only flux-3   one model
//   add --redo to measure again what is already in results.json (KIE: also writes the credits each image cost)
// Providers run side by side, the images of one provider one after the other. Results already in
// notes/timings/results.json are not made again (delete a line to redo it).
// Costs real money: fal is about 1 $ for everything, KIE and Comfy Router are billed from their own balances.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
require('../lib/env').load();
const fal = require('../lib/fal');
const kie = require('../lib/kie');
const router = require('../lib/router');
const magnific = require('../lib/magnific');
const { buildPrompt } = require('../lib/prompt');

const OUT = path.join(ROOT, 'notes', 'timings');
// Magnific runs alone (own file), so two runs side by side never overwrite each other's results.
const RESULTS_FILES = ['results.json', 'results-magnific.json'].map((n) => path.join(OUT, n));
const MODELS_FILE = path.join(ROOT, 'data', 'models.json');
const options = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'options.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const redo = args.includes('--redo');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const wanted = args.filter((a) => ['fal', 'kie', 'router', 'magnific'].includes(a));
const providers = wanted.length ? wanted : ['fal', 'kie', 'router'];
const RESULTS = RESULTS_FILES[providers.length === 1 && providers[0] === 'magnific' ? 1 : 0];

const prompt = buildPrompt(options, { ...options.defaults, layout: 'portrait', look: 'photo', background: 'lightgrey' }, '', null, null).prompt;

function clientFor(provider) {
  if (provider === 'fal') return fal.client({ key: (process.env.FAL_KEY || '').trim(), queue: process.env.FAL_QUEUE_URL || fal.QUEUE });
  if (provider === 'kie') return kie.client({ key: (process.env.KIE_API_KEY || '').trim(), api: process.env.KIE_URL || kie.API, upload: process.env.KIE_UPLOAD_URL || kie.UPLOAD });
  if (provider === 'magnific') {
    // Magnific takes its key from the environment; its answers are adapted to the shape of the others.
    return {
      queue: (ask) => magnific.queue(ask),
      job: async (id) => {
        const r = await magnific.job(id);
        return { status: r.status, urls: r.images.map((i) => i.filename), inline: [], error: r.error };
      },
    };
  }
  return router.client({ key: (process.env.COMFY_CLOUD_API_KEY || '').trim(), api: process.env.COMFY_ROUTER_URL || router.API });
}

const models = JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8')).models;
fs.mkdirSync(OUT, { recursive: true });
const results = fs.existsSync(RESULTS) ? JSON.parse(fs.readFileSync(RESULTS, 'utf8')) : {};
const save = () => fs.writeFileSync(RESULTS, `${JSON.stringify(results, null, 2)}\n`);

async function measure(provider, model) {
  const client = clientFor(provider);
  const engine = model.engines[provider];
  const res0 = (engine.resolutions || [])[0];
  const started = Date.now();
  const id = await client.queue({ prompt, seed: 20261031, width: 1024, height: 1024, model: model.id, resolution: res0 ? res0.id : '1k', format: provider === 'router' || provider === 'magnific' || model.id === 'ideogram-4-5' ? undefined : 'jpeg' });
  for (let i = 0; i < 600; i++) {
    await sleep(1000);
    const r = await client.job(id);
    if (r.status === 'error') throw new Error(r.error);
    if (r.status === 'done' && (r.urls.length || (r.inline && r.inline.length))) {
      const seconds = Math.round((Date.now() - started) / 100) / 10;
      let bytes;
      let type = 'image/png';
      if (r.urls.length) {
        const img = await fetch(r.urls[0], { signal: AbortSignal.timeout(60000) });
        if (!img.ok) throw new Error(`download failed (HTTP ${img.status})`);
        type = img.headers.get('content-type') || type;
        bytes = Buffer.from(await img.arrayBuffer());
      } else {
        type = r.inline[0].type;
        bytes = Buffer.from(r.inline[0].data, 'base64');
      }
      const ext = /webp/.test(type) ? 'webp' : /jpe?g/.test(type) ? 'jpg' : 'png';
      fs.writeFileSync(path.join(OUT, `${provider}-${model.id}.${ext}`), bytes);
      // KIE says what the task cost (in credits) and how long it computed: ask for it.
      let credits;
      let computed;
      if (provider === 'kie') {
        const taskId = String(id).replace(/^kie:/, '');
        const api = (process.env.KIE_URL || kie.API).replace(/\/+$/, '');
        try {
          const d = await fetch(`${api}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers: { authorization: `Bearer ${(process.env.KIE_API_KEY || '').trim()}` }, signal: AbortSignal.timeout(10000) }).then((x) => x.json());
          if (d && d.data) {
            if (Number.isFinite(Number(d.data.creditsConsumed))) credits = Number(d.data.creditsConsumed);
            if (Number.isFinite(Number(d.data.costTime))) computed = Number(d.data.costTime);
          }
        } catch (err) { /* the time is still good */ }
      }
      return { seconds, credits, computed };
    }
  }
  throw new Error('took more than 10 minutes');
}

async function runProvider(provider) {
  const list = models.filter((m) => m.engines && m.engines[provider] && (!only || m.id === only));
  for (const m of list) {
    const key = `${provider}/${m.id}`;
    // KIE entries without a cost (the first run did not ask for it) are made again.
    if (!redo && results[key] && results[key].seconds && (provider !== 'kie' || results[key].credits != null)) continue;
    try {
      const { seconds, credits, computed } = await measure(provider, m);
      results[key] = { seconds, credits, computed, at: new Date().toISOString() };
      console.log(`  ok  ${key}  ${seconds} s${credits != null ? `  ${credits} credits` : ''}`);
    } catch (err) {
      results[key] = { error: err.message, at: new Date().toISOString() };
      console.log(`  --  ${key}: ${err.message}`);
    }
    save();
  }
}

const allResults = Object.assign({}, ...RESULTS_FILES.filter((p) => fs.existsSync(p)).map((p) => JSON.parse(fs.readFileSync(p, 'utf8'))));

function writeModels() {
  const raw = fs.readFileSync(MODELS_FILE, 'utf8');
  const crlf = raw.includes('\r\n');
  const data = JSON.parse(raw);
  let n = 0;
  for (const m of data.models) {
    for (const p of providers) {
      const r = (results[`${p}/${m.id}`]) || (allResults[`${p}/${m.id}`]);
      if (m.engines && m.engines[p] && r && r.seconds) {
        m.engines[p].secs = Math.max(1, Math.round(r.seconds));
        // KIE's measured cost of one image at the first resolution, in credits (the shape the page reads: price[resolution]).
        if (p === 'kie' && r.credits != null && m.engines[p].resolutions && m.engines[p].resolutions[0]) {
          m.engines[p].price = { ...(typeof m.engines[p].price === 'object' ? m.engines[p].price : {}), [m.engines[p].resolutions[0].id]: r.credits };
        }
        n += 1;
      }
    }
  }
  const out = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(MODELS_FILE, crlf ? out.replace(/\n/g, '\r\n') : out);
  console.log(`${n} render time(s) written to data/models.json`);
}

(async () => {
  console.log(`Measuring: ${providers.join(', ')}`);
  await Promise.all(providers.map(runProvider));
  writeModels();
})();
