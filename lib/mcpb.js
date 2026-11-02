'use strict';
// The Claude Desktop extension (Kara.mcpb): a zip with a manifest, the icon, the MCP server and the whole app.
// Built here, with no dependency, for tools/build-mcpb.js (a file in dist/) and for the app's MCP window (a download).

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// What goes into the extension: the app, not the tests, the installers or the docs.
const FILES = ['server.js', 'mcp.js', 'package.json', 'LICENSE'];
const DIRS = ['lib', 'data', 'public', 'workflows'];

const manifest = (version) => ({
  manifest_version: '0.2',
  name: 'kara',
  display_name: 'Kara',
  version,
  description: 'Design characters with Kara from your chat: pick the choices, get a character sheet made on your own ComfyUI.',
  long_description:
    'Kara is an open source character designer. With this extension, Claude can read Kara\'s menus (age, face, hair, outfit, layout, look...), build the prompt and generate the image.\n\nGenerating on your own machine (ComfyUI) is free. Any paid provider (KIE, fal, Magnific, Comfy Router) is refused until you have agreed in the chat.\n\nKara starts by itself when needed. If you already run Kara, that one is used, with its keys. ComfyUI must be running to generate on your own machine.',
  author: { name: 'Dash Dash', url: 'https://dashdash.design' },
  homepage: 'https://github.com/DashDashDesign/Kara',
  repository: { type: 'git', url: 'https://github.com/DashDashDesign/Kara' },
  license: 'MIT',
  icon: 'icon.png',
  server: {
    type: 'node',
    entry_point: 'mcp.js',
    mcp_config: { command: 'node', args: ['${__dirname}/mcp.js'] },
  },
  tools: [
    { name: 'kara_menus', description: 'Lists every menu of Kara and the ids of their choices.' },
    { name: 'kara_status', description: 'Shows the models, which providers have a key, and whether ComfyUI answers.' },
    { name: 'kara_prompt', description: 'Builds the prompt and image size from menu choices, without generating (free).' },
    { name: 'kara_apply', description: 'Sets the menus in the open Kara window, so you see the choices appear (nothing is generated).' },
    { name: 'kara_result', description: 'Waits for an image that is still being made and returns it.' },
    { name: 'kara_generate', description: 'Generates a character image. Free on your own machine; paid providers need your agreement.' },
  ],
  compatibility: { platforms: ['win32', 'darwin', 'linux'], runtimes: { node: '>=18.0.0' } },
});


// ---------- a zip file, by hand ----------

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d) {
  return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function zip(entries) {
  const { time, date } = dosTime(new Date());
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = packed.length < data.length;
    const body = useDeflate ? packed : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // names are UTF-8
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, body);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(useDeflate ? 8 : 0, 10);
    head.writeUInt16LE(time, 12);
    head.writeUInt16LE(date, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(body.length, 20);
    head.writeUInt32LE(data.length, 24);
    head.writeUInt16LE(nameBuf.length, 28);
    head.writeUInt32LE(offset, 42);
    central.push(head, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}


// The extension as bytes, made from the app's own folder.
function build(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const entries = [{ name: 'manifest.json', data: Buffer.from(`${JSON.stringify(manifest(pkg.version), null, 2)}
`) }];
  entries.push({ name: 'icon.png', data: fs.readFileSync(path.join(root, 'public', 'icons', 'icon-512.png')) });
  for (const f of FILES) {
    if (fs.existsSync(path.join(root, f))) entries.push({ name: f, data: fs.readFileSync(path.join(root, f)) });
  }
  for (const d of DIRS) {
    for (const full of walk(path.join(root, d)).sort()) {
      entries.push({ name: path.relative(root, full).split(path.sep).join('/'), data: fs.readFileSync(full) });
    }
  }
  return { bytes: zip(entries), files: entries.length, version: pkg.version };
}

module.exports = { build };
