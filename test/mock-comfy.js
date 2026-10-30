'use strict';
// A fake ComfyUI, only for trying the interface without a GPU and for automated tests.
// Run:  node test/mock-comfy.js          (listens on 8199)
// Then: COMFY_URL=http://127.0.0.1:8199 node server.js

const http = require('node:http');

const PORT = Number(process.env.MOCK_PORT || 8199);
const DELAY_MS = Number(process.env.MOCK_DELAY || 2500);
const FAIL = process.env.MOCK_FAIL === '1';

// 1 x 1 grey PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const CLOUD_KEY = 'test-key';
// MOCK_ACCOUNT: active (default), waitlisted, nocredits
const CLOUD_ACCOUNT = process.env.MOCK_ACCOUNT || 'active';

const jobs = new Map();
let last = null;
let lastBody = null;
let lastPath = null;
// Fake KIE state
let kieCredits = 1000;
let kieLast = null;
const uploads = [];
const kieUploads = [];
const kieJobs = new Map();
// Fake fal state
let falLast = null;
let falPath = null;
const falJobs = new Map();
// Fake Comfy Router state
let routerLast = null;
let routerPath = null;
let routerIdem = null;
const routerJobs = new Map();
let leakedKey = false;
let interrupted = 0;
let counter = 0;

function json(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // A fake GitHub for the updater: the latest version, and its archive (a tar.gz built here).
  const SHA = 'a'.repeat(40);
  if (req.method === 'GET' && url.pathname === '/repos/DashDashDesign/Kara/commits/main') {
    return json(res, 200, { sha: SHA, commit: { committer: { date: '2026-10-29T10:00:00Z' } } });
  }
  if (req.method === 'GET' && url.pathname === `/DashDashDesign/Kara/tar.gz/${SHA}`) {
    const block = (name, data, type = '0') => {
      const h = Buffer.alloc(512);
      h.write(name, 0);
      h.write('0000644\0', 100);
      h.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124);
      h.write(type, 156);
      h.write('ustar\0', 257);
      h.fill(' ', 148, 156);
      let sum = 0;
      for (const b of h) sum += b;
      h.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
      return Buffer.concat([h, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
    };
    const tar = Buffer.concat([
      block('pax_global_header', Buffer.from('52 comment=aaaa\n'), 'g'),
      block('kara-aaaa/server.js', Buffer.from('// new server\n')),
      block('kara-aaaa/public/app.js', Buffer.from('// new page\n')),
      block('kara-aaaa/.env', Buffer.from('STOLEN=1\n')),
      block('kara-aaaa/../outside.txt', Buffer.from('no\n')),
      Buffer.alloc(1024),
    ]);
    res.writeHead(200, { 'content-type': 'application/gzip' });
    return res.end(require('zlib').gzipSync(tar));
  }

  // Model folders, as ComfyUI lists them, and where they are on disk (MOCK_COMFY_DIR); a fake model download.
  const folderMatch = url.pathname.match(/^\/models\/([a-z_]+)$/);
  if (req.method === 'GET' && folderMatch) {
    const dir = process.env.MOCK_COMFY_DIR ? require('path').join(process.env.MOCK_COMFY_DIR, 'models', folderMatch[1]) : null;
    return json(res, 200, dir && require('fs').existsSync(dir) ? require('fs').readdirSync(dir).filter((f) => !f.endsWith('.part')) : []);
  }
  if (req.method === 'GET' && url.pathname === '/internal/folder_paths') {
    if (!process.env.MOCK_COMFY_DIR) return json(res, 404, {});
    const p = (f) => [require('path').join(process.env.MOCK_COMFY_DIR, 'models', f)];
    return json(res, 200, { diffusion_models: p('diffusion_models'), text_encoders: p('text_encoders'), vae: p('vae'), model_patches: p('model_patches') });
  }
  if (req.method === 'GET' && url.pathname.startsWith('/hf/')) {
    const body = Buffer.from(`fake weights for ${url.pathname}`);
    res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': body.length });
    return res.end(body);
  }
  if (req.method === 'GET' && url.pathname === '/system_stats') {
    return json(res, 200, { devices: [{ name: 'Mock GPU (no real generation)' }] });
  }

  // Reference images sent before an editing workflow; only the names are kept.
  if (req.method === 'POST' && url.pathname === '/upload/image') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('latin1');
      const m = /filename="([^"]+)"/.exec(text);
      uploads.push(m ? m[1] : '?');
      json(res, 200, { name: m ? m[1] : 'upload.png', subfolder: '', type: 'input' });
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/__uploads') return json(res, 200, uploads);

  if (req.method === 'POST' && url.pathname === '/prompt') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      last = body.prompt;
      if (FAIL) {
        return json(res, 400, {
          error: { type: 'prompt_outputs_failed_validation', message: 'Prompt outputs failed validation', details: '' },
          node_errors: { 1: { class_type: 'UNETLoader', errors: [{ message: 'Value not in list', details: 'unet_name: z_image_turbo_bf16.safetensors not in []' }] } },
        });
      }
      const id = `mock-${++counter}`;
      jobs.set(id, Date.now());
      json(res, 200, { prompt_id: id, number: counter, node_errors: {} });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/history/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const started = jobs.get(id);
    if (!started || Date.now() - started < DELAY_MS) return json(res, 200, {});
    return json(res, 200, {
      [id]: {
        status: { status_str: 'success', completed: true, messages: [] },
        outputs: { 10: { images: [{ filename: `cd_${String(counter).padStart(5, '0')}_.png`, subfolder: 'Kara', type: 'output' }] } },
      },
    });
  }

  if (req.method === 'GET' && url.pathname === '/queue') {
    const running = [...jobs.entries()].filter(([, s]) => Date.now() - s < DELAY_MS && Date.now() - s > 800).map(([id]) => [0, id]);
    return json(res, 200, { queue_running: running, queue_pending: [] });
  }

  if (req.method === 'GET' && url.pathname === '/view') {
    res.writeHead(200, { 'content-type': 'image/png' });
    return res.end(PNG);
  }

  // ---- Fake Comfy Router: key in X-API-Key, one route per model, native bodies and results ----
  if (url.pathname.startsWith('/v2/models/')) {
    if (req.headers['x-api-key'] !== CLOUD_KEY) return json(res, 401, { detail: 'Invalid API key', error_type: 'unauthorized' });
    if (req.method === 'GET' && url.pathname.endsWith('/openapi.json')) return json(res, 200, { openapi: '3.1.0' });
    const m = url.pathname.match(/^\/v2\/models\/([^/]+\/[^/]+)\/requests(?:\/([^/]+)(\/status)?)?$/);
    if (!m) return json(res, 404, { detail: 'not found' });
    if (req.method === 'POST' && !m[2]) {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        routerLast = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        routerPath = url.pathname;
        routerIdem = req.headers['idempotency-key'] || null;
        const id = `6f1a1a6e-0000-4000-8000-${String(++counter).padStart(12, '0')}`;
        routerJobs.set(id, { at: Date.now(), model: m[1] });
        const base = `http://127.0.0.1:${PORT}/v2/models/${m[1]}/requests/${id}`;
        json(res, 201, { request_id: id, status: 'IN_QUEUE', queue_position: 0, status_url: `${base}/status`, response_url: base, cancel_url: `${base}/cancel` });
      });
      return;
    }
    const job = routerJobs.get(m[2]);
    if (!job) return json(res, 404, { detail: 'Request not found' });
    const age = Date.now() - job.at;
    const status = age < DELAY_MS ? (age < 300 ? 'IN_QUEUE' : 'IN_PROGRESS') : 'COMPLETED';
    if (m[3] || status !== 'COMPLETED') return json(res, m[3] ? 200 : 202, { request_id: m[2], status, queue_position: 0 });
    if (job.model.startsWith('vertexai/')) return json(res, 200, { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: PNG.toString('base64') } }] } }] });
    if (job.model.startsWith('openai/')) return json(res, 200, { created: 1, output_format: 'png', data: [{ b64_json: PNG.toString('base64') }] });
    return json(res, 200, { data: [{ url: `http://127.0.0.1:${PORT}/signed/router_1.png`, size: '64x64' }] });
  }
  if (req.method === 'GET' && url.pathname === '/__router') return json(res, 200, { last: routerLast, path: routerPath, idem: routerIdem });

  // ---- Fake fal queue: key in Authorization: Key ..., links to status and result in the answer ----
  if (/^\/(fal-ai|krea|openai|ideogram|bytedance|blackforestlabs|google)\//.test(url.pathname)) {
    if (req.headers.authorization !== `Key ${CLOUD_KEY}`) return json(res, 401, { detail: 'Unauthorized' });
    const m = url.pathname.match(/^(\/[^/]+\/[^/]+)\/requests\/([^/]+)(\/status)?$/);
    if (m) {
      const started = falJobs.get(m[2]);
      if (!started) return json(res, 404, { detail: 'Request not found' });
      const age = Date.now() - started;
      if (m[3]) return json(res, 200, { status: age < DELAY_MS ? (age < 300 ? 'IN_QUEUE' : 'IN_PROGRESS') : 'COMPLETED' });
      return json(res, 200, { images: [{ url: `http://127.0.0.1:${PORT}/signed/fal_1.png`, width: 64, height: 64 }], seed: 1 });
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        falLast = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        falPath = url.pathname;
        const id = `fal-req-${++counter}`;
        falJobs.set(id, Date.now());
        const app = url.pathname.split('/').slice(0, 3).join('/');
        const base = `http://127.0.0.1:${PORT}${app}/requests/${id}`;
        json(res, 200, { request_id: id, status_url: `${base}/status`, response_url: base, cancel_url: `${base}/cancel` });
      });
      return;
    }
    return json(res, 404, { detail: 'not found' });
  }
  if (req.method === 'GET' && url.pathname === '/v1/account/billing') {
    if (req.headers.authorization !== `Key ${CLOUD_KEY}`) return json(res, 403, { error: { type: 'forbidden', message: 'missing permission' } });
    return json(res, 200, { username: 'test', credits: { current_balance: 24.5, currency: 'USD' } });
  }
  if (req.method === 'GET' && url.pathname === '/__fal') return json(res, 200, { last: falLast, path: falPath });

  // ---- Fake KIE: key in Authorization: Bearer, errors as HTTP 200 with a code in the body ----
  const kieAuth = req.headers.authorization === `Bearer ${CLOUD_KEY}`;
  const readJson = (fn) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => fn(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')));
  };
  if (url.pathname === '/api/v1/chat/credit') {
    if (!kieAuth) return json(res, 200, { code: 401, msg: 'You do not have access permissions' });
    return json(res, 200, { code: 200, msg: 'success', data: kieCredits });
  }
  if (req.method === 'POST' && url.pathname === '/api/file-base64-upload') {
    if (!kieAuth) return json(res, 200, { success: false, code: 401, msg: 'unauthorized' });
    return readJson((body) => {
      kieUploads.push(body.base64Data.slice(0, 30));
      json(res, 200, { success: true, code: 200, msg: 'File uploaded successfully', data: { fileName: body.fileName, downloadUrl: `http://127.0.0.1:${PORT}/kie-files/${kieUploads.length}.jpg` } });
    });
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/jobs/createTask') {
    if (!kieAuth) return json(res, 200, { code: 401, msg: 'You do not have access permissions' });
    return readJson((body) => {
      kieLast = body;
      kieCredits -= 4;
      const id = `kie-task-${++counter}`;
      kieJobs.set(id, Date.now());
      json(res, 200, { code: 200, msg: 'success', data: { taskId: id } });
    });
  }
  if (url.pathname === '/api/v1/jobs/recordInfo') {
    if (!kieAuth) return json(res, 200, { code: 401, msg: 'You do not have access permissions' });
    const id = url.searchParams.get('taskId');
    const started = kieJobs.get(id);
    if (!started) return json(res, 200, { code: 422, msg: 'record not found' });
    const age = Date.now() - started;
    if (age < DELAY_MS) return json(res, 200, { code: 200, data: { taskId: id, state: age < 300 ? 'waiting' : 'generating' } });
    return json(res, 200, { code: 200, data: { taskId: id, state: 'success', resultJson: JSON.stringify({ resultUrls: [`http://127.0.0.1:${PORT}/signed/kie_1.png`] }) } });
  }
  if (req.method === 'GET' && url.pathname === '/__kie') return json(res, 200, { last: kieLast, uploads: kieUploads, credits: kieCredits });

  // ---- Fake Comfy Cloud: same server, routes under /api, key in X-API-Key ----
  if (url.pathname.startsWith('/api/')) {
    if (req.headers['x-api-key'] !== CLOUD_KEY) return json(res, 401, { error: 'invalid api key' });
    const cloudPath = url.pathname.slice(4);

    if (req.method === 'GET' && cloudPath === '/user') return json(res, 200, { status: CLOUD_ACCOUNT === 'nocredits' ? 'active' : CLOUD_ACCOUNT });

    if (req.method === 'POST' && cloudPath === '/prompt') {
      if (CLOUD_ACCOUNT === 'nocredits') return json(res, 402, { error: 'insufficient credits' });
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        last = body.prompt;
        lastBody = body;
        const id = `cloud-${++counter}`;
        jobs.set(id, Date.now());
        json(res, 200, { prompt_id: id, number: counter, node_errors: {} });
      });
      return;
    }

    const status = cloudPath.match(/^\/job\/([^/]+)\/status$/);
    if (req.method === 'GET' && status) {
      const started = jobs.get(decodeURIComponent(status[1]));
      if (!started) return json(res, 404, { error: 'unknown job' });
      const age = Date.now() - started;
      const state = age < 600 ? 'pending' : age < DELAY_MS ? 'in_progress' : 'completed';
      return json(res, 200, { id: status[1], status: state });
    }

    const detail = cloudPath.match(/^\/jobs\/([^/]+)$/);
    if (req.method === 'GET' && detail) {
      return json(res, 200, { id: detail[1], status: 'completed', outputs: { 10: { images: [{ filename: 'cloud_00001_.png', subfolder: '', type: 'output' }] } } });
    }

    if (req.method === 'GET' && cloudPath === '/view') {
      res.writeHead(302, { location: `http://127.0.0.1:${PORT}/signed/cloud_00001_.png?sig=abc` });
      return res.end();
    }

    if (req.method === 'POST' && cloudPath === '/interrupt') {
      interrupted += 1;
      return json(res, 200, {});
    }
    return json(res, 404, { error: 'not found' });
  }

  // ---- Fake Magnific API: key in x-magnific-api-key ----
  if (url.pathname.startsWith('/v1/ai/text-to-image/') || url.pathname.startsWith('/v1/ai/gemini-')) {
    if (req.headers['x-magnific-api-key'] !== CLOUD_KEY) return json(res, 401, { message: 'invalid api key' });
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        lastBody = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        lastPath = url.pathname;
        const id = `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;
        jobs.set(id, Date.now());
        json(res, 200, { data: { task_id: id, status: 'CREATED', generated: [] } });
      });
      return;
    }
    const id = url.pathname.split('/').pop();
    const started = jobs.get(id);
    if (!started) return json(res, 404, { message: 'task not found' });
    const age = Date.now() - started;
    if (age < DELAY_MS) return json(res, 200, { data: { task_id: id, status: age < 600 ? 'CREATED' : 'IN_PROGRESS', generated: [] } });
    return json(res, 200, { data: { task_id: id, status: 'COMPLETED', generated: [`http://127.0.0.1:${PORT}/signed/magnific_1.png?sig=abc`] } });
  }


  // The signed storage link: must NOT receive the API key.
  if (req.method === 'GET' && url.pathname.startsWith('/signed/')) {
    if (req.headers['x-api-key'] || req.headers['x-magnific-api-key'] || req.headers.authorization) leakedKey = true;
    res.writeHead(200, { 'content-type': 'image/png' });
    return res.end(PNG);
  }
  if (req.method === 'GET' && url.pathname === '/__cloud') return json(res, 200, { leakedKey, interrupted, lastBody, lastPath });

  if (req.method === 'POST' && url.pathname === '/interrupt') return json(res, 200, {});
  if (req.method === 'GET' && url.pathname === '/__last') return json(res, 200, last || {});

  return json(res, 404, { error: 'not found' });
});

if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => console.log(`Mock ComfyUI on http://127.0.0.1:${PORT}${FAIL ? ' (failing on purpose)' : ''}`));
}

module.exports = { server };
