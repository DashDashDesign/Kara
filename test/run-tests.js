'use strict';
// Checks the whole chain against the fake ComfyUI:  node test/run-tests.js
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const APP = 'http://127.0.0.1:3299';
const MOCK = 'http://127.0.0.1:8199';
// A developer's own .env must never change what the tests do.
const LOCAL = { COMFY_MODE: 'local', COMFY_CLOUD_API_KEY: '', MAGNIFIC_API_KEY: '' };
// Settings saved from the page go to this throwaway file, never to a real .env.
const ENV_FILE = path.join(os.tmpdir(), `kara-test-${process.pid}.env`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(file, env) {
  const child = spawn(process.execPath, [path.join(ROOT, file)], { env: { ...process.env, ENV_FILE, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.on('data', (d) => process.stderr.write(d));
  return child;
}

async function waitFor(url) {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(url);
      return;
    } catch (err) {
      await sleep(150);
    }
  }
  throw new Error(`Nothing answered at ${url}`);
}

const post = (p, body) => fetch(APP + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.log(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

// Runs the app in cloud mode against the fake Comfy Cloud (same mock server).
async function cloudRound(label, { key, account }, body) {
  console.log(`  -- cloud: ${label}`);
  const mock = start('test/mock-comfy.js', { MOCK_DELAY: '1800', MOCK_ACCOUNT: account });
  const app = start('server.js', { PORT: '3299', COMFY_MODE: 'cloud', COMFY_CLOUD_URL: MOCK, COMFY_CLOUD_API_KEY: key, MAGNIFIC_API_KEY: '' });
  try {
    await waitFor(MOCK + '/system_stats');
    await waitFor(APP + '/api/status');
    await body();
  } finally {
    mock.kill();
    app.kill();
    await sleep(300);
  }
}

async function main() {
  const mock = start('test/mock-comfy.js', { MOCK_DELAY: '1800' });
  const app = start('server.js', { PORT: '3299', COMFY_URL: MOCK, ...LOCAL });
  try {
    await waitFor(MOCK + '/system_stats');
    await waitFor(APP + '/api/status');

    await check('status sees ComfyUI', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, true);
      assert.match(s.device, /Mock GPU/);
    });

    let cfg;
    await check('config has options, presets and a workflow', async () => {
      cfg = await (await fetch(APP + '/api/config')).json();
      assert.ok(cfg.options.groups.length >= 15);
      assert.equal(cfg.presets.length, 10);
      assert.ok(cfg.workflows.includes('zimage_turbo_t2i.api.json'));
    });

    await check('every preset only uses ids that exist', async () => {
      for (const p of cfg.presets) {
        for (const [gid, val] of Object.entries(p.selection)) {
          const g = cfg.options.groups.find((x) => x.id === gid);
          assert.ok(g, `${p.id}: unknown group ${gid}`);
          for (const id of Array.isArray(val) ? val : [val]) assert.ok(g.options.some((o) => o.id === id), `${p.id}: unknown option ${gid}.${id}`);
        }
      }
    });

    await check('every option has English and French labels and a prompt field', async () => {
      for (const g of cfg.options.groups) {
        assert.ok(g.en && g.fr, `group ${g.id}`);
        for (const o of g.options) assert.ok(o.en && o.fr && typeof o.p === 'string', `${g.id}.${o.id}`);
      }
    });

    await check('preview builds a readable prompt from a preset', async () => {
      const p = cfg.presets.find((x) => x.id === 'selwyn');
      const r = await (await post('/api/preview', { selection: p.selection, extra: p.extra })).json();
      assert.match(r.prompt, /elf/);
      assert.match(r.prompt, /silver grey long straight hair/);
      assert.match(r.prompt, /glasses/);
      assert.match(r.prompt, /Additional details: an elf with elegant pointed ears, ink-stained/);
      assert.deepEqual([r.width, r.height], [1792, 1024]);
    });

    await check('bald ignores hair colour, layout changes size', async () => {
      const r = await (await post('/api/preview', { selection: { hairStyle: 'bald', hairColor: 'pink', layout: 'fullbody' } })).json();
      assert.match(r.prompt, /bald head/);
      assert.doesNotMatch(r.prompt, /pink/);
      assert.deepEqual([r.width, r.height], [896, 1536]);
    });

    await check('unknown ids are ignored and multi menus have no maximum unless the data sets one', async () => {
      const r = await (await post('/api/preview', { selection: { age: 'dragon', features: ['freckles', 'scar', 'mole', 'brows', 'nope'] } })).json();
      assert.match(r.prompt, /an adult woman/);
      assert.doesNotMatch(r.prompt, /dragon/);
      const count = ['freckles', 'scar through one eyebrow', 'beauty mark', 'thick eyebrows'].filter((w) => r.prompt.includes(w)).length;
      assert.equal(count, 4);
    });

    await check('free text replaces a single menu choice and is added to a multi menu', async () => {
      const r = await (await post('/api/preview', { selection: { outfit: 'suit', accessories: ['hat'], custom: { outfit: 'a mustard raincoat', accessories: 'a brass pocket watch', age: '   ' } } })).json();
      assert.match(r.prompt, /a mustard raincoat/);
      assert.doesNotMatch(r.prompt, /tailored formal suit/);
      assert.match(r.prompt, /a hat, a brass pocket watch/);
    });

    await check('a hex colour reaches the prompt with a colour name, inside the group template', async () => {
      const r = await (await post('/api/preview', { selection: { custom: { hairColor: '#3FA068', skin: '#F3DCCD' } } })).json();
      assert.match(r.prompt, /green \(hex #3FA068\) wavy/);
      assert.match(r.prompt, /\(hex #F3DCCD\) skin/);
    });

    await check('advanced render sets ratio and resolution, unknown values keep the layout size', async () => {
      const square = await (await post('/api/preview', { selection: { layout: 'sheet' }, model: 'z-image-turbo', render: { ratio: '1:1', resolution: '1mp' } })).json();
      assert.deepEqual([square.width, square.height], [1024, 1024]);
      const wide = await (await post('/api/preview', { selection: { layout: 'portrait' }, render: { ratio: '16:9', resolution: '2mp' } })).json();
      assert.equal(wide.width > wide.height, true);
      assert.equal(wide.width % 16 + wide.height % 16, 0);
      const bad = await (await post('/api/preview', { selection: { layout: 'fullbody' }, render: { ratio: '99:1' } })).json();
      assert.deepEqual([bad.width, bad.height], [896, 1536]);
    });

    await check('settings: another website cannot post, a key is saved but never shown', async () => {
      const evil = await fetch(APP + '/api/settings', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: JSON.stringify({ provider: 'magnific', key: 'stolen' }) });
      assert.equal(evil.status, 403);
      const gen = await fetch(APP + '/api/generate', { method: 'POST', headers: { 'content-type': 'text/plain', origin: 'https://evil.example' }, body: '{}' });
      assert.equal(gen.status, 403);
      const res = await post('/api/settings', { provider: 'local', comfyUrl: `${MOCK}/` });
      const info = await res.json();
      assert.equal(info.provider, 'local');
      assert.equal(info.comfyUrl, MOCK);
      const saved = await (await post('/api/settings', { provider: 'local', key: 'not-for-local' })).json();
      assert.equal(JSON.stringify(saved).includes('not-for-local'), false);
      assert.match(fs.readFileSync(ENV_FILE, 'utf8'), /COMFY_URL=http:\/\/127\.0\.0\.1:8199/);
    });

    await check('settings: "forget my key" empties the key in .env', async () => {
      const set = await (await post('/api/settings', { provider: 'magnific', key: 'to-forget' })).json();
      assert.equal(set.hasKey.magnific, true);
      const gone = await (await post('/api/settings', { provider: 'magnific', forget: true })).json();
      assert.equal(gone.hasKey.magnific, false);
      assert.equal(fs.readFileSync(ENV_FILE, 'utf8').includes('to-forget'), false);
    });

    await check('age and gender: words for children, a typed age, origin, height and build', async () => {
      const kid = await (await post('/api/preview', { selection: { age: 'child', presentation: 'man', ethnicity: 'eastasian' } })).json();
      assert.match(kid.prompt, /The character is a little boy of East Asian descent\./);
      const typed = await (await post('/api/preview', { selection: { presentation: 'nonbinary', custom: { age: '8', height: '1.32 m (4 ft 4 in)' } } })).json();
      assert.match(typed.prompt, /an 8-year-old child/);
      assert.match(typed.prompt, /1\.32 m \(4 ft 4 in\) tall/);
      const nb = await (await post('/api/preview', { selection: { presentation: 'nonbinary', build: 'heavy', height: 'tall' } })).json();
      assert.match(nb.prompt, /an adult non-binary person/);
      assert.match(nb.prompt, /tall, heavy-set, plus-size build/);
    });

    await check('outfit and accessory images are numbered after the starting images, cut to what the model takes', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const r = await (await post('/api/preview', { selection: {}, model: 'nano-banana-pro', refCounts: { main: 1, outfit: 2, accessories: 3, look: 4 } })).json();
      assert.match(r.prompt, /Use exactly the clothing shown in reference images 2 and 3\./);
      assert.match(r.prompt, /Use exactly the accessories shown in reference images 4, 5 and 6\./);
      assert.match(r.prompt, /colour palette of reference images 7 and 8,/, 'Nano Banana Pro takes 8 images: only two style images fit');
      const text = await (await post('/api/preview', { selection: {}, model: 'z-image-turbo', refCounts: { outfit: 2 } })).json();
      assert.doesNotMatch(text.prompt, /reference image/, 'a text-only model gets no reference sentence');
    });

    await check('style images come after the others; an emotion of the wheel reaches the prompt', async () => {
      const r = await (await post('/api/preview', { selection: { expression: 'anger-1' }, model: 'nano-banana-pro', refCounts: { outfit: 1, look: 2 } })).json();
      assert.match(r.prompt, /Use exactly the clothing shown in reference image 1\./);
      assert.match(r.prompt, /Match the visual style, rendering, lighting and colour palette of reference images 2 and 3/);
      assert.match(r.prompt, /annoyed expression/);
    });

    await check('no em or en dashes in any prompt text', async () => {
      const r = await (await post('/api/preview', { selection: cfg.presets[0].selection, extra: 'x' })).json();
      assert.doesNotMatch(r.prompt, /[\u2013\u2014]/);
    });

    let job;
    await check('generate sends the right values into the workflow', async () => {
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, extra: 'a red scarf', seed: 424242 });
      assert.equal(res.status, 200);
      job = await res.json();
      assert.equal(job.seed, 424242);
      const sent = await (await fetch(MOCK + '/__last')).json();
      assert.match(sent['4'].inputs.text, /a red scarf/);
      assert.equal(sent['8'].inputs.seed, 424242);
      assert.equal(sent['7'].inputs.width, 1024);
      assert.equal(sent['7'].inputs.height, 1280);
      assert.deepEqual(sent['4'].inputs.clip, ['2', 0], 'links must stay intact');
    });

    await check('job goes from waiting to done and returns an image link', async () => {
      const seen = new Set();
      let result;
      for (let i = 0; i < 30; i++) {
        result = await (await fetch(`${APP}/api/job?id=${job.promptId}`)).json();
        seen.add(result.status);
        if (result.status === 'done') break;
        await sleep(300);
      }
      assert.equal(result.status, 'done');
      assert.ok(seen.has('queued') || seen.has('running'));
      assert.equal(result.images.length, 1);
      const img = await fetch(APP + result.images[0].url);
      assert.equal(img.status, 200);
      assert.equal(img.headers.get('content-type'), 'image/png');
      assert.ok((await img.arrayBuffer()).byteLength > 20);
    });

    await check('MOSS-Image uses its own workflow, our prompt goes straight to the encoder', async () => {
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'moss-image', seed: 9 });
      assert.equal(res.status, 200, await res.clone().text());
      const wf = await (await fetch(MOCK + '/__last')).json();
      const encoder = wf['18:4'];
      assert.equal(encoder.class_type, 'CLIPTextEncode');
      assert.match(encoder.inputs.text, /character/i);
      assert.equal(wf['18:11'], undefined, 'the TextGenerate node is not sent');
      assert.equal(wf['18:13'], undefined, 'the text preview is not sent');
      assert.equal(wf['18:7'].inputs.seed, 9);
      assert.equal(typeof wf['18:6'].inputs.width, 'number');
    });

    await check('FLUX 3 Klein and Qwen-Image 2.1 on this PC without images: text-to-image workflows, prompt in their encoder', async () => {
      let res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'flux-3-klein', seed: 4 });
      assert.equal(res.status, 200, await res.clone().text());
      let wf = await (await fetch(MOCK + '/__last')).json();
      assert.equal(wf['18:1'].inputs.unet_name, 'flux3-image-klein-base-int8-convrot.safetensors');
      assert.match(wf['18:4'].inputs.text, /The character is/);
      assert.doesNotMatch(wf['18:4'].inputs.text, /reference image/);
      assert.equal(wf['18:11'], undefined, 'no LLM rewrite');
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'qwen-2-1', seed: 4 });
      assert.equal(res.status, 200, await res.clone().text());
      wf = await (await fetch(MOCK + '/__last')).json();
      assert.equal(wf['459:452'].class_type, 'TextEncodeQwenImage21');
      assert.match(wf['459:452'].inputs.prompt, /The character is/);
      assert.equal(wf['459:458'].inputs.seed, 4);
      assert.equal(typeof wf['459:456'].inputs.width, 'number');
      assert.equal(wf['459:471'], undefined, 'no LLM rewrite');
      assert.ok(wf['461'], 'the Save Image (Advanced) node is kept');
    });

    await check('FLUX 3 Klein and Qwen-Image 2.1 on this PC with images: sent to ComfyUI, then wired into the editing workflow', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      let res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'flux-3-klein', seed: 4, refs: [png, png, png, png, png], refMode: 'sheet' });
      assert.equal(res.status, 200, await res.clone().text());
      let wf = await (await fetch(MOCK + '/__last')).json();
      assert.equal(wf['17'].class_type, 'ReferenceMultiLatent');
      assert.deepEqual(Object.keys(wf['17'].inputs).filter((k) => k.startsWith('images.')), ['images.image0', 'images.image1', 'images.image2', 'images.image3', 'images.image4']);
      assert.match(wf[wf['17'].inputs['images.image0'][0]].inputs.image, /^kara_ref_/);
      assert.match(wf['4'].inputs.text, /reference image/);
      assert.equal(wf['54'], undefined, 'the sample image of the template is not loaded');
      assert.equal(wf['47'], undefined, 'no LLM rewrite');
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'qwen-2-1', seed: 4, refs: [png, png], refMode: 'sheet' });
      assert.equal(res.status, 200, await res.clone().text());
      wf = await (await fetch(MOCK + '/__last')).json();
      assert.deepEqual(Object.keys(wf['459:474'].inputs).filter((k) => k.startsWith('images.')), ['images.image_1', 'images.image_2']);
      assert.match(wf['459:474'].inputs.prompt, /reference image/);
      assert.ok((await (await fetch(MOCK + '/__uploads')).json()).length >= 6);
    });

    await check('face drawing as a guide: Z-Image on this PC uses the ControlNet workflow, as a portrait', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const preview = await (await post('/api/preview', { selection: { layout: 'sheet' }, model: 'z-image-turbo', guide: true })).json();
      assert.equal(preview.guided, true);
      assert.match(preview.prompt, /^Close-up head and shoulders portrait/);
      const res = await post('/api/generate', { selection: { layout: 'sheet' }, model: 'z-image-turbo', seed: 5, guide: png });
      assert.equal(res.status, 200, await res.clone().text());
      const wf = await (await fetch(MOCK + '/__last')).json();
      assert.equal(wf['15'].class_type, 'QwenImageDiffsynthControlnet');
      assert.match(wf['11'].inputs.image, /^kara_ref_/);
      assert.equal(wf['12'].inputs.width, wf['7'].inputs.width);
      assert.equal(wf['12'].inputs.height, wf['7'].inputs.height);
      assert.ok(wf['7'].inputs.height > wf['7'].inputs.width, 'portrait size');
      assert.doesNotMatch(wf['4'].inputs.text, /schematic drawing/, 'no reference sentence: the drawing steers the image itself');
      assert.equal(typeof wf['15'].inputs.strength, 'number', 'a strength is always set');
    });

    await check('face drawing strength: the page\'s slider value reaches the ControlNet node, kept between 0.2 and 0.9', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const send = async (guideStrength) => {
        const res = await post('/api/generate', { selection: {}, model: 'z-image-turbo', seed: 6, guide: png, guideStrength });
        assert.equal(res.status, 200, await res.clone().text());
        return (await (await fetch(MOCK + '/__last')).json())['15'].inputs.strength;
      };
      assert.equal(await send(0.4), 0.4);
      assert.equal(await send(5), 0.9, 'too high is cut to 0.9');
      assert.equal(await send(0), 0.2, 'too low is raised to 0.2');
      const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', 'zimage_turbo_guide.api.json'), 'utf8'));
      assert.equal(await send(undefined), base['15'].inputs.strength, 'without a value, the workflow keeps its own strength');
    });

    await check('face drawing as a guide on a model that takes images: sent as a reference image, numbered after the starting images', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const preview = await (await post('/api/preview', { selection: {}, model: 'flux-3-klein', refCounts: { main: 1, guide: 1 }, hasRefs: true, refMode: 'inspire' })).json();
      assert.match(preview.prompt, /Reference image 2 is a blurred schematic drawing of the face/);
      const res = await post('/api/generate', { selection: {}, model: 'flux-3-klein', seed: 4, guide: png });
      assert.equal(res.status, 200, await res.clone().text());
      const wf = await (await fetch(MOCK + '/__last')).json();
      assert.deepEqual(Object.keys(wf['17'].inputs).filter((k) => k.startsWith('images.')), ['images.image0']);
      assert.match(wf['4'].inputs.text, /Reference image 1 is a blurred schematic drawing/);
    });

    await check('random seed is used when none is given', async () => {
      const r = await (await post('/api/generate', {})).json();
      assert.ok(Number.isInteger(r.seed) && r.seed >= 0);
    });

    await check('static files are served and path tricks are refused', async () => {
      assert.equal((await fetch(APP + '/')).status, 200);
      assert.equal((await fetch(APP + '/app.js')).status, 200);
      const bad = await fetch(APP + '/..%2Fserver.js');
      assert.ok([403, 404].includes(bad.status));
      const bad2 = await fetch(APP + '/api/image?filename=..%2F..%2Fsecret');
      assert.equal(bad2.status, 400);
    });

    await check('workflow name cannot escape the workflows folder', async () => {
      const res = await post('/api/generate', { workflow: '../package.json' });
      assert.equal(res.status, 500);
    });
  } finally {
    mock.kill();
    app.kill();
  }

  // Second round: ComfyUI refuses the job, then ComfyUI is not running at all.
  const failing = start('test/mock-comfy.js', { MOCK_FAIL: '1' });
  const app2 = start('server.js', { PORT: '3299', COMFY_URL: MOCK, ...LOCAL });
  try {
    await waitFor(MOCK + '/system_stats');
    await waitFor(APP + '/api/status');
    await check('a missing model file says to install the model, not the raw ComfyUI message', async () => {
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.equal(body.code, 'nomodel');
      assert.match(body.error, /Install the model/);
    });
  } finally {
    failing.kill();
  }
  await sleep(300);
  try {
    await check('ComfyUI down: status says so, generate explains', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, false);
      assert.match(s.error, /Cannot reach ComfyUI/);
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /Cannot reach ComfyUI/);
    });
  } finally {
    app2.kill();
  }

  await cloudRound('good key, active account', { key: 'test-key', account: 'active' }, async () => {
    await check('cloud: status connected, key never shown to the browser', async () => {
      const raw = await (await fetch(APP + '/api/status')).text();
      const s = JSON.parse(raw);
      assert.equal(s.ok, true);
      assert.equal(s.mode, 'cloud');
      assert.doesNotMatch(raw, /test-key/);
      const cfg = await (await fetch(APP + '/api/config')).text();
      assert.doesNotMatch(cfg, /test-key/);
      assert.equal(JSON.parse(cfg).mode, 'cloud');
    });

    let job;
    await check('cloud: generate sends only the workflow, with our values', async () => {
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, extra: 'a green coat', seed: 777 });
      assert.equal(res.status, 200);
      job = await res.json();
      const sent = await (await fetch(MOCK + '/__cloud')).json();
      assert.deepEqual(Object.keys(sent.lastBody), ['prompt']);
      assert.match(sent.lastBody.prompt['4'].inputs.text, /a green coat/);
      assert.equal(sent.lastBody.prompt['8'].inputs.seed, 777);
    });

    await check('cloud: job goes through waiting to done, image comes through the signed link', async () => {
      const seen = new Set();
      let result;
      for (let i = 0; i < 30; i++) {
        result = await (await fetch(`${APP}/api/job?id=${job.promptId}`)).json();
        seen.add(result.status);
        if (result.status === 'done') break;
        await sleep(300);
      }
      assert.equal(result.status, 'done');
      assert.ok(seen.has('queued') || seen.has('running'));
      assert.equal(result.images.length, 1);
      const img = await fetch(APP + result.images[0].url);
      assert.equal(img.status, 200);
      assert.equal(img.headers.get('content-type'), 'image/png');
      const sent = await (await fetch(MOCK + '/__cloud')).json();
      assert.equal(sent.leakedKey, false, 'the API key must not reach the signed storage link');
    });

    await check('cloud: cancel reaches Comfy Cloud', async () => {
      await post('/api/cancel', {});
      const sent = await (await fetch(MOCK + '/__cloud')).json();
      assert.equal(sent.interrupted, 1);
    });
  });

  await cloudRound('wrong key', { key: 'nope', account: 'active' }, async () => {
    await check('cloud: wrong key gives a clear status and generate message', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, false);
      assert.equal(s.code, 'badkey');
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /refused the API key/);
    });
  });

  await cloudRound('no key', { key: '', account: 'active' }, async () => {
    await check('cloud: missing key is explained, nothing is sent', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.code, 'nokey');
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /COMFY_CLOUD_API_KEY/);
    });
  });

  await cloudRound('inactive subscription', { key: 'test-key', account: 'waitlisted' }, async () => {
    await check('cloud: inactive account is reported', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, false);
      assert.equal(s.code, 'nosub');
    });
  });

  await cloudRound('no credits', { key: 'test-key', account: 'nocredits' }, async () => {
    await check('cloud: out of credits gives a readable message', async () => {
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /credits/);
    });
  });

  // Magnific (not ComfyUI): prompt, seed and size only
  const magnificRound = async (label, key, body) => {
    console.log(`  -- magnific: ${label}`);
    const mock = start('test/mock-comfy.js', { MOCK_DELAY: '1800' });
    const app = start('server.js', { PORT: '3299', COMFY_MODE: 'magnific', MAGNIFIC_URL: MOCK, MAGNIFIC_API_KEY: key, COMFY_CLOUD_API_KEY: '' });
    try {
      await waitFor(MOCK + '/system_stats');
      await waitFor(APP + '/api/status');
      await body();
    } finally {
      mock.kill();
      app.kill();
      await sleep(300);
    }
  };

  await magnificRound('good key', 'test-key', async () => {
    await check('magnific: status connected, key never shown to the browser', async () => {
      const raw = await (await fetch(APP + '/api/status')).text();
      assert.equal(JSON.parse(raw).ok, true);
      assert.equal(JSON.parse(raw).mode, 'magnific');
      assert.doesNotMatch(raw, /test-key/);
    });
    let job;
    await check('magnific: generate sends prompt, seed and the closest size', async () => {
      const res = await post('/api/generate', { selection: { layout: 'fullbody' }, extra: 'a blue hat', seed: 99 });
      assert.equal(res.status, 200);
      job = await res.json();
      const sent = (await (await fetch(MOCK + '/__cloud')).json()).lastBody;
      assert.match(sent.prompt, /a blue hat/);
      assert.equal(sent.seed, 99);
      assert.equal(sent.image_size, 'portrait_9_16');
    });
    await check('magnific: GPT Image 2.5 with a reference image goes to the edit route, and its job is followed there', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'gpt-image-2-5-sunburst', seed: 3, refs: [png], refMode: 'inspire', render: { ratio: 'auto', resolution: '1k' } });
      assert.equal(res.status, 200, await res.clone().text());
      const started = await res.json();
      const cloud = await (await fetch(MOCK + '/__cloud')).json();
      assert.equal(cloud.lastPath, '/v1/ai/text-to-image/gpt-image-2-5-edit');
      assert.equal(cloud.lastBody.variant, 'sunburst');
      assert.deepEqual(cloud.lastBody.reference_images, ['iVBORw0KGgo=']);
      assert.equal(cloud.lastBody.seed, undefined, 'GPT Image takes no seed');
      assert.match(started.promptId, /^gpt-image-2-5-sunburst\+edit:/);
      let result;
      for (let i = 0; i < 30; i++) {
        result = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(started.promptId)}`)).json();
        if (result.status === 'done') break;
        await sleep(300);
      }
      assert.equal(result.status, 'done');
      const nb = await post('/api/generate', { selection: {}, model: 'nano-banana-pro', seed: 3, refs: [png], refMode: 'inspire' });
      assert.equal(nb.status, 200, await nb.clone().text());
      const sent = await (await fetch(MOCK + '/__cloud')).json();
      assert.equal(sent.lastPath, '/v1/ai/text-to-image/nano-banana-pro');
      assert.deepEqual(sent.lastBody.reference_images, [{ image: 'iVBORw0KGgo=', mime_type: 'image/png' }]);
    });
    await check('magnific: job finishes and the image is served, only for links Magnific returned', async () => {
      let result;
      for (let i = 0; i < 30; i++) {
        result = await (await fetch(`${APP}/api/job?id=${job.promptId}`)).json();
        if (result.status === 'done') break;
        await sleep(300);
      }
      assert.equal(result.status, 'done');
      const img = await fetch(APP + result.images[0].url);
      assert.equal(img.status, 200);
      assert.equal(img.headers.get('content-type'), 'image/png');
      assert.equal((await (await fetch(MOCK + '/__cloud')).json()).leakedKey, false);
      const other = await fetch(`${APP}/api/image?${new URLSearchParams({ filename: 'http://127.0.0.1:1/x.png', subfolder: '', type: 'url' })}`);
      assert.equal(other.status, 500, 'a link Magnific never returned must be refused');
    });
    await check('magnific: size choice follows the aspect ratio', async () => {
      const { pickSize } = require('../lib/magnific-api');
      assert.equal(pickSize('z-image-turbo', 1024, 1280), 'portrait_3_4');
      assert.equal(pickSize('z-image-turbo', 1792, 1024), 'landscape_16_9');
      assert.equal(pickSize('z-image-turbo', 1024, 1024), 'square_hd');
      assert.equal(pickSize('z-image-turbo', 896, 1536), 'portrait_9_16');
    });
  });

  await magnificRound('wrong key', 'nope', async () => {
    await check('magnific: wrong key is reported', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.code, 'badkey');
      const res = await post('/api/generate', {});
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /refused the API key/);
    });
  });

  await magnificRound('no key', '', async () => {
    await check('magnific: missing key is explained', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.code, 'nokey');
      assert.match(s.error, /MAGNIFIC_API_KEY/);
    });
  });

  // .env loader
  await check('.env loader reads values, quotes and comments, and never overrides real variables', async () => {
    const env = require('../lib/env');
    const v = env.parse('﻿# note\nA=1\nexport B="two words"\nC=three # trailing\nbad line\n');
    assert.deepEqual(v, { A: '1', B: 'two words', C: 'three' });
  });

  const kieRound = async (label, key, body) => {
    console.log(`  -- kie: ${label}`);
    const mock = start('test/mock-comfy.js', { MOCK_DELAY: '900' });
    const app = start('server.js', { PORT: '3299', COMFY_MODE: 'kie', KIE_URL: MOCK, KIE_UPLOAD_URL: MOCK, KIE_API_KEY: key, MAGNIFIC_API_KEY: '', COMFY_CLOUD_API_KEY: '' });
    try {
      await waitFor(MOCK + '/system_stats');
      await waitFor(APP + '/api/status');
      await body();
    } finally {
      mock.kill();
      app.kill();
      await sleep(300);
    }
  };

  await kieRound('good key', 'test-key', async () => {
    await check('kie: status shows the balance, key never shown to the browser', async () => {
      const text = await (await fetch(APP + '/api/status')).text();
      const s = JSON.parse(text);
      assert.equal(s.ok, true);
      assert.equal(s.credits, 1000);
      assert.equal(text.includes('test-key'), false);
    });
    await check('kie: Qwen 2.1 uploads the reference images, then asks for image-to-image with them', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const res = await post('/api/generate', { selection: { layout: 'fullbody' }, model: 'qwen-2-1', refs: [png, png], refMode: 'sheet', seed: 11, render: { ratio: '9:16', resolution: '2k' } });
      assert.equal(res.status, 200);
      const job = await res.json();
      assert.match(job.promptId, /^kie:/);
      const seen = await (await fetch(MOCK + '/__kie')).json();
      assert.equal(seen.uploads.length, 2);
      assert.equal(seen.last.model, 'qwen2-1/image-to-image');
      assert.equal(seen.last.input.image_urls.length, 2);
      assert.match(seen.last.input.image_urls[0], /\/kie-files\/1\.jpg$/);
      assert.equal(seen.last.input.aspect_ratio, '9:16');
      assert.equal(seen.last.input.resolution, '2K');
      assert.equal(seen.last.input.seed, 11);
      let r;
      for (let i = 0; i < 20; i++) {
        r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(job.promptId)}`)).json();
        if (r.status === 'done' || r.status === 'error') break;
        await sleep(200);
      }
      assert.equal(r.status, 'done');
      const img = await fetch(APP + r.images[0].url);
      assert.equal(img.status, 200);
      assert.equal((await (await fetch(MOCK + '/__cloud')).json()).leakedKey, false);
    });
    await check('kie: Z-Image without images is text to image, no seed sent', async () => {
      const res = await post('/api/generate', { selection: {}, model: 'z-image-turbo', seed: 5 });
      assert.equal(res.status, 200);
      const seen = await (await fetch(MOCK + '/__kie')).json();
      assert.equal(seen.last.model, 'z-image');
      assert.equal(seen.last.input.seed, undefined);
    });
  });

  const falRound = async (label, key, body) => {
    console.log(`  -- fal: ${label}`);
    const mock = start('test/mock-comfy.js', { MOCK_DELAY: '900' });
    const app = start('server.js', { PORT: '3299', COMFY_MODE: 'fal', FAL_QUEUE_URL: MOCK, FAL_API_URL: MOCK, FAL_KEY: key, KIE_URL: MOCK, KIE_UPLOAD_URL: MOCK, KIE_API_KEY: key, MAGNIFIC_API_KEY: '', COMFY_CLOUD_API_KEY: '' });
    try {
      await waitFor(MOCK + '/system_stats');
      await waitFor(APP + '/api/status');
      await body();
    } finally {
      mock.kill();
      app.kill();
      await sleep(300);
    }
  };

  // Installing the local model files: ComfyUI says where its folders are, the app downloads what is missing.
  {
    console.log('  -- local model install');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-comfy-'));
    const mock = start('test/mock-comfy.js', { MOCK_COMFY_DIR: dir });
    const app = start('server.js', { PORT: '3299', COMFY_MODE: 'local', COMFY_URL: MOCK, MODELS_URL: MOCK + '/hf', COMFY_DIR: '' });
    try {
      await waitFor(MOCK + '/system_stats');
      await waitFor(APP + '/api/status');
      await check('local: missing model files are listed, installed in the ComfyUI folders, then seen as present', async () => {
        let st = await (await fetch(APP + '/api/local/models?model=z-image-turbo')).json();
        assert.equal(st.comfy, true);
        assert.equal(st.canInstall, true);
        assert.deepEqual(st.files.map((f) => f.present), [false, false, false, false]);
        const res = await post('/api/local/install', { model: 'z-image-turbo' });
        assert.equal(res.status, 200, await res.clone().text());
        for (let i = 0; i < 40 && st.progress.state !== 'done'; i++) {
          await sleep(100);
          st = await (await fetch(APP + '/api/local/models?model=z-image-turbo')).json();
        }
        assert.equal(st.progress.state, 'done', JSON.stringify(st.progress));
        assert.deepEqual(st.files.map((f) => f.present), [true, true, true, true]);
        assert.ok(fs.existsSync(path.join(dir, 'models', 'vae', 'ae.safetensors')));
        const other = await fetch(APP + '/api/local/install', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}' });
        assert.equal(other.status, 403, 'another website cannot start a download');
      });
      await check('local: MOSS, Qwen 2.1, Z-Image Base and HiDream list their files with sizes; FLUX 3 Klein is gated and cannot be downloaded by the app', async () => {
        for (const [model, n] of [['moss-image', 3], ['qwen-2-1', 3], ['z-image-base', 3], ['hidream-i1', 6]]) {
          const st = await (await fetch(APP + '/api/local/models?model=' + model)).json();
          assert.equal(st.supported, true);
          assert.equal(st.files.length, n);
          // Z-Image Base shares its text encoder and VAE with Turbo, installed a few checks earlier: only some files are missing.
          assert.ok(st.files.every((f) => f.gb > 0), model);
          assert.ok(st.files.some((f) => !f.present), model);
          assert.equal(st.canInstall, true);
        }
        const moss = await post('/api/local/install', { model: 'moss-image' });
        assert.equal(moss.status, 200, await moss.clone().text());
        let st = await (await fetch(APP + '/api/local/models?model=moss-image')).json();
        for (let i = 0; i < 40 && st.progress.state !== 'done'; i++) {
          await sleep(100);
          st = await (await fetch(APP + '/api/local/models?model=moss-image')).json();
        }
        assert.equal(st.progress.state, 'done', JSON.stringify(st.progress));
        assert.deepEqual(st.files.map((f) => f.present), [true, true, true]);
        const klein = await (await fetch(APP + '/api/local/models?model=flux-3-klein')).json();
        assert.match(klein.gated, /huggingface\.co\/black-forest-labs/);
        assert.equal(klein.needsToken, true, 'without a Hugging Face token the gated model cannot be downloaded');
        assert.equal(klein.canInstall, false);
        assert.ok(klein.files.every((f) => f.gb > 0), 'sizes are known');
        // Deleting an installed model frees its files (and only those), an unknown name is refused.
        const gone = await post('/api/local/delete', { model: 'moss-image' });
        assert.equal(gone.status, 200, await gone.clone().text());
        const goneBody = await gone.json();
        assert.equal(goneBody.deleted.length, 3);
        assert.deepEqual(goneBody.status.files.map((x) => x.present), [false, false, false]);
        assert.equal(fs.existsSync(path.join(dir, 'models', 'vae', 'flux2-vae_small.safetensors')), false);
        assert.equal(fs.existsSync(path.join(dir, 'models', 'vae', 'ae.safetensors')), true, 'a file of another model stays');
        assert.equal((await post('/api/local/delete', { model: '../../etc' })).status, 400);
        // Stopping when nothing runs is harmless, and a stopped download is paused, not an error.
        const idle = await post('/api/local/install/cancel', { model: 'moss-image' });
        assert.equal(idle.status, 200);
        assert.notEqual((await idle.json()).progress.state, 'error');
        const refused = await post('/api/local/install', { model: 'flux-3-klein' });
        assert.equal(refused.status, 400);
        assert.match((await refused.json()).error, /token/i);
      });
    } finally {
      mock.kill();
      app.kill();
      fs.rmSync(dir, { recursive: true, force: true });
      await sleep(300);
    }
  }

  await kieRound('new models', 'test-key', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const sent = async (body) => {
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, seed: 5, ...body });
      assert.equal(res.status, 200, await res.clone().text());
      return (await (await fetch(MOCK + '/__kie')).json()).last;
    };
    await check('kie: Nano Banana Pro sends its images in image_input, with its own resolution names', async () => {
      const last = await sent({ model: 'nano-banana-pro', refs: [png, png], refMode: 'sheet', render: { ratio: '3:4', resolution: '2k' } });
      assert.equal(last.model, 'nano-banana-pro');
      assert.equal(last.input.image_input.length, 2);
      assert.equal(last.input.resolution, '2K');
      assert.equal(last.input.aspect_ratio, '3:4');
      assert.equal(last.input.seed, undefined, 'Nano Banana takes no seed');
    });
    await check('kie: Seedream 5 Pro sets its size by quality; GPT Image 2 switches to image-to-image with input_urls', async () => {
      const sd = await sent({ model: 'seedream-5-pro', render: { ratio: '16:9', resolution: '2k' } });
      assert.equal(sd.model, 'seedream/5-pro-text-to-image');
      assert.equal(sd.input.quality, 'high');
      assert.equal(sd.input.aspect_ratio, '16:9');
      const gpt = await sent({ model: 'gpt-image-2', refs: [png], refMode: 'sheet' });
      assert.equal(gpt.model, 'gpt-image-2-image-to-image');
      assert.equal(gpt.input.input_urls.length, 1);
    });
  });

  await falRound('new models', 'test-key', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    await check('fal: Krea 3 goes to its edit endpoint with a size in multiples of 16; Nano Banana Pro gets a ratio; MOSS-Image keeps our prompt', async () => {
      let res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'krea-3', refs: [png], refMode: 'sheet', seed: 8 });
      assert.equal(res.status, 200, await res.clone().text());
      let seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/krea/v3/edit');
      assert.equal(seen.last.image_size.width % 16, 0);
      assert.equal(seen.last.image_size.height % 16, 0);
      assert.equal(seen.last.seed, 8);
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'nano-banana-pro', seed: 8, render: { ratio: '4:5', resolution: '4k' } });
      assert.equal(res.status, 200, await res.clone().text());
      seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/fal-ai/nano-banana-pro');
      assert.equal(seen.last.aspect_ratio, '4:5');
      assert.equal(seen.last.resolution, '4K');
      assert.equal(seen.last.image_size, undefined);
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'moss-image', seed: 8 });
      assert.equal(res.status, 200, await res.clone().text());
      seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/fal-ai/moss-image');
      assert.equal(seen.last.enable_prompt_expansion, false, 'our prompt is used as is');
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'gpt-image-2-5-flare', refs: [png], refMode: 'sheet', seed: 8 });
      assert.equal(res.status, 200, await res.clone().text());
      seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/openai/gpt-image-2.5/flare/edit');
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'nano-banana-2-1', seed: 8, render: { ratio: '3:4', resolution: '2k' } });
      assert.equal(res.status, 200, await res.clone().text());
      seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/google/nano-banana-2.1');
      assert.equal(seen.last.resolution, '2K');
      res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'flux-3-klein', refs: [png, png], refMode: 'sheet', seed: 8 });
      assert.equal(res.status, 200, await res.clone().text());
      seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/blackforestlabs/flux-3/klein/edit-image');
      assert.equal(seen.last.image_urls.length, 2);
    });
  });

  await falRound('good key', 'test-key', async () => {
    await check('fal: FLUX 3 Klein sends the images as data URIs to the edit endpoint, exact size, then the result', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, true);
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const res = await post('/api/generate', { selection: { layout: 'portrait' }, model: 'flux-3-klein', refs: [png, png, png, png, png], refMode: 'sheet', seed: 21 });
      assert.equal(res.status, 200);
      const job = await res.json();
      assert.match(job.promptId, /^fal:/);
      const seen = await (await fetch(MOCK + '/__fal')).json();
      assert.equal(seen.path, '/blackforestlabs/flux-3/klein/edit-image');
      assert.equal(seen.last.image_urls.length, 5);
      assert.deepEqual(seen.last.image_size, { width: 1024, height: 1280 });
      assert.equal(seen.last.seed, 21);
      let r;
      for (let i = 0; i < 20; i++) {
        r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(job.promptId)}`)).json();
        if (r.status === 'done' || r.status === 'error') break;
        await sleep(200);
      }
      assert.equal(r.status, 'done');
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
      assert.equal((await (await fetch(MOCK + '/__cloud')).json()).leakedKey, false);
    });
    await check('balance: fal in dollars, Magnific has none, the page never sees a key', async () => {
      const text = await (await fetch(APP + '/api/balance?provider=fal')).text();
      const b = JSON.parse(text);
      assert.equal(b.amount, 24.5);
      assert.equal(b.unit, 'USD');
      assert.equal(text.includes('test-key'), false);
      assert.equal((await (await fetch(APP + '/api/balance?provider=magnific')).json()).error, 'unsupported');
      assert.equal((await (await fetch(APP + '/api/balance?provider=kie')).json()).amount, 1000);
    });
    await check('each request picks its provider: KIE through the header while the default is fal, image link carries it', async () => {
      const res = await fetch(APP + '/api/generate', { method: 'POST', headers: { 'content-type': 'application/json', 'x-user-provider': 'kie' }, body: JSON.stringify({ selection: {}, model: 'qwen-2-1', seed: 4 }) });
      assert.equal(res.status, 200);
      const job = await res.json();
      assert.match(job.promptId, /^kie:/);
      assert.equal((await (await fetch(MOCK + '/__kie')).json()).last.model, 'qwen2-1/text-to-image');
      let r;
      for (let i = 0; i < 20; i++) {
        r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(job.promptId)}`, { headers: { 'x-user-provider': 'kie' } })).json();
        if (r.status === 'done' || r.status === 'error') break;
        await sleep(200);
      }
      assert.equal(r.status, 'done');
      assert.match(r.images[0].url, /provider=kie/);
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.mode, 'fal', 'without the header, the default provider is unchanged');
    });
    await check('fal: a job id pointing to another host is refused (the key never leaves for it)', async () => {
      const forged = 'fal:' + Buffer.from(JSON.stringify({ s: 'https://evil.example/x', r: 'https://evil.example/y' })).toString('base64');
      const r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(forged)}`)).json();
      assert.equal(r.status, 'error');
    });
  });

  await falRound('wrong key', 'nope', async () => {
    await check('fal: wrong key is reported', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.code, 'badkey');
    });
  });

  const routerRound = async (label, key, body) => {
    console.log(`  -- comfy router: ${label}`);
    const mock = start('test/mock-comfy.js', { MOCK_DELAY: '900' });
    const app = start('server.js', { PORT: '3299', COMFY_MODE: 'router', COMFY_ROUTER_URL: MOCK, COMFY_CLOUD_API_KEY: key, MAGNIFIC_API_KEY: '', KIE_API_KEY: '', FAL_KEY: '' });
    try {
      await waitFor(MOCK + '/system_stats');
      await waitFor(APP + '/api/status');
      await body();
    } finally {
      mock.kill();
      app.kill();
      await sleep(300);
    }
  };
  const routerWait = async (id) => {
    let r;
    for (let i = 0; i < 20; i++) {
      r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent(id)}`)).json();
      if (r.status === 'done' || r.status === 'error') break;
      await sleep(200);
    }
    return r;
  };

  await routerRound('good key', 'test-key', async () => {
    await check('comfy router: Nano Banana Pro gets the native Gemini body (images inline, ratio, 2K), the image comes back from bytes', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, true);
      assert.equal(s.mode, 'router');
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const res = await post('/api/generate', { selection: { layout: 'sheet' }, model: 'nano-banana-pro', refs: [png, png], refMode: 'sheet', render: { ratio: 'auto', resolution: '2k' }, seed: 5 });
      assert.equal(res.status, 200);
      const job = await res.json();
      assert.match(job.promptId, /^router:vertexai\/gemini-3-pro-image\|/);
      const seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/vertexai/gemini-3-pro-image/requests');
      assert.ok(seen.idem, 'each submit carries an Idempotency-Key');
      const parts = seen.last.contents[0].parts;
      assert.equal(parts.length, 3);
      assert.deepEqual(parts[1], { inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } });
      assert.equal(seen.last.generationConfig.imageConfig.aspectRatio, '16:9');
      assert.equal(seen.last.generationConfig.imageConfig.imageSize, '2K');
      const r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      assert.match(r.images[0].url, /filename=router-/);
      const img = await fetch(APP + r.images[0].url);
      assert.equal(img.status, 200);
      assert.equal(img.headers.get('content-type'), 'image/png');
    });
    await check('comfy router: Seedream 5 Flash and GPT Image 2.5 get their own bodies, links and bytes both come back, the key never reaches the image link', async () => {
      let job = await (await post('/api/generate', { selection: {}, model: 'seedream-5-flash', seed: 9 })).json();
      let seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/byteplus/seedream-5-0-flash-260915/requests');
      assert.equal(seen.last.watermark, false);
      assert.equal(seen.last.seed, 9);
      let r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
      assert.equal((await (await fetch(MOCK + '/__cloud')).json()).leakedKey, false);
      job = await (await post('/api/generate', { selection: { layout: 'portrait' }, model: 'gpt-image-2-5-flare' })).json();
      seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/openai/gpt-image-2.5-flare/requests');
      assert.equal(seen.last.quality, 'high');
      assert.match(seen.last.size, /^\d+x\d+$/);
      r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
    });
    await check('comfy router: Qwen-Image 3, FLUX 2 and Krea 2 Turbo get their own bodies and their images come back', async () => {
      let job = await (await post('/api/generate', { selection: { layout: 'portrait' }, model: 'qwen-3-pro', seed: 5 })).json();
      let seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/qwen/qwen-image-3.0-pro/requests');
      assert.equal(seen.last.input.messages[0].role, 'user');
      assert.ok(seen.last.input.messages[0].content.at(-1).text);
      assert.match(seen.last.parameters.size, /^\d+\*\d+$/);
      assert.equal(seen.last.parameters.prompt_extend, false);
      let r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
      job = await (await post('/api/generate', { selection: { layout: 'portrait' }, model: 'flux-2-pro', seed: 6 })).json();
      seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/bfl/flux-2-pro/requests');
      assert.ok(seen.last.width >= 256 && seen.last.width <= 2048 && seen.last.width % 16 === 0);
      assert.ok(seen.last.height >= 256 && seen.last.height <= 2048);
      assert.equal(seen.last.output_format, 'png');
      r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      job = await (await post('/api/generate', { selection: { layout: 'portrait' }, model: 'krea-2-turbo', seed: 7 })).json();
      seen = await (await fetch(MOCK + '/__router')).json();
      assert.equal(seen.path, '/v2/models/krea/krea-2-medium-turbo/requests');
      assert.equal(seen.last.resolution, '1K');
      r = await routerWait(job.promptId);
      assert.equal(r.status, 'done');
      assert.equal((await fetch(APP + r.images[0].url)).status, 200);
    });
    await check('comfy router: a forged job id is refused', async () => {
      const r = await (await fetch(`${APP}/api/job?id=${encodeURIComponent('router:evil/../../x|12345678')}`)).json();
      assert.equal(r.status, 'error');
    });
  });

  await routerRound('wrong key', 'nope', async () => {
    await check('comfy router: wrong key is reported', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, false);
      assert.equal(s.code, 'badkey');
    });
  });

  await kieRound('wrong key', 'nope', async () => {
    await check('kie: wrong key is reported, generate explains', async () => {
      const s = await (await fetch(APP + '/api/status')).json();
      assert.equal(s.ok, false);
      assert.equal(s.code, 'badkey');
      const res = await post('/api/generate', { selection: {}, model: 'qwen-2-1' });
      assert.equal(res.status, 500);
      assert.match((await res.json()).error, /KIE refused the API key/);
    });
  });

  await check('update: a copy without git is replaced from the archive, .env kept, nothing written outside', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-update-'));
    fs.writeFileSync(path.join(dir, '.env'), 'MINE=1\n');
    fs.writeFileSync(path.join(dir, 'server.js'), '// old\n');
    const mock = start('test/mock-comfy.js', {});
    try {
      await waitFor(MOCK + '/system_stats');
      Object.assign(process.env, { UPDATE_ROOT: dir, UPDATE_API_URL: MOCK, UPDATE_ARCHIVE_URL: MOCK });
      const updater = require('../lib/update');
      const before = await updater.status();
      assert.equal(before.current, null);
      assert.equal(before.available, true);
      const r = await updater.update();
      assert.equal(r.via, 'archive');
      assert.equal(fs.readFileSync(path.join(dir, 'server.js'), 'utf8'), '// new server\n');
      assert.equal(fs.readFileSync(path.join(dir, 'public', 'app.js'), 'utf8'), '// new page\n');
      assert.equal(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'MINE=1\n');
      assert.equal(fs.existsSync(path.join(path.dirname(dir), 'outside.txt')), false);
      assert.equal((await updater.status()).available, false);
    } finally {
      mock.kill();
      fs.rmSync(dir, { recursive: true, force: true });
      await sleep(300);
    }
  });

  try {
    fs.unlinkSync(ENV_FILE);
  } catch (err) {
    /* nothing was saved */
  }
  console.log(`\n${passed} checks passed${process.exitCode ? ', some failed' : ''}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
