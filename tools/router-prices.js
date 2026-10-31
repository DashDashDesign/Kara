'use strict';
// Asks Comfy Router for the price of one image of each model, before running anything (free: nothing is charged),
// and writes it as "price" in the router engine of data/models.json.
//   node tools/router-prices.js
// Docs: https://docs.comfy.org/api-reference/router/comfy-router/price-a-model-call-before-running-it-without-running-it
// POST /v2/models/{provider}/{model}/estimate takes the model's own request body. The answer says "exact", "estimated"
// (a range: the top is kept) or "unknown" (nothing is written, an absent amount is never read as free).
// Key: COMFY_CLOUD_API_KEY in .env.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
require('../lib/env').load();
const router = require('../lib/router');

const FILE = path.join(ROOT, 'data', 'models.json');
const key = (process.env.COMFY_CLOUD_API_KEY || '').trim();
const base = (process.env.COMFY_ROUTER_URL || router.API).replace(/\/+$/, '');
if (!key) {
  console.log('No Comfy key (COMFY_CLOUD_API_KEY in .env).');
  process.exit(1);
}

const raw = fs.readFileSync(FILE, 'utf8');
const crlf = raw.includes('\r\n');
const data = JSON.parse(raw);

async function estimate(m, res) {
  const ask = router.MODELS[m.id];
  if (!ask) return { error: 'not in lib/router.js' };
  // One megapixel for 1k, four for 2k, and so on.
  const side = Math.round(1024 * Math.sqrt(res.mp || 1));
  const body = router.body(m.id, { prompt: 'A portrait photograph of a woman in a studio.', seed: 1, width: side, height: side, resolution: res.id, refs: [] });
  const r = await fetch(`${base}/v2/models/${ask.route}/estimate`, {
    method: 'POST',
    headers: { 'X-API-Key': key, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out) return { error: `HTTP ${r.status} ${out && (out.detail || out.error_type) ? JSON.stringify(out.detail || out.error_type) : ''}` };
  if (out.source === 'exact' || out.source === 'free') return { usd: Number(out.amount), source: out.source };
  if (out.source === 'estimated') return { usd: Number(out.max_amount), source: 'estimated' };
  return { error: `unknown price (${out.reason || ''})` };
}

(async () => {
  let n = 0;
  for (const m of data.models) {
    const engine = m.engines && m.engines.router;
    if (!engine) continue;
    const resolutions = engine.resolutions && engine.resolutions.length ? engine.resolutions : [{ id: '1k', mp: 1 }];
    const byRes = {};
    const notes = [];
    for (const res of resolutions) {
      try {
        const e = await estimate(m, res);
        if (e.error) notes.push(`${res.id}: ${e.error}`);
        else {
          byRes[res.id] = Math.round(e.usd * 100000) / 100000;
          if (e.source === 'estimated') notes.push(`${res.id}: estimated (top of the range)`);
        }
      } catch (err) {
        notes.push(`${res.id}: ${err.message}`);
      }
    }
    const ids = Object.keys(byRes);
    if (ids.length) {
      engine.price = ids.length === 1 && resolutions.length === 1 ? { usd: byRes[ids[0]] } : { usdByRes: byRes };
      n += 1;
    }
    console.log(`  ${ids.length ? 'ok' : '--'}  ${m.id}  ${JSON.stringify(byRes)}${notes.length ? `  ${notes.join('; ')}` : ''}`);
  }
  const out = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(FILE, crlf ? out.replace(/\n/g, '\r\n') : out);
  console.log(`${n} price(s) written to data/models.json`);
})();
