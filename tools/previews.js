'use strict';
// Makes the preview thumbnails of the menus and inspirations with Seedream 5 Flash (KIE first, else fal,
// keys from .env), with MOSS-Image through fal (--moss), or on the ComfyUI of this computer with --local.
// Same base character and same seed for every image: only the option shown changes.
// Images go to public/previews/<menu>-<option>.webp (or .png with --local), listed in public/previews/previews.json (read by the page).
//   node tools/previews.js            5 test images
//   node tools/previews.js --all      every option not done yet
//   node tools/previews.js --all --redo   every option, again
//   node tools/previews.js --menu hairStyle   one menu (--menu preset: the inspirations)
//   add --local to use ComfyUI on this PC (COMFY_URL in .env) instead of fal
//   node tools/previews.js --import   the thumbnails made on Magnific (tools/magnific-previews.json)
//   node tools/previews.js --models   the base character once with each model (KIE or fal, whichever has a key), for the models panel
//   node tools/previews.js --models --only hidream-i1   that model again (it costs: ask first)
// MOSS through fal: 0.05 $ per megapixel, so about 0.013 $ per 512 x 512 thumbnail.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
require('../lib/env').load();
process.env.COMFY_MODE = 'local';
const comfy = require('../lib/comfy');
const fal = require('../lib/fal');
const kie = require('../lib/kie');
const { buildPrompt } = require('../lib/prompt');

const OUT = path.join(ROOT, 'public', 'previews');
const MANIFEST = path.join(OUT, 'previews.json');
const SIZE = 1024; // with --local: generated square, then reduced in ComfyUI
const THUMB = 320;
const FAL_SIZE = 512; // through fal: the smallest size it makes, kept as is (webp, light)
// --seed N changes it (to try again a model preview that came out badly).
const seedArg = process.argv.indexOf('--seed');
const SEED = seedArg > 0 ? Number(process.argv[seedArg + 1]) || 20261030 : 20261030;
// The model of the menu thumbnails (chosen by Greg after a comparison on 28/10): good and cheap.
const THUMB_MODEL = 'seedream-5-flash';

const options = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'options.json'), 'utf8'));
const presets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'presets.json'), 'utf8'));
const template = JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', 'moss_image_t2i.api.json'), 'utf8'));

// Framing per menu: the face up close (accessories too, they are small), clothes and build from the knees up,
// height in full.
const CLOSE = new Set(['face', 'hair']);
const CLOSE_MENUS = new Set(['presentation', 'age', 'ethnicity', 'expression', 'look', 'background', 'accessories']);
const KNEES = new Set(['outfit', 'build']);
const FULL_OPENING = 'Full-body standing shot, front facing, arms relaxed, entire figure from head to feet in frame.';
const KNEES_OPENING = 'Three-quarter standing shot from the knees up, front facing, arms relaxed, the whole torso and outfit clearly visible.';
// Without it, some pictures came back as several people or several views side by side.
const SINGLE = ' One single person, a single photograph: no collage, no split panels, no multiple views.';
const TIGHT = ' Tight crop on the face and shoulders: nothing below the chest is visible.';
function layoutFor(group) {
  if (group.id === 'layout') return null;
  if (CLOSE.has(group.section) || CLOSE_MENUS.has(group.id)) return 'portrait';
  return 'fullbody';
}

// Every option to show: the colour menus already have their swatch, the wheel of emotions its colours.
function targets() {
  const out = [];
  for (const group of options.groups) {
    if (group.color || group.wheel) continue;
    for (const option of group.options) {
      if (option.petal) continue;
      out.push({ group, option });
    }
  }
  // The inspirations: their own character, from the face to the shoulders (key "preset/<id>").
  for (const preset of presets) out.push({ group: { id: 'preset' }, option: preset, preset });
  return out;
}

function promptFor({ group, option, preset }) {
  if (preset) {
    const selection = { ...options.defaults, ...preset.selection, layout: 'portrait', look: 'photo', background: 'lightgrey' };
    return buildPrompt(options, selection, preset.extra || '', null, null).prompt + TIGHT + SINGLE;
  }
  const selection = { ...options.defaults, layout: layoutFor(group) || option.id };
  selection[group.id] = group.type === 'multi' ? [option.id] : option.id;
  // Neutral studio picture, so the thumbnails look alike.
  if (group.id !== 'look') selection.look = 'photo';
  if (group.id !== 'background') selection.background = 'lightgrey';
  // Beards and moustaches show on a man; teeth show in a smile.
  if (group.id === 'facialHair') selection.presentation = 'man';
  if (group.id === 'teeth') selection.expression = 'joy-2';
  let prompt = buildPrompt(options, selection, '', null, null).prompt;
  if (KNEES.has(group.id)) prompt = prompt.replace(FULL_OPENING, KNEES_OPENING);
  // The layout menu shows sheets made of several views on purpose.
  return group.id === 'layout' ? prompt : prompt + SINGLE;
}

// The MOSS workflow with our prompt, a square size, and a step that reduces the image before saving.
function workflowFor(prompt) {
  const wf = comfy.inject(template, { prompt, seed: SEED, width: SIZE, height: SIZE });
  const saveId = Object.keys(wf).find((id) => /^SaveImage/.test(wf[id].class_type || ''));
  wf.thumb = { class_type: 'ImageScale', inputs: { upscale_method: 'lanczos', width: THUMB, height: THUMB, crop: 'center', image: wf[saveId].inputs.images } };
  wf[saveId].inputs.images = ['thumb', 0];
  wf[saveId].inputs.filename_prefix = 'kara_preview';
  return wf;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Through fal: queue, wait, download the webp.
async function makeOneFal(client, target) {
  const id = await client.queue({ prompt: promptFor(target), seed: SEED, width: FAL_SIZE, height: FAL_SIZE, model: 'moss-image', format: 'webp' });
  for (let i = 0; i < 300; i++) {
    await sleep(2000);
    const r = await client.job(id);
    if (r.status === 'error') throw new Error(r.error);
    if (r.status === 'done' && r.urls.length) {
      const res = await fetch(r.urls[0], { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`fal did not send the image (HTTP ${res.status}).`);
      const file = `${target.group.id}-${target.option.id}.webp`;
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      return file;
    }
  }
  throw new Error('Took more than 10 minutes.');
}

async function makeOne(target) {
  const id = await comfy.queue(workflowFor(promptFor(target)));
  for (let i = 0; i < 600; i++) {
    await sleep(1000);
    const r = await comfy.job(id);
    if (r.status === 'error') throw new Error(r.error);
    if (r.status === 'done' && r.images.length) {
      const res = await comfy.view(r.images[0]);
      if (!res.ok) throw new Error(`ComfyUI did not send the image (HTTP ${res.status}).`);
      const file = `${target.group.id}-${target.option.id}.png`;
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      return file;
    }
  }
  throw new Error('Took more than 10 minutes.');
}

// The base character, the same for every model: default menus, head-and-shoulders portrait.
function basePrompt() {
  return buildPrompt(options, { ...options.defaults, layout: 'portrait', look: 'photo', background: 'lightgrey' }, '', null, null).prompt;
}

const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'models.json'), 'utf8'));

// Made smaller on Windows (PowerShell, nothing to install), so the repository stays light.
// Elsewhere, ImageMagick when it is there (GitHub's machines have it), else kept as is.
function shrink(file, size = 512) {
  const src = path.join(OUT, file);
  const out = file.replace(/\.\w+$/, '.jpg');
  const dest = path.join(OUT, out);
  if (process.platform !== 'win32') {
    try {
      require('child_process').execFileSync('convert', [src, '-resize', `${size}x${size}>`, '-quality', '85', `jpg:${dest}.tmp`], { stdio: 'ignore', timeout: 60000 });
      if (src !== dest) fs.unlinkSync(src);
      fs.renameSync(`${dest}.tmp`, dest);
      return out;
    } catch (err) {
      return file;
    }
  }
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    `$i = [System.Drawing.Image]::FromFile('${src}')`,
    `$k = ${size} / [Math]::Max($i.Width, $i.Height)`,
    'if ($k -gt 1) { $k = 1 }',
    '$b = New-Object System.Drawing.Bitmap ([int]($i.Width * $k)), ([int]($i.Height * $k))',
    '$g = [System.Drawing.Graphics]::FromImage($b)',
    '$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic',
    '$g.DrawImage($i, 0, 0, $b.Width, $b.Height)',
    '$i.Dispose()',
    '$e = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }',
    '$p = New-Object System.Drawing.Imaging.EncoderParameters 1',
    '$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L',
    `$b.Save('${dest}.tmp', $e, $p)`,
  ].join('; ');
  try {
    require('child_process').execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore', timeout: 60000, windowsHide: true });
    if (src !== dest) fs.unlinkSync(src);
    fs.renameSync(`${dest}.tmp`, dest);
    return out;
  } catch (err) {
    return file;
  }
}

// One model through KIE (first, cheapest) or fal: queue, wait, download a light file.
// prompt and name: the base character and model-<id> unless given (menu thumbnails).
async function makeModelPreview(model, prompt = basePrompt(), name = `model-${model.id}`) {
  const kieKey = (process.env.KIE_API_KEY || '').trim();
  const falKey = (process.env.FAL_KEY || '').trim();
  const engines = model.engines || {};
  let client;
  let via;
  if (kieKey && engines.kie) {
    client = kie.client({ key: kieKey, api: process.env.KIE_URL || kie.API, upload: process.env.KIE_UPLOAD_URL || kie.UPLOAD });
    via = 'kie';
  } else if (falKey && engines.fal) {
    client = fal.client({ key: falKey, queue: process.env.FAL_QUEUE_URL || fal.QUEUE });
    via = 'fal';
  } else throw new Error('no KIE or fal key for this model');
  const res0 = (engines[via].resolutions || [])[0];
  const id = await client.queue({ prompt, seed: SEED, width: 1024, height: 1024, model: model.id, resolution: res0 ? res0.id : '1k', format: via === 'fal' ? 'webp' : 'jpeg' });
  for (let i = 0; i < 300; i++) {
    await sleep(3000);
    const r = await client.job(id);
    if (r.status === 'error') throw new Error(r.error);
    if (r.status === 'done' && r.urls.length) {
      const res = await fetch(r.urls[0], { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`the image could not be downloaded (HTTP ${res.status}).`);
      const type = res.headers.get('content-type') || '';
      const ext = /webp/.test(type) ? 'webp' : /png/.test(type) ? 'png' : 'jpg';
      const file = `${name}.${ext}`;
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      return { file: shrink(file), via };
    }
  }
  throw new Error('Took more than 15 minutes.');
}

// Models that did not keep to the portrait framing with the plain prompt: a few more words for them only.
const PREVIEW_HINT = {
  // These two seem to read only the start of a long prompt: what they must respect goes first.
  'nano-banana': { before: 'Close-up head and shoulders portrait, tight crop on the face and shoulders, nothing below the chest in frame. ', after: '' },
  'hidream-i1': { before: 'A real photograph, photorealistic close-up studio portrait of a real woman, plain white seamless background, not an illustration, not a cartoon, no scenery. ', after: '' },
};

async function makeModels(manifest, redo, only) {
  const list = models.models.filter((m) => {
    if (only) return m.id === only;
    const file = manifest[`model/${m.id}`];
    return redo || !file || !fs.existsSync(path.join(ROOT, 'public', file));
  });
  console.log(`${list.length} model preview(s) to make, the same character with each model (KIE first, else fal).`);
  for (const m of list) {
    const started = Date.now();
    try {
      const hint = PREVIEW_HINT[m.id];
      const { file, via } = await makeModelPreview(m, hint && typeof hint === 'object' ? hint.before + basePrompt() + hint.after : basePrompt() + (hint || ''));
      manifest[`model/${m.id}`] = `previews/${file}`;
      fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`  ok  ${m.name} via ${via}  (${Math.round((Date.now() - started) / 1000)} s)`);
    } catch (err) {
      console.log(`  --  ${m.name}: ${err.message}`);
    }
  }
}

// Thumbnails made on Magnific (Seedream 5 Flash, 28/10): tools/magnific-previews.json lists "menu/option" -> link,
// or -> { "url": link, "crop": [x, y, size] } to keep only a square of the picture (fractions of its width and height),
// or -> { "url": link, "pad": true } to fit a wide sheet whole in a square, on the colour of its corner,
// cut at full size before it is made smaller (ImageMagick; left whole where it is missing).
// Downloaded once per link (several options can share one picture), made smaller, listed; the list is then removed.
const IMPORT_FILE = path.join(__dirname, 'magnific-previews.json');
const IMPORT_HOST = process.env.PREVIEWS_IMPORT_HOST || 'https://pikaso.cdnpk.net/';

function cropSquare(file, [x, y, size]) {
  try {
    const run = (args) => require('child_process').execFileSync('convert', args, { encoding: 'utf8', timeout: 60000 });
    const [w, h] = run([file, '-format', '%w %h', 'info:']).trim().split(' ').map(Number);
    const side = Math.round(size * Math.min(w, h));
    run([file, '-crop', `${side}x${side}+${Math.round(x * w)}+${Math.round(y * h)}`, '+repage', file]);
  } catch (err) {
    console.log(`  ..  ${path.basename(file)} kept whole (no ImageMagick to crop it)`);
  }
}

function padSquare(file) {
  try {
    const run = (args) => require('child_process').execFileSync('convert', args, { encoding: 'utf8', timeout: 60000 });
    const [w, h] = run([file, '-format', '%w %h', 'info:']).trim().split(' ').map(Number);
    const corner = run([file, '-format', '%[pixel:p{2,2}]', 'info:']).trim();
    const side = Math.max(w, h);
    run([file, '-background', corner, '-gravity', 'center', '-extent', `${side}x${side}`, file]);
  } catch (err) {
    console.log(`  ..  ${path.basename(file)} kept as is (no ImageMagick to fit it in a square)`);
  }
}

async function importMagnific(manifest) {
  if (!fs.existsSync(IMPORT_FILE)) throw new Error('Nothing to import: tools/magnific-previews.json is not here (already imported?).');
  const list = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf8'));
  const done = new Map();
  let failed = 0;
  console.log(`${Object.keys(list).length} thumbnails to fetch from Magnific.`);
  for (const [key, entry] of Object.entries(list)) {
    const link = entry && typeof entry === 'object' ? entry.url : entry;
    const crop = entry && Array.isArray(entry.crop) && entry.crop.length === 3 && entry.crop.every((n) => typeof n === 'number' && n >= 0 && n <= 1) ? entry.crop : null;
    if (!/^[\w-]+\/[\w-]+$/.test(key) || typeof link !== 'string' || !link.startsWith(IMPORT_HOST)) continue;
    const pad = !!(entry && entry.pad === true);
    if (done.has(link) && !crop && !pad) {
      manifest[key] = done.get(link);
      continue;
    }
    try {
      const res = await fetch(link, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}${res.status === 403 ? ' (the link has expired)' : ''}`);
      const type = res.headers.get('content-type') || '';
      const ext = /webp/.test(type) ? 'webp' : /jpe?g/.test(type) ? 'jpg' : 'png';
      const name = `${key.replace('/', '-')}.${ext}`;
      fs.writeFileSync(path.join(OUT, name), Buffer.from(await res.arrayBuffer()));
      if (crop) cropSquare(path.join(OUT, name), crop);
      if (pad) padSquare(path.join(OUT, name));
      const file = `previews/${shrink(name)}`;
      manifest[key] = file;
      if (!crop && !pad) done.set(link, file);
      fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`  ok  ${key}`);
    } catch (err) {
      failed += 1;
      console.log(`  !!  ${key}: ${err.message}`);
    }
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  if (!failed) fs.unlinkSync(IMPORT_FILE);
  console.log(failed ? `${failed} thumbnail(s) failed: run it again.` : 'All thumbnails are in public/previews.');
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const redo = args.includes('--redo');
  const menu = args.includes('--menu') ? args[args.indexOf('--menu') + 1] : null;
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  if (args.includes('--models')) return makeModels(manifest, redo, only);
  if (args.includes('--import')) return importMagnific(manifest);

  let list = targets();
  if (menu) list = list.filter((t) => t.group.id === menu);
  else if (!all) {
    // The test: five menus that show different things.
    const pick = [['hairStyle', 'afro'], ['outfit', 'suit'], ['age', 'senior'], ['faceShape', 'round'], ['build', 'muscular']];
    list = pick.map(([g, o]) => list.find((t) => t.group.id === g && t.option.id === o)).filter(Boolean);
  }
  // Done = listed AND still on disk: a thumbnail deleted by hand is made again.
  const done = (t) => {
    const file = manifest[`${t.group.id}/${t.option.id}`];
    return !!file && fs.existsSync(path.join(ROOT, 'public', file));
  };
  if (!redo && (all || menu)) list = list.filter((t) => !done(t));

  const local = args.includes('--local');
  let make;
  if (local) {
    const ping = await comfy.ping();
    if (!ping.ok) throw new Error(`ComfyUI does not answer at ${comfy.base()}. Start it, then run this again.`);
    console.log(`${list.length} image(s) to make with MOSS-Image on ${comfy.base()}.`);
    make = makeOne;
  } else if (!args.includes('--moss')) {
    const model = models.models.find((m) => m.id === THUMB_MODEL);
    console.log(`${list.length} image(s) to make with ${model.name} (KIE first, else fal; a few cents each).`);
    make = async (t) => (await makeModelPreview(model, promptFor(t), `${t.group.id}-${t.option.id}`)).file;
  } else {
    const key = (process.env.FAL_KEY || '').trim();
    if (!key) throw new Error('No fal key: add it in the app (Keys, fal), then run this again.');
    const client = fal.client({ key, queue: process.env.FAL_QUEUE_URL || fal.QUEUE });
    const cost = list.length * 0.05 * ((FAL_SIZE * FAL_SIZE) / (1024 * 1024));
    console.log(`${list.length} image(s) to make with MOSS-Image through fal, about ${cost.toFixed(2)} $.`);
    make = (t) => makeOneFal(client, t);
  }
  let made = 0;
  for (const target of list) {
    const label = `${target.group.id} / ${target.option.id}`;
    const started = Date.now();
    try {
      const file = await make(target);
      manifest[`${target.group.id}/${target.option.id}`] = `previews/${file}`;
      fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
      made += 1;
      console.log(`  ok  ${label}  (${Math.round((Date.now() - started) / 1000)} s)`);
    } catch (err) {
      console.log(`  !!  ${label}: ${err.message}`);
    }
  }
  console.log(`${made} image(s) saved in public/previews.`);
}

// Run from the command line; required (by a check script), it only gives its prompts.
if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
module.exports = { targets, promptFor, cropSquare };
