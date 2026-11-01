// How long a prompt each model takes, in characters, per provider (read in the providers' docs, 1 Nov 2026).
// A model not listed takes the general cap. Over the limit, the prompt is cut at the last full sentence that fits.
const GENERAL = 4000;
const MAX = {
  kie: {
    'z-image-turbo': 1000,
    'seedream-5-lite': 2995,
    'seedream-5-pro': 5000,
    'seedream-5-flash': 5000,
    'qwen-2-1': 5000,
    'qwen-3': 5000,
    'qwen-3-pro': 5000,
    'flux-3-klein': 5000,
  },
};

function limitFor(provider, model) {
  return (MAX[provider] && MAX[provider][model]) || GENERAL;
}

// { prompt, cut: true, from, to } when the text had to be shortened.
function fit(prompt, provider, model) {
  const text = String(prompt || '');
  const max = limitFor(provider, model);
  if (text.length <= max) return { prompt: text, cut: false, from: text.length, to: text.length, max };
  const head = text.slice(0, max);
  const end = head.lastIndexOf('. ');
  const out = end > max * 0.6 ? head.slice(0, end + 1) : head;
  return { prompt: out, cut: true, from: text.length, to: out.length, max };
}

module.exports = { fit, limitFor };
