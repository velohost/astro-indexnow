# astro-indexnow

An Astro integration that automatically submits **changed pages** to **IndexNow**
after each build, helping search engines discover updates faster.

Designed to follow Astro’s official integration patterns (like `@astrojs/sitemap`):
- No interactive prompts
- No secret injection
- Explicit, config-driven usage
- CI-safe and deterministic

---

## What is IndexNow?

[IndexNow](https://www.indexnow.org/) is a protocol supported by search engines
like **Bing** and **Yandex** that allows websites to proactively notify them
when URLs are added, updated, or deleted.

Instead of waiting for crawlers, your site tells search engines exactly
what changed.

---

## Features

- 🚀 Submits URLs to IndexNow **at build time**
- 🔁 Only submits **changed pages** (no unnecessary resubmits)
- 🔒 No secrets stored or prompted — fully explicit config
- 🧠 Uses Astro’s `site` config as the canonical base URL
- 🧪 Safe for CI/CD pipelines
- 🧩 Zero runtime impact

---

## Installation

```bash
npm install astro-indexnow
```

or using Astro’s helper:

```bash
npx astro add astro-indexnow
```

> Note: Like other Astro integrations, `astro add` installs the integration
> but does not inject configuration values. See usage below.

---

## Usage

`astro-indexnow` follows the **same configuration pattern as `@astrojs/sitemap`**.

### 1) Configure your site URL

IndexNow requires a fully qualified, canonical site URL.

In `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import indexNow from "astro-indexnow";

export default defineConfig({
  site: "https://example.com",

  integrations: [
    indexNow({
      key: "YOUR_INDEXNOW_API_KEY",
    }),
  ],
});
```

---

### 2) Using environment variables (recommended)

```js
indexNow({
  key: process.env.INDEXNOW_KEY,
});
```

This keeps secrets out of version control and works cleanly in CI.

---

## Configuration Options

### `key` (required)

Type: `string`

Your IndexNow API key.

You can generate a key at:
- https://www.indexnow.org/

---

### `site` (required, from Astro config)

Type: `string`

The integration reads the site’s canonical URL from:

```js
defineConfig({
  site: "https://example.com"
})
```

This **must** start with `http://` or `https://`.

---

## How It Works

At build time, the integration:

1. Reads Astro’s output directory
2. Collects all generated page URLs
3. Hashes and compares them to the previous build
4. Submits **only changed URLs** to IndexNow
5. Saves state for the next build

No runtime code is added to your site.

---

## CI / Deployment

This integration is designed to work cleanly in CI environments.

Example:

```bash
INDEXNOW_KEY=your-key astro build
```

No prompts. No interactivity. Fully deterministic.

---

## Limitations

- IndexNow submissions only run on `astro build`
- Requires `site` to be configured
- Requires a valid IndexNow key
- Uninstalling the package does not automatically remove config
  (same behaviour as other Astro integrations)

---

## Inspiration & Philosophy

This integration intentionally mirrors the behaviour of
official Astro integrations such as:

- `@astrojs/sitemap`

Astro integrations are designed to:
- avoid mutating user config implicitly
- avoid prompting for secrets
- rely on explicit configuration

`astro-indexnow` follows these principles strictly.

---

## License

MIT
