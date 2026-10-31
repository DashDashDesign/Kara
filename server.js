'use strict';
// Kara: tiny local server. No dependencies, Node 18 or newer.
// It serves the web page and talks to your ComfyUI.

const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');

const env = require('./lib/env');

env.load(); // reads .env (API key, mode) before anything else

const comfy = require('./lib/comfy');
const install = require('./lib/install');
const updater = require('./lib/update');
const { buildPrompt } = require('./lib/prompt');
const { resolveSize, refModeOf, packRefs, engineOf } = require('./lib/models');

const PORT = Number(process.env.PORT || 3210);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const WORKFLOWS = path.join(ROOT, 'workflows');
const DEFAULT_WORKFLOW = process.env.WORKFLOW || 'zimage_turbo_t2i.api.json';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function readJson(file) {
  return JSON.parse(await fsp.readFile(file, 'utf8'));
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 40_000_000) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function listWorkflows() {
  const files = await fsp.readdir(WORKFLOWS);
  return files.filter((f) => f.endsWith('.api.json')).sort();
}

async function loadWorkflow(name) {
  const safe = path.basename(name || DEFAULT_WORKFLOW);
  if (!safe.endsWith('.api.json')) throw new Error('Unknown workflow.');
  return readJson(path.join(WORKFLOWS, safe));
}

function randomSeed() {
  return Math.floor(Math.random() * 2 ** 32);
}


// Provider settings as the page may see them: which provider, and whether a key is saved. Never the key itself.
function settingsInfo() {
  return {
    editable: true,
    byok: false,
    provider: comfy.mode(),
    providers: comfy.PROVIDERS,
    comfyUrl: (process.env.COMFY_URL || 'http://127.0.0.1:8188').trim(),
    comfyDir: (process.env.COMFY_DIR || '').trim(),
    hasHfToken: !!(process.env.HF_TOKEN || '').trim(),
    hasKey: { cloud: !!(process.env.COMFY_CLOUD_API_KEY || '').trim(), router: !!(process.env.COMFY_CLOUD_API_KEY || '').trim(), magnific: !!(process.env.MAGNIFIC_API_KEY || '').trim(), kie: !!(process.env.KIE_API_KEY || '').trim(), fal: !!(process.env.FAL_KEY || '').trim() },
  };
}

// Only a page opened on this computer may change things: another website open in the same browser
// must not be able to start paid generations or rewrite .env. The browser always sends Host,
// and sends Origin on cross-site posts.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
function fromThisComputer(req) {
  const hostName = (h) => {
    try {
      return new URL(`http://${h}`).hostname;
    } catch (err) {
      return '';
    }
  };
  if (!LOCAL_HOSTS.has(hostName(req.headers.host || ''))) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch (err) {
    return false;
  }
}

// Prompt from the menus; size from the sheet layout, or from "advanced render" when set.
async function promptAndSize(body) {
  const [options, models] = await Promise.all([readJson(path.join(ROOT, 'data', 'options.json')), readJson(path.join(ROOT, 'data', 'models.json'))]);
  // The face drawing as a guide, on a model whose ComfyUI engine has a ControlNet workflow (models.json, "guideWorkflow"):
  // the drawing steers the image itself, so the picture is a head and shoulders portrait in the drawing's proportions.
  const guideEngine = engineOf(models, body.model, comfy.mode()).engine;
  const guideWorkflow = body.guide && guideEngine && guideEngine.guideWorkflow ? guideEngine.guideWorkflow : null;
  if (guideWorkflow) {
    body = { ...body, guide: undefined, selection: { ...(body.selection || {}), layout: 'portrait' }, render: body.render ? { ...body.render, ratio: 'auto' } : body.render };
  }
  const refMode = refModeOf(models, body, comfy.mode());
  const packed = packRefs(models, body, comfy.mode());
  const built = buildPrompt(options, body.selection, body.extra, refMode, packed.counts);
  const size = resolveSize(models, body.model, comfy.mode(), body.render, built.width, built.height);
  // A model that runs in ComfyUI may bring its own workflow (models.json, engine "workflow").
  const m = models.models.find((x) => x.id === size.model);
  const engine = m && m.engines ? m.engines[comfy.mode()] : null;
  // With reference images, the engine's editing workflow when it has one.
  const workflow = guideWorkflow || (engine && packed.refs.length && engine.editWorkflow ? engine.editWorkflow : engine && engine.workflow ? engine.workflow : null);
  return { prompt: built.prompt, width: size.width, height: size.height, resolution: size.resolution, model: size.model, refs: packed.refs, workflow, guided: !!guideWorkflow };
}

async function handleApi(req, res, url) {
  const route = url.pathname;

  if (req.method === 'GET' && route === '/api/config') {
    const [options, presets, models, workflows] = await Promise.all([
      readJson(path.join(ROOT, 'data', 'options.json')),
      readJson(path.join(ROOT, 'data', 'presets.json')),
      readJson(path.join(ROOT, 'data', 'models.json')),
      listWorkflows(),
    ]);
    // The version number of package.json, shown in About (read each time: an update changes it).
    const pkg = await readJson(path.join(ROOT, 'package.json')).catch(() => ({}));
    return send(res, 200, { options, presets, models, settings: settingsInfo(), workflows, defaultWorkflow: DEFAULT_WORKFLOW, comfyUrl: comfy.base(), mode: comfy.mode(), version: pkg.version || '' });
  }

  if (req.method === 'GET' && route === '/api/status') {
    return send(res, 200, await comfy.ping());
  }

  if (req.method === 'POST' && route === '/api/preview') {
    const body = await readBody(req);
    const { prompt, width, height, guided } = await promptAndSize(body);
    return send(res, 200, { prompt, width, height, guided });
  }

  if (req.method === 'POST' && route === '/api/generate') {
    const body = await readBody(req);
    const { prompt, width, height, resolution, model, refs, workflow: own, guided } = await promptAndSize(body);
    const seed = Number.isInteger(body.seed) && body.seed >= 0 ? body.seed : randomSeed();
    const template = await loadWorkflow(own || body.workflow);
    // A ComfyUI workflow that takes images: they are sent to ComfyUI first, then wired in by name.
    const images = comfy.takesImages(template) ? await comfy.uploadImages(refs) : [];
    const [guide] = guided && typeof body.guide === 'string' ? await comfy.uploadImages([body.guide]) : [];
    if (guided && !guide) return send(res, 400, { error: 'The face drawing did not arrive.' });
    // The ControlNet strength from the page's slider, kept between 0.2 and 0.9.
    const asked = Number(body.guideStrength);
    const guideStrength = guided && Number.isFinite(asked) ? Math.min(0.9, Math.max(0.2, asked)) : undefined;
    const workflow = comfy.inject(template, { prompt, seed, width, height, model, resolution, refs, images, guide, guideStrength });
    const promptId = await comfy.queue(workflow);
    return send(res, 200, { promptId, seed, prompt, width, height });
  }

  if (req.method === 'GET' && route === '/api/job') {
    const id = url.searchParams.get('id') || '';
    if (!id) return send(res, 400, { error: 'Missing id.' });
    const result = await comfy.job(id);
    result.images = result.images.map((img) => ({
      ...img,
      url: `/api/image?${new URLSearchParams({ filename: img.filename, subfolder: img.subfolder, type: img.type, provider: comfy.mode() })}`,
    }));
    return send(res, 200, result);
  }

  if (req.method === 'GET' && route === '/api/image') {
    const filename = url.searchParams.get('filename') || '';
    if (!filename || filename.includes('..')) return send(res, 400, { error: 'Bad filename.' });
    const upstream = await comfy.view({
      filename,
      subfolder: url.searchParams.get('subfolder') || '',
      type: url.searchParams.get('type') || 'output',
    });
    if (!upstream.ok) return send(res, upstream.status, { error: 'Image not found in ComfyUI.' });
    res.writeHead(200, {
      'content-type': upstream.headers.get('content-type') || 'image/png',
      'cache-control': 'private, max-age=3600',
    });
    return Readable.fromWeb(upstream.body).pipe(res);
  }

  if (req.method === 'GET' && route === '/api/settings') return send(res, 200, settingsInfo());

  if (req.method === 'GET' && route === '/api/balance') {
    const provider = url.searchParams.get('provider') || comfy.mode();
    return send(res, 200, { provider, ...(await comfy.balance(provider)) });
  }

  if (req.method === 'POST' && route === '/api/settings') {
    const body = await readBody(req);
    const provider = ['local', 'cloud', 'router', 'magnific', 'kie', 'fal'].includes(body.provider) ? body.provider : null;
    if (!provider) return send(res, 400, { error: 'Unknown provider.' });
    // Saves the key (and the ComfyUI address); the provider itself is chosen for each generation by the page.
    const updates = {};
    if (provider === 'local' && body.comfyUrl) {
      let u;
      try {
        u = new URL(String(body.comfyUrl));
      } catch (err) {
        return send(res, 400, { error: 'This ComfyUI address is not valid.' });
      }
      if (!/^https?:$/.test(u.protocol)) return send(res, 400, { error: 'This ComfyUI address is not valid.' });
      updates.COMFY_URL = u.origin;
    }
    if (provider === 'local' && typeof body.comfyDir === 'string') {
      const dir = body.comfyDir.trim();
      if (dir && (!path.isAbsolute(dir) || dir.length > 400 || /[\r\n]/.test(dir))) return send(res, 400, { error: 'This folder is not valid: give the full path of the ComfyUI folder.' });
      updates.COMFY_DIR = dir;
    }
    // The Hugging Face token (read only), for the model files behind a licence: saved, never sent back.
    if (provider === 'local' && typeof body.hfToken === 'string' && body.hfToken.trim()) {
      const tok = body.hfToken.trim();
      if (tok.length > 300 || /s/.test(tok)) return send(res, 400, { error: 'This Hugging Face token does not look right.' });
      updates.HF_TOKEN = tok;
    }
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    if (key) {
      if (key.length > 300 || /\s/.test(key)) return send(res, 400, { error: 'This key does not look right.' });
      // Comfy Cloud and Comfy Router take the same Comfy key (platform.comfy.org).
      if (provider === 'cloud' || provider === 'router') updates.COMFY_CLOUD_API_KEY = key;
      if (provider === 'magnific') updates.MAGNIFIC_API_KEY = key;
      if (provider === 'kie') updates.KIE_API_KEY = key;
      if (provider === 'fal') updates.FAL_KEY = key;
    }
    // "Forget my key": empties the key line, for example before lending the computer.
    if (body.forget === true && !key) {
      if (provider === 'cloud' || provider === 'router') updates.COMFY_CLOUD_API_KEY = '';
      if (provider === 'magnific') updates.MAGNIFIC_API_KEY = '';
      if (provider === 'kie') updates.KIE_API_KEY = '';
      if (provider === 'fal') updates.FAL_KEY = '';
      if (provider === 'local') updates.HF_TOKEN = '';
    }
    env.save(updates);
    return send(res, 200, settingsInfo());
  }

  // Model files for ComfyUI on this computer: what is missing, and downloading it.
  if (req.method === 'GET' && route === '/api/local/models') {
    return send(res, 200, await install.status(url.searchParams.get('model') || 'z-image-turbo'));
  }
  if (req.method === 'POST' && route === '/api/local/install') {
    const body = await readBody(req);
    try {
      await install.install(String(body.model || 'z-image-turbo'));
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
    return send(res, 200, await install.status(String(body.model || 'z-image-turbo')));
  }

  if (req.method === 'POST' && route === '/api/local/delete') {
    const body = await readBody(req);
    try {
      const out = await install.remove(String(body.model || ''));
      return send(res, 200, { ...out, status: await install.status(String(body.model)) });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }
  if (req.method === 'POST' && route === '/api/local/install/cancel') {
    const body = await readBody(req);
    install.cancel();
    return send(res, 200, await install.status(String(body.model || install.progress.model || 'z-image-turbo')));
  }

  // Is there a newer version on GitHub, and install it (the page then asks to restart the app).
  if (req.method === 'GET' && route === '/api/update') {
    try {
      return send(res, 200, await updater.status());
    } catch (err) {
      return send(res, 200, { error: err.message });
    }
  }
  if (req.method === 'POST' && route === '/api/update') {
    try {
      return send(res, 200, await updater.update());
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }
  // Restart after an update: a fresh copy of this server (same Node, same folder) takes over the port.
  if (req.method === 'POST' && route === '/api/restart') {
    send(res, 200, { ok: true });
    setTimeout(restart, 300);
    return;
  }
  if (req.method === 'POST' && route === '/api/cancel') {
    await comfy.interrupt();
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found.' });
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD' && !fromThisComputer(req)) return send(res, 403, { error: 'Requests from other sites are refused.' });
    // The provider for this request: header x-user-provider (sent by the page), or ?provider= on image links.
    const provider = String(req.headers['x-user-provider'] || url.searchParams.get('provider') || '');
    if (url.pathname.startsWith('/api/')) return await comfy.withProvider(provider, () => handleApi(req, res, url));
    return serveStatic(req, res, url);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${url.pathname}: ${err.message}`);
    // ComfyUI refuses a workflow whose model file it does not have: say what to do instead of its raw message.
    const missing = /Value not in list/.test(err.message || '') && /(unet_name|clip_name|vae_name|ckpt_name)/.test(err.message || '');
    if (!res.headersSent) return send(res, 500, { error: missing ? 'The model is not installed in ComfyUI. Open Keys, choose "ComfyUI on your own machine", then "Install the model".' : err.message || 'Server error.', code: missing ? 'nomodel' : undefined });
    res.end();
  }
});

function restart() {
  server.close();
  const child = spawn(process.execPath, process.argv.slice(1), { cwd: process.cwd(), env: { ...process.env, KARA_RESTART: '1' }, detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  setTimeout(() => process.exit(0), 200);
}

// Started by a restart: the old copy may still hold the port for a moment.
let listenTries = 0;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && process.env.KARA_RESTART && listenTries++ < 40) return setTimeout(() => server.listen(PORT, '127.0.0.1'), 250);
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Kara (character designer)');
  console.log(`  Open:     http://localhost:${PORT}`);
  console.log(`  ${{ cloud: 'Comfy Cloud:', router: 'Comfy Router:', magnific: 'Magnific:', kie: 'KIE:', fal: 'fal:', local: 'ComfyUI:' }[comfy.mode()]}  ${comfy.base()}`);
  if (comfy.mode() !== 'local') {
    const key = ((comfy.mode() === 'magnific' ? process.env.MAGNIFIC_API_KEY : comfy.mode() === 'kie' ? process.env.KIE_API_KEY : comfy.mode() === 'fal' ? process.env.FAL_KEY : process.env.COMFY_CLOUD_API_KEY) || '').trim();
    console.log(`  API key:  ${key ? `${key.length} characters, starts with "${key.slice(0, 6)}"` : 'none found'}`);
  }
  console.log('  Stop:     press Ctrl+C');
  console.log('');
});
