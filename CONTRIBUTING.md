# Contributing to Kara

Thanks for wanting to help! Kara is an open source visual character designer (MIT license).

## How to contribute

1. Look at the [Issues](https://github.com/DashDashDesign/Kara/issues) and pick one. Comment "I'll take this" so nobody else starts the same work.
2. Click **Fork** (top right of the repository page) to get your own copy.
3. Make your changes in your copy, ideally on a new branch named after the idea (for example `sessions` or `ai-composer`).
4. Run `npm test`. It must stay green.
5. Click **Contribute, then Open pull request**. Say in a few words what you changed and how you tested it. Screenshots help a lot for interface changes.

Small, focused pull requests are easier to review than one huge one. If an idea is big, open a draft pull request early so we can talk about the direction.

## Running Kara locally

You need Node 18 or newer. There is nothing to install:

```
node server.js
```

Then open http://localhost:3210. On Windows you can also double-click `start.bat`.

Without any API key you can still work on the interface. For image generation you need either a local ComfyUI or a key from one of the providers (KIE, fal, Magnific, Comfy Router), put in a `.env` file. **Never commit a key or a `.env` file.**

## Ground rules

- **Zero npm dependencies.** Anyone must be able to run Kara without installing anything.
- **The interface is bilingual (English and French).** Every new text needs both. Other languages are very welcome too.
- **Data over code.** Menus and presets live in `data/options.json` and `data/presets.json`. Prefer adding data to adding code.
- **Two places for provider code.** Anything about how Kara talks to a provider goes in `lib/` and also in `worker/index.js` (the online version).
- **Keys stay on the server.** A key is never sent back to the browser or to an image link.
- **No look-alikes.** Do not copy names, presets, texts or visuals from other commercial apps.
- **Be honest about testing.** Say what you tested for real and what you could not test (for example "tested on Mac" or "only against the mock servers").

## Adding a provider

A provider is a service that makes the images (KIE, fal, Magnific, Comfy Router...). The easiest way to start is to copy an existing one: `lib/fal.js` is a good model (queue, status, result, key test, balance).

1. **Client**: create `lib/<name>.js` with plain `fetch` only, so the same file runs in Node and in the Cloudflare Worker. It sends the prompt, seed, size and reference images, then returns the image link. The key goes only in the request to the provider, never to the browser, never to an image link.
2. **Models**: describe what each model accepts (sizes, ratios, number of reference images, price) in `data/models.json`, under an engine named after your provider.
3. **Server**: register the provider in `lib/comfy.js` (search for `fal` and follow every place it appears), and the key name in `lib/env.js`.
4. **Online version**: do the same in `worker/index.js`. The visitor's own key is sent with each request.
5. **Interface**: add the provider to the list, key panel and logo in `public/app.js` (search for `fal` there too). Texts in English and French.
6. **Tests**: add a fake server for your provider in `test/mock-comfy.js` and checks in `test/run-tests.js`. `npm test` runs against fakes only, so please also say in your pull request whether you tested with a real key.

Do not copy another provider's names, logos or visuals without their permission.

## What gets merged

Every change to `main` is deployed automatically to the online version, so pull requests are reviewed before merging. Expect some questions and requests for changes: it is normal.
