#!/usr/bin/env node
'use strict';
// Builds dist/Kara.mcpb: a Claude Desktop extension, installed by double-clicking the file.
// The app itself offers the same file from its MCP window (/api/mcpb).  Usage: node tools/build-mcpb.js

const fs = require('node:fs');
const path = require('node:path');
const { build } = require('../lib/mcpb');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'Kara.mcpb');
const made = build(ROOT);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, made.bytes);
console.log(`${path.relative(ROOT, OUT)}: ${made.files} files, ${(made.bytes.length / 1048576).toFixed(1)} MB, version ${made.version}`);
