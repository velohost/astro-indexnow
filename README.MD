# astro-indexnow

An Astro integration that automatically submits **all built pages** to **IndexNow**
after each build, helping search engines discover updates faster.

Designed to follow Astro’s official integration patterns (like `@astrojs/sitemap`):

- No interactive prompts
- No automatic file mutation
- Explicit, config‑driven usage
- CI‑safe and deterministic
- Zero runtime impact

---

## What is IndexNow?

[IndexNow](https://www.indexnow.org/) is a protocol supported by search engines
such as **Bing** and **Yandex** that allows websites to proactively notify them
when URLs are added or updated.

Instead of waiting for crawlers, your site directly tells search engines
which URLs should be re‑crawled.

---

## Features

- 🚀 Submits URLs to IndexNow **at build time**
- 🔁 Submits **all generated pages** every build (simple & reliable)
- 🔒 No secrets prompted or stored automatically
- 🧠 Uses Astro’s `site` config as the canonical base URL
- 🧪 Safe for CI/CD pipelines
- 🧩 No client‑side or runtime code added

---

## Installation

```bash
npm install astro-indexnow
```

Or using Astro’s helper:

```bash
npx astro add astro-indexnow
```

> **Note**  
> Like other Astro integrations, `astro add` installs the package but does **not**
> inject configuration values. You must configure it manually (see below).

---

## Step 1 — Get your IndexNow key

Generate an IndexNow API key here:

👉 https://www.bing.com/indexnow/getstarted

You will receive:
- an **API key** (a long string)
- instructions to create a **key file**

---

## Step 2 — Create the key file (required)

IndexNow requires proof that you own the site.

Create a text file named **`<YOUR_KEY>.txt`** in your Astro `public/` directory.

### Example

If your key is:

```
abcd1234
```

Create this file:

```
public/abcd1234.txt
```

With **exactly this content**:

```
abcd1234
```

Astro will automatically copy this file to the build output.

> ⚠️ The plugin does **not** create this file for you.

---

## Step 3 — Configure Astro

Add **both** your site URL and the IndexNow integration
to `astro.config.mjs`.

### Example

```js
// @ts-check
import { defineConfig } from "astro/config";
import indexnow from "astro-indexnow";

export default defineConfig({
  site: "https://example.com",

  integrations: [
    indexnow({
      key: "YOUR_INDEXNOW_KEY",
    }),
  ],
});
```

### Using environment variables (recommended)

```js
indexnow({
  key: process.env.INDEXNOW_KEY,
});
```

This keeps secrets out of version control and works cleanly in CI.

---

## Configuration Options

### `key` (required)

Type: `string`

Your IndexNow API key.

---

### `site` (required)

Type: `string`

Set via Astro’s config:

```js
defineConfig({
  site: "https://example.com"
})
```

Must begin with `http://` or `https://`.

---

## How It Works

On every `astro build`, the integration:

1. Reads Astro’s build output directory
2. Detects all generated pages
3. Converts them to public URLs
4. Submits them to IndexNow via a single POST request

No state is stored and no runtime code is added to your site.

---

## Limitations

- Submissions only run on `astro build`
- Requires a valid `site` configuration
- Requires the IndexNow key file to exist
- Uninstalling the package does not remove config automatically
  (same behaviour as other Astro integrations)

---

## Philosophy

This integration intentionally mirrors the behaviour of
official Astro integrations such as:

- `@astrojs/sitemap`

It avoids:
- automatic config mutation
- secret prompting
- hidden side effects

Everything is explicit and predictable.

---
## Maintainer

Built and maintained by **Velohost** — a UK-based platform providing
free, privacy-first infrastructure and diagnostic tools for developers.

https://velohost.co.uk

## License

MIT
