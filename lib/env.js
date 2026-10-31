'use strict';
// Reads a .env file next to server.js and puts its values into process.env.
// No dependency. A value already set in the real environment always wins.

const fs = require('node:fs');
const path = require('node:path');

function parse(text) {
  const values = {};
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '');
    values[match[1]] = value;
  }
  return values;
}

// ENV_FILE lets the tests use a throwaway file instead of the real .env.
const DEFAULT_FILE = () => process.env.ENV_FILE || path.join(__dirname, '..', '.env');

function load(file = DEFAULT_FILE()) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    return false;
  }
  for (const [key, value] of Object.entries(parse(text))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

// Writes some values into .env (other lines are kept as they are) and applies them right away.
// Only the names in ALLOWED can be written, values are single lines.
const ALLOWED = ['COMFY_MODE', 'COMFY_URL', 'COMFY_DIR', 'COMFY_CLOUD_API_KEY', 'MAGNIFIC_API_KEY', 'KIE_API_KEY', 'FAL_KEY', 'HF_TOKEN'];

function save(updates, file = DEFAULT_FILE()) {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  } catch (err) {
    text = '';
  }
  const lines = text ? text.split(/\r?\n/) : [];
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  for (const [key, raw] of Object.entries(updates)) {
    if (!ALLOWED.includes(key)) continue;
    const value = String(raw).replace(/[\r\n]/g, '').trim();
    const line = `${key}=${/[\s#"']/.test(value) ? JSON.stringify(value) : value}`;
    const at = lines.findIndex((l) => new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`).test(l));
    if (at >= 0) lines[at] = line;
    else lines.push(line);
    process.env[key] = value;
  }
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

module.exports = { load, parse, save };
