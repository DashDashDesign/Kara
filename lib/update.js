'use strict';
// Updates this copy of the app from GitHub (main branch), without npm or any other tool.
// A git clone is updated with "git pull"; a copy made by the installer is replaced file by file
// from GitHub's archive. .env (your keys) and every file that is not in the archive stay untouched.
// The installed version is kept in .version (not in the repository).

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFile } = require('node:child_process');

// UPDATE_ROOT: another folder to update (the tests use a throwaway one).
const ROOT = path.resolve(process.env.UPDATE_ROOT || path.join(__dirname, '..'));
const REPO = 'DashDashDesign/Kara';
const VERSION_FILE = path.join(ROOT, '.version');
// Never written by an update.
const KEEP = new Set(['.env', '.version']);
// Overridable for the tests.
const API = () => (process.env.UPDATE_API_URL || 'https://api.github.com').replace(/\/+$/, '');
const ARCHIVE = () => (process.env.UPDATE_ARCHIVE_URL || 'https://codeload.github.com').replace(/\/+$/, '');

const isGit = () => fs.existsSync(path.join(ROOT, '.git'));

function git(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: ROOT, timeout: 120000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message || '').trim()));
      else resolve(stdout.trim());
    });
  });
}

async function localVersion() {
  if (isGit()) {
    try {
      return await git(['rev-parse', 'HEAD']);
    } catch (err) {
      // git missing: fall back to the file.
    }
  }
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim() || null;
  } catch (err) {
    return null;
  }
}

async function latest() {
  const res = await fetch(`${API()}/repos/${REPO}/commits/main`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'kara' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GitHub answered HTTP ${res.status}.`);
  const body = await res.json();
  if (!body || !/^[0-9a-f]{40}$/.test(body.sha || '')) throw new Error('GitHub did not give the latest version.');
  const date = body.commit && body.commit.committer && body.commit.committer.date;
  return { sha: body.sha, date: date || null };
}

// { current, latest, date, available }
async function status() {
  const [current, last] = await Promise.all([localVersion(), latest()]);
  return { current, latest: last.sha, date: last.date, available: current !== last.sha };
}

// Reads a tar archive (already unzipped): [{ name, mode, data }] for regular files.
function untar(buf) {
  const files = [];
  let longName = null;
  let paxPath = null;
  for (let off = 0; off + 512 <= buf.length; ) {
    const head = buf.subarray(off, off + 512);
    if (head.every((b) => b === 0)) break;
    const str = (a, b) => head.subarray(a, b).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(str(124, 136).trim() || '0', 8);
    const type = str(156, 157) || '0';
    const prefix = str(345, 500);
    let name = (prefix ? `${prefix}/` : '') + str(0, 100);
    const mode = parseInt(str(100, 108).trim() || '644', 8);
    const data = buf.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') {
      longName = data.toString('utf8').replace(/\0.*$/s, '');
      continue;
    }
    if (type === 'x') {
      const m = /\d+ path=([^\n]*)\n/.exec(data.toString('utf8'));
      paxPath = m ? m[1] : null;
      continue;
    }
    if (type === 'g') continue;
    if (longName) name = longName;
    if (paxPath) name = paxPath;
    longName = paxPath = null;
    if (type === '0' || type === '7') files.push({ name, mode, data: Buffer.from(data) });
  }
  return files;
}

// Writes the archive's files into the app folder: first folder level stripped, nothing outside the folder.
function install(files) {
  let count = 0;
  for (const f of files) {
    const rel = f.name.split('/').slice(1).join('/');
    if (!rel || rel.endsWith('/') || KEEP.has(rel)) continue;
    const target = path.resolve(ROOT, rel);
    if (!target.startsWith(ROOT + path.sep)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, f.data);
    if (process.platform !== 'win32' && f.mode & 0o111) fs.chmodSync(target, 0o755);
    count += 1;
  }
  return count;
}

async function update() {
  const last = await latest();
  if (isGit()) {
    try {
      await git(['pull', '--ff-only', 'origin', 'main']);
      return { ok: true, via: 'git', version: last.sha };
    } catch (err) {
      // No git on this computer: the archive below does the same.
      if (!/not recognized|ENOENT|not found/i.test(err.message)) throw new Error(`git pull failed: ${err.message}`);
    }
  }
  const res = await fetch(`${ARCHIVE()}/${REPO}/tar.gz/${last.sha}`, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`GitHub did not send the new version (HTTP ${res.status}).`);
  const files = untar(zlib.gunzipSync(Buffer.from(await res.arrayBuffer())));
  if (!files.some((f) => /\/server\.js$/.test(f.name))) throw new Error('The archive from GitHub does not look like this app.');
  const count = install(files);
  fs.writeFileSync(VERSION_FILE, `${last.sha}\n`);
  return { ok: true, via: 'archive', version: last.sha, files: count };
}

module.exports = { status, update, untar, ROOT };
