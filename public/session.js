'use strict';
// Session storage and export. Plain JavaScript, no dependency.
// Generations (image + prompt + settings) are kept in the browser (IndexedDB),
// so a reload loses nothing, and can be exported as one self-contained .html file
// that opens anywhere and can be imported back into the app.
(() => {
  const DB_NAME = 'kara';
  const STORE = 'cards';
  const FORMAT = 'kara-session';

  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function run(mode, action) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // Newest first, like the stack of cards on screen.
  async function load() {
    const all = await run('readonly', (s) => s.getAll());
    return (all || []).sort((a, b) => b.created - a.created);
  }
  const save = (card) => run('readwrite', (s) => s.put(card));
  const remove = (id) => run('readwrite', (s) => s.delete(id));
  const clear = () => run('readwrite', (s) => s.clear());

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  async function dataUrlToBlob(url) {
    const res = await fetch(url);
    return res.blob();
  }

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // cards: [{ id, created, name, seed, width, height, prompt, settings, summary: [[label, value]], blob }]
  async function exportHtml(cards, texts) {
    const meta = [];
    const figures = [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const src = c.blob ? await blobToDataUrl(c.blob) : '';
      meta.push({ id: c.id, created: c.created, name: c.name, seed: c.seed, width: c.width, height: c.height, prompt: c.prompt, settings: c.settings, fav: !!c.fav, provider: c.provider || null, model: c.model || null, batch: c.batch || null, batchIndex: c.batchIndex || 0, refThumbs: c.refThumbs, refMode: c.refMode || null, guide: c.guide || null });
      const rows = (c.summary || []).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
      figures.push(`<figure data-i="${i}" data-name="${esc(c.name)}">
  ${src ? `<img src="${src}" alt="${esc(c.name)}" width="${c.width}" height="${c.height}">` : ''}
  ${src ? `<button type="button" class="dl" title="${esc(texts.download || 'Download')}">&#8595;</button>` : ''}
  <figcaption>
    <p class="m">${c.fav ? '&#9829; ' : ''}${esc(c.name)} · seed ${esc(c.seed)} · ${esc(c.width)} x ${esc(c.height)} · ${esc(new Date(c.created).toLocaleString())}</p>
    ${rows ? `<table>${rows}</table>` : ''}
    <details><summary class="m">${esc(texts.prompt)}</summary><p class="prompt">${esc(c.prompt)}</p></details>
  </figcaption>
</figure>`);
    }
    const data = JSON.stringify({ format: FORMAT, version: 1, exported: Date.now(), cards: meta }).replace(/</g, '\\u003c');
    return `<!doctype html>
<html lang="${esc(texts.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(texts.title)}</title>
<style>
body{margin:0;background:#0a0a0a;color:#f5f5f0;font:400 16px/1.55 system-ui,sans-serif;padding:28px clamp(16px,4vw,48px)}
h1{font:900 34px/1 'Arial Narrow',sans-serif;text-transform:uppercase;margin:0 0 6px}
.m{font:400 12px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:rgba(245,245,240,.6);margin:0}
figure{margin:28px 0 0;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;background:#111}
img{display:block;width:100%;height:auto;max-height:80vh;object-fit:contain;background:#0c0c0e}
figcaption{padding:14px 18px 16px}
table{border-collapse:collapse;margin:12px 0 0;font-size:14px}
th{text-align:left;font-weight:500;color:rgba(245,245,240,.6);padding:2px 18px 2px 0;vertical-align:top}
summary{cursor:pointer;margin-top:12px}
.bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:18px calc(-1 * clamp(16px,4vw,48px)) 0;padding:10px clamp(16px,4vw,48px);background:rgba(10,10,10,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.08)}
.views{display:inline-flex;gap:2px;padding:3px;border:1px solid rgba(255,255,255,.12);border-radius:999px}
.views button,.all{border:0;border-radius:999px;padding:6px 14px;background:none;color:rgba(245,245,240,.6);font:500 13px system-ui,sans-serif;cursor:pointer}
.views button[aria-pressed="true"]{background:rgba(62,207,96,.14);color:#3ecf60}
.all{margin-left:auto;border:1px solid rgba(255,255,255,.12)}
.all:hover,.dl:hover{color:#3ecf60;border-color:#3ecf60}
figure{position:relative}
.dl{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,10,12,.75);color:#f5f5f0;font:600 16px system-ui,sans-serif;cursor:pointer}
/* Gallery: small square tiles; Medium: larger tiles with their caption; a click on a tile opens its details */
body.grid .figs,body.medium .figs{display:grid;gap:12px;margin-top:24px}
body.grid .figs{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
body.medium .figs{grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px}
body.grid figure,body.medium figure{margin:0;cursor:zoom-in}
body.grid img{aspect-ratio:1;object-fit:cover;max-height:none}
body.medium img{max-height:60vh}
body.grid figcaption{padding:8px 10px}
body.grid figcaption > :not(.m),body.medium figcaption details{display:none}
body.grid figcaption .m{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.grid .dl{width:28px;height:28px;font-size:13px;top:6px;right:6px;opacity:0}
body.grid figure:hover .dl{opacity:1}
@media (hover:none){body.grid .dl{opacity:1}}
.prompt{font:400 13px/1.55 ui-monospace,Consolas,monospace;color:rgba(245,245,240,.72);white-space:pre-wrap}
</style>
</head>
<body class="grid">
<h1>${esc(texts.title)}</h1>
<p class="m">${esc(texts.subtitle)}</p>
<div class="bar"><div class="views"><button type="button" data-view="grid">${esc(texts.gallery || 'Gallery')}</button><button type="button" data-view="medium">${esc(texts.medium || 'Medium')}</button><button type="button" data-view="list">${esc(texts.list || 'Details')}</button></div><button type="button" class="all">${esc(texts.downloadAll || 'Download all')}</button></div>
<div class="figs">
${figures.join('\n')}
</div>
<script type="application/json" id="cd-session">${data}</script>
<script>
(function () {
  var views = ['grid', 'medium', 'list'];
  function show(view, target) {
    views.forEach(function (v) { document.body.classList.toggle(v, v === view); });
    document.querySelectorAll('.views button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === view ? 'true' : 'false'); });
    if (target) target.scrollIntoView({ block: 'start' });
  }
  function save(f) {
    var img = f.querySelector('img');
    if (!img) return;
    var a = document.createElement('a');
    a.href = img.src;
    a.download = f.dataset.name || 'character.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  document.querySelectorAll('.views button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });
  document.querySelectorAll('figure').forEach(function (f) {
    f.addEventListener('click', function (e) {
      if (e.target.closest('.dl')) { e.stopPropagation(); return save(f); }
      if (!document.body.classList.contains('list') && !e.target.closest('figcaption')) show('list', f);
    });
  });
  // Every picture, one after the other (the browser may ask once to allow several downloads).
  document.querySelector('.all').addEventListener('click', function () {
    var all = Array.prototype.slice.call(document.querySelectorAll('figure'));
    all.forEach(function (f, i) { setTimeout(function () { save(f); }, i * 400); });
  });
  show('grid');
})();
</script>
</body>
</html>
`;
  }

  // Reads a file made by exportHtml and returns cards with their image as a Blob.
  async function importHtml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const node = doc.getElementById('cd-session');
    if (!node) throw new Error('not a session file');
    const data = JSON.parse(node.textContent);
    if (!data || data.format !== FORMAT || !Array.isArray(data.cards)) throw new Error('not a session file');
    const cards = [];
    for (let i = 0; i < data.cards.length; i++) {
      const c = data.cards[i];
      const img = doc.querySelector(`figure[data-i="${i}"] img`);
      const src = img ? img.getAttribute('src') : '';
      if (!src || !src.startsWith('data:image/')) continue;
      cards.push({
        id: String(c.id || `${Date.now()}-${i}`),
        created: Number(c.created) || Date.now(),
        name: String(c.name || 'character.png'),
        seed: c.seed,
        width: Number(c.width) || 0,
        height: Number(c.height) || 0,
        prompt: String(c.prompt || ''),
        settings: typeof c.settings === 'string' ? c.settings : null,
        fav: c.fav === true,
        provider: typeof c.provider === 'string' ? c.provider : null,
        model: typeof c.model === 'string' ? c.model : null,
        batch: typeof c.batch === 'string' ? c.batch : null,
        batchIndex: Number(c.batchIndex) || 0,
        // Small JPEG copies of the reference images only, nothing else.
        refThumbs: !Array.isArray(c.refThumbs) ? undefined : c.refThumbs
          .filter((r) => r && typeof r.kind === 'string' && typeof r.src === 'string' && r.src.startsWith('data:image/jpeg;base64,') && r.src.length < 60000)
          .slice(0, 20)
          .map((r) => ({ kind: r.kind.slice(0, 20), src: r.src })),
        refMode: c.refMode === 'sheet' || c.refMode === 'inspire' ? c.refMode : null,
        // The face drawing that guided the image (a small PNG), to compare.
        guide: c.guide && (c.guide.mode === 'control' || c.guide.mode === 'ref') && typeof c.guide.src === 'string' && c.guide.src.startsWith('data:image/png;base64,') && c.guide.src.length < 400000 ? { mode: c.guide.mode, src: c.guide.src } : null,
        blob: await dataUrlToBlob(src),
      });
    }
    return cards;
  }

  window.CDSession = { load, save, remove, clear, exportHtml, importHtml };
})();
