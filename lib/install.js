'use strict';
// Installs the files a local model needs into the ComfyUI running on this computer (PC version only).
// The files come from the official Comfy-Org repository on Hugging Face, as listed in the ComfyUI docs:
// https://docs.comfy.org/tutorials/image/z-image/z-image-turbo
// Where to put them: ComfyUI says it itself (/internal/folder_paths), else COMFY_DIR from .env.

const fs = require('fs');
const path = require('path');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

// MODELS_URL only serves the tests (a fake download server).
const HF = (process.env.MODELS_URL || 'https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files').replace(/\/+$/, '');

// Per model: each file, the ComfyUI folder it goes in, and roughly how big it is (to show before downloading).
const MODELS = {
  'z-image-turbo': [
    { folder: 'diffusion_models', file: 'z_image_turbo_bf16.safetensors', url: `${HF}/diffusion_models/z_image_turbo_bf16.safetensors`, gb: 12.3 },
    { folder: 'text_encoders', file: 'qwen_3_4b.safetensors', url: `${HF}/text_encoders/qwen_3_4b.safetensors`, gb: 8 },
    { folder: 'vae', file: 'ae.safetensors', url: `${HF}/vae/ae.safetensors`, gb: 0.34 },
    // ControlNet that makes the image follow the face drawing (Alibaba PAI, listed in the ComfyUI Z-Image template).
    { folder: 'model_patches', file: 'Z-Image-Turbo-Fun-Controlnet-Union.safetensors', url: process.env.MODELS_URL ? `${HF}/model_patches/Z-Image-Turbo-Fun-Controlnet-Union.safetensors` : 'https://huggingface.co/alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union/resolve/main/Z-Image-Turbo-Fun-Controlnet-Union.safetensors', gb: 3.1 },
  ],
};

// Models of the Comfy-Org repositories on Hugging Face (file lists read on the ComfyUI docs, sizes from the files themselves, 31 Oct 2026).
// The prompt-rewriting text encoders are left out on purpose: the app never runs that step.
const repo = (name, folder, file) => (process.env.MODELS_URL ? `${HF}/${folder}/${file}` : `https://huggingface.co/Comfy-Org/${name}/resolve/main/${folder}/${file}`);
MODELS['moss-image'] = [
  { folder: 'diffusion_models', file: 'moss_image_sft_int8_convrot.safetensors', url: repo('MOSS-Image', 'diffusion_models', 'moss_image_sft_int8_convrot.safetensors'), gb: 5.4 },
  { folder: 'text_encoders', file: 'qwen3.5_9b_w4a8_gptq.safetensors', url: repo('MOSS-Image', 'text_encoders', 'qwen3.5_9b_w4a8_gptq.safetensors'), gb: 7.3 },
  { folder: 'vae', file: 'flux2-vae_small.safetensors', url: repo('MOSS-Image', 'vae', 'flux2-vae_small.safetensors'), gb: 0.25 },
];
MODELS['qwen-2-1'] = [
  { folder: 'diffusion_models', file: 'qwen_image_2.1_int8_convrot.safetensors', url: repo('Qwen-Image-2.1', 'diffusion_models', 'qwen_image_2.1_int8_convrot.safetensors'), gb: 7.3 },
  { folder: 'text_encoders', file: 'qwen3vl_8b_int8_convrot.safetensors', url: repo('Qwen-Image-2.1', 'text_encoders', 'qwen3vl_8b_int8_convrot.safetensors'), gb: 9.4 },
  { folder: 'vae', file: 'qwen_image_2.1_vae_bf16.safetensors', url: repo('Qwen-Image-2.1', 'vae', 'qwen_image_2.1_vae_bf16.safetensors'), gb: 0.68 },
];
// The z_image repositories keep their files under split_files/.
const split = (name, folder, file) => (process.env.MODELS_URL ? `${HF}/${folder}/${file}` : `https://huggingface.co/Comfy-Org/${name}/resolve/main/split_files/${folder}/${file}`);
// Z-Image Base: the same text encoder and VAE as Turbo (already there if Turbo is installed), and its own weights.
MODELS['z-image-base'] = [
  { folder: 'diffusion_models', file: 'z_image_bf16.safetensors', url: split('z_image', 'diffusion_models', 'z_image_bf16.safetensors'), gb: 12.3 },
  { folder: 'text_encoders', file: 'qwen_3_4b.safetensors', url: split('z_image_turbo', 'text_encoders', 'qwen_3_4b.safetensors'), gb: 8 },
  { folder: 'vae', file: 'ae.safetensors', url: split('z_image_turbo', 'vae', 'ae.safetensors'), gb: 0.34 },
];
// HiDream-I1 Full: four text encoders, the VAE and the fp8 weights (files listed in the ComfyUI template hidream_i1_full).
const hidream = (folder, file, gb) => ({ folder, file, url: process.env.MODELS_URL ? `${HF}/${folder}/${file}` : `https://huggingface.co/Comfy-Org/HiDream-I1_ComfyUI/resolve/main/split_files/${folder}/${file}`, gb });
MODELS['hidream-i1'] = [
  hidream('diffusion_models', 'hidream_i1_full_fp8.safetensors', 17.1),
  hidream('text_encoders', 'llama_3.1_8b_instruct_fp8_scaled.safetensors', 9.1),
  hidream('text_encoders', 't5xxl_fp8_e4m3fn_scaled.safetensors', 5.2),
  hidream('text_encoders', 'clip_g_hidream.safetensors', 1.4),
  hidream('text_encoders', 'clip_l_hidream.safetensors', 0.25),
  hidream('vae', 'ae.safetensors', 0.34),
];

// FLUX 3 Klein sits in a gated repository: its licence must be accepted on Hugging Face, with an account (accepting is
// instant). The download then needs that account's read token (HF_TOKEN in .env, filled in Keys). Sizes from the repository's file list.
const KLEIN_PAGE = 'https://huggingface.co/black-forest-labs/flux-3-image-klein-comfy';
const klein = (folder, file, gb) => ({ folder, file, gated: KLEIN_PAGE, url: process.env.MODELS_URL ? `${HF}/${folder}/${file}` : `${KLEIN_PAGE}/resolve/main/${folder}/${file}`, gb });
MODELS['flux-3-klein'] = [
  klein('diffusion_models', 'flux3-image-klein-base-int8-convrot.safetensors', 5.8),
  klein('text_encoders', 'qwen3vl_4b_int8_convrot.safetensors', 4.9),
  klein('vae', 'flux2-vae.safetensors', 0.34),
];
const hfToken = () => (process.env.HF_TOKEN || '').trim();

const comfyUrl = () => (process.env.COMFY_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const isLocalComfy = () => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(comfyUrl());

async function getJson(url, ms = 5000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// The files ComfyUI already sees in a folder (GET /models/<folder>). null when ComfyUI does not answer.
async function listed(folder) {
  try {
    const list = await getJson(`${comfyUrl()}/models/${folder}`);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return null;
  }
}

// The folder on disk for a ComfyUI folder name: asked to ComfyUI when it runs on this computer, else COMFY_DIR.
async function folderOnDisk(folder) {
  if (isLocalComfy()) {
    try {
      const paths = await getJson(`${comfyUrl()}/internal/folder_paths`);
      const list = paths && (paths[folder] || (folder === 'diffusion_models' ? paths.unet : null));
      const first = Array.isArray(list) ? (Array.isArray(list[0]) ? list[0][0] : list[0]) : null;
      if (typeof first === 'string' && path.isAbsolute(first)) return first;
    } catch (err) {
      /* older ComfyUI: fall back to COMFY_DIR */
    }
  }
  const dir = (process.env.COMFY_DIR || '').trim();
  return dir && path.isAbsolute(dir) ? path.join(dir, 'models', folder) : null;
}

// Every folder ComfyUI reads for a kind of model (it can have several: its own, a shared one...).
async function foldersOnDisk(folder) {
  const out = new Set();
  if (isLocalComfy()) {
    try {
      const paths = await getJson(`${comfyUrl()}/internal/folder_paths`);
      const list = paths && (paths[folder] || (folder === 'diffusion_models' ? paths.unet : null));
      for (const item of Array.isArray(list) ? list : []) {
        const dir = Array.isArray(item) ? item[0] : item;
        if (typeof dir === 'string' && path.isAbsolute(dir)) out.add(dir);
      }
    } catch (err) {
      /* older ComfyUI: COMFY_DIR below */
    }
  }
  const dir = (process.env.COMFY_DIR || '').trim();
  if (dir && path.isAbsolute(dir)) out.add(path.join(dir, 'models', folder));
  return [...out];
}

// One download at a time, its progress kept here for the page.
const progress = { state: 'idle', model: null, file: null, done: 0, total: 0, error: null };
// The running download can be stopped: the part already on disk is kept, and the next install continues from it.
let controller = null;
function cancel() {
  if (progress.state !== 'running') return false;
  progress.cancelled = true;
  if (controller) controller.abort();
  return true;
}

async function status(model) {
  const files = MODELS[model];
  if (!files) return { model, supported: false };
  // Progress first: a download that ends while the folders are read then shows its files as present.
  const snapshot = { ...progress };
  const out = [];
  let comfy = true;
  for (const f of files) {
    const names = await listed(f.folder);
    if (names === null) comfy = false;
    out.push({ folder: f.folder, file: f.file, gb: f.gb, present: !!names && names.includes(f.file), gated: f.gated || undefined });
  }
  const where = comfy ? await folderOnDisk(files[0].folder) : null;
  const gated = (files.find((f) => f.gated) || {}).gated;
  const needsToken = !!gated && !hfToken();
  return { model, supported: true, comfy, canInstall: comfy && !!where && !needsToken, gated, needsToken, files: out, progress: snapshot };
}

// Downloads to <file>.part, resumes a cut download with a Range request, renames when complete.
async function download(f, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, f.file);
  const part = `${target}.part`;
  const have = fs.existsSync(part) ? fs.statSync(part).size : 0;
  // The token goes to Hugging Face only (a redirect to another host drops it).
  const headers = {};
  if (have) headers.range = `bytes=${have}-`;
  if (f.gated && hfToken()) headers.authorization = `Bearer ${hfToken()}`;
  controller = new AbortController();
  const res = await fetch(f.url, { headers, redirect: 'follow', signal: controller.signal });
  if (f.gated && (res.status === 401 || res.status === 403)) throw new Error(`Hugging Face refused the download: accept the licence on ${f.gated} with the account of your token, and check that the token is a "read" token.`);
  if (!res.ok && res.status !== 206) throw new Error(`Download refused (HTTP ${res.status}) for ${f.file}.`);
  const resumed = res.status === 206;
  const length = Number(res.headers.get('content-length')) || 0;
  progress.file = f.file;
  progress.done = resumed ? have : 0;
  progress.total = (resumed ? have : 0) + length;
  const counter = new Transform({
    transform(chunk, enc, cb) {
      progress.done += chunk.length;
      cb(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(res.body), counter, fs.createWriteStream(part, { flags: resumed ? 'a' : 'w' }), { signal: controller.signal });
  fs.renameSync(part, target);
}

// Deletes the files of a model to free disk space: only the files of its list, by exact name, in ComfyUI's model folders.
// A file that another model of the list needs too (the VAE, a text encoder) is kept, and a download in progress is refused.
async function remove(model) {
  const files = MODELS[model];
  if (!files) throw new Error('This model cannot be removed from here.');
  if (progress.state === 'running') throw new Error('A download is running: wait for it, or pause it first.');
  // Another model still installed (all its files there) that uses the same file keeps it.
  const users = [];
  for (const [id, list] of Object.entries(MODELS)) {
    if (id === model || !list.some((g) => files.some((f) => f.file === g.file && f.folder === g.folder))) continue;
    const st = await status(id);
    if (st.comfy && st.files.every((x) => x.present)) users.push(list);
  }
  const shared = (f) => users.some((list) => list.some((g) => g.file === f.file && g.folder === f.folder));
  const deleted = [];
  const kept = [];
  for (const f of files) {
    if (shared(f)) {
      kept.push({ file: f.file, why: 'shared' });
      continue;
    }
    for (const dir of await foldersOnDisk(f.folder)) {
      const target = path.join(dir, f.file);
      // Never outside the folder, and only a plain file with that exact name (a .part left by a paused download goes too).
      if (path.dirname(target) !== dir) continue;
      for (const name of [target, `${target}.part`]) {
        try {
          const st = fs.lstatSync(name);
          if (!st.isFile()) continue;
          fs.unlinkSync(name);
          deleted.push({ file: f.file, gb: Math.round(st.size / 1e8) / 10 });
        } catch (err) {
          /* not in this folder */
        }
      }
    }
  }
  return { deleted, kept };
}

// Starts the installation in the background; the page follows it with status().
async function install(model) {
  const files = MODELS[model];
  if (!files) throw new Error('This model cannot be installed automatically.');
  if (files.some((f) => f.gated) && !hfToken()) throw new Error('This model asks you to accept its licence on Hugging Face: put your Hugging Face token in Keys first.');
  if (progress.state === 'running') return;
  const st = await status(model);
  if (!st.comfy) throw new Error('ComfyUI does not answer. Start it first.');
  if (!st.canInstall) throw new Error('The ComfyUI folder is unknown. Fill in "ComfyUI folder" in Keys.');
  Object.assign(progress, { state: 'running', model, file: null, done: 0, total: 0, error: null, cancelled: false });
  (async () => {
    try {
      for (const f of files) {
        if (st.files.find((x) => x.file === f.file && x.present)) continue;
        const dir = await folderOnDisk(f.folder);
        if (!dir) throw new Error('The ComfyUI folder is unknown.');
        await download(f, dir);
      }
      progress.state = 'done';
    } catch (err) {
      // Stopped on purpose: paused, not an error (what was downloaded stays).
      if (progress.cancelled) progress.state = 'paused';
      else {
        progress.state = 'error';
        progress.error = err.message;
      }
    }
  })();
}

module.exports = { MODELS, status, install, cancel, remove, progress };
