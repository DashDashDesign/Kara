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

// One download at a time, its progress kept here for the page.
const progress = { state: 'idle', model: null, file: null, done: 0, total: 0, error: null };

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
    out.push({ folder: f.folder, file: f.file, gb: f.gb, present: !!names && names.includes(f.file) });
  }
  const where = comfy ? await folderOnDisk(files[0].folder) : null;
  return { model, supported: true, comfy, canInstall: comfy && !!where, files: out, progress: snapshot };
}

// Downloads to <file>.part, resumes a cut download with a Range request, renames when complete.
async function download(f, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, f.file);
  const part = `${target}.part`;
  const have = fs.existsSync(part) ? fs.statSync(part).size : 0;
  const res = await fetch(f.url, { headers: have ? { range: `bytes=${have}-` } : {}, redirect: 'follow' });
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
  await pipeline(Readable.fromWeb(res.body), counter, fs.createWriteStream(part, { flags: resumed ? 'a' : 'w' }));
  fs.renameSync(part, target);
}

// Starts the installation in the background; the page follows it with status().
async function install(model) {
  const files = MODELS[model];
  if (!files) throw new Error('This model cannot be installed automatically.');
  if (progress.state === 'running') return;
  const st = await status(model);
  if (!st.comfy) throw new Error('ComfyUI does not answer. Start it first.');
  if (!st.canInstall) throw new Error('The ComfyUI folder is unknown. Fill in "ComfyUI folder" in Keys.');
  Object.assign(progress, { state: 'running', model, file: null, done: 0, total: 0, error: null });
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
      progress.state = 'error';
      progress.error = err.message;
    }
  })();
}

module.exports = { MODELS, status, install, progress };
