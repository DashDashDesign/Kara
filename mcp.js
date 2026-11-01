#!/usr/bin/env node
'use strict';
// Kara as an MCP server (stdio), so Claude or any other agent can design and generate characters.
// No dependencies: MCP over stdio is JSON-RPC, one message per line.
// It talks to a running Kara (http://127.0.0.1:3210) and starts it if nothing answers.
// Keys stay in Kara's .env: this file never sees them.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3210);
const BASE = (process.env.KARA_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
const OUT = process.env.KARA_MCP_OUT || path.join(os.homedir(), 'kara', 'mcp');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- talking to Kara ----------

async function alive() {
  try {
    const r = await fetch(`${BASE}/api/status`, { signal: AbortSignal.timeout(2000) });
    return r.ok || r.status < 500;
  } catch (err) {
    return false;
  }
}

// A Kara started from here stops with the agent; a Kara that was already running is left alone.
let started = null;
process.on('exit', () => {
  if (started) started.kill();
});

// The installed Kara (the one with a window and a taskbar icon), when there is one: closing its window stops it, as usual.
function installedKara() {
  if (process.env.KARA_URL || process.env.PORT) return null; // tests and custom setups start their own
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const exe = path.join(process.env.LOCALAPPDATA, 'Programs', 'Kara', 'Kara.exe');
    return fs.existsSync(exe) ? { cmd: exe, args: [] } : null;
  }
  if (process.platform === 'darwin' && fs.existsSync('/Applications/Kara.app')) return { cmd: 'open', args: ['-a', 'Kara'] };
  return null;
}

async function waitAlive(seconds) {
  for (let i = 0; i < seconds * 4; i++) {
    await sleep(250);
    if (await alive()) return true;
  }
  return false;
}

async function startKara() {
  const installed = installedKara();
  if (installed) {
    launchedAt = Date.now();
    spawn(installed.cmd, installed.args, { detached: true, stdio: 'ignore' }).unref();
    if (await waitAlive(40)) return;
  }
  // No installed Kara, or it did not come up: run the server from here, stopped when this agent goes away.
  if (!started || started.exitCode !== null) {
    started = spawn(process.execPath, [path.join(__dirname, 'server.js')], { cwd: __dirname, stdio: 'ignore', windowsHide: true, env: { ...process.env, PORT: String(PORT), KARA_PARENT_PID: String(process.pid) } });
    started.unref();
  }
  if (!(await waitAlive(10))) throw new Error('Kara did not start. Start it by hand (start.bat or the Kara shortcut) and try again.');
}

let launchedAt = 0;
let starting = null;
async function ensureKara() {
  if (await alive()) return;
  if (process.env.KARA_URL) throw new Error(`Kara does not answer at ${BASE}.`);
  starting = starting || startKara().finally(() => {
    starting = null;
  });
  await starting;
}

async function kara(method, route, body, provider) {
  await ensureKara();
  const headers = { 'content-type': 'application/json', ...(provider ? { 'x-user-provider': provider } : {}) };
  const res = await fetch(BASE + route, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: text.slice(0, 300) };
  }
  if (!res.ok) throw new Error(data.error || `Kara answered ${res.status}.`);
  return data;
}

let configCache = null;
async function config() {
  if (!configCache) configCache = await kara('GET', '/api/config');
  return configCache;
}

// ---------- tools ----------

const SELECTION_HELP = 'Map of menu id to the chosen option id (a list of ids for multi-choice menus), e.g. {"presentation":"man","age":"elder","hairStyle":"bald","layout":"portrait"}. For free text on any menu use {"custom":{"outfit":"a mustard raincoat"}}. Call kara_menus for the ids. Menus left out keep Kara\'s defaults.';

const TOOLS = [
  {
    name: 'kara_menus',
    description: 'Lists every menu of Kara (gender, age, face, hair, outfit, layout, look, background...) with the ids of their options, and the default choices. Call this first to know what you can ask for.',
    inputSchema: { type: 'object', properties: { menu: { type: 'string', description: 'Optional menu id to show only that one.' } } },
  },
  {
    name: 'kara_status',
    description: 'Shows which image models exist, which providers have a key (local ComfyUI needs none), the current default provider and whether ComfyUI answers.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'kara_prompt',
    description: 'Builds the text prompt and the image size from menu choices, without generating anything (free, instant).',
    inputSchema: {
      type: 'object',
      properties: {
        selection: { type: 'object', description: SELECTION_HELP },
        extra: { type: 'string', description: 'Free extra details added to the prompt.' },
        model: { type: 'string', description: 'Model id (see kara_status).' },
      },
    },
  },
  {
    name: 'kara_apply',
    description: 'Sets the menus in the open Kara window (it opens one if needed), so the user sees the choices appear, without generating anything. Use it to show or adjust a character before generating; kara_generate then makes the image from the same choices.',
    inputSchema: {
      type: 'object',
      properties: {
        selection: { type: 'object', description: SELECTION_HELP },
        extra: { type: 'string', description: 'Free extra details added to the prompt.' },
        model: { type: 'string', description: 'Model id (see kara_status).' },
        provider: { type: 'string', enum: ['local', 'router', 'kie', 'fal', 'magnific'], description: 'Where the image will be made. Default local. Choosing it spends nothing.' },
      },
    },
  },
  {
    name: 'kara_result',
    description: 'Waits for an image that kara_generate said was STILL RUNNING, and returns it. Call it with the job_id, as many times as needed, instead of generating again.',
    inputSchema: { type: 'object', properties: { job_id: { type: 'string', description: 'The job_id given by kara_generate.' } }, required: ['job_id'] },
  },
  {
    name: 'kara_generate',
    description: 'Generates a character image and returns it. With provider "local" (the default, ComfyUI on this machine) it is free. Any other provider (kie, fal, magnific, router) spends the user\'s money, even when the user named it in their request: the first call only returns a quote (provider, model, price) and generates nothing. Give the quote to the user, wait for their yes in the chat, then call again with the same arguments and the quote_id. If a Kara window is open, the image is made in it (menus set, image in its history and gallery, shown large there); otherwise the server makes it. Takes from a few seconds to a few minutes: if the answer says STILL RUNNING, do not generate again, call kara_result with the job_id.',
    inputSchema: {
      type: 'object',
      properties: {
        selection: { type: 'object', description: SELECTION_HELP },
        extra: { type: 'string', description: 'Free extra details added to the prompt.' },
        model: { type: 'string', description: 'Model id (see kara_status). Default: Z-Image Turbo.' },
        provider: { type: 'string', enum: ['local', 'router', 'kie', 'fal', 'magnific'], description: 'Where the image is made. Default local.' },
        seed: { type: 'integer', description: 'Same seed and same choices give the same image. Default random. Only used when the image is made without the Kara window (in_app false or no window open).' },
        in_app: { type: 'boolean', description: 'Default true: use the open Kara window when there is one. False: make the image without it (then seed is used).' },
        quote_id: { type: 'string', description: 'For a paid provider only: the id given by the quote, to pass after the user has said yes to that quote.' },
      },
    },
  },
];

function menuLine(g, defaults) {
  const opts = (g.options || []).map((o) => `${o.id}${o.en ? ` (${o.en})` : ''}`).join(', ');
  const def = defaults ? defaults[g.id] : undefined;
  return `${g.id} [${g.en}, ${g.type}${def !== undefined ? `, default ${JSON.stringify(def)}` : ''}]: ${opts || 'free text or colour'}`;
}

async function toolMenus(args) {
  const cfg = await config();
  const groups = cfg.options.groups.filter((g) => !args.menu || g.id === args.menu);
  if (!groups.length) throw new Error(`No menu called "${args.menu}".`);
  return [{ type: 'text', text: groups.map((g) => menuLine(g, cfg.options.defaults)).join('\n') }];
}

async function toolStatus() {
  const cfg = await config();
  // ComfyUI on this machine is what kara_generate uses by default, so that is what is checked (not Kara's page default).
  const [status, settings] = await Promise.all([kara('GET', '/api/status', null, 'local').catch((e) => ({ error: e.message })), kara('GET', '/api/settings')]);
  const models = cfg.models.models.map((m) => `${m.id} (${m.name})${m.engines ? ` via ${Object.keys(m.engines).join('/')}` : ''}`);
  const text = [
    `Kara ${cfg.version || ''} at ${BASE}`,
    `ComfyUI on this machine (provider "local", used by kara_generate unless told otherwise): ${status.error || !status.ok ? `not answering (${status.error || status.message || 'no reply'})` : `ready, ${status.device}`}`,
    `Keys saved: ${Object.entries(settings.hasKey).map(([k, v]) => `${k} ${v ? 'yes' : 'no'}`).join(', ')}`,
    `Models:\n${models.join('\n')}`,
  ].join('\n');
  return [{ type: 'text', text }];
}

async function toolPrompt(args) {
  const r = await kara('POST', '/api/preview', { selection: args.selection || {}, extra: args.extra || '', model: args.model });
  return [{ type: 'text', text: `${r.width} x ${r.height}\n\n${r.prompt}` }];
}

// ---------- paid generations: a quote first, then the user's answer ----------

const CREDIT_USD = { kie: 0.005, magnific: 0.0008 }; // same figures as the page
const QUOTE_MIN_WAIT = 10 * 1000; // a quote cannot be used at once: the user must have had time to read it and answer
const QUOTE_LIFE = 15 * 60 * 1000;
const quotes = new Map();

// Dollars for one image, from the prices in data/models.json; null when it is only known after the first image.
function priceUsd(engine, provider, size) {
  const price = engine && engine.price;
  if (!price) return null;
  if (price === 'free') return 0;
  const res = engine.resolutions && engine.resolutions[0] ? engine.resolutions[0].id : '';
  if (price.usd != null) return price.usd;
  if (price.usdByRes && price.usdByRes[res] != null) return price.usdByRes[res];
  if (price.usdPerMp != null) return (price.usdPerMp * size.width * size.height) / 1e6;
  if (CREDIT_USD[provider] && price[res] != null) return price[res] * CREDIT_USD[provider];
  return null;
}

async function balanceOf(provider) {
  try {
    const b = await kara('GET', `/api/balance?provider=${provider}`, null, provider);
    return Number.isFinite(b.amount) ? { amount: b.amount, unit: b.unit } : null;
  } catch (err) {
    return null;
  }
}

async function quoteFor(args, provider) {
  const cfg = await config();
  const modelId = args.model || cfg.models.default;
  const model = cfg.models.models.find((m) => m.id === modelId);
  const engine = model && model.engines ? model.engines[provider] : null;
  if (!model) throw new Error(`Unknown model "${modelId}". Call kara_status for the list.`);
  if (!engine) throw new Error(`${model.name} is not available at "${provider}". Call kara_status to see where each model runs.`);
  const size = await kara('POST', '/api/preview', { selection: args.selection || {}, extra: args.extra || '', model: modelId });
  const usd = priceUsd(engine, provider, size);
  const id = Math.random().toString(36).slice(2, 8);
  quotes.set(id, { provider, model: modelId, at: Date.now() });
  const price = usd === null ? 'not known in advance (Kara measures it after the image)' : usd === 0 ? 'free' : `about ${usd.toFixed(2)} USD per image`;
  return [
    {
      type: 'text',
      text: [
        'NOT STARTED. This generation is paid and nothing has been spent.',
        `Provider: ${provider}. Model: ${model.name}. Image: ${size.width} x ${size.height}. Price: ${price}.`,
        'Tell the user exactly this (provider, model, price) and ask if they agree. Do not go on until the user has answered yes in the chat.',
        `If they agree, call kara_generate again with the same arguments and quote_id="${id}". If they refuse, stop.`,
      ].join('\n'),
    },
  ];
}

function checkQuote(args, provider) {
  const q = quotes.get(args.quote_id);
  const modelId = args.model;
  if (!q || q.provider !== provider || Date.now() - q.at > QUOTE_LIFE) return 'This quote is unknown or expired. Call kara_generate without quote_id to get a new quote, and ask the user.';
  if (modelId && q.model !== modelId) return 'The model is not the one that was quoted. Call kara_generate without quote_id to get a new quote, and ask the user.';
  if (Date.now() - q.at < QUOTE_MIN_WAIT) return 'The user has not had time to answer. Show them the quote, wait for their yes in the chat, then call again with the same quote_id.';
  return null;
}

// ---------- making the image: in the open Kara window, or by the server alone ----------

async function makeByServer(args, provider) {
  const body = { selection: args.selection || {}, extra: args.extra || '', model: args.model, seed: Number.isInteger(args.seed) ? args.seed : undefined };
  const job = await kara('POST', '/api/generate', body, provider);
  const started = Date.now();
  let result;
  for (;;) {
    result = await kara('GET', `/api/job?id=${encodeURIComponent(job.promptId)}`, null, provider);
    if (result.status === 'done' || result.status === 'error') break;
    if (Date.now() - started > 10 * 60 * 1000) throw new Error('The image took more than 10 minutes. Check Kara.');
    await sleep(1500);
  }
  if (result.status === 'error') throw new Error(result.error || 'Generation failed.');
  const images = [];
  for (const img of result.images) {
    const res = await fetch(BASE + img.url, { headers: { 'x-user-provider': provider } });
    if (!res.ok) throw new Error(`Could not fetch the image (${res.status}).`);
    images.push({ mime: res.headers.get('content-type') || 'image/png', buf: Buffer.from(await res.arrayBuffer()) });
  }
  return { images, seed: job.seed, width: job.width, height: job.height, prompt: job.prompt };
}

// The page sets the menus, presses its own Generate and sends the image back (see setupRemote in public/app.js).
async function makeInApp(args, provider) {
  const order = { type: 'generate', wait: true, selection: args.selection || {}, extra: args.extra || '', model: args.model, provider, paidOk: provider !== 'local' };
  const r = await kara('POST', '/api/remote/command', order);
  if (!r.ok) throw new Error(r.error || 'The Kara window could not make the image.');
  return { images: [{ mime: r.mime, buf: Buffer.from(r.data, 'base64') }], seed: r.seed, width: r.width, height: r.height, prompt: r.prompt };
}

async function pageCount() {
  try {
    return (await kara('GET', '/api/remote/status')).pages;
  } catch (err) {
    return 0;
  }
}

async function waitPage(seconds) {
  for (let i = 0; i < Math.max(1, seconds * 2); i++) {
    if (await pageCount()) return true;
    await sleep(500);
  }
  return false;
}

function openBrowser() {
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', BASE]] : process.platform === 'darwin' ? ['open', [BASE]] : ['xdg-open', [BASE]];
  spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}

// Is a Kara window open? With open=true, opens one (the installed app, else a browser tab) and waits for it.
async function ensurePage(open) {
  await ensureKara();
  if (await waitPage(Date.now() - launchedAt < 60000 ? 20 : 1)) return true;
  if (!open) return false;
  openBrowser();
  return waitPage(15);
}

async function toolApply(args) {
  if (!(await ensurePage(true))) throw new Error('Could not open a Kara window. Open Kara (the Kara shortcut, or http://localhost:3210) and try again.');
  const r = await kara('POST', '/api/remote/command', { type: 'apply', wait: true, selection: args.selection || {}, extra: args.extra || '', model: args.model, provider: args.provider || 'local' });
  if (!r.ok) throw new Error(r.error || 'The Kara window could not apply the choices.');
  return [{ type: 'text', text: 'The choices are set in the Kara window. Nothing was generated. Call kara_generate to make the image.' }];
}

// Makes the image and builds the answer for the agent: the images, where they are saved, and what it cost.
async function produce(args, provider, before) {
  // In the open Kara window when there is one (the image then lands in its history and gallery), else made by the server.
  const inApp = args.in_app !== false && (await ensurePage(false));
  const made = inApp ? await makeInApp(args, provider) : await makeByServer(args, provider);
  const content = [];
  const saved = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const [i, img] of made.images.entries()) {
    const ext = img.mime.includes('jpeg') ? 'jpg' : img.mime.includes('webp') ? 'webp' : 'png';
    const file = path.join(OUT, `kara_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${made.seed}${i ? `_${i + 1}` : ''}.${ext}`);
    fs.writeFileSync(file, img.buf);
    saved.push(file);
    content.push({ type: 'image', data: img.buf.toString('base64'), mimeType: img.mime });
  }
  const job = made;
  // What it really cost, read from the provider's balance before and after (KIE, fal).
  let cost = '';
  if (before) {
    const after = await balanceOf(provider);
    const spent = after ? Math.round((before.amount - after.amount) * 1000) / 1000 : NaN;
    if (spent > 0) cost = `\nCost: ${spent} ${before.unit}${CREDIT_USD[provider] ? ` (about ${(spent * CREDIT_USD[provider]).toFixed(2)} USD)` : ''}. Tell the user.`;
  }
  content.unshift({ type: 'text', text: `Done with ${provider}${inApp ? ' in the Kara window' : ''}, seed ${job.seed}, ${job.width} x ${job.height}.${cost}\nSaved: ${saved.join(', ')}\nPrompt: ${job.prompt}` });
  return content;
}

// Claude Desktop gives up on a tool call after 60 seconds, and a paid image can take longer. So the image is made as a job:
// the call waits about 45 seconds, and if the image is not ready it says so and the agent asks again with kara_result.
const jobs = new Map();
const WAIT_MS = Number(process.env.KARA_MCP_WAIT_MS) || 45 * 1000; // the variable is for the tests

async function waitJob(job, until, ctx) {
  const t0 = Date.now();
  while (!job.done && Date.now() < until) {
    await sleep(500);
    if (ctx && Math.round((Date.now() - t0) / 500) % 10 === 0) ctx.progress(`Making the image, ${Math.round((Date.now() - job.started) / 1000)} s`);
  }
  if (job.error) throw job.error;
  if (job.done) return job.content;
  const secs = Math.round((Date.now() - job.started) / 1000);
  return [{ type: 'text', text: `STILL RUNNING after ${secs} s. The image is being made and nothing is lost. Do NOT start another generation (a paid one would be paid twice). Call kara_result with job_id="${job.id}" to wait for it.` }];
}

async function toolGenerate(args, ctx) {
  const until = Date.now() + WAIT_MS;
  const provider = args.provider || 'local';
  let before = null;
  if (provider !== 'local') {
    if (!args.quote_id) return quoteFor(args, provider);
    const problem = checkQuote(args, provider);
    if (problem) return [{ type: 'text', text: `NOT STARTED. ${problem}` }];
    quotes.delete(args.quote_id);
    before = await balanceOf(provider);
  }
  const job = { id: Math.random().toString(36).slice(2, 8), started: Date.now(), done: false, content: null, error: null };
  jobs.set(job.id, job);
  setTimeout(() => jobs.delete(job.id), 60 * 60 * 1000).unref();
  produce(args, provider, before).then(
    (content) => Object.assign(job, { content, done: true }),
    (error) => Object.assign(job, { error, done: true })
  );
  return waitJob(job, until, ctx);
}

async function toolResult(args, ctx) {
  const job = jobs.get(args.job_id);
  if (!job) throw new Error('Unknown or expired job_id. Nothing is running under this id.');
  return waitJob(job, Date.now() + WAIT_MS, ctx);
}

const HANDLERS = { kara_menus: toolMenus, kara_status: toolStatus, kara_prompt: toolPrompt, kara_apply: toolApply, kara_generate: toolGenerate, kara_result: toolResult };

// ---------- JSON-RPC over stdio ----------

function write(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

async function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && write({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => id !== undefined && write({ jsonrpc: '2.0', id, error: { code, message } });
  try {
    if (method === 'initialize') {
      return reply({
        protocolVersion: (params && params.protocolVersion) || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'kara', version: require('./package.json').version },
        instructions: 'Kara designs character sheets. Call kara_menus, then kara_apply to set the menus in the Kara window (optional), then kara_generate. Local generation is free; any other provider costs money and needs the user\'s agreement.',
      });
    }
    if (method === 'ping') return reply({});
    if (method === 'tools/list') return reply({ tools: TOOLS });
    if (method === 'tools/call') {
      const handler = HANDLERS[params && params.name];
      if (!handler) return fail(-32602, `Unknown tool ${params && params.name}`);
      try {
        const token = params && params._meta && params._meta.progressToken;
        let step = 0;
        const ctx = { progress: (message) => token !== undefined && write({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken: token, progress: ++step, message } }) };
        return reply({ content: await handler((params && params.arguments) || {}, ctx) });
      } catch (err) {
        return reply({ isError: true, content: [{ type: 'text', text: err.message }] });
      }
    }
    if (method && method.startsWith('notifications/')) return;
    return fail(-32601, `Method not found: ${method}`);
  } catch (err) {
    return fail(-32603, err.message);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch (err) {
      write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
  }
});
process.stdin.on('end', () => process.exit(0));
