'use strict';
// Turns the user's menu choices into one text prompt. No ComfyUI knowledge here.

function findOption(group, id) {
  return group.options.find((o) => o.id === id);
}

// Keeps only ids that exist, and respects single/multi rules.
function cleanSelection(options, selection) {
  const out = {};
  for (const group of options.groups) {
    const raw = selection ? selection[group.id] : undefined;
    const fallback = options.defaults[group.id];
    const value = raw === undefined ? fallback : raw;
    if (group.type === 'multi') {
      const list = Array.isArray(value) ? value : [];
      const valid = list.filter((id) => findOption(group, id));
      const unique = [...new Set(valid)];
      out[group.id] = group.max ? unique.slice(0, group.max) : unique;
    } else {
      const id = Array.isArray(value) ? value[0] : value;
      out[group.id] = findOption(group, id) ? id : findOption(group, fallback) ? fallback : group.options[0].id;
    }
  }
  // Free text typed by the user for a group: replaces the menu choice (single) or is added to it (multi).
  out.custom = {};
  const custom = selection && selection.custom && typeof selection.custom === 'object' ? selection.custom : {};
  for (const group of options.groups) {
    const text = typeof custom[group.id] === 'string' ? custom[group.id].trim().slice(0, 200) : '';
    if (text) out.custom[group.id] = text;
  }
  return out;
}

// A few colour names, so a hex code also reaches models that read words better than codes.
const COLOR_NAMES = [
  ['black', 0, 0, 0], ['charcoal', 54, 54, 54], ['dark grey', 90, 90, 90], ['grey', 128, 128, 128], ['silver', 192, 192, 192], ['white', 245, 245, 245],
  ['ivory', 240, 232, 214], ['beige', 222, 196, 160], ['tan', 196, 150, 108], ['light brown', 166, 118, 80], ['brown', 120, 78, 48], ['dark brown', 70, 44, 28],
  ['amber', 200, 138, 28], ['golden', 214, 178, 90], ['blonde', 230, 205, 140], ['ginger', 190, 90, 40], ['copper', 184, 115, 51], ['auburn', 120, 52, 30],
  ['red', 200, 30, 40], ['deep red', 130, 20, 30], ['pink', 236, 150, 180], ['pastel pink', 240, 190, 210], ['magenta', 200, 40, 150], ['purple', 110, 50, 150],
  ['lilac', 190, 160, 225], ['navy blue', 20, 35, 90], ['blue', 40, 90, 200], ['sky blue', 120, 180, 230], ['ice blue', 180, 215, 235], ['teal', 20, 130, 130],
  ['turquoise', 60, 200, 190], ['green', 50, 140, 70], ['dark green', 25, 75, 40], ['olive green', 110, 120, 50], ['mint green', 160, 220, 180], ['yellow', 235, 210, 50],
  ['orange', 235, 130, 30], ['peach', 245, 190, 150], ['porcelain', 243, 220, 205], ['hazel', 142, 107, 62],
];

function hexText(text) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(text).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  let best = COLOR_NAMES[0];
  let bestD = Infinity;
  for (const c of COLOR_NAMES) {
    const d = 2 * (c[1] - r) ** 2 + 4 * (c[2] - g) ** 2 + 3 * (c[3] - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return `${best[0]} (hex #${m[1].toUpperCase()})`;
}

function ownText(group, text) {
  const words = hexText(text) || text;
  return group.ownTemplate ? group.ownTemplate.replace('{}', words) : words;
}

function fragment(options, sel, groupId) {
  const group = options.groups.find((g) => g.id === groupId);
  if (!group) return [];
  const ids = group.type === 'multi' ? sel[groupId] : [sel[groupId]];
  let list = ids
    .map((id) => findOption(group, id))
    .filter(Boolean)
    .map((o) => ({ text: o.p, option: o }))
    .filter((f) => f.text);
  const own = sel.custom && sel.custom[groupId] ? ownText(group, sel.custom[groupId]) : '';
  if (own) list = group.type === 'multi' ? [...list, { text: own, option: {} }] : [{ text: own, option: {} }];
  return list;
}

function first(options, sel, groupId) {
  return fragment(options, sel, groupId)[0] || null;
}

// refMode, only when reference images are sent:
//   'sheet'   the character in the image becomes the sheet; the menus about the person are left out.
//   'inspire' the menus describe the character; the images guide the look.
// "a" or "an" before a word or a number ("an 8-year-old", "an adult").
function article(words) {
  return /^(8|11|18|8\d|[aeiou])/i.test(words) ? `an ${words}` : `a ${words}`;
}

// Age and gender together: a number typed as age wins over the menu; babies, children and teens get their own words.
function person(options, sel) {
  const ageGroup = options.groups.find((g) => g.id === 'age');
  const genderGroup = options.groups.find((g) => g.id === 'presentation');
  const own = sel.custom && sel.custom.age && /^\d{1,3}$/.test(sel.custom.age.trim()) ? Number(sel.custom.age.trim()) : null;
  let stage = null;
  let ageText = '';
  if (own !== null) {
    stage = own < 3 ? 'baby' : own < 13 ? 'child' : own < 18 ? 'teen' : null;
    ageText = `${own}-year-old`;
  } else if (ageGroup) {
    const o = findOption(ageGroup, sel.age);
    stage = (o && o.stage) || null;
    ageText = (o && o.p) || '';
  }
  const g = genderGroup ? findOption(genderGroup, sel.presentation) : null;
  const word = g ? (stage && g.forms && g.forms[stage]) || g.p : '';
  return [ageText, word].filter(Boolean).join(' ');
}

// Sentences that point the model to the reference images, numbered in the order they are sent:
// starting images first, then the face drawing, outfit, accessories and style. counts: { main, guide, outfit, accessories, look }.
const REF_SENTENCES = {
  guide: (list) => `${list[0].toUpperCase()}${list.slice(1)} is a blurred schematic drawing of the face, only a proportion guide: follow its face shape and proportions (face outline, jaw, eye spacing, size and tilt, nose size, mouth width). Do not reproduce its lines, outlines or flat shapes, nor its colours or its bald head: the face must look natural, with real anatomy, in the style asked for.`,
  outfit: (list) => `Use exactly the clothing shown in ${list}.`,
  accessories: (list) => `Use exactly the accessories shown in ${list}.`,
  look: (list) => `Match the visual style, rendering, lighting and colour palette of ${list}, without copying their subject.`,
};

function refSentences(counts) {
  const out = {};
  let at = (counts && counts.main) || 0;
  for (const key of Object.keys(REF_SENTENCES)) {
    const n = (counts && counts[key]) || 0;
    if (!n) continue;
    const nums = Array.from({ length: n }, (_, i) => at + i + 1);
    at += n;
    const list = nums.length === 1 ? `reference image ${nums[0]}` : `reference images ${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]}`;
    out[key] = REF_SENTENCES[key](list);
  }
  return out;
}

function buildPrompt(options, selection, extra, refMode, refCounts) {
  const sel = cleanSelection(options, selection);
  const text = (groupId) => {
    const f = first(options, sel, groupId);
    return f ? f.text : '';
  };

  const layout = first(options, sel, 'layout');
  const layoutOption = layout ? layout.option : null;

  const parts = [];
  if (layout) parts.push(layout.text);
  // A style typed by hand (not one of the menu looks) leads the prompt and closes it: at the end only,
  // after a list of realistic details, the models kept making a photograph.
  const lookPick = first(options, sel, 'look');
  const ownLook = lookPick && !lookPick.option.id ? lookPick.text.replace(/[.\s]+$/, '') : '';
  if (ownLook) parts.push(`Art style: ${ownLook}. The whole image, the character included, is made in this style, not as a photograph unless the style asks for one.`);
  const note = (extra || '').toString().trim().slice(0, 400);
  const refs = refSentences(refCounts);

  // Several start images: several views of the same character, used together.
  const mains = (refCounts && refCounts.main) || 0;
  if (refMode === 'sheet') {
    parts.push(
      mains > 1
        ? `The character is the one shown in reference images 1 to ${mains}, several views of the same person: combine them to keep the same face, hairstyle, body, skin, outfit, colours and accessories. Ignore the backgrounds, framing and poses of those images; show the character in a neutral standing pose.`
        : 'The character is the one shown in the reference image: keep the same face, hairstyle, body, skin, outfit, colours and accessories. Ignore the background, framing and pose of the reference image; show the character in a neutral standing pose.'
    );
    if (refs.outfit) parts.push(`Dress the character in the clothing shown in the outfit references. ${refs.outfit}`);
    if (refs.accessories) parts.push(`Add the accessories from their references. ${refs.accessories}`);
    if (note) parts.push(`Changes: ${note}.`);
    const look = text('look');
    if (look) parts.push(ownLook ? `Remember the art style: ${ownLook}.` : look);
    if (refs.look) parts.push(refs.look);
    const background = text('background');
    if (background) parts.push(background);
    const size = layoutOption && layoutOption.size ? layoutOption.size : [1024, 1024];
    return { prompt: parts.join(' '), width: size[0], height: size[1], selection: sel };
  }

  const who = [person(options, sel), text('ethnicity')].filter(Boolean).join(' ');
  if (who) parts.push(`The character is ${article(who)}.`);

  // Two colours ("#AAAAAA|#BBBBBB"): eyes of different colours (heterochromia).
  const pair = /^#?([0-9a-f]{6})\|#?([0-9a-f]{6})$/i.exec((sel.custom && sel.custom.eyeColor) || '');
  const eyes = pair ? '' : [text('eyeShape'), text('eyeColor')].filter(Boolean).join(' ');
  const eyesText = pair
    ? `${[text('eyeShape'), 'eyes'].filter(Boolean).join(' ')} of two different colours (heterochromia): one ${hexText(pair[1])} eye and one ${hexText(pair[2])} eye`
    : eyes ? `${eyes} eyes` : '';
  const appearance = [
    text('height'),
    text('build'),
    text('faceShape'),
    text('forehead'),
    text('brows'),
    text('browColor'),
    eyesText,
    text('mouth'),
    text('lipColor'),
    text('chin'),
    text('chinCleft'),
    text('ears'),
    text('teeth'),
    text('skin'),
    ...fragment(options, sel, 'features').map((f) => f.text),
    text('expression'),
  ].filter(Boolean);
  if (appearance.length) parts.push(`Appearance: ${appearance.join(', ')}.`);
  // The nose gets its own sentence: in a list, the models smooth it into an ordinary nose.
  const nose = text('nose');
  if (nose) parts.push(`Distinctive nose, clearly visible: ${nose}.`);
  // Same for the unibrow: in the list it was ignored and the two brows stayed apart.
  const join = text('browJoin');
  if (join) parts.push(`Distinctive unibrow, clearly visible: ${join}.`);
  if (refs.guide) parts.push(refs.guide);

  const styleFrag = first(options, sel, 'hairStyle');
  const hair = [];
  if (styleFrag) {
    const colour = styleFrag.option.noColor ? '' : text('hairColor');
    hair.push([colour, styleFrag.text].filter(Boolean).join(' '));
  }
  const facial = text('facialHair');
  if (facial) hair.push(facial);
  if (hair.length) parts.push(`Hair: ${hair.join(', ')}.`);

  const outfit = text('outfit');
  const accessories = fragment(options, sel, 'accessories').map((f) => f.text);
  if (outfit || refs.outfit) parts.push([outfit ? `Outfit: ${outfit}.` : '', refs.outfit || ''].filter(Boolean).join(' '));
  if (accessories.length || refs.accessories) parts.push([accessories.length ? `Accessories: ${accessories.join(', ')}.` : '', refs.accessories || ''].filter(Boolean).join(' '));

  if (note) parts.push(`Additional details: ${note}.`);
  if (refMode === 'inspire') parts.push(mains > 1 ? `Use reference images 1 to ${mains} as visual reference for the character's look, outfit and style.` : "Use the reference images as visual reference for the character's look, outfit and style.");

  const look = text('look');
  if (look) parts.push(ownLook ? `Remember the art style: ${ownLook}.` : look);
  if (refs.look) parts.push(refs.look);
  const background = text('background');
  if (background) parts.push(background);

  const size = layoutOption && layoutOption.size ? layoutOption.size : [1024, 1024];
  return { prompt: parts.join(' '), width: size[0], height: size[1], selection: sel };
}

module.exports = { buildPrompt, cleanSelection, hexText };
